/**
 * Data collection for the "Pending review" homepage widget.
 *
 * There is no cross-content-type "drafts" endpoint in Strapi, but the admin
 * Content Manager API already exposes exactly the two views editors need,
 * per content type, fully permission-checked server-side:
 *
 *   GET /content-manager/content-types
 *     -> all content types (uid, kind, display name, draftAndPublish flag)
 *
 *   GET /content-manager/collection-types/:uid?filters[$and][0][__status][$eq]=draft
 *     -> entries that were never published ("Draft (never published)")
 *
 *   GET /content-manager/collection-types/:uid?filters[$and][0][__status][$eq]=published-modified
 *     -> entries whose draft has unsaved changes over the published version
 *        ("Published (modified)")
 *
 * Single types (e.g. api::engagement-page.engagement-page) are fetched per
 * locale through /content-manager/single-types/:uid and classified by
 * comparing the draft's updatedAt with the published version's.
 *
 * Types the requesting editor cannot read answer 403 and are silently skipped.
 */

export type PendingState = 'new' | 'modified';

export interface PendingEntry {
  key: string;
  documentId: string;
  locale: string | null;
  title: string;
  state: PendingState;
  updatedAt: string | null;
}

export interface PendingGroup {
  uid: string;
  label: string;
  kind: 'collectionType' | 'singleType';
  entries: PendingEntry[];
}

export interface PendingResult {
  total: number;
  groups: PendingGroup[];
  /** True when at least one type had more results than one page could hold. */
  truncated: boolean;
}

export interface PendingSnapshot extends PendingResult {
  /** Epoch milliseconds at which this data was collected from the API. */
  fetchedAt: number;
  /** True when the snapshot was served from the TTL cache, not a fresh request. */
  cached: boolean;
}

export interface PendingFetchOptions {
  /**
   * Cache namespace. The data is permission-dependent, so callers should
   * include the current admin user here to avoid showing one editor's
   * readable content types to another on the same browser session.
   */
  cacheKey?: string;
  /** Bypass the cache and refetch (used by the refresh button). */
  force?: boolean;
  /** Injectable clock, mainly for tests. */
  now?: () => number;
}

interface AdminClient {
  get: (url: string, options?: { params?: Record<string, unknown> }) => Promise<{ data: any }>;
}

interface ContentTypeDto {
  uid: string;
  kind: 'collectionType' | 'singleType';
  isDisplayed?: boolean;
  info?: { displayName?: string };
  options?: { draftAndPublish?: boolean };
}

const PAGE_SIZE = 100;

const STATUS_FILTER = (value: 'draft' | 'published-modified') => ({
  $and: [{ __status: { $eq: value } }],
});

/**
 * Same heuristic as the draft notification email (config/cron-tasks.ts):
 * pick the most meaningful human readable field whatever the content type is.
 */
export function resolveDisplayTitle(row: any, documentId?: string): string {
  if (row?.fullName?.trim) return row.fullName.trim();
  const combinedName = [row?.firstName, row?.lastName].filter(Boolean).join(' ').trim();
  if (combinedName) return combinedName;
  if (row?.lastName?.trim) return row.lastName.trim();
  if (row?.firstName?.trim) return row.firstName.trim();

  const candidateFields = ['title', 'name', 'label', 'heading', 'headline', 'subject', 'slug'];
  for (const field of candidateFields) {
    const value = row?.[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return `Untitled (${documentId ?? row?.documentId ?? 'unknown'})`;
}

function toEntry(
  uid: string,
  row: any,
  state: PendingState
): PendingEntry | null {
  const documentId = row?.documentId;
  if (!documentId) return null;

  const locale = row?.locale ?? null;
  return {
    key: `${uid}:${documentId}:${locale ?? ''}:${state}`,
    documentId,
    locale,
    title: resolveDisplayTitle(row, documentId),
    state,
    updatedAt: row?.updatedAt ?? null,
  };
}

/**
 * Returns null when the type cannot be listed for this user (403, 404...).
 */
async function safeGet(
  client: AdminClient,
  url: string,
  params?: Record<string, unknown>
): Promise<any | null> {
  try {
    const response = await client.get(url, params ? { params } : undefined);
    return response?.data ?? null;
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    if (status === 403 || status === 404) return null;
    // Do not let one broken type take the whole widget down
    console.warn(`[pending-review] request failed for ${url}`, error);
    return null;
  }
}

async function collectCollectionType(
  client: AdminClient,
  type: ContentTypeDto
): Promise<{ entries: PendingEntry[]; truncated: boolean }> {
  const url = `/content-manager/collection-types/${type.uid}`;
  const baseParams = { locale: '*', page: 1, pageSize: PAGE_SIZE };

  const [neverPublished, modified] = await Promise.all([
    safeGet(client, url, { ...baseParams, filters: STATUS_FILTER('draft') }),
    safeGet(client, url, { ...baseParams, filters: STATUS_FILTER('published-modified') }),
  ]);

  const entries: PendingEntry[] = [];
  let truncated = false;

  for (const [payload, state] of [
    [neverPublished, 'new'],
    [modified, 'modified'],
  ] as const) {
    if (!payload) continue;
    const rows = payload.results ?? payload.data ?? [];
    for (const row of rows) {
      const entry = toEntry(type.uid, row, state);
      if (entry) entries.push(entry);
    }
    const total = payload.pagination?.total;
    if (typeof total === 'number' && total > rows.length) {
      truncated = true;
    }
  }

  return { entries, truncated };
}

async function collectSingleType(
  client: AdminClient,
  type: ContentTypeDto
): Promise<{ entries: PendingEntry[]; truncated: boolean }> {
  const url = `/content-manager/single-types/${type.uid}`;

  const first = await safeGet(client, url, { status: 'draft' });
  if (!first) return { entries: [], truncated: false };

  const entries: PendingEntry[] = [];
  const seenLocales = new Set<string>();

  const classify = (payload: any) => {
    const document = payload?.data;
    if (!document || !document.documentId) return;

    const locale: string | null = document.locale ?? null;
    if (locale) {
      if (seenLocales.has(locale)) return;
      seenLocales.add(locale);
    }

    const published = payload?.meta?.availableStatus?.[0] ?? null;
    let state: PendingState | null = null;

    if (!published) {
      state = 'new';
    } else {
      const draftTime = document.updatedAt ? Date.parse(document.updatedAt) : 0;
      const publishedTime = published.updatedAt ? Date.parse(published.updatedAt) : 0;
      if (draftTime > publishedTime) state = 'modified';
    }

    if (!state) return; // published and unmodified -> nothing to review

    const entry = toEntry(type.uid, document, state);
    if (entry) entries.push(entry);
  };

  classify(first);

  const availableLocales: string[] = (first?.meta?.availableLocales ?? [])
    .map((localization: any) => localization?.locale)
    .filter((code: unknown): code is string => typeof code === 'string' && code.length > 0);

  const missingLocales = availableLocales.filter((code) => !seenLocales.has(code));

  const results = await Promise.all(
    missingLocales.map((locale) => safeGet(client, url, { locale, status: 'draft' }))
  );
  for (const payload of results) {
    if (payload) classify(payload);
  }

  return { entries, truncated: false };
}

/**
 * Collects everything waiting for publish review across the whole site.
 * Prefer `fetchPendingReview`, which adds the TTL cache on top of this.
 */
async function collectPendingReview(client: AdminClient): Promise<PendingResult> {
  const response = await client.get('/content-manager/content-types');
  const contentTypes: ContentTypeDto[] = response?.data?.data ?? [];

  const targets = contentTypes.filter(
    (type) =>
      type.uid?.startsWith('api::') &&
      type.options?.draftAndPublish === true &&
      type.isDisplayed !== false
  );

  const collected = await Promise.all(
    targets.map(async (type) => {
      const { entries, truncated } =
        type.kind === 'singleType'
          ? await collectSingleType(client, type)
          : await collectCollectionType(client, type);

      entries.sort((a, b) => {
        const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return bTime - aTime;
      });

      const group: PendingGroup = {
        uid: type.uid,
        label: type.info?.displayName ?? type.uid,
        kind: type.kind,
        entries,
      };

      return { group, truncated };
    })
  );

  const groups = collected
    .map((c) => c.group)
    .filter((group) => group.entries.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    total: groups.reduce((sum, group) => sum + group.entries.length, 0),
    groups,
    truncated: collected.some((c) => c.truncated),
  };
}

/** How long a snapshot is reused before the widget hits the API again. */
export const PENDING_REVIEW_CACHE_TTL_MS = 2 * 60 * 1000;

interface CacheRecord {
  key: string;
  snapshot: PendingSnapshot;
}

let cache: CacheRecord | null = null;
let inFlight: { key: string; promise: Promise<PendingSnapshot> } | null = null;

/**
 * Fetches everything waiting for publish review, reusing a recent result when
 * possible.
 *
 * The widget makes one request per draft&publish content type. On a large site
 * that is a few dozen calls, so navigating back to the dashboard would re-run
 * all of them for data that changes slowly. A short TTL makes repeat visits
 * free while keeping the list effectively live; `force: true` refreshes on
 * demand.
 *
 * Concurrent callers with the same key (e.g. React StrictMode mounting the
 * effect twice) share a single in-flight request.
 */
export async function fetchPendingReview(
  client: AdminClient,
  options: PendingFetchOptions = {}
): Promise<PendingSnapshot> {
  const key = options.cacheKey ?? 'default';
  const now = options.now ?? Date.now;

  if (!options.force && cache?.key === key) {
    const age = now() - cache.snapshot.fetchedAt;
    if (age >= 0 && age < PENDING_REVIEW_CACHE_TTL_MS) {
      return { ...cache.snapshot, cached: true };
    }
  }

  if (inFlight?.key === key) {
    return inFlight.promise;
  }

  const promise = collectPendingReview(client).then((result) => {
    const snapshot: PendingSnapshot = {
      ...result,
      fetchedAt: now(),
      cached: false,
    };
    cache = { key, snapshot };
    return snapshot;
  });

  inFlight = { key, promise };

  // Clear the in-flight marker once settled, without swallowing the rejection
  // for the caller. Both branches return undefined, so the derived promise
  // never rejects and cannot trigger an unhandled rejection warning.
  const clearInFlight = () => {
    if (inFlight?.promise === promise) inFlight = null;
  };
  promise.then(clearInFlight, clearInFlight);

  return promise;
}

/**
 * Returns a fresh cached snapshot without making a request, if one exists for
 * this key. Lets the widget render immediately when it remounts (e.g. when
 * navigating back to the dashboard) instead of flashing a loader.
 */
export function getCachedPendingReview(cacheKey = 'default'): PendingSnapshot | null {
  if (!cache || cache.key !== cacheKey) return null;

  const age = Date.now() - cache.snapshot.fetchedAt;
  if (age < 0 || age >= PENDING_REVIEW_CACHE_TTL_MS) return null;

  return { ...cache.snapshot, cached: true };
}

/**
 * Deep link into the Content Manager edit view.
 * Locale is carried the same way the admin panel itself does it:
 * ?plugins[i18n][locale]=xx
 *
 * The returned path is relative to the admin router (no admin mount prefix).
 * The widget resolves it with `useHref`, which applies the configured admin
 * basename, so links keep working when the panel is served from a
 * subdirectory (e.g. /strapi/admin in production).
 */
export function getEditViewUrl(group: PendingGroup, entry: PendingEntry): string {
  const locale = entry.locale
    ? `?plugins[i18n][locale]=${encodeURIComponent(entry.locale)}`
    : '';

  if (group.kind === 'singleType') {
    return `/content-manager/single-types/${group.uid}${locale}`;
  }

  return `/content-manager/collection-types/${group.uid}/${entry.documentId}${locale}`;
}

import * as React from 'react';
import { Badge, Flex, IconButton, Link, Typography } from '@strapi/design-system';
import { ArrowClockwise } from '@strapi/icons';
import { useAuth, useFetchClient, Widget } from '@strapi/strapi/admin';
import { useHref } from 'react-router-dom';

import {
  fetchPendingReview,
  getCachedPendingReview,
  getEditViewUrl,
  type PendingGroup,
  type PendingSnapshot,
} from './pending-review';

const STATE_LABEL: Record<string, string> = {
  new: 'Never published',
  modified: 'Pending edits',
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function formatTime(value: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function EntryRow({ group, entry }: { group: PendingGroup; entry: PendingGroup['entries'][number] }) {
  const date = formatDate(entry.updatedAt);
  // Router-relative path -> absolute path with the configured admin basename.
  const href = useHref(getEditViewUrl(group, entry));

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      gap={2}
      paddingTop={1}
      paddingBottom={1}
      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <Link href={href} title={entry.title}>
          <Typography variant="omega" textColor="neutral800" ellipsis>
            {entry.title}
          </Typography>
        </Link>
        {entry.locale ? (
          <Typography variant="pi" textColor="neutral500">
            {' '}
            · {entry.locale.toUpperCase()}
          </Typography>
        ) : null}
      </div>
      <Flex gap={2} alignItems="center" style={{ flexShrink: 0 }}>
        <Typography variant="pi" textColor="neutral600">
          {STATE_LABEL[entry.state] ?? entry.state}
        </Typography>
        {date ? (
          <Typography variant="pi" textColor="neutral500" style={{ whiteSpace: 'nowrap' }}>
            {date}
          </Typography>
        ) : null}
      </Flex>
    </Flex>
  );
}

function UpdatedHint({
  snapshot,
  refreshing,
  error,
  onRefresh,
}: {
  snapshot: PendingSnapshot;
  refreshing: boolean;
  error: unknown;
  onRefresh: () => void;
}) {
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <Flex alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="pi" textColor="neutral500">
          Updated {formatTime(snapshot.fetchedAt)}
        </Typography>
        <IconButton
          label="Refresh now"
          aria-label="Refresh now"
          variant="ghost"
          size="S"
          disabled={refreshing}
          onClick={onRefresh}
        >
          <ArrowClockwise />
        </IconButton>
      </Flex>
      {error ? (
        <Typography variant="pi" textColor="danger600">
          Could not refresh; showing the last result.
        </Typography>
      ) : null}
    </div>
  );
}

export default function PendingReviewWidget() {
  const { get } = useFetchClient();
  // Permission-dependent data: keep one cache bucket per admin user so a
  // different account signing in on the same browser never sees stale or
  // out-of-scope counts.
  const userKey = useAuth('PendingReviewWidget', (state) => state.user?.email ?? 'anonymous');
  const cacheKey = `pending-review:${userKey}`;

  const [snapshot, setSnapshot] = React.useState<PendingSnapshot | null>(() =>
    getCachedPendingReview(cacheKey)
  );
  const [loading, setLoading] = React.useState(
    () => getCachedPendingReview(cacheKey) === null
  );
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    let cancelled = false;

    const cached = getCachedPendingReview(cacheKey);
    setSnapshot(cached);
    setLoading(cached === null);
    setError(null);

    fetchPendingReview({ get }, { cacheKey })
      .then((data) => {
        if (cancelled) return;
        setSnapshot(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [get, cacheKey]);

  const refresh = React.useCallback(() => {
    setRefreshing(true);
    setError(null);

    fetchPendingReview({ get }, { cacheKey, force: true })
      .then((data) => {
        setSnapshot(data);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [get, cacheKey]);

  if (loading) {
    return <Widget.Loading />;
  }

  if (error && !snapshot) {
    return <Widget.Error>Could not load pending items.</Widget.Error>;
  }

  if (!snapshot) {
    return <Widget.NoData>No data available.</Widget.NoData>;
  }

  const hint = (
    <UpdatedHint
      snapshot={snapshot}
      refreshing={refreshing}
      error={error}
      onRefresh={refresh}
    />
  );

  if (snapshot.total === 0) {
    return (
      <div style={{ width: '100%', textAlign: 'left' }}>
        <Widget.NoData>
          Everything is published. Nothing is waiting for review.
        </Widget.NoData>
        {hint}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <Typography variant="pi" textColor="neutral600">
        {snapshot.total} {snapshot.total === 1 ? 'item is' : 'items are'} not live on the
        website yet.
      </Typography>

      <div style={{ maxHeight: 340, overflowY: 'auto', marginTop: 4 }}>
        {snapshot.groups.map((group) => (
          <div key={group.uid}>
            <Flex
              alignItems="center"
              justifyContent="space-between"
              gap={2}
              paddingTop={2}
              paddingBottom={1}
            >
              <Typography variant="sigma" textColor="neutral700" textTransform="uppercase">
                {group.label}
              </Typography>
              <Badge>{group.entries.length}</Badge>
            </Flex>

            {group.entries.map((entry) => (
              <EntryRow key={entry.key} group={group} entry={entry} />
            ))}
          </div>
        ))}
      </div>

      {snapshot.truncated ? (
        <Typography variant="pi" textColor="neutral500" style={{ marginTop: 4 }}>
          Showing the most recent results per content type. Open a content type in the
          Content Manager to see the full list.
        </Typography>
      ) : null}

      {hint}
    </div>
  );
}

import * as React from 'react';
import { Badge, Flex, Link, Typography } from '@strapi/design-system';
import { useFetchClient, Widget } from '@strapi/strapi/admin';
import { useHref } from 'react-router-dom';

import {
  fetchPendingReview,
  getEditViewUrl,
  type PendingGroup,
  type PendingResult,
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

export default function PendingReviewWidget() {
  const { get } = useFetchClient();
  const [result, setResult] = React.useState<PendingResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    let cancelled = false;

    fetchPendingReview({ get })
      .then((data) => {
        if (cancelled) return;
        setResult(data);
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
  }, [get]);

  if (loading) {
    return <Widget.Loading />;
  }

  if (error) {
    return <Widget.Error>Could not load pending items.</Widget.Error>;
  }

  if (!result || result.total === 0) {
    return (
      <Widget.NoData>
        Everything is published. Nothing is waiting for review.
      </Widget.NoData>
    );
  }

  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <Typography variant="pi" textColor="neutral600">
        {result.total} {result.total === 1 ? 'item is' : 'items are'} not live on the
        website yet.
      </Typography>

      <div style={{ maxHeight: 340, overflowY: 'auto', marginTop: 4 }}>
        {result.groups.map((group) => (
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

      {result.truncated ? (
        <Typography variant="pi" textColor="neutral500" style={{ marginTop: 4 }}>
          Showing the most recent results per content type. Open a content type in the
          Content Manager to see the full list.
        </Typography>
      ) : null}
    </div>
  );
}

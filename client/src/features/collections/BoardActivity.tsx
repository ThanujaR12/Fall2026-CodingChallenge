// "Recent activity" on a board page: who added, edited, or removed which photo, and invites.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClockCounterClockwise, Images } from '@phosphor-icons/react';
import { assetUrl } from '@/api/client';
import { getBoardActivity } from '@/api/collections';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { shortAgo } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import type { BoardActivityEntry } from '@/types/api';

const SHOWN_AT_FIRST = 6;

function describe(entry: BoardActivityEntry, myUserId: string) {
  const who = entry.actor?.id === myUserId ? 'You' : `@${entry.actor?.username ?? 'someone'}`;
  switch (entry.type) {
    case 'item_added':
      return `${who} added “${entry.itemTitle}”`;
    case 'item_edited':
      return `${who} edited “${entry.itemTitle}”`;
    case 'item_removed':
      return `${who} removed “${entry.itemTitle}”`;
    default:
      return `${who} invited @${entry.target?.username ?? 'someone'} as ${
        entry.role === 'viewer' ? 'a viewer' : 'an editor'
      }`;
  }
}

export function BoardActivity({
  collectionId,
  myUserId,
}: {
  collectionId: string;
  myUserId: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const activity = useQuery({
    queryKey: queryKeys.activity(collectionId),
    queryFn: () => getBoardActivity(collectionId),
  });
  const entries = activity.data ?? [];
  const shown = showAll ? entries : entries.slice(0, SHOWN_AT_FIRST);

  return (
    <section aria-labelledby="board-activity" className="mt-12 max-w-[640px]">
      <h2 id="board-activity" className="mb-3 flex items-center gap-2 text-[20px]">
        <ClockCounterClockwise size={20} aria-hidden="true" className="text-accent-deep" />
        Recent activity
      </h2>

      {activity.isPending ? (
        <div className="grid gap-3" role="status" aria-label="Loading activity">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : activity.isError ? (
        <p className="text-[14px] text-ink/70">
          Couldn't load activity.{' '}
          <button
            type="button"
            className="cursor-pointer text-accent-deep underline"
            onClick={() => activity.refetch()}
          >
            Try again
          </button>
        </p>
      ) : entries.length === 0 ? (
        <p className="text-[14px] text-ink/70">
          Nothing yet. Photos added, edited, or removed will show up here.
        </p>
      ) : (
        <>
          <ol className="grid">
            {shown.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0"
              >
                <span className="stripe-placeholder inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  {entry.imageUrl ? (
                    <img
                      src={assetUrl(entry.imageUrl)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Images size={18} className="text-ink/50" aria-hidden="true" />
                  )}
                </span>
                <p className="min-w-0 flex-1 text-[14px]">{describe(entry, myUserId)}</p>
                <time dateTime={entry.createdAt} className="shrink-0 text-[13px] text-ink/65">
                  {shortAgo(entry.createdAt)}
                </time>
              </li>
            ))}
          </ol>
          {entries.length > SHOWN_AT_FIRST && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show less' : `Show all ${entries.length}`}
            </Button>
          )}
        </>
      )}
    </section>
  );
}

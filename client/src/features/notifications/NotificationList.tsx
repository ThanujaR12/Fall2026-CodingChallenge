// The notification list (Pinterest-style): "Activity" rows for invites with a round avatar and an
// Open button, and "Updates" rows for board changes with the photo's thumbnail.
import { useNavigate } from 'react-router';
import { BellSimple, Images } from '@phosphor-icons/react';
import { assetUrl } from '@/api/client';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { shortAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types/api';
import { useMarkRead, useNotifications } from './useNotifications';

const VERB: Record<string, string> = {
  item_added: 'added',
  item_edited: 'edited',
  item_removed: 'removed',
};

function UnreadDot({ read }: { read: boolean }) {
  if (read) return null;
  return (
    <span className="size-2.5 shrink-0 rounded-full bg-accent2" role="img" aria-label="Unread" />
  );
}

function Time({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} className="shrink-0 text-[13px] text-ink/65">
      {shortAgo(iso)}
    </time>
  );
}

function ActivityRow({ n, onOpen }: { n: AppNotification; onOpen: () => void }) {
  const who = n.actor?.username ?? 'Someone';
  return (
    <li className="flex gap-3.5 py-3">
      <span
        aria-hidden="true"
        className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-surface text-[20px] font-semibold uppercase"
      >
        {who.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[16px] leading-snug', !n.read && 'font-semibold')}>
          @{who} invited you to <strong className="font-semibold">{n.collection.name}</strong> as{' '}
          {n.role === 'viewer' ? 'a viewer' : 'an editor'}
        </p>
        <button
          type="button"
          onClick={onOpen}
          className="mt-2 inline-flex min-h-9 cursor-pointer items-center rounded-full bg-surface px-4 text-[14px] font-semibold hover:bg-neutral-200"
        >
          Open board
        </button>
      </div>
      <div className="flex flex-col items-end gap-2 pt-1">
        <Time iso={n.createdAt} />
        <UnreadDot read={n.read} />
      </div>
    </li>
  );
}

function UpdateRow({ n, onOpen }: { n: AppNotification; onOpen: () => void }) {
  const who = n.actor?.username ?? 'Someone';
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full cursor-pointer items-center gap-3.5 rounded-xl py-2.5 text-left hover:bg-surface/70"
      >
        <span className="stripe-placeholder inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          {n.imageUrl ? (
            <img src={assetUrl(n.imageUrl)} alt="" className="h-full w-full object-cover" />
          ) : (
            <Images size={24} className="text-ink/50" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold">{n.collection.name}</span>
          <span className={cn('block text-[14px] text-ink/75', !n.read && 'text-ink')}>
            @{who} {VERB[n.type] ?? 'changed'} “{n.itemTitle}”
          </span>
        </span>
        <span className="flex flex-col items-end gap-2 self-start pt-1">
          <Time iso={n.createdAt} />
          <UnreadDot read={n.read} />
        </span>
      </button>
    </li>
  );
}

export function NotificationList({ onNavigate }: { onNavigate?: () => void }) {
  const query = useNotifications();
  const markRead = useMarkRead();
  const navigate = useNavigate();

  function open(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id);
    onNavigate?.();
    navigate(`/collections/${n.collection.id}`);
  }

  if (query.isPending) {
    return (
      <div className="grid gap-4" role="status" aria-label="Loading notifications">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3.5">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <Skeleton className="h-10 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load notifications."
        message={query.error.message}
        onRetry={() => query.refetch()}
        isRetrying={query.isRefetching}
      />
    );
  }

  const all = query.data.notifications;
  const activity = all.filter((n) => n.type === 'member_invited');
  const updates = all.filter((n) => n.type !== 'member_invited');

  if (all.length === 0) {
    return (
      <div className="py-10 text-center">
        <BellSimple size={34} weight="duotone" className="mx-auto mb-3 text-accent" />
        <p className="text-[17px] font-semibold">You're all caught up.</p>
        <p className="mt-1 text-[14px] text-ink/70">
          When people add to boards you share, you'll see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {activity.length > 0 && (
        <section aria-labelledby="notif-activity">
          <h3 id="notif-activity" className="mb-1 text-[18px]">
            Activity
          </h3>
          <ul>
            {activity.map((n) => (
              <ActivityRow key={n.id} n={n} onOpen={() => open(n)} />
            ))}
          </ul>
        </section>
      )}
      {updates.length > 0 && (
        <section aria-labelledby="notif-updates">
          <h3 id="notif-updates" className="mb-1 text-[18px]">
            Updates
          </h3>
          <ul>
            {updates.map((n) => (
              <UpdateRow key={n.id} n={n} onOpen={() => open(n)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// "Mark all as read", shown only while something is unread.
import { Checks } from '@phosphor-icons/react';
import { useMarkAllRead, useNotifications } from './useNotifications';

export function MarkAllReadButton() {
  const query = useNotifications();
  const markAll = useMarkAllRead();
  if (!query.data || query.data.unreadCount === 0) return null;

  return (
    <button
      type="button"
      onClick={() => markAll.mutate()}
      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-accent-deep hover:bg-accent-tint"
    >
      <Checks size={16} aria-hidden="true" />
      Mark all as read
    </button>
  );
}

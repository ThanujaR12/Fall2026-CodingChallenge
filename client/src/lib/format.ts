// Small text formatters for counts and dates shown in the UI.

export function imageCount(n: number): string {
  return n === 1 ? '1 image' : `${n.toLocaleString()} images`;
}

export function collectionCount(n: number): string {
  return n === 1 ? '1 collection' : `${n.toLocaleString()} collections`;
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** Compact age for lists: "now", "5m", "3h", "2d", "3w", "1mo", "2y". */
export function shortAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

/** "updated today", "updated 2 days ago", "updated 3 weeks ago"... */
export function updatedAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'updated today';
  if (days < 7) return `updated ${relative.format(-days, 'day')}`;
  if (days < 30) return `updated ${relative.format(-Math.floor(days / 7), 'week')}`;
  if (days < 365) return `updated ${relative.format(-Math.floor(days / 30), 'month')}`;
  return `updated ${relative.format(-Math.floor(days / 365), 'year')}`;
}

export function savedOn(iso: string): string {
  return new Date(iso).toLocaleDateString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

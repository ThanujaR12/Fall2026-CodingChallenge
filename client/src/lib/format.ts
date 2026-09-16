// Small text formatters for counts and dates shown in the UI.

export function imageCount(n: number): string {
  return n === 1 ? '1 image' : `${n.toLocaleString()} images`;
}

export function collectionCount(n: number): string {
  return n === 1 ? '1 collection' : `${n.toLocaleString()} collections`;
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

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

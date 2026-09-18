// Recent searches, remembered in this browser only (a convenience; nothing is sent anywhere).
const KEY = 'pixboard.recentSearches';
const MAX = 6;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((q): q is string => typeof q === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(q: string): void {
  const query = q.trim();
  if (!query) return;
  try {
    const next = [
      query,
      ...getRecentSearches().filter((r) => r.toLowerCase() !== query.toLowerCase()),
    ];
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
  } catch {
    // Storage can be unavailable (private windows); recent searches are simply skipped.
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

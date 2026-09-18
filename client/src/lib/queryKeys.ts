// Cache keys for TanStack Query, kept in one place so invalidations always match.
export const queryKeys = {
  search: (q: string, color?: string | null) => ['search', q, color ?? null] as const,
  feed: (topic: string, color?: string | null) => ['feed', topic, color ?? null] as const,
  // All collection lists share the "collections" prefix so one invalidation refreshes them all.
  collections: (sourceId?: string) =>
    sourceId ? (['collections', { sourceId }] as const) : (['collections'] as const),
  collection: (id: string) => ['collection', id] as const,
  activity: (id: string) => ['activity', id] as const,
};

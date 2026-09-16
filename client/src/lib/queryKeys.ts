// Cache keys for TanStack Query, kept in one place so invalidations always match.
export const queryKeys = {
  search: (q: string) => ['search', q] as const,
  // All collection lists share the "collections" prefix so one invalidation refreshes them all.
  collections: (sourceId?: string) =>
    sourceId ? (['collections', { sourceId }] as const) : (['collections'] as const),
  collection: (id: string) => ['collection', id] as const,
};

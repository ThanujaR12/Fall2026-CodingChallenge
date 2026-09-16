// Data hooks for collections: list, create (and later detail, update, delete).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCollection, listCollections } from '@/api/collections';
import { queryKeys } from '@/lib/queryKeys';
import type { CollectionSummary } from '@/types/api';

export function useCollections(sourceId?: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.collections(sourceId),
    queryFn: () => listCollections(sourceId),
    enabled: options.enabled ?? true,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: (created) => {
      // Show the new collection first right away, then refresh every list from the server.
      queryClient.setQueryData<CollectionSummary[]>(queryKeys.collections(), (current) =>
        current ? [created, ...current] : current,
      );
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

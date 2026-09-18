// Data hooks for collections: list, detail, create, update, and delete.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  updateCollection,
} from '@/api/collections';
import { queryKeys } from '@/lib/queryKeys';
import type { CollectionDetail, CollectionInput, CollectionsResponse } from '@/types/api';

export function useCollections(sourceId?: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.collections(sourceId),
    queryFn: () => listCollections(sourceId),
    enabled: options.enabled ?? true,
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: queryKeys.collection(id),
    queryFn: () => getCollection(id),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: (created) => {
      // Show the new collection first right away, then refresh every list from the server.
      queryClient.setQueryData<CollectionsResponse>(queryKeys.collections(), (current) =>
        current ? { ...current, collections: [created, ...current.collections] } : current,
      );
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useUpdateCollection(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: Partial<CollectionInput>) => updateCollection(id, changes),
    onSuccess: (updated) => {
      // Show the saved name/description immediately; the item list is unchanged.
      queryClient.setQueryData<CollectionDetail>(queryKeys.collection(id), (current) =>
        current ? { ...current, ...updated } : current,
      );
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    // The page navigates away after deleting; refreshing the lists is enough here.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

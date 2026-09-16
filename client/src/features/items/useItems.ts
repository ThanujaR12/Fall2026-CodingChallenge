// Data hooks for saved items: save, edit, and remove.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeItem, saveItem, updateItem } from '@/api/items';
import { queryKeys } from '@/lib/queryKeys';
import type { CollectionDetail, ItemChanges } from '@/types/api';

export function useSaveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, sourceId }: { collectionId: string; sourceId: string }) =>
      saveItem(collectionId, sourceId),
    onSuccess: (item) => {
      // Counts, covers, and "Saved" markers all change after a save.
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.collection(item.collectionId) });
    },
  });
}

export function useUpdateItem(collectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, changes }: { itemId: string; changes: ItemChanges }) =>
      updateItem(collectionId, itemId, changes),
    onSuccess: (updated) => {
      // Replace just this item in the cached collection so the edit shows immediately.
      queryClient.setQueryData<CollectionDetail>(queryKeys.collection(collectionId), (current) =>
        current
          ? {
              ...current,
              updatedAt: updated.updatedAt,
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useRemoveItem(collectionId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.collection(collectionId);

  return useMutation({
    mutationFn: (itemId: string) => removeItem(collectionId, itemId),
    // Optimistic: the image disappears right away and comes back only if the server refuses.
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CollectionDetail>(key);
      if (previous) {
        queryClient.setQueryData<CollectionDetail>(key, {
          ...previous,
          itemCount: previous.itemCount - 1,
          items: previous.items.filter((item) => item.id !== itemId),
        });
      }
      return { previous };
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

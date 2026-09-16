// Data hooks for saved items: save, edit, and remove.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveItem, updateItem } from '@/api/items';
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

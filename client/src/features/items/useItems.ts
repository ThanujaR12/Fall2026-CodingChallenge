// Data hooks for saved items: save (and later edit and remove).
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveItem } from '@/api/items';
import { queryKeys } from '@/lib/queryKeys';

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

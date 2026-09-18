// Data hooks for saved items: save, edit, and remove. All three update the screen instantly
// (optimistic) and roll back if the server refuses the change.
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { removeItem, saveItem, updateItem } from '@/api/items';
import { queryKeys } from '@/lib/queryKeys';
import type { CollectionDetail, CollectionsResponse, ItemChanges } from '@/types/api';

type SaveVars = { collectionId: string; sourceId: string };

export function useSaveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, sourceId }: SaveVars) => saveItem(collectionId, sourceId),
    // Every cached collection list gets the new count (and "Already saved" mark) right away.
    onMutate: async ({ collectionId, sourceId }: SaveVars) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });
      const previous = queryClient.getQueriesData<CollectionsResponse>({
        queryKey: ['collections'],
      });
      for (const [key, data] of previous) {
        if (!data) continue;
        const forThisImage = JSON.stringify(key).includes(`"sourceId":"${sourceId}"`);
        const bump = <T extends { id: string; itemCount: number; containsImage?: boolean }>(
          c: T,
        ): T =>
          c.id === collectionId
            ? {
                ...c,
                itemCount: c.itemCount + 1,
                ...(forThisImage ? { containsImage: true } : {}),
              }
            : c;
        queryClient.setQueryData<CollectionsResponse>(key, {
          ...data,
          collections: data.collections.map(bump),
          shared: data.shared.map(bump),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key as QueryKey, data);
      }
    },
    onSettled: (_item, _error, vars) => {
      // Covers, palettes, and counts come back from the server once it has the image.
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.collection(vars.collectionId) });
    },
  });
}

export function useUpdateItem(collectionId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.collection(collectionId);

  return useMutation({
    mutationFn: ({ itemId, changes }: { itemId: string; changes: ItemChanges }) =>
      updateItem(collectionId, itemId, changes),
    // Show the new title and note immediately; an empty title keeps the old one until the
    // server fills in its default.
    onMutate: async ({ itemId, changes }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CollectionDetail>(key);
      if (previous) {
        queryClient.setQueryData<CollectionDetail>(key, {
          ...previous,
          items: previous.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  title: changes.title?.trim() || item.title,
                  note: changes.note ?? item.note,
                }
              : item,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (updated) => {
      // Swap in exactly what the server stored.
      queryClient.setQueryData<CollectionDetail>(key, (current) =>
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

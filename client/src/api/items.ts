// HTTP calls for saved items inside a collection.
import type { ItemChanges, SavedItem } from '@/types/api';
import { request } from './client';

export async function saveItem(collectionId: string, sourceId: string): Promise<SavedItem> {
  const body = await request<{ item: SavedItem }>(`/collections/${collectionId}/items`, {
    method: 'POST',
    body: JSON.stringify({ sourceId }),
  });
  return body.item;
}

export async function updateItem(
  collectionId: string,
  itemId: string,
  changes: ItemChanges,
): Promise<SavedItem> {
  const body = await request<{ item: SavedItem }>(`/collections/${collectionId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
  return body.item;
}

export function removeItem(collectionId: string, itemId: string): Promise<void> {
  return request<void>(`/collections/${collectionId}/items/${itemId}`, { method: 'DELETE' });
}

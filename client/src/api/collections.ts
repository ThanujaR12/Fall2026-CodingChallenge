// HTTP calls for collections.
import type { CollectionDetail, CollectionInput, CollectionSummary } from '@/types/api';
import { request } from './client';

export async function listCollections(sourceId?: string): Promise<CollectionSummary[]> {
  const query = sourceId ? `?${new URLSearchParams({ sourceId })}` : '';
  const body = await request<{ collections: CollectionSummary[] }>(`/collections${query}`);
  return body.collections;
}

export async function createCollection(input: CollectionInput): Promise<CollectionSummary> {
  const body = await request<{ collection: CollectionSummary }>('/collections', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.collection;
}

export async function getCollection(id: string): Promise<CollectionDetail> {
  const body = await request<{ collection: CollectionDetail }>(`/collections/${id}`);
  return body.collection;
}

export async function updateCollection(
  id: string,
  changes: Partial<CollectionInput>,
): Promise<CollectionSummary> {
  const body = await request<{ collection: CollectionSummary }>(`/collections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
  return body.collection;
}

export function deleteCollection(id: string): Promise<void> {
  return request<void>(`/collections/${id}`, { method: 'DELETE' });
}

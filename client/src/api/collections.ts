// HTTP calls for collections.
import type {
  RecommendationsResponse,
  BoardActivityEntry,
  CollectionDetail,
  CollectionInput,
  CollectionSummary,
  CollectionsResponse,
} from '@/types/api';
import { request } from './client';

/** Your own collections plus the ones shared with you. */
export function listCollections(sourceId?: string): Promise<CollectionsResponse> {
  const query = sourceId ? `?${new URLSearchParams({ sourceId })}` : '';
  return request<CollectionsResponse>(`/collections${query}`);
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

/** The board's recent activity, newest first. */
export async function getBoardActivity(id: string): Promise<BoardActivityEntry[]> {
  const body = await request<{ activity: BoardActivityEntry[] }>(`/collections/${id}/activity`);
  return body.activity;
}

/** "More ideas for this board": photos like the board's, page by page. */
export function getRecommendations(id: string, page: number): Promise<RecommendationsResponse> {
  const params = new URLSearchParams({ page: String(page) });
  return request<RecommendationsResponse>(`/collections/${id}/recommendations?${params}`);
}

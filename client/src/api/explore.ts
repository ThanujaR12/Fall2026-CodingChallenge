// HTTP calls for Explore: public boards (optionally by color) and a public board's read-only view.
import type { ImageColor } from '@/lib/colors';
import type { ExploreResponse, SharedView } from '@/types/api';
import { request } from './client';

export function listPublicBoards(page: number, color: ImageColor | null): Promise<ExploreResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (color) params.set('color', color);
  return request<ExploreResponse>(`/explore?${params}`);
}

export async function getPublicBoard(id: string): Promise<SharedView> {
  const body = await request<{ collection: SharedView }>(`/explore/${id}`);
  return body.collection;
}

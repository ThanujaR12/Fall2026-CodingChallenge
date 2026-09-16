// HTTP calls for image search.
import type { SearchResponse } from '@/types/api';
import { request } from './client';

export function searchImages(q: string, page: number): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, page: String(page) });
  return request<SearchResponse>(`/search/images?${params}`);
}

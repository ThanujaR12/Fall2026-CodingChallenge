// HTTP calls for image search.
import type { ImageColor } from '@/lib/colors';
import type { SearchResponse } from '@/types/api';
import { request } from './client';

export function searchImages(
  q: string,
  page: number,
  color?: ImageColor | null,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, page: String(page) });
  if (color) params.set('color', color);
  return request<SearchResponse>(`/search/images?${params}`);
}

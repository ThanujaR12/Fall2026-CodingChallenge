// HTTP calls for photo pages: one Pixabay photo with its colours, and photos like it.
import type { PhotoResponse, SimilarBy, SimilarResponse } from '@/types/api';
import { request } from './client';

export function getPhoto(sourceId: string): Promise<PhotoResponse> {
  return request<PhotoResponse>(`/photos/${sourceId}`);
}

export function getSimilarPhotos(
  sourceId: string,
  by: SimilarBy,
  page: number,
): Promise<SimilarResponse> {
  const params = new URLSearchParams({ by, page: String(page) });
  return request<SimilarResponse>(`/photos/${sourceId}/similar?${params}`);
}

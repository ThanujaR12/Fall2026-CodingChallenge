// HTTP call for the home feed: popular photos for a topic, page by page.
import type { ImageColor } from '@/lib/colors';
import type { FeedTopic } from '@/lib/feedTopics';
import type { ForYouResponse, SearchResponse } from '@/types/api';
import { request } from './client';

export function getFeed(
  topic: FeedTopic,
  page: number,
  color?: ImageColor | null,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ topic, page: String(page) });
  if (color) params.set('color', color);
  return request<SearchResponse>(`/feed?${params}`);
}

/** The personalised home feed; the seed reshuffles it per visit. */
export function getForYou(page: number, seed: string): Promise<ForYouResponse> {
  return request<ForYouResponse>(
    `/feed/for-you?${new URLSearchParams({ page: String(page), seed })}`,
  );
}

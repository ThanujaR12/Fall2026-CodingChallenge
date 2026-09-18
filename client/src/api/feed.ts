// HTTP call for the home feed: popular photos for a topic, page by page.
import type { FeedTopic } from '@/lib/feedTopics';
import type { SearchResponse } from '@/types/api';
import { request } from './client';

export function getFeed(topic: FeedTopic, page: number): Promise<SearchResponse> {
  const params = new URLSearchParams({ topic, page: String(page) });
  return request<SearchResponse>(`/feed?${params}`);
}

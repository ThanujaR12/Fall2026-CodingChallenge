// Loads the home feed for a topic page by page; scrolling near the end fetches the next 20.
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from '@/api/feed';
import type { FeedTopic } from '@/lib/feedTopics';
import { queryKeys } from '@/lib/queryKeys';

export function useFeed(topic: FeedTopic) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.feed(topic),
    queryFn: ({ pageParam }) => getFeed(topic, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 10 * 60_000,
  });

  const results = query.data?.pages.flatMap((page) => page.results) ?? [];
  return { ...query, results };
}

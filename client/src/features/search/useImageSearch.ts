// Loads search results page by page, so "Load more" appends the next 20 to what's shown.
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchImages } from '@/api/search';
import { queryKeys } from '@/lib/queryKeys';

export function useImageSearch(q: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.search(q),
    queryFn: ({ pageParam }) => searchImages(q, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: q.trim().length > 0,
    staleTime: 5 * 60_000,
  });

  const results = query.data?.pages.flatMap((page) => page.results) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return { ...query, results, total };
}

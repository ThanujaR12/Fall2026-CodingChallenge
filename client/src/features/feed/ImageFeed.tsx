// A paged photo feed as a masonry board that loads the next page as you scroll near the bottom.
import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowClockwise, CircleNotch } from '@phosphor-icons/react';
import { ErrorState } from '@/components/ErrorState';
import { MasonryGrid } from '@/components/MasonryGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { SearchResult } from '@/types/api';
import { PIN_CAPTION_HEIGHT, PinCard } from './PinCard';

/** The parts of a TanStack infinite query the feed needs. */
export type FeedQuery = {
  results: SearchResult[];
  isPending: boolean;
  isError: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
};

type ImageFeedProps = {
  feed: FeedQuery;
  label: string;
  renderSaveAction: (result: SearchResult) => ReactNode;
};

const SKELETON_HEIGHTS = [260, 340, 220, 300, 380, 240, 320, 280, 230, 360, 270, 310];

export function ImageFeed({ feed, label, renderSaveAction }: ImageFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = feed;

  // Start loading the next page well before the bottom so scrolling feels endless.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: '900px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  if (feed.isPending) {
    return (
      <div
        role="status"
        aria-label="Loading photos"
        className="columns-2 gap-2.5 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5"
      >
        {SKELETON_HEIGHTS.map((height, index) => (
          <Skeleton
            key={index}
            className="mb-4 w-full break-inside-avoid rounded-2xl"
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  if (feed.isError && feed.results.length === 0) {
    return (
      <ErrorState
        title="The image service didn't answer."
        message="Your collections are unaffected. This usually clears in a moment."
        onRetry={() => feed.refetch()}
        isRetrying={feed.isRefetching}
      />
    );
  }

  return (
    <section aria-label={label}>
      <MasonryGrid
        items={feed.results}
        label={label}
        getKey={(result) => result.sourceId}
        getRatio={(result) => result.height / result.width}
        captionHeight={PIN_CAPTION_HEIGHT}
        renderItem={(result, imageHeight) => (
          <PinCard result={result} imageHeight={imageHeight} renderSaveAction={renderSaveAction} />
        )}
      />

      <div
        ref={sentinelRef}
        className="flex min-h-20 flex-col items-center justify-center gap-3 py-6"
      >
        {isFetchingNextPage && (
          <p role="status" className="flex items-center gap-2 text-[14px] text-ink/65">
            <CircleNotch size={18} className="animate-spin" aria-hidden="true" />
            Loading more photos…
          </p>
        )}
        {isFetchNextPageError && (
          <>
            <p role="alert" className="text-[14px] text-accent2-deep">
              Couldn't load more photos.
            </p>
            <Button variant="secondary" onClick={() => fetchNextPage()}>
              <ArrowClockwise size={16} aria-hidden="true" />
              Try again
            </Button>
          </>
        )}
        {!hasNextPage && feed.results.length > 0 && (
          <p className="text-[13px] text-ink/65 italic">You've reached the end.</p>
        )}
      </div>
    </section>
  );
}

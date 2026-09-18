// "For you" on Home: a banner saying what the feed learned from your saves (tap an interest to
// explore it, or Shuffle for a fresh deal), then the personalised photo board with the reason each
// photo was picked. New people see a fresh, shuffled mix and a nudge to start saving.
import { useState } from 'react';
import { Link } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ShuffleSimple, Sparkle } from '@phosphor-icons/react';
import { getForYou } from '@/api/feed';
import { Button } from '@/components/ui/button';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import { newVisitSeed, visitSeed } from '@/lib/visitSeed';
import type { SearchResult } from '@/types/api';
import { ImageFeed } from './ImageFeed';

const renderSaveAction = (result: SearchResult) => (
  <SaveToCollectionPopover result={result} appearance="pin" />
);

export function ForYouFeed() {
  const [seed, setSeed] = useState(visitSeed);
  const feed = useInfiniteQuery({
    queryKey: ['for-you', seed],
    queryFn: ({ pageParam }) => getForYou(pageParam, seed),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 10 * 60_000,
  });
  const first = feed.data?.pages[0];
  const results = feed.data?.pages.flatMap((p) => p.results) ?? [];

  function shuffle() {
    setSeed(newVisitSeed());
    window.scrollTo({ top: 0 });
  }

  return (
    <section aria-labelledby="for-you-heading">
      <div className="brand-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
        <div className="min-w-0">
          <h2 id="for-you-heading" className="flex items-center gap-2.5 text-[20px]">
            <span
              aria-hidden="true"
              className="brand-gradient inline-flex size-8 items-center justify-center rounded-full text-white shadow-soft"
            >
              <Sparkle size={16} weight="fill" />
            </span>
            <span>
              {first?.personalized ? 'Picked ' : 'Fresh picks '}
              <span className="text-brand">for you</span>
            </span>
          </h2>
          {first?.personalized ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] text-ink/75">
              From what you save:
              {first.interests.map((interest) => (
                <Link
                  key={interest}
                  to={`/search?${new URLSearchParams({ q: interest })}`}
                  className="rounded-full border border-divider bg-white px-3 py-1 font-semibold text-ink transition-colors hover:border-accent hover:bg-accent-tint hover:text-accent-deep"
                >
                  {interest}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[13px] text-ink/75">
              A new mix every visit. Save photos you love and this feed learns your taste.
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={shuffle}
          disabled={feed.isFetching && !feed.isFetchingNextPage}
        >
          <ShuffleSimple size={16} aria-hidden="true" />
          Shuffle
        </Button>
      </div>

      <ImageFeed
        key={seed}
        feed={{ ...feed, results, hasNextPage: feed.hasNextPage ?? false }}
        label="Photos picked for you"
        renderSaveAction={renderSaveAction}
        showReasons={Boolean(first?.personalized)}
      />
    </section>
  );
}

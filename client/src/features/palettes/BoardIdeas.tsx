// "More ideas for this board": recommended photos (from the board's own tags) with one-tap Add.
// Used on the board page and when a board is picked in the Home topics bar.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { getRecommendations } from '@/api/collections';
import { EmptyState } from '@/components/EmptyState';
import { ImageFeed } from '@/features/feed/ImageFeed';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import type { SearchResult } from '@/types/api';
import { AddToBoardButton } from './AddToBoardButton';

type BoardIdeasProps = {
  boardId: string;
  boardName: string;
  /** Editors and owners get one-tap Add; viewers can still save to their own boards. */
  canAdd: boolean;
  title: ReactNode;
  /** Shows an "Open board" link (used on Home). */
  showOpenLink?: boolean;
};

export function BoardIdeas({ boardId, boardName, canAdd, title, showOpenLink }: BoardIdeasProps) {
  const ideas = useInfiniteQuery({
    queryKey: ['recommendations', boardId],
    queryFn: ({ pageParam }) => getRecommendations(boardId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore && last.page < 25 ? last.page + 1 : undefined),
    staleTime: 10 * 60_000,
  });
  const results = ideas.data?.pages.flatMap((page) => page.results) ?? [];
  const basedOn = ideas.data?.pages[0]?.basedOn ?? [];

  const renderAction = (result: SearchResult) =>
    canAdd ? (
      <AddToBoardButton result={result} boardId={boardId} boardName={boardName} />
    ) : (
      <SaveToCollectionPopover result={result} appearance="pin" />
    );

  return (
    <section aria-labelledby={`ideas-${boardId}`} className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`ideas-${boardId}`} className="flex items-center gap-2 text-[22px]">
            <Sparkle size={22} weight="fill" aria-hidden="true" className="text-accent2" />
            {title}
          </h2>
          {basedOn.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-ink/70">
              Based on
              {basedOn.map((word) => (
                <span key={word} className="tag bg-surface text-ink/80">
                  {word}
                </span>
              ))}
            </p>
          )}
        </div>
        {showOpenLink && (
          <Link
            to={`/collections/${boardId}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface px-4 text-[14px] font-semibold hover:bg-neutral-200"
          >
            Open board
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>

      {!ideas.isPending && !ideas.isError && results.length === 0 ? (
        <EmptyState
          icon={<Sparkle size={34} weight="duotone" />}
          title="No ideas yet."
          body="Give the board a descriptive name or save a photo or two, and suggestions will follow."
        />
      ) : (
        <ImageFeed
          feed={{ ...ideas, results, hasNextPage: ideas.hasNextPage ?? false }}
          label={`Ideas for ${boardName}`}
          renderSaveAction={renderAction}
        />
      )}
    </section>
  );
}

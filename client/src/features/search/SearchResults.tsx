// Search results area: idle, loading, error, empty, and the results grid with "Load more".
import type { ReactNode } from 'react';
import { ArrowClockwise, Binoculars, CircleNotch, MagnifyingGlass } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GridSkeleton } from '@/components/GridSkeleton';
import { Button } from '@/components/ui/button';
import type { SearchResult } from '@/types/api';
import { SearchResultCard } from './SearchResultCard';
import { useImageSearch } from './useImageSearch';

type SearchResultsProps = {
  q: string;
  renderSaveAction: (result: SearchResult) => ReactNode;
};

export function SearchResults({ q, renderSaveAction }: SearchResultsProps) {
  const search = useImageSearch(q);

  if (!q) {
    return (
      <EmptyState
        icon={<MagnifyingGlass size={34} weight="duotone" />}
        title="Start with a word."
        body="Search millions of free photos, then save the ones worth keeping into your collections."
      />
    );
  }

  if (search.isPending) return <GridSkeleton count={6} />;

  if (search.isError && search.results.length === 0) {
    return (
      <ErrorState
        title="The image service didn't answer."
        message="Your collections are unaffected. This usually clears in a moment."
        onRetry={() => search.refetch()}
        isRetrying={search.isRefetching}
      />
    );
  }

  if (search.results.length === 0) {
    return (
      <EmptyState
        icon={<Binoculars size={34} weight="duotone" />}
        title={`Nothing for “${q}”.`}
        body="Try a broader or different word."
      />
    );
  }

  return (
    <section aria-label="Search results">
      <p className="mb-5 text-[13px] text-ink/65">
        {search.total.toLocaleString()} {search.total === 1 ? 'result' : 'results'}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {search.results.map((result) => (
          <SearchResultCard
            key={result.sourceId}
            result={result}
            renderSaveAction={renderSaveAction}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-start gap-3">
        {search.isFetchNextPageError && (
          <p role="alert" className="text-[14px] text-accent2-deep">
            Couldn't load more results.
          </p>
        )}
        {search.hasNextPage ? (
          <Button
            variant="secondary"
            onClick={() => search.fetchNextPage()}
            disabled={search.isFetchingNextPage}
          >
            {search.isFetchingNextPage ? (
              <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              search.isFetchNextPageError && <ArrowClockwise size={16} aria-hidden="true" />
            )}
            {search.isFetchingNextPage
              ? 'Loading…'
              : search.isFetchNextPageError
                ? 'Try again'
                : 'Load more'}
          </Button>
        ) : (
          <p className="text-[13px] text-ink/65 italic">End of results</p>
        )}
      </div>
    </section>
  );
}

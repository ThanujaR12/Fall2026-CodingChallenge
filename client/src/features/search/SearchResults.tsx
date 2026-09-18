// Search results: idle and empty messages, otherwise the same scrolling masonry board as Home.
import type { ReactNode } from 'react';
import { Binoculars, MagnifyingGlass } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { ImageFeed } from '@/features/feed/ImageFeed';
import type { ImageColor } from '@/lib/colors';
import type { SearchResult } from '@/types/api';
import { useImageSearch } from './useImageSearch';

type SearchResultsProps = {
  q: string;
  color?: ImageColor | null;
  renderSaveAction: (result: SearchResult) => ReactNode;
};

export function SearchResults({ q, color = null, renderSaveAction }: SearchResultsProps) {
  const search = useImageSearch(q, color);

  if (!q) {
    return (
      <EmptyState
        icon={<MagnifyingGlass size={34} weight="duotone" />}
        title="Start with a word."
        body="Search millions of free photos, then save the ones worth keeping into your collections."
      />
    );
  }

  if (!search.isPending && !search.isError && search.results.length === 0) {
    return (
      <EmptyState
        icon={<Binoculars size={34} weight="duotone" />}
        title={`Nothing for “${q}”.`}
        body={
          color
            ? 'Try another color or clear the color filter.'
            : 'Try a broader or different word.'
        }
      />
    );
  }

  return (
    <>
      {!search.isPending && search.results.length > 0 && (
        <p className="mb-4 text-[13px] text-ink/65">
          {search.total.toLocaleString()} {search.total === 1 ? 'result' : 'results'}
        </p>
      )}
      <ImageFeed
        key={color ?? 'any'}
        feed={{ ...search, hasNextPage: search.hasNextPage ?? false }}
        label="Search results"
        renderSaveAction={renderSaveAction}
      />
    </>
  );
}

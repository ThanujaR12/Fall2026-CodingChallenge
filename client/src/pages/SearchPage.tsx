// Search screen: headline, keyword field (kept in the ?q= URL), and results.
import { useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { BookmarkSimple } from '@phosphor-icons/react';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/features/search/SearchBar';
import { SearchResults } from '@/features/search/SearchResults';
import { APP_NAME } from '@/lib/constants';
import type { SearchResult } from '@/types/api';

type SearchPageProps = {
  /** Lets the save flow plug in without the page knowing its details. */
  renderSaveAction?: (result: SearchResult) => ReactNode;
};

const placeholderSave = () => (
  <Button variant="secondary" disabled>
    <BookmarkSimple size={16} />
    Save
  </Button>
);

export function SearchPage({ renderSaveAction = placeholderSave }: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q')?.trim() ?? '';

  useEffect(() => {
    document.title = q ? `${q} · Search · ${APP_NAME}` : `Search · ${APP_NAME}`;
  }, [q]);

  return (
    <PageContainer className="pt-6 md:pt-10">
      {/* Visually hidden on phones (the design drops it) but kept for screen readers. */}
      <h1 className="sr-only mb-5 text-[50px] md:not-sr-only">Find something worth keeping.</h1>
      <div className="mb-6 max-w-[900px] md:mb-10">
        {/* key resets the field when the URL query changes (e.g. browser Back). */}
        <SearchBar key={q} initialQuery={q} onSearch={(next) => setSearchParams({ q: next })} />
      </div>
      <SearchResults q={q} renderSaveAction={renderSaveAction} />
    </PageContainer>
  );
}

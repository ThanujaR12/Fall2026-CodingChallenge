// Search screen: headline, keyword field (kept in the ?q= URL), and results with Save actions.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import { SearchBar } from '@/features/search/SearchBar';
import { SearchResults } from '@/features/search/SearchResults';
import { APP_NAME } from '@/lib/constants';
import type { SearchResult } from '@/types/api';

const renderSaveAction = (result: SearchResult) => <SaveToCollectionPopover result={result} />;

export function SearchPage() {
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

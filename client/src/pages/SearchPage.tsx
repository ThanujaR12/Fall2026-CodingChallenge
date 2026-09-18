// Search results: the query as the heading (typed in the header search), a colour filter
// (both kept in ?q=&color=), and results.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import { ColorPicker } from '@/features/palettes/ColorPicker';
import { SearchResults } from '@/features/search/SearchResults';
import { isImageColor, type ImageColor } from '@/lib/colors';
import { APP_NAME } from '@/lib/constants';
import type { SearchResult } from '@/types/api';

const renderSaveAction = (result: SearchResult) => (
  <SaveToCollectionPopover result={result} appearance="pin" />
);

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q')?.trim() ?? '';
  const rawColor = searchParams.get('color');
  const color = isImageColor(rawColor) ? rawColor : null;

  function update(next: { q?: string; color?: ImageColor | null }) {
    const params: Record<string, string> = {};
    const nextQ = next.q ?? q;
    const nextColor = next.color === undefined ? color : next.color;
    if (nextQ) params.q = nextQ;
    if (nextColor) params.color = nextColor;
    setSearchParams(params);
  }

  useEffect(() => {
    document.title = q ? `${q} · Search · ${APP_NAME}` : `Search · ${APP_NAME}`;
  }, [q]);

  return (
    <PageContainer className="max-w-[1800px] pt-6 md:pt-10">
      <h1 className="mb-4 text-[32px] break-words md:text-[46px]">
        {q ? `“${q}”` : 'Find something worth keeping.'}
      </h1>
      <div className="mb-6 max-w-[900px] md:mb-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[13px] font-semibold text-ink/75">Color</span>
          <ColorPicker size="compact" value={color} onChange={(next) => update({ color: next })} />
        </div>
      </div>
      <SearchResults q={q} color={color} renderSaveAction={renderSaveAction} />
    </PageContainer>
  );
}

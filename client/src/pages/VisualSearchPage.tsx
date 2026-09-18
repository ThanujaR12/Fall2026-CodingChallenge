// Results of "Search with a photo": your photo, the brands and words read from it,
// search ideas (pick which to search), its colours, and photos matching by subject or by colour.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Camera, Palette, Shapes } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PaletteStrip } from '@/components/PaletteStrip';
import { ImageFeed } from '@/features/feed/ImageFeed';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import { useImageSearch } from '@/features/search/useImageSearch';
import { VisualSearchDialog } from '@/features/search/VisualSearchDialog';
import { APP_NAME } from '@/lib/constants';
import { IMAGE_COLORS, nearestImageColor } from '@/lib/colors';
import { cn } from '@/lib/utils';
import type { PhotoAnalysis } from '@/lib/visualSearch';
import type { SearchResult, SimilarBy } from '@/types/api';

type VisualState = PhotoAnalysis & { image: string };

const renderSaveAction = (result: SearchResult) => (
  <SaveToCollectionPopover result={result} appearance="pin" />
);

function Results({ state }: { state: VisualState }) {
  // Start with the best idea: printed words if any were read, otherwise the top object guess.
  const [query, setQuery] = useState(state.guesses[0]?.name ?? state.words[0] ?? '');
  const [by, setBy] = useState<SimilarBy>('subject');
  const color = state.palette[0] ? nearestImageColor(state.palette[0]) : null;
  const colorLabel = IMAGE_COLORS.find((c) => c.id === color)?.label.toLowerCase();
  const search = useImageSearch(query, by === 'color' ? color : null);

  const chip = (value: string, extra?: string) => (
    <button
      key={value}
      type="button"
      role="radio"
      aria-checked={value === query}
      onClick={() => setQuery(value)}
      className={cn(
        'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors',
        value === query ? 'bg-ink text-paper' : 'bg-surface hover:bg-neutral-200',
      )}
    >
      {value}
      {extra && (
        <span
          className={cn(
            'text-[12px] font-normal',
            value === query ? 'text-paper/80' : 'text-ink/65',
          )}
        >
          {extra}
        </span>
      )}
    </button>
  );

  const option = (value: SimilarBy, text: string, Icon: typeof Shapes) => (
    <button
      type="button"
      aria-pressed={by === value}
      onClick={() => setBy(value)}
      className={cn(
        'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors',
        by === value ? 'bg-ink text-paper' : 'text-ink/80 hover:bg-neutral-200',
      )}
    >
      <Icon size={16} weight={by === value ? 'fill' : 'regular'} aria-hidden="true" />
      {text}
    </button>
  );

  return (
    <>
      <div className="mb-10 grid items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10">
        <img
          src={state.image}
          alt="The photo you searched with"
          className="w-full rounded-2xl object-cover md:max-h-[320px]"
        />
        <div className="grid gap-5">
          <div role="radiogroup" aria-label="Search for" className="grid gap-4">
            {state.words.length > 0 && (
              <div>
                <p className="label-caps mb-2">Brands and words</p>
                <div className="flex flex-wrap gap-2">{state.words.map((w) => chip(w))}</div>
              </div>
            )}
            {state.guesses.length > 0 && (
              <div>
                <p className="label-caps mb-2">Search ideas</p>
                <div className="flex flex-wrap gap-2">
                  {state.guesses.map((g) =>
                    chip(
                      g.name,
                      g.probability !== undefined
                        ? `${Math.round(g.probability * 100)}%`
                        : undefined,
                    ),
                  )}
                </div>
              </div>
            )}
            <p className="-mt-2 text-[13px] text-ink/70">Tap any of these to search it instead.</p>
          </div>
          <div>
            <p className="label-caps mb-2">Its colours</p>
            <PaletteStrip colors={state.palette} className="h-12 max-w-[420px] rounded-xl" />
          </div>
        </div>
      </div>

      <section aria-labelledby="visual-results">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="visual-results" className="text-[26px]">
              Photos like yours
            </h2>
            <p className="mt-1 text-[13px] text-ink/70">
              Matching “{query}”{by === 'color' && colorLabel ? ` in ${colorLabel} tones` : ''}
            </p>
          </div>
          <div
            role="group"
            aria-label="Match by"
            className="inline-flex gap-1 rounded-full bg-surface p-1"
          >
            {option('subject', 'Same subject', Shapes)}
            {option('color', 'Same colours', Palette)}
          </div>
        </div>
        {!search.isPending && !search.isError && search.results.length === 0 ? (
          <EmptyState
            icon={<Camera size={34} weight="duotone" />}
            title={`No photos for “${query}”${by === 'color' ? ' in these colours' : ''}.`}
            body="Try another guess above, or switch between subject and colours."
          />
        ) : (
          <ImageFeed
            key={`${query}|${by}`}
            feed={{ ...search, hasNextPage: search.hasNextPage ?? false }}
            label="Photos like yours"
            renderSaveAction={renderSaveAction}
          />
        )}
      </section>
    </>
  );
}

export function VisualSearchPage() {
  const location = useLocation();
  const state = location.state as VisualState | null;

  useEffect(() => {
    document.title = `Search with a photo · ${APP_NAME}`;
  }, []);

  return (
    <PageContainer className="max-w-[1800px] pt-6 md:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[34px] md:text-[42px]">Search with a photo</h1>
        {state && (
          <div className="flex items-center gap-2 rounded-full bg-surface py-1 pr-4 pl-1 text-[14px] font-semibold">
            <VisualSearchDialog />
            Try another photo
          </div>
        )}
      </div>
      {state && (state.guesses.length > 0 || state.words.length > 0) ? (
        // Keyed by the photo so a new search starts fresh.
        <Results key={state.image.slice(-64)} state={state} />
      ) : (
        <EmptyState
          icon={<Camera size={34} weight="duotone" />}
          title="Start with a photo."
          body="Use the camera button to snap or upload something, and we'll find photos like it."
          action={
            <div className="inline-flex items-center gap-2 rounded-full bg-surface py-1 pr-4 pl-1 text-[14px] font-semibold">
              <VisualSearchDialog />
              Search with a photo
            </div>
          }
        />
      )}
    </PageContainer>
  );
}

// Palette Boards hub: every board's color palette (copy, download, find more like it) and
// browsing photos by color, with an optional keyword. Color and keyword live in the URL.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { MagnifyingGlass, Palette, X } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollections } from '@/features/collections/useCollections';
import { ImageFeed } from '@/features/feed/ImageFeed';
import { useFeed } from '@/features/feed/useFeed';
import { BoardPaletteCard } from '@/features/palettes/BoardPaletteCard';
import { ColorPicker } from '@/features/palettes/ColorPicker';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import { useImageSearch } from '@/features/search/useImageSearch';
import { APP_NAME, MAX_QUERY } from '@/lib/constants';
import {
  IMAGE_COLORS,
  RAINBOW,
  isImageColor,
  nearestImageColor,
  type ImageColor,
} from '@/lib/colors';
import type { CollectionSummary, SearchResult } from '@/types/api';

const renderSaveAction = (result: SearchResult) => (
  <SaveToCollectionPopover result={result} appearance="pin" />
);

// Photos in one color: a keyword search when there is one, otherwise popular photos.
function ColorResults({ color, q }: { color: ImageColor; q: string }) {
  const feed = useFeed('all', color, !q);
  const search = useImageSearch(q, color);
  const active = q ? { ...search, hasNextPage: search.hasNextPage ?? false } : feed;
  const label = IMAGE_COLORS.find((c) => c.id === color)?.label ?? color;

  if (q && !search.isPending && !search.isError && search.results.length === 0) {
    return (
      <EmptyState
        icon={<MagnifyingGlass size={34} weight="duotone" />}
        title={`No ${label.toLowerCase()} photos for “${q}”.`}
        body="Try another color or a broader word."
      />
    );
  }
  return (
    <ImageFeed
      key={`${color}|${q}`}
      feed={active}
      label={q ? `${label} photos of ${q}` : `${label} photos`}
      renderSaveAction={renderSaveAction}
    />
  );
}

export function PalettesPage() {
  const [params, setParams] = useSearchParams();
  const rawColor = params.get('color');
  const color = isImageColor(rawColor) ? rawColor : null;
  const q = params.get('q')?.trim() ?? '';
  const [keyword, setKeyword] = useState(q);
  const browseRef = useRef<HTMLElement>(null);
  const boards = useCollections();

  useEffect(() => {
    document.title = `Palettes · ${APP_NAME}`;
  }, []);

  function update(next: { color?: ImageColor | null; q?: string }) {
    const nextColor = next.color === undefined ? color : next.color;
    const nextQ = next.q === undefined ? q : next.q;
    const query: Record<string, string> = {};
    if (nextColor) query.color = nextColor;
    if (nextQ) query.q = nextQ;
    setParams(query, { replace: true });
  }

  function findMoreLike(board: CollectionSummary) {
    setKeyword('');
    update({ color: nearestImageColor(board.palette[0]), q: '' });
    browseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submitKeyword(event: FormEvent) {
    event.preventDefault();
    update({ q: keyword.trim() });
  }

  const owned = boards.data?.collections ?? [];
  const shared = boards.data?.shared ?? [];

  return (
    <PageContainer className="max-w-[1800px] pt-6 md:pt-10">
      <header className="mb-8 max-w-[720px]">
        <p className="label-caps mb-2">Palette Boards</p>
        <h1 className="flex items-center gap-3 text-[34px] md:text-[46px]">
          <span
            aria-hidden="true"
            className="inline-flex size-11 items-center justify-center rounded-full md:size-12"
            style={{ background: RAINBOW }}
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-paper md:size-9">
              <Palette size={20} weight="fill" />
            </span>
          </span>
          Palettes
        </h1>
        <p className="mt-2 text-[16px] text-ink/75">
          Every board has its own colors. Copy them, download them, or find more photos that match.
        </p>
      </header>

      <section aria-labelledby="board-palettes" className="mb-12">
        <h2 id="board-palettes" className="mb-4 text-[22px]">
          Your board palettes
        </h2>
        {boards.isPending ? (
          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            role="status"
            aria-label="Loading palettes"
          >
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[200px] rounded-2xl" />
            ))}
          </div>
        ) : boards.isError ? (
          <ErrorState
            title="Couldn't load your boards."
            message="Your boards are safe. Try again in a moment."
            onRetry={() => boards.refetch()}
            isRetrying={boards.isRefetching}
          />
        ) : owned.length + shared.length === 0 ? (
          <EmptyState
            icon={<Palette size={34} weight="duotone" />}
            title="No boards yet."
            body="Make a board and save a few photos. Its colors will show up here."
            action={
              <Link to="/collections" className={buttonVariants({ variant: 'secondary' })}>
                Go to Boards
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {owned.map((board) => (
              <li key={board.id}>
                <BoardPaletteCard board={board} ownerLabel="Yours" onFindMore={findMoreLike} />
              </li>
            ))}
            {shared.map((board) => (
              <li key={board.id}>
                <BoardPaletteCard
                  board={board}
                  ownerLabel={`Shared by @${board.owner.username}`}
                  onFindMore={findMoreLike}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section ref={browseRef} aria-labelledby="browse-color" className="scroll-mt-4">
        <h2 id="browse-color" className="mb-1 text-[22px]">
          Browse by color
        </h2>
        <p className="mb-5 text-[14px] text-ink/70">
          Pick a color to see photos in it. Add a word to narrow it down.
        </p>
        <div className="mb-5">
          <ColorPicker value={color} onChange={(next) => update({ color: next })} />
        </div>
        <form role="search" onSubmit={submitKeyword} className="mb-8 flex max-w-[560px] gap-2.5">
          <label htmlFor="color-keyword" className="sr-only">
            Keyword (optional)
          </label>
          <div className="relative flex-1">
            <Input
              id="color-keyword"
              type="search"
              value={keyword}
              maxLength={MAX_QUERY}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Optional keyword, e.g. flowers"
              className="min-h-11 pr-10"
              autoComplete="off"
            />
            {q && (
              <button
                type="button"
                aria-label="Clear keyword"
                onClick={() => {
                  setKeyword('');
                  update({ q: '' });
                }}
                className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-ink/65 hover:bg-surface"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button type="submit" className="min-h-11" disabled={!color}>
            Search
          </Button>
        </form>

        {color ? (
          <ColorResults color={color} q={q} />
        ) : (
          <p className="text-[15px] text-ink/65 italic">Choose a color above to start browsing.</p>
        )}
      </section>
    </PageContainer>
  );
}

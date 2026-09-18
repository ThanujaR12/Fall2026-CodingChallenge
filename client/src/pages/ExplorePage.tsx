// Explore (design 07): everyone's public boards as palette cards, filterable by color.
// Open to signed-out visitors too; the color filter lives in the URL.
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Compass, CircleNotch } from '@phosphor-icons/react';
import { assetUrl } from '@/api/client';
import { listPublicBoards } from '@/api/explore';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ColorPicker } from '@/features/palettes/ColorPicker';
import { APP_NAME } from '@/lib/constants';
import { EMPTY_PALETTE, IMAGE_COLORS, isImageColor } from '@/lib/colors';
import { imageCount } from '@/lib/format';
import type { ExploreBoard } from '@/types/api';

function ExploreCard({ board }: { board: ExploreBoard }) {
  const palette = board.palette.length > 0 ? board.palette : EMPTY_PALETTE;
  return (
    <article>
      <Link to={`/explore/${board.id}`} className="group block focus-visible:outline-offset-4">
        <div className="overflow-hidden rounded-2xl">
          <div className="stripe-placeholder aspect-[16/10] w-full overflow-hidden">
            {board.coverImageUrl && (
              <img
                src={assetUrl(board.coverImageUrl)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            )}
          </div>
          <div className="flex h-3" aria-hidden="true">
            {palette.map((color) => (
              <span key={color} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
        <h2 className="mt-3 text-[19px] font-semibold group-hover:text-accent-deep">
          {board.name}
        </h2>
      </Link>
      <p className="mt-0.5 text-[13px] text-ink/70">
        by @{board.owner.username} · {imageCount(board.itemCount)}
      </p>
    </article>
  );
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('color');
  const color = isImageColor(raw) ? raw : null;
  const colorLabel = IMAGE_COLORS.find((c) => c.id === color)?.label.toLowerCase();

  const explore = useInfiniteQuery({
    queryKey: ['explore', color],
    queryFn: ({ pageParam }) => listPublicBoards(pageParam, color),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
  const boards = explore.data?.pages.flatMap((page) => page.boards) ?? [];

  useEffect(() => {
    document.title = `Explore · ${APP_NAME}`;
  }, []);

  return (
    <PageContainer className="max-w-[1800px] pt-6 md:pt-10">
      <header className="mb-6">
        <h1 className="text-[34px] md:text-[46px]">Explore public boards</h1>
        <p className="mt-1 text-[16px] text-ink/75">
          Browse by the colors people collected, not the words they used.
        </p>
      </header>

      <div className="mb-8">
        <ColorPicker
          value={color}
          onChange={(next) => setParams(next ? { color: next } : {}, { replace: true })}
        />
      </div>

      {explore.isPending ? (
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
          role="status"
          aria-label="Loading boards"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-[16/11] rounded-2xl" />
          ))}
        </div>
      ) : explore.isError ? (
        <ErrorState
          title="Couldn't load Explore."
          message={explore.error.message}
          onRetry={() => explore.refetch()}
          isRetrying={explore.isRefetching}
        />
      ) : boards.length === 0 ? (
        <EmptyState
          icon={<Compass size={34} weight="duotone" />}
          title={color ? `No ${colorLabel} boards yet.` : 'No public boards yet.'}
          body={
            color
              ? 'Try another color.'
              : 'Make one of your boards public from its Share menu and it will show up here.'
          }
        />
      ) : (
        <>
          <ul className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {boards.map((board) => (
              <li key={board.id}>
                <ExploreCard board={board} />
              </li>
            ))}
          </ul>
          {explore.hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => explore.fetchNextPage()}
                disabled={explore.isFetchingNextPage}
              >
                {explore.isFetchingNextPage && (
                  <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
                )}
                {explore.isFetchingNextPage ? 'Loading…' : 'More boards'}
              </Button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

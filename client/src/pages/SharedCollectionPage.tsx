// Read-only board (design 06) for share-link visitors and for public boards opened from Explore.
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { LinkBreak } from '@phosphor-icons/react';
import { ApiError, assetUrl } from '@/api/client';
import { getPublicBoard } from '@/api/explore';
import { getSharedView } from '@/api/sharing';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GridSkeleton } from '@/components/GridSkeleton';
import { ImageCredit } from '@/components/ImageCredit';
import { LazyImage } from '@/components/LazyImage';
import { PageContainer } from '@/components/PageContainer';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BoardHero } from '@/features/palettes/BoardHero';
import { BoardPaletteBar } from '@/features/palettes/BoardPaletteBar';
import { APP_NAME } from '@/lib/constants';
import { imageCount, savedOn } from '@/lib/format';

type SharedCollectionPageProps = {
  /** "share": /s/:token links; "public": /explore/:id boards. */
  source?: 'share' | 'public';
};

export function SharedCollectionPage({ source = 'share' }: SharedCollectionPageProps) {
  const { token = '', id = '' } = useParams();
  const isPublic = source === 'public';
  const shared = useQuery({
    queryKey: isPublic ? ['public-board', id] : ['shared', token],
    queryFn: () => (isPublic ? getPublicBoard(id) : getSharedView(token)),
  });
  const name = shared.data?.name;

  useEffect(() => {
    document.title = name ? `${name} · ${APP_NAME}` : `Shared board · ${APP_NAME}`;
  }, [name]);

  if (shared.isPending) {
    return (
      <PageContainer className="pt-6 md:pt-14">
        <div className="mb-10 space-y-3" role="status" aria-label="Loading board">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-12 w-2/3 max-w-[480px]" />
          <Skeleton className="h-4 w-1/2 max-w-[360px]" />
        </div>
        <GridSkeleton variant="board" count={4} />
      </PageContainer>
    );
  }

  if (shared.isError) {
    const inactive =
      shared.error instanceof ApiError &&
      (shared.error.status === 404 || shared.error.status === 400);
    return (
      <PageContainer className="pt-6 md:pt-14">
        {inactive ? (
          <EmptyState
            icon={<LinkBreak size={34} weight="duotone" />}
            title={isPublic ? "This board isn't public." : 'This link is no longer active.'}
            body={
              isPublic
                ? 'The owner may have made it private. Find more boards on Explore.'
                : 'The owner may have turned sharing off. Ask them for a new link.'
            }
            action={
              <Link
                to={isPublic ? '/explore' : '/login'}
                className={buttonVariants({ variant: 'secondary' })}
              >
                {isPublic ? 'Back to Explore' : `Go to ${APP_NAME}`}
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="Couldn't load this board."
            message={shared.error.message}
            onRetry={() => shared.refetch()}
            isRetrying={shared.isRefetching}
          />
        )}
      </PageContainer>
    );
  }

  const board = shared.data;

  return (
    <PageContainer>
      <BoardHero palette={board.palette}>
        <header>
          <p className="label-caps mb-2 font-semibold [color:var(--board-accent,rgba(32,30,29,0.65))]">
            {isPublic ? 'Public board · Explore' : 'Shared board · View only'}
          </p>
          <h1 className="text-[34px] break-words md:text-[54px]">{board.name}</h1>
          {board.description && (
            <p className="mt-3 max-w-[620px] text-[16px] text-ink/75">{board.description}</p>
          )}
          <p className="mt-4 flex flex-wrap items-center gap-2 text-[14px] text-ink/75">
            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-full bg-accent-deep text-[11px] font-semibold text-white uppercase"
            >
              {board.owner.username.slice(0, 2)}
            </span>
            A board by <strong className="font-semibold text-ink">@{board.owner.username}</strong> ·{' '}
            {imageCount(board.itemCount)} · updated {savedOn(board.updatedAt)}
          </p>
          <BoardPaletteBar palette={board.palette} />
        </header>
      </BoardHero>

      {board.items.length === 0 ? (
        <p className="text-[15px] text-ink/65 italic">Nothing has been saved to this board yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {board.items.map((item) => (
            <li key={item.id} className="min-w-0">
              <LazyImage src={assetUrl(item.imageUrl)} alt={item.title} aspect="4 / 3" />
              <h2 className="mt-2.5 truncate text-[15px]">{item.title}</h2>
              {item.note && (
                <p className="mt-0.5 line-clamp-2 text-[13px] text-ink/75">{item.note}</p>
              )}
              <ImageCredit creatorName={item.creatorName} pageUrl={item.pageUrl} />
              {item.addedBy && (
                <p className="text-[12px] text-ink/65">added by @{item.addedBy.username}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

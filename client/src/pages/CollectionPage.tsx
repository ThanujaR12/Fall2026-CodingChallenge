// Single collection screen: header and saved images, with loading, empty, and error states.
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { Images, SquaresFour } from '@phosphor-icons/react';
import { ApiError } from '@/api/client';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GridSkeleton } from '@/components/GridSkeleton';
import { PageContainer } from '@/components/PageContainer';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionHeader } from '@/features/collections/CollectionHeader';
import { useCollection } from '@/features/collections/useCollections';
import { SavedItemGrid } from '@/features/items/SavedItemGrid';
import { APP_NAME } from '@/lib/constants';

export function CollectionPage() {
  const { id = '' } = useParams();
  const collection = useCollection(id);
  const name = collection.data?.name;

  useEffect(() => {
    document.title = name ? `${name} · ${APP_NAME}` : `Collection · ${APP_NAME}`;
  }, [name]);

  if (collection.isPending) {
    return (
      <PageContainer className="pt-6 md:pt-10">
        <div className="mb-10 space-y-3" role="status" aria-label="Loading collection">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-2/3 max-w-[420px]" />
          <Skeleton className="h-4 w-1/2 max-w-[320px]" />
        </div>
        <GridSkeleton variant="board" />
      </PageContainer>
    );
  }

  if (collection.isError) {
    const notFound =
      collection.error instanceof ApiError &&
      (collection.error.status === 404 || collection.error.code === 'VALIDATION_ERROR');
    return (
      <PageContainer className="pt-6 md:pt-10">
        {notFound ? (
          <EmptyState
            icon={<SquaresFour size={34} weight="duotone" />}
            title="Collection not found"
            body="It may have been deleted, or the link is wrong."
            action={
              <Link to="/collections" className={buttonVariants({ variant: 'primary' })}>
                Go to My collections
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="Couldn't load this collection."
            message={collection.error.message}
            onRetry={() => collection.refetch()}
            isRetrying={collection.isRefetching}
          />
        )}
      </PageContainer>
    );
  }

  const data = collection.data;

  return (
    <PageContainer className="pt-6 md:pt-10">
      <CollectionHeader collection={data} />

      {data.items.length === 0 ? (
        <EmptyState
          icon={<Images size={34} weight="duotone" />}
          title="Nothing saved here yet"
          body={`Find images worth keeping and save them to ${data.name}.`}
          action={
            <Link to="/search" className={buttonVariants({ variant: 'primary' })}>
              Search images
            </Link>
          }
        />
      ) : (
        <SavedItemGrid items={data.items} onOpen={() => undefined} />
      )}
    </PageContainer>
  );
}

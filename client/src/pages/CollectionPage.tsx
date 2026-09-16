// Single collection screen: header with Edit/Delete, saved images, and item detail (?item=).
import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Images, SquaresFour } from '@phosphor-icons/react';
import { ApiError } from '@/api/client';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GridSkeleton } from '@/components/GridSkeleton';
import { PageContainer } from '@/components/PageContainer';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionHeader } from '@/features/collections/CollectionHeader';
import { DeleteCollectionDialog } from '@/features/collections/DeleteCollectionDialog';
import { EditCollectionDialog } from '@/features/collections/EditCollectionDialog';
import { useCollection } from '@/features/collections/useCollections';
import { ItemDetailPanel } from '@/features/items/ItemDetailPanel';
import { SavedItemGrid } from '@/features/items/SavedItemGrid';
import { APP_NAME } from '@/lib/constants';

export function CollectionPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const collection = useCollection(id);
  const name = collection.data?.name;

  // The open item lives in the URL so reloads keep it and browser Back closes it.
  const selectedId = searchParams.get('item');
  const selectedItem = collection.data?.items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    document.title = name ? `${name} · ${APP_NAME}` : `Collection · ${APP_NAME}`;
  }, [name]);

  function openItem(itemId: string) {
    setSearchParams({ item: itemId }, { preventScrollReset: true });
  }

  function closeItem() {
    setSearchParams({}, { preventScrollReset: true });
  }

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
      <CollectionHeader
        collection={data}
        actions={
          <>
            <EditCollectionDialog collection={data} />
            <DeleteCollectionDialog collection={data} />
          </>
        }
      />

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
        // The detail column is always reserved on wide screens, so opening an item never reflows the grid.
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <SavedItemGrid
            items={data.items}
            selectedId={selectedItem?.id}
            onOpen={(item) => openItem(item.id)}
          />
          <ItemDetailPanel
            collectionId={data.id}
            collectionName={data.name}
            item={selectedItem}
            onClose={closeItem}
          />
        </div>
      )}
    </PageContainer>
  );
}

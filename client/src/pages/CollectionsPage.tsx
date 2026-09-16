// My collections screen: title, totals, New collection button, and the collection grid.
import { useEffect } from 'react';
import { Plus, SquaresFour } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GridSkeleton } from '@/components/GridSkeleton';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { CollectionGrid } from '@/features/collections/CollectionGrid';
import { NewCollectionDialog } from '@/features/collections/NewCollectionDialog';
import { useCollections } from '@/features/collections/useCollections';
import { APP_NAME } from '@/lib/constants';
import { collectionCount, imageCount } from '@/lib/format';

export function CollectionsPage() {
  const collections = useCollections();

  useEffect(() => {
    document.title = `My collections · ${APP_NAME}`;
  }, []);

  const newCollectionButton = (
    <NewCollectionDialog
      trigger={
        <Button>
          <Plus size={16} weight="bold" />
          New collection
        </Button>
      }
    />
  );

  const list = collections.data ?? [];
  const totalImages = list.reduce((sum, c) => sum + c.itemCount, 0);

  return (
    <PageContainer className="pt-6 md:pt-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
        <div>
          <h1 className="text-[29px] md:text-[42px]">My collections</h1>
          {collections.isSuccess && list.length > 0 && (
            <p className="mt-1 text-[14px] text-ink/65">
              {collectionCount(list.length)} · {imageCount(totalImages)}
            </p>
          )}
        </div>
        {list.length > 0 && newCollectionButton}
      </div>

      {collections.isPending ? (
        <GridSkeleton variant="board" count={3} />
      ) : collections.isError ? (
        <ErrorState
          title="Couldn't load your collections."
          message={collections.error.message}
          onRetry={() => collections.refetch()}
          isRetrying={collections.isRefetching}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<SquaresFour size={34} weight="duotone" />}
          title="No collections yet"
          body="Create your first collection to start saving images."
          action={newCollectionButton}
        />
      ) : (
        <CollectionGrid collections={list} />
      )}
    </PageContainer>
  );
}

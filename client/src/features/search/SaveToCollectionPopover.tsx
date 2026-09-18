// "Save to collection" popover for a search result: pick a collection or create one, then save.
import { useState } from 'react';
import { BookmarkSimple, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollections, useCreateCollection } from '@/features/collections/useCollections';
import { useSaveItem } from '@/features/items/useItems';
import type { CollectionSummary, SearchResult } from '@/types/api';
import { CollectionPickerRow } from './CollectionPickerRow';
import { NewCollectionInline } from './NewCollectionInline';

export function SaveToCollectionPopover({ result }: { result: SearchResult }) {
  const [open, setOpen] = useState(false);
  const [savingTo, setSavingTo] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | undefined>();
  // True from pressing Create until the image is saved into the new collection.
  const [creating, setCreating] = useState(false);

  // Only ask the server which collections hold this image once the picker is opened.
  const collections = useCollections(result.sourceId, { enabled: open });
  const createCollection = useCreateCollection();
  const saveItem = useSaveItem();
  const busy = saveItem.isPending || createCollection.isPending || creating;

  async function saveTo(collection: Pick<CollectionSummary, 'id' | 'name'>) {
    setSavingTo(collection.id);
    try {
      await saveItem.mutateAsync({ collectionId: collection.id, sourceId: result.sourceId });
      setOpen(false);
      toast.success(`Saved to ${collection.name}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ITEM_ALREADY_SAVED') {
        toast(`Already saved in ${collection.name}`);
      } else if (error instanceof ApiError && error.code === 'COLLECTION_NOT_FOUND') {
        toast.error('That collection no longer exists.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Could not save the image.');
      }
      void collections.refetch();
    } finally {
      setSavingTo(null);
    }
  }

  async function createAndSave(name: string) {
    setCreateError(undefined);
    setCreating(true);
    try {
      const created = await createCollection.mutateAsync({ name, description: '' });
      await saveTo(created);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? (error.fields?.name ?? error.message)
          : 'Could not create the collection.';
      setCreateError(message);
      throw error;
    } finally {
      setCreating(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setCreateError(undefined);
  }

  // Your own collections, then shared ones you can edit (viewers can't save).
  const list = [
    ...(collections.data?.collections ?? []),
    ...(collections.data?.shared ?? []).filter((c) => c.role === 'editor'),
  ];

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="secondary" aria-label={`Save “${result.title}” to a collection`}>
          <BookmarkSimple size={16} />
          Save
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="grid gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[17px]">Save to collection</h4>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label="Close"
            className="-mr-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-[2px] text-ink/70 hover:bg-accent-tint"
          >
            <X size={16} />
          </button>
        </div>

        {collections.isPending ? (
          <div className="grid gap-3" role="status" aria-label="Loading collections">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : collections.isError ? (
          <div role="alert" className="grid gap-2">
            <p className="text-[14px] text-accent2-deep">Couldn't load your collections.</p>
            <Button variant="secondary" size="sm" onClick={() => collections.refetch()}>
              Retry
            </Button>
          </div>
        ) : list.length === 0 ? (
          <p className="text-[14px] text-ink/75">
            Create your first collection — this image will be saved into it.
          </p>
        ) : (
          <ul className="max-h-[260px] overflow-y-auto" aria-label="Your collections">
            {list.map((collection) => (
              <CollectionPickerRow
                key={collection.id}
                collection={collection}
                isSaving={savingTo === collection.id}
                disabled={busy}
                onSave={() => void saveTo(collection)}
              />
            ))}
          </ul>
        )}

        <NewCollectionInline
          onCreate={createAndSave}
          isPending={creating}
          disabled={busy || creating}
          error={createError}
        />
      </PopoverContent>
    </Popover>
  );
}

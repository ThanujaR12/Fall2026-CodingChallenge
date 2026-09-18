// "Save to collection" popover for a search result: pick a collection or create one, then save.
import { useState } from 'react';
import { BookmarkSimple, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollections, useCreateCollection } from '@/features/collections/useCollections';
import { useSaveItem } from '@/features/items/useItems';
import { cn } from '@/lib/utils';
import type { CollectionSummary, SearchResult } from '@/types/api';
import { CollectionPickerRow } from './CollectionPickerRow';
import { NewCollectionInline } from './NewCollectionInline';

type SaveToCollectionPopoverProps = {
  result: SearchResult;
  /** "pin" is the round magenta Save shown over feed photos. */
  appearance?: 'button' | 'pin';
};

export function SaveToCollectionPopover({
  result,
  appearance = 'button',
}: SaveToCollectionPopoverProps) {
  const [open, setOpen] = useState(false);
  // The board it was just saved to (shown on the button as "Saved").
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | undefined>();
  // True from pressing Create until the image is saved into the new collection.
  const [creating, setCreating] = useState(false);

  // Only ask the server which collections hold this image once the picker is opened.
  const collections = useCollections(result.sourceId, { enabled: open });
  const createCollection = useCreateCollection();
  const saveItem = useSaveItem();
  const busy = createCollection.isPending || creating;

  // Optimistic: the picker closes, the button reads "Saved", and counts update at once;
  // if the server refuses, everything rolls back with an explanation.
  function saveTo(collection: Pick<CollectionSummary, 'id' | 'name'>) {
    setOpen(false);
    setSavedTo(collection.name);
    toast.success(`Saved to ${collection.name}`);
    saveItem.mutate(
      { collectionId: collection.id, sourceId: result.sourceId },
      {
        onError: (error) => {
          setSavedTo(null);
          if (error instanceof ApiError && error.code === 'ITEM_ALREADY_SAVED') {
            toast(`Already saved in ${collection.name}`);
          } else if (error instanceof ApiError && error.code === 'COLLECTION_NOT_FOUND') {
            toast.error('That collection no longer exists.');
          } else {
            toast.error(
              `Couldn't save to ${collection.name}. ${error instanceof Error ? error.message : ''}`,
            );
          }
        },
      },
    );
  }

  async function createAndSave(name: string) {
    setCreateError(undefined);
    setCreating(true);
    try {
      const created = await createCollection.mutateAsync({ name, description: '' });
      saveTo(created);
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
        <Button
          variant={appearance === 'pin' ? 'primary' : 'secondary'}
          className={
            appearance === 'pin'
              ? cn(
                  'min-h-10 rounded-full px-4 text-[15px] text-white',
                  savedTo ? 'bg-ink hover:bg-ink/85' : 'bg-accent2 hover:bg-accent2-deep',
                )
              : undefined
          }
          aria-label={
            savedTo
              ? `Saved to ${savedTo}. Save “${result.title}” to another collection`
              : `Save “${result.title}” to a collection`
          }
        >
          {savedTo ? (
            <Check size={16} weight="bold" aria-hidden="true" />
          ) : (
            <BookmarkSimple size={16} aria-hidden="true" />
          )}
          {savedTo ? 'Saved' : 'Save'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="grid gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[17px]">Save to collection</h4>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label="Close"
            className="-mr-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink/70 hover:bg-accent-tint"
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

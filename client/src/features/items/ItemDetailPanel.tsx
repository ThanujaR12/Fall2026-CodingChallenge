// Item detail: a sticky side column on wide screens, a bottom sheet on phones and tablets.
import { Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { assetUrl } from '@/api/client';
import { LazyImage } from '@/components/LazyImage';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { SavedItem } from '@/types/api';
import { ItemEditForm } from './ItemEditForm';
import { useRemoveItem } from './useItems';

type ItemDetailPanelProps = {
  collectionId: string;
  collectionName: string;
  item: SavedItem | null;
  onClose: () => void;
};

type ItemDetailsProps = { item: SavedItem; onRemove: () => void; isRemoving: boolean };

function ItemDetails({ item, onRemove, isRemoving }: ItemDetailsProps) {
  return (
    <div className="grid gap-5">
      <LazyImage
        src={assetUrl(item.imageUrl)}
        alt={item.title}
        width={item.width}
        height={item.height}
      />
      {/* key resets the form whenever a different image is opened. */}
      <ItemEditForm key={item.id} item={item} />
      <div className="border-t border-divider pt-4">
        <Button
          variant="destructive-ghost"
          className="-ml-3.5"
          onClick={onRemove}
          disabled={isRemoving}
        >
          <Trash size={16} />
          Remove from collection
        </Button>
      </div>
    </div>
  );
}

export function ItemDetailPanel({
  collectionId,
  collectionName,
  item,
  onClose,
}: ItemDetailPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  // Lives here (not in ItemDetails) so its callbacks still run after the details close.
  const remove = useRemoveItem(collectionId);

  function handleRemove() {
    if (!item) return;
    // Close first; the image disappears from the grid immediately (optimistic update).
    onClose();
    remove.mutate(item.id, {
      onSuccess: () => toast.success(`Removed from ${collectionName}`),
      onError: (error) => toast.error(`Couldn't remove the image. ${error.message}`),
    });
  }

  const details = item && (
    <ItemDetails item={item} onRemove={handleRemove} isRemoving={remove.isPending} />
  );

  if (isDesktop) {
    return (
      <aside aria-label="Item detail" className="sticky top-6 self-start">
        <p className="label-caps mb-4">Item detail</p>
        {details ?? (
          <p className="stripe-placeholder flex aspect-[4/3] items-center justify-center px-6 text-center text-[14px] text-ink/60 italic">
            Select an image to see its details and add a note.
          </p>
        )}
      </aside>
    );
  }

  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="md:px-10">
        <SheetTitle>Item detail</SheetTitle>
        <SheetDescription>Details, title, and note for the selected image.</SheetDescription>
        {details}
      </SheetContent>
    </Sheet>
  );
}

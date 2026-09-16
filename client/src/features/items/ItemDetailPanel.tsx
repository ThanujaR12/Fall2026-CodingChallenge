// Item detail: a sticky side column on wide screens, a bottom sheet on phones and tablets.
import { useEffect, useRef } from 'react';
import { ArrowSquareOut, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { assetUrl } from '@/api/client';
import { ImageCredit } from '@/components/ImageCredit';
import { LazyImage } from '@/components/LazyImage';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { savedOn } from '@/lib/format';
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

      <div className="grid gap-3">
        {item.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {item.tags.map((tag) => (
              <li key={tag}>
                <span className="tag bg-surface text-ink/75">{tag}</span>
              </li>
            ))}
          </ul>
        )}
        <div>
          <ImageCredit creatorName={item.creatorName} pageUrl={item.pageUrl} />
          <p className="text-[12px] text-ink/65">Saved {savedOn(item.createdAt)}</p>
        </div>
        <a
          href={item.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'secondary', className: 'justify-self-start' })}
        >
          <ArrowSquareOut size={16} />
          View on Pixabay
        </a>
      </div>

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
  const headingRef = useRef<HTMLParagraphElement>(null);
  // Lives here (not in ItemDetails) so its callbacks still run after the details close.
  const remove = useRemoveItem(collectionId);
  const itemId = item?.id;

  // Keep the latest onClose without re-running the effects below on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Desktop side column: move focus into the panel when a different image opens.
  // (The phone sheet gets focus handling from Radix.)
  useEffect(() => {
    if (isDesktop && itemId) headingRef.current?.focus({ preventScroll: true });
  }, [isDesktop, itemId]);

  // Desktop side column: Escape closes it and returns focus to the card that opened it.
  useEffect(() => {
    if (!isDesktop || !itemId) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Let an open dialog (e.g. Edit collection) handle its own Escape.
      if (
        event.key !== 'Escape' ||
        document.querySelector('[role="dialog"], [role="alertdialog"]')
      ) {
        return;
      }
      onCloseRef.current();
      document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)?.focus();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, itemId]);

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
      <aside
        aria-label="Item detail"
        className="sticky top-6 max-h-[calc(100dvh-48px)] self-start overflow-y-auto pr-1"
      >
        <p ref={headingRef} tabIndex={-1} className="label-caps mb-4 outline-none">
          Item detail
        </p>
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

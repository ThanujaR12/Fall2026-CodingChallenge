// Item detail: a sticky side column on wide screens, a bottom sheet on phones and tablets.
import { assetUrl } from '@/api/client';
import { LazyImage } from '@/components/LazyImage';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { SavedItem } from '@/types/api';
import { ItemEditForm } from './ItemEditForm';

type ItemDetailPanelProps = {
  item: SavedItem | null;
  onClose: () => void;
};

function ItemDetails({ item }: { item: SavedItem }) {
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
    </div>
  );
}

export function ItemDetailPanel({ item, onClose }: ItemDetailPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return (
      <aside aria-label="Item detail" className="sticky top-6 self-start">
        <p className="label-caps mb-4">Item detail</p>
        {item ? (
          <ItemDetails item={item} />
        ) : (
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
        {item && <ItemDetails item={item} />}
      </SheetContent>
    </Sheet>
  );
}

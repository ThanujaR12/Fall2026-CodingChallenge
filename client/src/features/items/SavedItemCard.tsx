// Unboxed card for a saved image: photo and title open the detail view; credit links to Pixabay.
import { assetUrl } from '@/api/client';
import { ImageCredit } from '@/components/ImageCredit';
import { LazyImage } from '@/components/LazyImage';
import { cn } from '@/lib/utils';
import type { SavedItem } from '@/types/api';

type SavedItemCardProps = {
  item: SavedItem;
  isSelected?: boolean;
  myUserId?: string;
  onOpen: (item: SavedItem) => void;
};

export function SavedItemCard({ item, isSelected = false, myUserId, onOpen }: SavedItemCardProps) {
  return (
    <article className="flex min-w-0 flex-col">
      <button
        type="button"
        data-item-id={item.id}
        onClick={() => onOpen(item)}
        aria-label={`Open ${item.title}`}
        aria-pressed={isSelected}
        className={cn(
          'group block w-full cursor-pointer text-left outline-offset-4',
          isSelected && 'outline-2 outline-accent',
        )}
      >
        <LazyImage src={assetUrl(item.imageUrl)} alt={item.title} aspect="4 / 3" />
        <h3 className="mt-2.5 truncate text-[15px] group-hover:text-accent-deep">{item.title}</h3>
      </button>
      {/* Outside the button so the link is not nested inside another control. */}
      <ImageCredit creatorName={item.creatorName} pageUrl={item.pageUrl} />
      {item.addedBy && (
        <p className="text-[12px] text-ink/65">
          added by {item.addedBy.id === myUserId ? 'you' : `@${item.addedBy.username}`}
        </p>
      )}
    </article>
  );
}

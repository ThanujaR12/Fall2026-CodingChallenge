// Grid of saved images: two columns on phones, three on wide screens.
import type { SavedItem } from '@/types/api';
import { SavedItemCard } from './SavedItemCard';

type SavedItemGridProps = {
  items: SavedItem[];
  selectedId?: string | null;
  onOpen: (item: SavedItem) => void;
};

export function SavedItemGrid({ items, selectedId, onOpen }: SavedItemGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-5">
      {items.map((item) => (
        <SavedItemCard
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

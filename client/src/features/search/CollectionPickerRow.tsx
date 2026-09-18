// One collection in the save picker: a Save button, or an "Already saved" mark.
import { Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { imageCount } from '@/lib/format';
import type { CollectionSummary, SharedCollectionSummary } from '@/types/api';

type CollectionPickerRowProps = {
  collection: CollectionSummary | SharedCollectionSummary;
  disabled: boolean;
  onSave: () => void;
};

export function CollectionPickerRow({ collection, disabled, onSave }: CollectionPickerRowProps) {
  const alreadySaved = collection.containsImage === true;

  return (
    <li
      className="flex min-h-[52px] items-center justify-between gap-3 border-b border-divider py-1.5 last:border-b-0"
      aria-disabled={alreadySaved || undefined}
    >
      <div className="min-w-0">
        <p className="truncate text-[15px]">{collection.name}</p>
        <p className="text-[12px] text-ink/65">
          {imageCount(collection.itemCount)}
          {'owner' in collection && ` · shared by @${collection.owner.username}`}
        </p>
      </div>

      {alreadySaved ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-ink/65">
          <Check size={14} weight="bold" aria-hidden="true" />
          Already saved
        </span>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-accent-deep"
          disabled={disabled}
          onClick={onSave}
          aria-label={`Save to ${collection.name}`}
        >
          Save
        </Button>
      )}
    </li>
  );
}

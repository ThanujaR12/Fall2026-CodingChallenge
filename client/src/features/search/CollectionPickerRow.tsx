// One collection in the save picker: Save button, "Saving…" spinner, or an "Already saved" mark.
import { Check, CircleNotch } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { imageCount } from '@/lib/format';
import type { CollectionSummary } from '@/types/api';

type CollectionPickerRowProps = {
  collection: CollectionSummary;
  isSaving: boolean;
  disabled: boolean;
  onSave: () => void;
};

export function CollectionPickerRow({
  collection,
  isSaving,
  disabled,
  onSave,
}: CollectionPickerRowProps) {
  const alreadySaved = collection.containsImage === true;

  return (
    <li
      className="flex min-h-[52px] items-center justify-between gap-3 border-b border-divider py-1.5 last:border-b-0"
      aria-disabled={alreadySaved || undefined}
    >
      <div className="min-w-0">
        <p className="truncate text-[15px]">{collection.name}</p>
        <p className="text-[12px] text-ink/60">{imageCount(collection.itemCount)}</p>
      </div>

      {alreadySaved ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-ink/65">
          <Check size={14} weight="bold" aria-hidden="true" />
          Already saved
        </span>
      ) : isSaving ? (
        <span
          role="status"
          className="inline-flex shrink-0 items-center gap-1.5 px-2.5 text-[13px] text-accent-deep"
        >
          <CircleNotch size={14} className="animate-spin" aria-hidden="true" />
          Saving…
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

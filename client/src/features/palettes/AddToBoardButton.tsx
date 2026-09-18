// One-tap "Add" for a recommended photo: saves it straight into a known board, instantly.
import { useState } from 'react';
import { Check, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { useSaveItem } from '@/features/items/useItems';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/types/api';

type AddToBoardButtonProps = { result: SearchResult; boardId: string; boardName: string };

export function AddToBoardButton({ result, boardId, boardName }: AddToBoardButtonProps) {
  const [added, setAdded] = useState(false);
  const save = useSaveItem();

  function add() {
    if (added) return;
    // Optimistic: shows "Added" at once and undoes it if the server refuses.
    setAdded(true);
    save.mutate(
      { collectionId: boardId, sourceId: result.sourceId },
      {
        onSuccess: () => toast.success(`Added to ${boardName}`),
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'ITEM_ALREADY_SAVED') {
            toast(`Already in ${boardName}`);
            return;
          }
          setAdded(false);
          toast.error(`Couldn't add it to ${boardName}. ${error.message}`);
        },
      },
    );
  }

  return (
    <Button
      onClick={add}
      aria-pressed={added}
      aria-label={
        added ? `Added “${result.title}” to ${boardName}` : `Add “${result.title}” to ${boardName}`
      }
      className={cn(
        'min-h-10 rounded-full px-4 text-[15px] text-white',
        added ? 'bg-ink hover:bg-ink' : 'bg-accent2 hover:bg-accent2-deep',
      )}
    >
      {added ? (
        <Check size={16} weight="bold" aria-hidden="true" />
      ) : (
        <Plus size={16} weight="bold" aria-hidden="true" />
      )}
      {added ? 'Added' : 'Add'}
    </Button>
  );
}

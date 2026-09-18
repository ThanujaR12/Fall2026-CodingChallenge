// A saved image's title and note: read view with Edit, or an edit form with Save changes / Cancel.
import { useState, type FormEvent } from 'react';
import { PencilSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NOTE_MAX, TITLE_MAX } from '@/lib/constants';
import type { SavedItem } from '@/types/api';
import { useUpdateItem } from './useItems';

type ItemEditFormProps = { item: SavedItem; canEdit: boolean };

export function ItemEditForm({ item, canEdit }: ItemEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [note, setNote] = useState(item.note);
  const update = useUpdateItem(item.collectionId);
  const fieldErrors = update.error instanceof ApiError ? (update.error.fields ?? {}) : {};

  function startEditing() {
    // Always start from the last saved values.
    setTitle(item.title);
    setNote(item.note);
    update.reset();
    setIsEditing(true);
  }

  function cancel() {
    update.reset();
    setIsEditing(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (update.isPending) return;
    // Optimistic: the new title and note show right away and the form closes.
    setIsEditing(false);
    update.mutate(
      { itemId: item.id, changes: { title: title.trim(), note } },
      {
        onSuccess: () => toast.success('Changes saved'),
        onError: (error) => {
          // The panel has already rolled back to the saved values; reopen the form with what
          // they typed so nothing is lost, showing any field errors next to their fields.
          setIsEditing(true);
          if (!(error instanceof ApiError && error.fields)) {
            toast.error(`Couldn't save your changes. ${error.message}`);
          }
        },
      },
    );
  }

  if (!isEditing) {
    return (
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[20px] break-words">{item.title}</h2>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={startEditing} className="-mr-2 shrink-0">
              <PencilSimple size={16} />
              Edit
            </Button>
          )}
        </div>
        {item.note ? (
          <p className="text-[14px] whitespace-pre-line text-ink/80">{item.note}</p>
        ) : (
          <p className="text-[14px] text-ink/65 italic">No note yet</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor={`title-${item.id}`}>Display title</Label>
        <Input
          id={`title-${item.id}`}
          value={title}
          maxLength={TITLE_MAX}
          autoFocus
          placeholder="Leave empty to use the image's tags"
          aria-invalid={Boolean(fieldErrors.title)}
          onChange={(event) => setTitle(event.target.value)}
        />
        {fieldErrors.title && <p className="text-[13px] text-accent2-deep">{fieldErrors.title}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`note-${item.id}`}>
          Personal note{' '}
          <span className="text-ink/65">
            — {note.length} / {NOTE_MAX}
          </span>
        </Label>
        <Textarea
          id={`note-${item.id}`}
          value={note}
          maxLength={NOTE_MAX}
          placeholder="Why did you save this?"
          aria-invalid={Boolean(fieldErrors.note)}
          onChange={(event) => setNote(event.target.value)}
        />
        {fieldErrors.note && <p className="text-[13px] text-accent2-deep">{fieldErrors.note}</p>}
      </div>

      <div className="flex gap-2.5">
        <Button type="submit">Save changes</Button>
        <Button type="button" variant="ghost" onClick={cancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

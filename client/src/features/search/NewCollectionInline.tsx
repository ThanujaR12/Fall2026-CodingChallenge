// Footer of the save picker: type a new collection name and create it (the image is saved there).
import { useState, type FormEvent } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NAME_MAX } from '@/lib/constants';

type NewCollectionInlineProps = {
  onCreate: (name: string) => Promise<unknown>;
  isPending: boolean;
  disabled: boolean;
  error?: string;
};

export function NewCollectionInline({
  onCreate,
  isPending,
  disabled,
  error,
}: NewCollectionInlineProps) {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!trimmed || disabled) return;
    try {
      await onCreate(trimmed);
      setName('');
    } catch {
      // The parent shows the error; keep the typed name so it can be fixed.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-1.5">
      <div className="flex gap-2">
        <label htmlFor="new-collection-name" className="sr-only">
          New collection name
        </label>
        <Input
          id="new-collection-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={NAME_MAX}
          placeholder="New collection name…"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'new-collection-error' : undefined}
          disabled={disabled}
        />
        <Button type="submit" disabled={!trimmed || disabled} className="shrink-0">
          {isPending && <CircleNotch size={16} className="animate-spin" aria-hidden="true" />}
          {isPending ? 'Saving…' : 'Create'}
        </Button>
      </div>
      {error && (
        <p id="new-collection-error" className="text-[13px] text-accent2-deep">
          {error}
        </p>
      )}
    </form>
  );
}

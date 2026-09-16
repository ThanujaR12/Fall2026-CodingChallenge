// Name and description fields shared by "New collection" and "Edit collection", with validation.
import { useState, type FormEvent } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DESCRIPTION_MAX, NAME_MAX } from '@/lib/constants';
import type { CollectionInput } from '@/types/api';

type CollectionFormProps = {
  initialValues?: CollectionInput;
  submitLabel: string;
  onSubmit: (values: CollectionInput) => void;
  onCancel: () => void;
  isPending: boolean;
  error?: unknown;
};

type FieldErrors = { name?: string; description?: string };

// Mirrors the server rules so most mistakes are caught before a request is sent.
function validateLocally(values: CollectionInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = 'Give the collection a name.';
  else if (values.name.trim().length > NAME_MAX)
    errors.name = 'Names can be at most 60 characters.';
  if (values.description.trim().length > DESCRIPTION_MAX) {
    errors.description = 'Descriptions can be at most 280 characters.';
  }
  return errors;
}

function serverErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {};
  if (error.code === 'COLLECTION_NAME_TAKEN') return { name: error.message };
  return { name: error.fields?.name, description: error.fields?.description };
}

export function CollectionForm({
  initialValues = { name: '', description: '' },
  submitLabel,
  onSubmit,
  onCancel,
  isPending,
  error,
}: CollectionFormProps) {
  const [values, setValues] = useState(initialValues);
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});
  const errors = { ...serverErrors(error), ...localErrors };
  const otherError =
    error instanceof Error && !errors.name && !errors.description ? error.message : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateLocally(values);
    setLocalErrors(found);
    if (Object.keys(found).length > 0 || isPending) return;
    onSubmit({ name: values.name.trim(), description: values.description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="collection-name">Name</Label>
        <Input
          id="collection-name"
          value={values.name}
          maxLength={NAME_MAX}
          autoFocus
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'collection-name-error' : undefined}
          onChange={(event) => {
            setValues({ ...values, name: event.target.value });
            setLocalErrors({ ...localErrors, name: undefined });
          }}
        />
        {errors.name && (
          <p id="collection-name-error" className="text-[13px] text-accent2-deep">
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="collection-description">
          Description <span className="text-ink/55">— optional</span>
        </Label>
        <Textarea
          id="collection-description"
          value={values.description}
          maxLength={DESCRIPTION_MAX}
          className="min-h-[96px]"
          aria-invalid={Boolean(errors.description)}
          aria-describedby="collection-description-count"
          onChange={(event) => {
            setValues({ ...values, description: event.target.value });
            setLocalErrors({ ...localErrors, description: undefined });
          }}
        />
        <p id="collection-description-count" className="text-[12px] text-ink/60">
          {values.description.length} / {DESCRIPTION_MAX}
        </p>
        {errors.description && (
          <p className="text-[13px] text-accent2-deep">{errors.description}</p>
        )}
      </div>

      {otherError && (
        <p role="alert" className="text-[13px] text-accent2-deep">
          {otherError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <CircleNotch size={16} className="animate-spin" aria-hidden="true" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

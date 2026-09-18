// Create: make a new board (name, description, public or private) with a live preview, then
// either open it or jump straight into a first search to fill it.
import { useEffect, useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { CircleNotch, GlobeHemisphereWest, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCollection } from '@/features/collections/useCollections';
import { FormError } from '@/features/auth/FormError';
import { EMPTY_PALETTE } from '@/lib/colors';
import { APP_NAME, DESCRIPTION_MAX, MAX_QUERY, NAME_MAX } from '@/lib/constants';

type FieldErrors = { name?: string; description?: string };

function fieldErrorsFrom(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {};
  if (error.code === 'COLLECTION_NAME_TAKEN') return { name: error.message };
  return { name: error.fields?.name, description: error.fields?.description };
}

function BoardPreview({
  name,
  description,
  isPublic,
}: {
  name: string;
  description: string;
  isPublic: boolean;
}) {
  return (
    <div aria-hidden="true" className="rounded-2xl border border-divider bg-surface/60 p-5">
      <p className="label-caps mb-3">Preview</p>
      <div className="overflow-hidden rounded-xl">
        <div className="stripe-placeholder flex aspect-[16/10] items-center justify-center">
          <span className="text-[13px] text-ink/65 italic">Your photos go here</span>
        </div>
        <div className="flex h-2.5">
          {EMPTY_PALETTE.map((color) => (
            <span key={color} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
      <p className="mt-3 truncate text-[20px] font-semibold">{name.trim() || 'Untitled board'}</p>
      <p className="mt-1 line-clamp-2 min-h-[2.6em] text-[14px] text-ink/75">
        {description.trim() || 'A short description helps collaborators know what belongs here.'}
      </p>
      <p className="mt-2 text-[13px] text-ink/70">
        0 images ·{' '}
        <span className="tag bg-accent-tint text-accent-deep">
          {isPublic ? 'Public' : 'Private'}
        </span>
      </p>
      <p className="mt-4 text-[13px] text-ink/70">
        Its color palette appears automatically as you save photos.
      </p>
    </div>
  );
}

export function CreatePage() {
  const navigate = useNavigate();
  const create = useCreateCollection();
  const publicLabelId = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [firstSearch, setFirstSearch] = useState('');
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});
  const errors = { ...fieldErrorsFrom(create.error), ...localErrors };
  const otherError =
    create.error instanceof Error && !errors.name && !errors.description
      ? create.error.message
      : null;

  useEffect(() => {
    document.title = `Create · ${APP_NAME}`;
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: FieldErrors = {};
    if (!name.trim()) found.name = 'Give the board a name.';
    setLocalErrors(found);
    if (found.name || create.isPending) return;

    create.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        visibility: isPublic ? 'public' : 'private',
      },
      {
        onSuccess: (board) => {
          const q = firstSearch.trim();
          if (q) {
            toast.success(`Created ${board.name}. Tap Save on any photo to add it.`);
            navigate(`/search?${new URLSearchParams({ q })}`);
          } else {
            toast.success(`Created ${board.name}`);
            navigate(`/collections/${board.id}`);
          }
        },
      },
    );
  }

  return (
    <PageContainer className="pt-6 md:pt-10">
      <h1 className="text-[34px] md:text-[46px]">Create a board</h1>
      <p className="mt-1 mb-8 text-[16px] text-ink/75">
        Collect photos around an idea. Share it later, or make it public on Explore.
      </p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,560px)_minmax(0,380px)] lg:gap-16">
        <form onSubmit={handleSubmit} noValidate className="grid gap-6">
          <div className="grid gap-1.5">
            <Label htmlFor="board-name">Name</Label>
            <Input
              id="board-name"
              value={name}
              maxLength={NAME_MAX}
              autoFocus
              required
              placeholder="e.g. Coastal mornings"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'board-name-error' : undefined}
              onChange={(event) => {
                setName(event.target.value);
                setLocalErrors({});
                if (create.error) create.reset();
              }}
            />
            {errors.name && (
              <p id="board-name-error" className="text-[13px] text-accent2-deep">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="board-description">
              Description <span className="font-normal text-ink/65">(optional)</span>
            </Label>
            <Textarea
              id="board-description"
              value={description}
              maxLength={DESCRIPTION_MAX}
              rows={3}
              placeholder="What belongs on this board?"
              aria-invalid={Boolean(errors.description)}
              aria-describedby="board-description-help"
              onChange={(event) => setDescription(event.target.value)}
            />
            <p id="board-description-help" className="text-[12px] text-ink/65">
              {errors.description ?? `${description.length}/${DESCRIPTION_MAX}`}
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-divider p-4">
            <div className="flex gap-2.5">
              <GlobeHemisphereWest
                size={18}
                className="mt-0.5 text-accent-deep"
                aria-hidden="true"
              />
              <div>
                <p id={publicLabelId} className="text-[15px]">
                  Public on Explore
                </p>
                <p className="text-[13px] text-ink/65">
                  {isPublic
                    ? 'Anyone can find and view it once it has photos.'
                    : 'Private: only you and people you invite can see it.'}
                </p>
              </div>
            </div>
            <Switch
              aria-labelledby={publicLabelId}
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="board-first-search">
              Find photos for it <span className="font-normal text-ink/65">(optional)</span>
            </Label>
            <div className="relative">
              <MagnifyingGlass
                size={18}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/65"
                aria-hidden="true"
              />
              <Input
                id="board-first-search"
                value={firstSearch}
                maxLength={MAX_QUERY}
                placeholder="e.g. misty harbor"
                className="pl-10"
                aria-describedby="board-first-search-help"
                onChange={(event) => setFirstSearch(event.target.value)}
              />
            </div>
            <p id="board-first-search-help" className="text-[12px] text-ink/65">
              We'll take you straight to these photos so you can start saving.
            </p>
          </div>

          {otherError && <FormError message={otherError} />}

          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" size="lg" disabled={create.isPending}>
              {create.isPending && (
                <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
              )}
              {create.isPending ? 'Creating…' : 'Create board'}
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>

        <BoardPreview name={name} description={description} isPublic={isPublic} />
      </div>
    </PageContainer>
  );
}

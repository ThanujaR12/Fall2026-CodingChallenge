// "Public on Explore" switch in the owner's Share dialog; public boards can be browsed by anyone.
import { useId } from 'react';
import { Link } from 'react-router';
import { GlobeHemisphereWest } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useUpdateCollection } from '@/features/collections/useCollections';
import type { Visibility } from '@/types/api';

type VisibilityToggleProps = { collectionId: string; visibility: Visibility };

export function VisibilityToggle({ collectionId, visibility }: VisibilityToggleProps) {
  const update = useUpdateCollection(collectionId);
  const labelId = useId();
  const isPublic = visibility === 'public';

  function toggle(on: boolean) {
    update.mutate(
      { visibility: on ? 'public' : 'private' },
      {
        onSuccess: () => toast.success(on ? 'Board is public on Explore' : 'Board is private'),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-2.5">
        <GlobeHemisphereWest size={18} className="mt-0.5 text-accent-deep" aria-hidden="true" />
        <div>
          <p id={labelId} className="text-[15px]">
            Public on Explore
          </p>
          <p className="text-[13px] text-ink/65">
            {isPublic ? (
              <>
                Anyone can find and view it on{' '}
                <Link to="/explore" className="underline">
                  Explore
                </Link>
                .
              </>
            ) : (
              'Private: only you, your members, and share-link visitors can see it.'
            )}
          </p>
        </div>
      </div>
      <Switch
        aria-labelledby={labelId}
        checked={isPublic}
        disabled={update.isPending}
        onCheckedChange={toggle}
      />
    </div>
  );
}

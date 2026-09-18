// "Anyone with the link can view" switch, the link itself, and a Copy button (owner only).
import { useId } from 'react';
import { Copy, LinkSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { shareUrl } from '@/api/sharing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useShareLink } from './useSharing';

type ShareLinkToggleProps = { collectionId: string; shareToken: string | null };

export function ShareLinkToggle({ collectionId, shareToken }: ShareLinkToggleProps) {
  const { enable, disable } = useShareLink(collectionId);
  const labelId = useId();
  const pending = enable.isPending || disable.isPending;
  const url = shareToken ? shareUrl(shareToken) : '';

  function toggle(on: boolean) {
    const mutation = on ? enable : disable;
    mutation.mutate(undefined, {
      onSuccess: () => toast.success(on ? 'Share link is on' : 'Share link turned off'),
      onError: (error) => toast.error(error.message),
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error("Couldn't copy automatically — select the link and copy it.");
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-2.5">
          <LinkSimple size={18} className="mt-0.5 text-accent-deep" aria-hidden="true" />
          <div>
            <p id={labelId} className="text-[15px]">
              Anyone with the link can view
            </p>
            <p className="text-[13px] text-ink/65">Read-only. No account needed.</p>
          </div>
        </div>
        <Switch
          aria-labelledby={labelId}
          checked={Boolean(shareToken)}
          disabled={pending}
          onCheckedChange={toggle}
        />
      </div>

      {shareToken && (
        <div className="flex gap-2">
          <label htmlFor="share-url" className="sr-only">
            Share link
          </label>
          <Input id="share-url" readOnly value={url} onFocus={(event) => event.target.select()} />
          <Button variant="secondary" onClick={copy} className="shrink-0">
            <Copy size={16} />
            Copy
          </Button>
        </div>
      )}
      <p className="text-[12px] text-ink/65">
        Turning the link off immediately breaks the old address.
      </p>
    </div>
  );
}

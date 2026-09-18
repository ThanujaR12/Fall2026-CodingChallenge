// "Edit profile": display name, a short bio, and an avatar colour (suggested from your own colour
// signature), with a live preview. Saving updates the avatar everywhere at once.
import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, PencilSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { updateProfile } from '@/api/profile';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/useAuth';
import { readableOn } from '@/lib/colors';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/api';

// Always-available choices, after the ones drawn from your own boards.
const PRESETS = ['#006786', '#D6006C', '#3A9D5D', '#F28C28', '#6B4FD8', '#201E1D'];

export function EditProfileDialog({ profile }: { profile: Profile }) {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.user.displayName);
  const [bio, setBio] = useState(profile.user.bio);
  const [color, setColor] = useState(profile.user.avatarColor);

  const suggestions = [...new Set([...profile.colorSignature, ...PRESETS])].slice(0, 10);

  const save = useMutation({
    mutationFn: () =>
      updateProfile({ displayName: displayName.trim(), bio: bio.trim(), avatarColor: color }),
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData<Profile>(queryKeys.profile, (current) =>
        current ? { ...current, user } : current,
      );
      toast.success('Profile updated');
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Start from what's saved each time the dialog opens.
      setDisplayName(profile.user.displayName);
      setBio(profile.user.bio);
      setColor(profile.user.avatarColor);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const previewName = displayName.trim() || profile.user.username;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <PencilSimple size={16} aria-hidden="true" />
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>How you appear to the people you share boards with.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="flex items-center gap-4 rounded-2xl bg-surface p-4" aria-hidden="true">
            <Avatar
              name={previewName}
              color={color}
              ring={profile.colorSignature}
              className="size-16 text-[20px]"
            />
            <div className="min-w-0">
              <p className="truncate text-[18px] font-semibold">{previewName}</p>
              <p className="text-[13px] text-ink/70">@{profile.user.username}</p>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">Display name</Label>
            <Input
              id="profile-name"
              value={displayName}
              maxLength={50}
              placeholder={profile.user.username}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profile-bio">
              Bio <span className="font-normal text-ink/65">— {bio.length} / 160</span>
            </Label>
            <Textarea
              id="profile-bio"
              value={bio}
              maxLength={160}
              rows={3}
              placeholder="What do you collect? e.g. Coastlines, quiet mornings, and good type."
              onChange={(event) => setBio(event.target.value)}
            />
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-[14px] font-semibold">Avatar colour</legend>
            <p className="-mt-1 text-[13px] text-ink/70">
              The first ones come from your boards' colours.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((hex) => {
                const active = hex.toUpperCase() === color.toUpperCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    aria-pressed={active}
                    aria-label={`Use ${hex}`}
                    title={hex}
                    onClick={() => setColor(hex)}
                    className={cn(
                      'inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-ink/15',
                      active && 'ring-2 ring-ink ring-offset-2 ring-offset-paper',
                    )}
                    style={{ backgroundColor: hex }}
                  >
                    {active && (
                      <Check
                        size={16}
                        weight="bold"
                        style={{ color: readableOn(hex) }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex gap-2.5">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save profile'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

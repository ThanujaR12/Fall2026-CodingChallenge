// Invite an existing user by username or email as an editor or viewer (owner only).
import { useState, type FormEvent } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/features/auth/FormError';
import type { MemberRole } from '@/types/api';
import { useMembers } from './useSharing';

export function InviteForm({ collectionId }: { collectionId: string }) {
  const { invite } = useMembers(collectionId);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('editor');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const who = usernameOrEmail.trim();
    if (!who || invite.isPending) return;
    setError(null);
    invite.mutate(
      { usernameOrEmail: who, role },
      {
        onSuccess: () => {
          toast.success(`Invited ${who} as ${role}`);
          setUsernameOrEmail('');
        },
        onError: (err) => setError(err.message),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="invite-who" className="sr-only">
          Username or email to invite
        </label>
        <Input
          id="invite-who"
          placeholder="Username or email"
          value={usernameOrEmail}
          onChange={(event) => {
            setUsernameOrEmail(event.target.value);
            setError(null);
          }}
          autoComplete="off"
        />
        <div className="flex gap-2">
          <label htmlFor="invite-role" className="sr-only">
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value as MemberRole)}
            className="min-h-11 flex-1 cursor-pointer rounded-xl border border-divider bg-white/85 px-2 text-[14px] md:min-h-9"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="submit" disabled={!usernameOrEmail.trim() || invite.isPending}>
            {invite.isPending && (
              <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
            )}
            Invite
          </Button>
        </div>
      </div>
      {error && <FormError message={error} />}
    </form>
  );
}

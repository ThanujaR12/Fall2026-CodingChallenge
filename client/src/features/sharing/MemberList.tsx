// The owner plus every member with their role; the owner can change roles or remove people.
import { X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Member, MemberRole, PublicUser } from '@/types/api';
import { useMembers } from './useSharing';

type MemberListProps = {
  collectionId: string;
  owner: PublicUser;
  members: Member[];
  myUserId: string;
  canManage: boolean;
};

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-deep text-[12px] font-semibold text-white uppercase"
    >
      {name.slice(0, 2)}
    </span>
  );
}

export function MemberList({ collectionId, owner, members, myUserId, canManage }: MemberListProps) {
  const { changeRole, remove } = useMembers(collectionId);
  const you = (user: PublicUser) => (user.id === myUserId ? ' · you' : '');

  return (
    <ul aria-label="Members" className="grid">
      <li className="flex min-h-[52px] items-center gap-3 border-b border-divider py-1.5">
        <Avatar name={owner.username} />
        <p className="min-w-0 flex-1 truncate text-[15px]">
          @{owner.username}
          <span className="text-ink/65">{you(owner)}</span>
        </p>
        <span className="text-[13px] text-ink/75">Owner</span>
      </li>

      {members.map(({ user, role }) => (
        <li
          key={user.id}
          className="flex min-h-[52px] items-center gap-3 border-b border-divider py-1.5 last:border-b-0"
        >
          <Avatar name={user.username} />
          <p className="min-w-0 flex-1 truncate text-[15px]">
            @{user.username}
            <span className="text-ink/65">{you(user)}</span>
          </p>
          {canManage ? (
            <>
              <label htmlFor={`role-${user.id}`} className="sr-only">
                Role for {user.username}
              </label>
              <select
                id={`role-${user.id}`}
                value={role}
                disabled={changeRole.isPending}
                onChange={(event) =>
                  changeRole.mutate(
                    { userId: user.id, role: event.target.value as MemberRole },
                    { onError: (error) => toast.error(error.message) },
                  )
                }
                className="min-h-11 cursor-pointer rounded-xl border border-divider bg-white/85 px-2 text-[14px] md:min-h-9"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="button"
                aria-label={`Remove ${user.username}`}
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(user.id, {
                    onSuccess: () => toast.success(`Removed @${user.username}`),
                    onError: (error) => toast.error(error.message),
                  })
                }
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-accent2-deep hover:bg-accent2-tint disabled:opacity-55 md:size-9"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <span className="text-[13px] text-ink/75">
              {role === 'editor' ? 'Editor' : 'Viewer'}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

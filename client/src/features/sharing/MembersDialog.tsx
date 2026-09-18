// For editors and viewers: who is on this board (read-only), and a way to leave it.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleNotch, SignOut, UsersThree } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { CollectionDetail } from '@/types/api';
import { MemberList } from './MemberList';
import { useLeaveCollection } from './useSharing';

type MembersDialogProps = { collection: CollectionDetail; myUserId: string };

export function MembersDialog({ collection, myUserId }: MembersDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const leave = useLeaveCollection(collection.id);
  const navigate = useNavigate();

  function confirmLeave() {
    leave.mutate(myUserId, {
      onSuccess: () => {
        toast.success(`You left ${collection.name}`);
        navigate('/collections');
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <Dialog onOpenChange={(open) => !open && setConfirming(false)}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <UsersThree size={16} />
          Members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
          <DialogDescription>
            You&apos;re {collection.role === 'editor' ? 'an editor' : 'a viewer'} on this board.
            Only the owner can change who has access.
          </DialogDescription>
        </DialogHeader>

        <MemberList
          collectionId={collection.id}
          owner={collection.owner}
          members={collection.members}
          myUserId={myUserId}
          canManage={false}
        />

        <div className="border-t border-divider pt-4">
          {confirming ? (
            <div className="grid gap-3">
              <p className="text-[14px]">
                Leave “{collection.name}”? You&apos;ll lose access until the owner invites you
                again.
              </p>
              <div className="flex gap-2.5">
                <Button variant="destructive" onClick={confirmLeave} disabled={leave.isPending}>
                  {leave.isPending && (
                    <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
                  )}
                  Leave collection
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="destructive-ghost"
              className="-ml-3.5"
              onClick={() => setConfirming(true)}
            >
              <SignOut size={16} />
              Leave collection
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

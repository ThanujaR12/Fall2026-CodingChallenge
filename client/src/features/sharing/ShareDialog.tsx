// Owner's Share dialog (design 05): share link toggle, member list with roles, and invites.
import { UsersThree } from '@phosphor-icons/react';
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
import { InviteForm } from './InviteForm';
import { MemberList } from './MemberList';
import { ShareLinkToggle } from './ShareLinkToggle';

type ShareDialogProps = { collection: CollectionDetail; myUserId: string };

export function ShareDialog({ collection, myUserId }: ShareDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <UsersThree size={16} />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Share “{collection.name}”</DialogTitle>
          <DialogDescription>
            You&apos;re the owner. Only you can manage members or delete this board.
          </DialogDescription>
        </DialogHeader>

        <ShareLinkToggle collectionId={collection.id} shareToken={collection.shareToken} />

        <div className="grid gap-3 border-t border-divider pt-5">
          <p className="label-caps">Members</p>
          <MemberList
            collectionId={collection.id}
            owner={collection.owner}
            members={collection.members}
            myUserId={myUserId}
            canManage
          />
          <InviteForm collectionId={collection.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

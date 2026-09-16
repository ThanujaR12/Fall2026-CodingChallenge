// Confirmation before permanently deleting a collection and everything saved in it.
import { CircleNotch, Trash } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { imageCount } from '@/lib/format';
import type { CollectionSummary } from '@/types/api';
import { useDeleteCollection } from './useCollections';

export function DeleteCollectionDialog({ collection }: { collection: CollectionSummary }) {
  const navigate = useNavigate();
  const remove = useDeleteCollection();

  function confirmDelete() {
    remove.mutate(collection.id, {
      onSuccess: () => {
        toast.success(`Deleted ${collection.name}`);
        navigate('/collections');
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive-ghost">
          <Trash size={16} />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {collection.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the collection and its {imageCount(collection.itemCount)}. This
            can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          {/* A plain button (not AlertDialogAction) so the dialog stays open while deleting. */}
          <Button variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>
            {remove.isPending && (
              <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
            )}
            Delete collection
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

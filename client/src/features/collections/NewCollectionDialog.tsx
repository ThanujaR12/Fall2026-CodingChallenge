// "New collection" dialog: opens from a trigger button and creates the collection on submit.
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CollectionForm } from './CollectionForm';
import { useCreateCollection } from './useCollections';

export function NewCollectionDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const create = useCreateCollection();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) create.reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Group images you want to keep together.</DialogDescription>
        </DialogHeader>
        {/* Remounted per opening so the fields start empty each time. */}
        {open && (
          <CollectionForm
            submitLabel="Create collection"
            isPending={create.isPending}
            error={create.error}
            onCancel={() => handleOpenChange(false)}
            onSubmit={(values) =>
              create.mutate(values, {
                onSuccess: (created) => {
                  handleOpenChange(false);
                  toast.success(`Created ${created.name}`);
                },
              })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

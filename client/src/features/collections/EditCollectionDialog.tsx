// "Edit collection" dialog: rename or change the description, stored only on Save changes.
import { useState } from 'react';
import { PencilSimple } from '@phosphor-icons/react';
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
import type { CollectionSummary } from '@/types/api';
import { CollectionForm } from './CollectionForm';
import { useUpdateCollection } from './useCollections';

export function EditCollectionDialog({ collection }: { collection: CollectionSummary }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCollection(collection.id);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) update.reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <PencilSimple size={16} />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Changes are saved when you press Save changes.</DialogDescription>
        </DialogHeader>
        {open && (
          <CollectionForm
            initialValues={{ name: collection.name, description: collection.description }}
            submitLabel="Save changes"
            isPending={update.isPending}
            error={update.error}
            onCancel={() => handleOpenChange(false)}
            onSubmit={(values) =>
              update.mutate(values, {
                onSuccess: () => {
                  handleOpenChange(false);
                  toast.success('Collection updated');
                },
              })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

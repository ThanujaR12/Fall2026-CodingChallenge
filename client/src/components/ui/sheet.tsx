// shadcn/ui Sheet: edge-anchored panel (Radix Dialog) used for item detail on phones and tablets.
import * as React from 'react';
import { X } from '@phosphor-icons/react';
import { Dialog as SheetPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetContent({
  className,
  children,
  side = 'bottom',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'right' | 'bottom';
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col gap-4 overflow-y-auto bg-paper p-4 text-ink shadow-float outline-none transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-300',
          side === 'right' &&
            'inset-y-0 right-0 h-full w-[min(420px,100%)] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          side === 'bottom' &&
            'inset-x-0 bottom-0 max-h-[88dvh] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="absolute top-2 right-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-surface"
          aria-label="Close"
        >
          <X size={18} />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn('label-caps', className)} {...props} />;
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn('sr-only', className)} {...props} />;
}

export { Sheet, SheetContent, SheetDescription, SheetTitle };

// shadcn/ui Button restyled to Broadsheet: square corners, serif 14/600, cyan primary, 44px tall on phones.
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const primary = 'bg-accent text-white hover:bg-accent-pressed';
const secondary = 'bg-surface text-ink border border-divider hover:bg-accent-tint';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[2px] font-serif text-[14px] font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary,
        secondary,
        ghost: 'bg-transparent text-ink hover:bg-accent-tint',
        'destructive-ghost': 'bg-transparent text-accent2-deep hover:bg-accent2-tint',
        icon: 'bg-transparent text-ink hover:bg-accent-tint',
        // Aliases for the names generated shadcn components use internally.
        default: primary,
        outline: secondary,
        destructive: 'bg-accent2-deep text-white hover:bg-accent2',
        link: 'bg-transparent px-0 text-accent-deep underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-11 px-3.5 md:min-h-9',
        sm: 'min-h-10 px-2.5 text-[13px] md:min-h-8',
        lg: 'min-h-11 px-[22px]',
        icon: 'size-11 md:size-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'primary',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

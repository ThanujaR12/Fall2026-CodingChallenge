// shadcn/ui Button in PixBoard style: rounded pills, sans 14/600, brand teal primary, 44px tall on phones.
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

// Fill is the AA-safe cyan (white text ≥ 4.5:1); the lighter #0088B0 stays for rings and borders.
const primary =
  'bg-accent-strong text-white shadow-[0_6px_18px_-8px_rgba(0,103,134,0.8)] hover:-translate-y-px hover:bg-accent-deep hover:shadow-[0_10px_24px_-8px_rgba(0,103,134,0.7)] active:translate-y-0';
const secondary =
  'bg-white/80 text-ink border border-divider shadow-[0_1px_2px_rgba(32,30,29,0.05)] hover:-translate-y-px hover:border-ink/20 hover:bg-white hover:shadow-soft active:translate-y-0';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full font-sans text-[14px] font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-200 motion-reduce:transform-none disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0',
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
        destructive:
          'bg-accent2-deep text-white shadow-[0_6px_18px_-8px_rgba(170,11,86,0.8)] hover:bg-accent2',
        link: 'bg-transparent px-0 text-accent-deep underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-11 px-4 md:min-h-10',
        sm: 'min-h-10 px-3 text-[13px] md:min-h-8',
        lg: 'min-h-12 px-6 text-[15px]',
        icon: 'size-11 md:size-10',
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

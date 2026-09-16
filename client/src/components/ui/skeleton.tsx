// shadcn/ui Skeleton: pulsing neutral block shown while content loads.
import * as React from 'react';

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-[2px] bg-neutral-100', className)}
      {...props}
    />
  );
}

export { Skeleton };

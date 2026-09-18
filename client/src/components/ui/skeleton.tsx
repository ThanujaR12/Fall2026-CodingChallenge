// shadcn/ui Skeleton: a softly shimmering block shown while content loads.
import * as React from 'react';

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('shimmer rounded-xl', className)}
      {...props}
    />
  );
}

export { Skeleton };

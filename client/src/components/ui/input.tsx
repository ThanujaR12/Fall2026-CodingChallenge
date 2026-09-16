// shadcn/ui Input restyled to Broadsheet: surface fill, hairline border, accent border on focus.
import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-11 w-full min-w-0 rounded-[2px] border border-divider bg-surface px-3 font-serif text-[14px] text-ink placeholder:text-ink/60 focus:border-accent focus-visible:outline-none disabled:opacity-55 aria-invalid:border-accent2-deep md:min-h-9',
        className,
      )}
      {...props}
    />
  );
}

export { Input };

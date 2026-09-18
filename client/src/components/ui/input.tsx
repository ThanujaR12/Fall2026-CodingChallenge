// shadcn/ui Input restyled to Broadsheet: surface fill, hairline border, accent border on focus.
import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-11 w-full min-w-0 rounded-xl border border-divider bg-white/85 px-3 font-sans text-[16px] md:text-[14px] text-ink placeholder:text-ink/60 shadow-[inset_0_1px_2px_rgba(32,30,29,0.04)] transition-[border-color,box-shadow] focus:border-accent focus:ring-4 focus:ring-accent/15 focus-visible:outline-none disabled:opacity-55 aria-invalid:border-accent2-deep md:min-h-9',
        className,
      )}
      {...props}
    />
  );
}

export { Input };

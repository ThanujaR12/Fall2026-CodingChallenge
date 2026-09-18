// shadcn/ui Textarea restyled to Broadsheet: surface fill, hairline border, 124px minimum height.
import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-[124px] w-full rounded-xl border border-divider bg-white/85 px-3 py-2 font-sans text-[16px] md:text-[14px] leading-[1.55] text-ink placeholder:text-ink/60 shadow-[inset_0_1px_2px_rgba(32,30,29,0.04)] transition-[border-color,box-shadow] focus:border-accent focus:ring-4 focus:ring-accent/15 focus-visible:outline-none disabled:opacity-55 aria-invalid:border-accent2-deep',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

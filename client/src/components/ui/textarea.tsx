// shadcn/ui Textarea restyled to Broadsheet: surface fill, hairline border, 124px minimum height.
import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-[124px] w-full rounded-[2px] border border-divider bg-surface px-3 py-2 font-serif text-[14px] leading-[1.55] text-ink placeholder:text-ink/60 focus:border-accent focus-visible:outline-none disabled:opacity-55 aria-invalid:border-accent2-deep',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

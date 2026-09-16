// Page-width wrapper with the design's gutters: 16px on phones, 40px on desktop.
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1280px] px-4 md:px-10', className)}>{children}</div>
  );
}

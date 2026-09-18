// Friendly "nothing here" panel with an icon, message, and optional next step.
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn('brand-card max-w-[480px] rounded-3xl px-6 py-8 md:px-8', className)}>
      <div
        className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-accent-tint text-accent-deep"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="text-[21px]">{title}</h3>
      {body && <p className="mt-2 text-[14px] text-ink/75">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

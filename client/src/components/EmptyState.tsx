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
    <div className={cn('max-w-[460px] py-10', className)}>
      <div className="mb-3 text-accent" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-[20px]">{title}</h3>
      {body && <p className="mt-2 text-[14px] text-ink/75">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

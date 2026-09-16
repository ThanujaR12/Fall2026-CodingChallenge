// Error panel with the magenta cloud icon, an explanation, and a Retry button.
import { ArrowClockwise, CloudSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
};

export function ErrorState({ title, message, onRetry, isRetrying, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn('max-w-[460px] py-10', className)}>
      <CloudSlash size={34} weight="duotone" className="mb-3 text-accent2" aria-hidden="true" />
      <h3 className="text-[20px]">{title}</h3>
      <p className="mt-2 text-[14px] text-ink/75">{message}</p>
      {onRetry && (
        <Button className="mt-5" onClick={onRetry} disabled={isRetrying}>
          <ArrowClockwise size={16} weight="bold" className={isRetrying ? 'animate-spin' : ''} />
          Retry
        </Button>
      )}
    </div>
  );
}

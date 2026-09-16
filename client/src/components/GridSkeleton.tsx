// Placeholder grid shown while cards load: boxed search cards or unboxed board cards.
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type GridSkeletonProps = { count?: number; variant?: 'card' | 'board'; className?: string };

export function GridSkeleton({ count = 6, variant = 'card', className }: GridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-3',
        variant === 'board' && 'md:gap-[30px]',
        className,
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={variant === 'card' ? 'bg-surface pb-[15px]' : ''}>
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className={cn('space-y-2 pt-3', variant === 'card' && 'px-[15px]')}>
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

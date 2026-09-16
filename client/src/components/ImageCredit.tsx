// Pixabay attribution line: "Photo by {creator} on Pixabay", linking to the original page.
import { cn } from '@/lib/utils';

type ImageCreditProps = { creatorName: string; pageUrl: string; className?: string };

export function ImageCredit({ creatorName, pageUrl, className }: ImageCreditProps) {
  return (
    <p className={cn('text-[12px] leading-snug text-ink/65', className)}>
      Photo by {creatorName || 'unknown'} on{' '}
      <a
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-ink/30 underline-offset-2 hover:text-accent-deep hover:decoration-accent"
      >
        Pixabay
      </a>
    </p>
  );
}

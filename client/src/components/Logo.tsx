// PaletteBoard logo: a board of four colour tiles (the palette swatches) beside the wordmark.
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

/** The palette-board mark on its own; decorative, so hidden from screen readers. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 52"
      aria-hidden="true"
      focusable="false"
      className={cn('size-6', className)}
    >
      <rect width="52" height="52" rx="13" fill="#1F4750" />
      <rect x="9" y="9" width="16" height="20" rx="3.5" fill="#12A5DB" />
      <rect x="27" y="9" width="16" height="12" rx="3.5" fill="#5CD68D" />
      <rect x="9" y="31" width="16" height="12" rx="3.5" fill="#FF8A4C" />
      <rect x="27" y="23" width="16" height="20" rx="3.5" fill="#F0148C" />
    </svg>
  );
}

/** Mark plus wordmark; the visible name doubles as the accessible name. */
export function Logo({
  className,
  markClassName,
  compactOnMobile = false,
}: {
  className?: string;
  markClassName?: string;
  /** Show only the mark on phones (the name returns from the sm breakpoint). */
  compactOnMobile?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          'font-semibold tracking-[-0.015em]',
          compactOnMobile && 'sr-only sm:not-sr-only',
        )}
      >
        {APP_NAME}
      </span>
    </span>
  );
}

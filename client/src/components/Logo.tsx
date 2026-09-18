// PixBoard logo: a masonry "board" of four saved images beside the serif wordmark.
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

/** The four-tile board mark on its own; decorative, so hidden from screen readers. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 52"
      aria-hidden="true"
      focusable="false"
      className={cn('size-6', className)}
    >
      <rect x="0" y="0" width="25" height="32" fill="#201E1D" />
      <rect x="27" y="0" width="25" height="18" fill="#007A9E" />
      <rect x="0" y="34" width="25" height="18" fill="#C1663C" />
      <rect x="27" y="20" width="25" height="32" fill="#D6006C" />
    </svg>
  );
}

/** Mark plus wordmark; the visible name doubles as the accessible name. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={markClassName} />
      <span className="font-semibold tracking-[-0.015em]">{APP_NAME}</span>
    </span>
  );
}

// An image that loads only when scrolled near, keeps its space while loading, and never shows broken.
import { useState } from 'react';
import { cn } from '@/lib/utils';

type LazyImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Fixed aspect ratio (e.g. "16 / 9"); otherwise the image's own width/height ratio is used. */
  aspect?: string;
  className?: string;
};

export function LazyImage({ src, alt, width, height, aspect, className }: LazyImageProps) {
  const [failed, setFailed] = useState(false);
  const aspectRatio = aspect ?? (width && height ? `${width} / ${height}` : '4 / 3');

  return (
    <div
      className={cn('stripe-placeholder relative w-full overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center text-[12px] text-ink/65 italic">
          image unavailable
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="newsprint absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

// One photo tile in the feed: rounded image, Save and "Pixabay" on hover or focus, title and credit below.
import { useState, type ReactNode } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { ImageCredit } from '@/components/ImageCredit';
import type { SearchResult } from '@/types/api';

/** Height of the title + credit block under each image (must match the markup below). */
export const PIN_CAPTION_HEIGHT = 50;

type PinCardProps = {
  result: SearchResult;
  imageHeight: number;
  renderSaveAction: (result: SearchResult) => ReactNode;
};

// Shown on hover and keyboard focus (and while the Save picker is open).
const hoverReveal =
  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 has-[[data-state=open]]:opacity-100';
// Touch screens have no hover, so Save is always visible there.
const alwaysOnTouch = `${hoverReveal} pointer-coarse:opacity-100`;

export function PinCard({ result, imageHeight, renderSaveAction }: PinCardProps) {
  const [failed, setFailed] = useState(false);

  return (
    <article className="group">
      <div
        className="stripe-placeholder relative overflow-hidden rounded-2xl"
        style={{ height: imageHeight }}
      >
        {failed ? (
          <span className="absolute inset-0 flex items-center justify-center text-[12px] text-ink/65 italic">
            image unavailable
          </span>
        ) : (
          <img
            src={result.thumbnailUrl}
            alt={result.title}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        {/* Darkens the photo on hover so the white controls stay readable. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-ink/40 opacity-0 transition-opacity group-hover:opacity-100 group-has-[[data-state=open]]:opacity-100"
        />
        <div className={`absolute top-2.5 right-2.5 ${alwaysOnTouch}`}>
          {renderSaveAction(result)}
        </div>
        <a
          href={result.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open “${result.title}” on Pixabay`}
          className={`absolute bottom-2.5 left-2.5 inline-flex min-h-9 items-center gap-1 rounded-full bg-white/90 px-3 text-[13px] font-semibold text-ink hover:bg-white ${hoverReveal}`}
        >
          Pixabay
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
      <div className="px-1 pt-2" style={{ height: PIN_CAPTION_HEIGHT }}>
        <h3 className="truncate text-[14px] leading-snug font-semibold">{result.title}</h3>
        <ImageCredit
          creatorName={result.creatorName}
          pageUrl={result.pageUrl}
          className="truncate"
        />
      </div>
    </article>
  );
}

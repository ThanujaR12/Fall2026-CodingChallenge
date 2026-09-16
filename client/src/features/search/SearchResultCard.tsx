// One search result as a boxed card: photo, title, credit, tags, and the save action.
import type { ReactNode } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { ImageCredit } from '@/components/ImageCredit';
import { LazyImage } from '@/components/LazyImage';
import type { SearchResult } from '@/types/api';

type SearchResultCardProps = {
  result: SearchResult;
  /** The Save button is injected so the card stays presentational. */
  renderSaveAction: (result: SearchResult) => ReactNode;
};

export function SearchResultCard({ result, renderSaveAction }: SearchResultCardProps) {
  return (
    <article className="flex flex-col bg-transparent md:rounded-[2px] md:bg-surface">
      <LazyImage src={result.thumbnailUrl} alt={result.title} aspect="4 / 3" />
      <div className="flex flex-1 flex-col gap-2 pt-2.5 md:p-[15px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[16px]">{result.title}</h3>
            <ImageCredit creatorName={result.creatorName} pageUrl={result.pageUrl} />
          </div>
          {/* Phone layout: Save sits beside the title. */}
          <div className="shrink-0 md:hidden">{renderSaveAction(result)}</div>
        </div>

        {result.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {result.tags.slice(0, 3).map((tag, index) => (
              // Two tags on phones, three on larger screens.
              <li key={tag} className={index === 2 ? 'hidden md:block' : ''}>
                <span className="tag bg-surface text-ink/75 md:bg-paper">{tag}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto hidden items-center gap-2 pt-1 md:flex">
          <div className="flex-1 [&>*]:w-full">{renderSaveAction(result)}</div>
          <a
            href={result.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on Pixabay"
            title="View on Pixabay"
            className="inline-flex size-9 items-center justify-center rounded-[2px] text-accent hover:bg-accent-tint"
          >
            <ArrowSquareOut size={18} />
          </a>
        </div>
      </div>
    </article>
  );
}

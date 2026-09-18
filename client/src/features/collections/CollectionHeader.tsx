// Collection page header: label, title, description, counts, palette, and an actions slot.
import type { ReactNode } from 'react';
import { BoardPaletteBar } from '@/features/palettes/BoardPaletteBar';
import { imageCount, updatedAgo } from '@/lib/format';
import type { CollectionSummary } from '@/types/api';

type CollectionHeaderProps = {
  collection: CollectionSummary;
  actions?: ReactNode;
  /** For shared collections: whose board it is and your role. */
  sharedAs?: { owner: string; role: 'editor' | 'viewer' };
};

export function CollectionHeader({ collection, actions, sharedAs }: CollectionHeaderProps) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="label-caps mb-2 font-semibold [color:var(--board-accent,rgba(32,30,29,0.65))]">
          {sharedAs ? `Collection · shared with you as ${sharedAs.role}` : 'Collection'}
          {collection.visibility === 'public' && ' · Public on Explore'}
        </p>
        <h1 className="text-[29px] break-words md:text-[44px]">{collection.name}</h1>
        {collection.description && (
          <p className="mt-3 max-w-[560px] text-[15px] text-ink/75">{collection.description}</p>
        )}
        <p className="mt-3 text-[13px] text-ink/75">
          {imageCount(collection.itemCount)} · {updatedAgo(collection.updatedAt)}
          {sharedAs && ` · by @${sharedAs.owner}`}
        </p>
        <BoardPaletteBar name={collection.name} palette={collection.palette} />
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}

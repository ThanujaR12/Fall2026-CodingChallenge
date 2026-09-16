// Collection page header: label, title, description, counts, and an actions slot (Edit, Delete).
import type { ReactNode } from 'react';
import { imageCount, updatedAgo } from '@/lib/format';
import type { CollectionSummary } from '@/types/api';

type CollectionHeaderProps = { collection: CollectionSummary; actions?: ReactNode };

export function CollectionHeader({ collection, actions }: CollectionHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="label-caps mb-2">Collection</p>
        <h1 className="text-[29px] break-words md:text-[44px]">{collection.name}</h1>
        {collection.description && (
          <p className="mt-3 max-w-[560px] text-[15px] text-ink/75">{collection.description}</p>
        )}
        <p className="mt-3 text-[13px] text-ink/65">
          {imageCount(collection.itemCount)} · {updatedAgo(collection.updatedAt)}
        </p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}

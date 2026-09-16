// Responsive grid of collection cards: one column on phones, up to three on desktop.
import type { CollectionSummary } from '@/types/api';
import { CollectionCard } from './CollectionCard';

export function CollectionGrid({ collections }: { collections: CollectionSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}

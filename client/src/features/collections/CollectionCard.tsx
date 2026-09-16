// Unboxed board card: cover photo with its credit, then name, description, and counts.
import { Link } from 'react-router';
import { assetUrl } from '@/api/client';
import { ImageCredit } from '@/components/ImageCredit';
import { LazyImage } from '@/components/LazyImage';
import { imageCount, updatedAgo } from '@/lib/format';
import type { CollectionSummary } from '@/types/api';

export function CollectionCard({ collection }: { collection: CollectionSummary }) {
  return (
    <article className="flex flex-col">
      <Link
        to={`/collections/${collection.id}`}
        className="group block focus-visible:outline-offset-4"
      >
        {collection.coverImageUrl ? (
          <LazyImage
            src={assetUrl(collection.coverImageUrl)}
            alt={`Cover of ${collection.name}`}
            aspect="16 / 10"
          />
        ) : (
          <div
            className="stripe-placeholder flex w-full items-center justify-center"
            style={{ aspectRatio: '16 / 10' }}
          >
            <span className="text-[13px] text-ink/55 italic">No images yet</span>
          </div>
        )}
        <h3 className="mt-3 text-[20px] group-hover:text-accent-deep">{collection.name}</h3>
      </Link>

      {collection.description && (
        <p className="mt-1 line-clamp-1 text-[14px] text-ink/75">{collection.description}</p>
      )}
      <p className="mt-1 text-[13px] text-ink/65">
        {imageCount(collection.itemCount)} · {updatedAgo(collection.updatedAt)}
      </p>
      {/* Credit sits outside the card link so links are never nested. */}
      {collection.coverCreatorName && collection.coverPageUrl && (
        <ImageCredit
          className="mt-0.5 text-[11px]"
          creatorName={collection.coverCreatorName}
          pageUrl={collection.coverPageUrl}
        />
      )}
    </article>
  );
}

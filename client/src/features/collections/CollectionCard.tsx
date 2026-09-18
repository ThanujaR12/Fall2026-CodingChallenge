// Unboxed board card: cover photo, its color strip, then name, description, counts, and sharing.
import { Link } from 'react-router';
import { assetUrl } from '@/api/client';
import { ImageCredit } from '@/components/ImageCredit';
import { LazyImage } from '@/components/LazyImage';
import { imageCount, updatedAgo } from '@/lib/format';
import type { CollectionSummary, SharedCollectionSummary } from '@/types/api';

type CollectionCardProps = { collection: CollectionSummary | SharedCollectionSummary };

export function CollectionCard({ collection }: CollectionCardProps) {
  // Shared collections also say who owns them and your role.
  const shared = 'owner' in collection ? collection : null;

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
            <span className="text-[13px] text-ink/65 italic">No images yet</span>
          </div>
        )}
        {collection.palette.length > 0 && (
          <div
            className="flex h-2"
            role="img"
            aria-label={`Colors: ${collection.palette.join(', ')}`}
          >
            {collection.palette.map((color) => (
              <span key={color} className="flex-1" style={{ backgroundColor: color }} />
            ))}
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
      {shared && (
        <p className="mt-0.5 text-[13px] text-ink/65">
          by @{shared.owner.username} ·{' '}
          <span className="tag bg-accent-tint text-accent-deep">
            {shared.role === 'editor' ? 'Editor' : 'Viewer'}
          </span>
        </p>
      )}
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

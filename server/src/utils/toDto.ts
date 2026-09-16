// Converts database documents and Pixabay hits into the exact JSON shapes the API promises.
import type { Types } from 'mongoose';
import type { CollectionStats } from '../services/collectionService.js';
import type { PixabayHit } from '../services/pixabayService.js';
import { splitTags, titleFromTags } from './titleFromTags.js';

export function imageUrl(assetId: Types.ObjectId | string): string {
  return `/api/images/${String(assetId)}`;
}

export function toSearchResult(hit: PixabayHit) {
  return {
    sourceId: String(hit.id),
    title: titleFromTags(hit.tags),
    tags: splitTags(hit.tags),
    creatorName: hit.user,
    pageUrl: hit.pageURL,
    thumbnailUrl: hit.webformatURL,
    width: hit.webformatWidth,
    height: hit.webformatHeight,
  };
}

type CollectionLike = {
  _id: Types.ObjectId;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toCollectionSummary(collection: CollectionLike, stats: CollectionStats) {
  const summary: Record<string, unknown> = {
    id: String(collection._id),
    name: collection.name,
    description: collection.description ?? '',
    itemCount: stats.itemCount,
    coverImageUrl: stats.coverAsset ? imageUrl(stats.coverAsset) : null,
    coverCreatorName: stats.coverAsset ? stats.coverCreatorName : null,
    coverPageUrl: stats.coverAsset ? stats.coverPageUrl : null,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
  if (stats.containsImage !== undefined) summary.containsImage = stats.containsImage;
  return summary;
}

type SavedItemLike = {
  _id: Types.ObjectId;
  collectionId: Types.ObjectId;
  sourceId: string;
  asset: Types.ObjectId;
  title: string;
  note?: string | null;
  tags: string[];
  creatorName?: string | null;
  pageUrl?: string | null;
  width?: number | null;
  height?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toSavedItem(item: SavedItemLike) {
  return {
    id: String(item._id),
    collectionId: String(item.collectionId),
    sourceId: item.sourceId,
    title: item.title,
    note: item.note ?? '',
    tags: [...item.tags],
    creatorName: item.creatorName ?? '',
    pageUrl: item.pageUrl ?? '',
    imageUrl: imageUrl(item.asset),
    width: item.width ?? 0,
    height: item.height ?? 0,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

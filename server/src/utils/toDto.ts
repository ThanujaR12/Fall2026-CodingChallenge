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
  visibility?: string | null;
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
    palette: stats.palette ?? [],
    visibility: collection.visibility === 'public' ? 'public' : 'private',
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
  if (stats.containsImage !== undefined) summary.containsImage = stats.containsImage;
  return summary;
}

type Role = 'owner' | 'editor' | 'viewer';
type MemberLike = { user: UserLike; role: 'editor' | 'viewer' };

export function toMembers(members: MemberLike[]) {
  return members.map((m) => ({ user: toPublicUser(m.user), role: m.role }));
}

// Owned collection plus who owns it, the viewer's role, members, and (owner only) the share token.
export function toCollectionDetail(
  collection: CollectionLike & {
    owner: UserLike;
    members: MemberLike[];
    shareToken?: string | null;
  },
  stats: CollectionStats,
  items: SavedItemLike[],
  role: Role,
) {
  return {
    ...toCollectionSummary(collection, stats),
    role,
    owner: toPublicUser(collection.owner),
    members: toMembers(collection.members),
    shareToken: role === 'owner' ? (collection.shareToken ?? null) : null,
    items: items.map(toSavedItem),
  };
}

export function toSharedSummary(
  collection: CollectionLike,
  stats: CollectionStats,
  owner: UserLike,
  role: 'editor' | 'viewer',
) {
  return { ...toCollectionSummary(collection, stats), owner: toPublicUser(owner), role };
}

// What a share-link visitor sees: no members and no token.
export function toSharedView(
  collection: CollectionLike & { owner: UserLike },
  stats: CollectionStats,
  items: SavedItemLike[],
) {
  return {
    ...toCollectionSummary(collection, stats),
    owner: toPublicUser(collection.owner),
    items: items.map(toSavedItem),
  };
}

type UserLike = { _id: Types.ObjectId; username: string; email?: string | null };

export function toPublicUser(user: UserLike) {
  return { id: String(user._id), username: user.username };
}

export function toAuthUser(user: UserLike) {
  return { id: String(user._id), username: user.username, email: user.email ?? '' };
}

// addedBy is a user document when populated, or just an id when it was not.
function publicUserOrNull(value: unknown) {
  if (value && typeof value === 'object' && 'username' in value) {
    return toPublicUser(value as UserLike);
  }
  return null;
}

type SavedItemLike = {
  _id: Types.ObjectId;
  collectionId: Types.ObjectId;
  addedBy?: unknown;
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
    addedBy: publicUserOrNull(item.addedBy),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Business rules for collections: unique names per owner, owned/shared lists, details, sharing.
import { randomBytes } from 'node:crypto';
import type { Types } from 'mongoose';
import { Collection } from '../models/Collection.js';
import { SavedItem } from '../models/SavedItem.js';
import { AppError } from '../utils/AppError.js';
import { removeForCollection as removeActivity } from './activityService.js';
import { removeOrphanAssets } from './assetService.js';
import { palettesFor } from './paletteService.js';
import { assertCan, resolveAccess } from './permissionService.js';

export type CollectionStats = {
  itemCount: number;
  coverAsset: Types.ObjectId | null;
  coverCreatorName: string | null;
  coverPageUrl: string | null;
  /** Up to five dominant colors merged from the collection's images. */
  palette: string[];
  containsImage?: boolean;
};

const emptyStats: CollectionStats = {
  itemCount: 0,
  coverAsset: null,
  coverCreatorName: null,
  coverPageUrl: null,
  palette: [],
};

// Names are compared ignoring case and surrounding spaces.
export function toNameKey(name: string): string {
  return name.trim().toLowerCase();
}

function nameTaken(): AppError {
  return new AppError(409, 'COLLECTION_NAME_TAKEN', 'A collection with that name already exists.');
}

export async function createCollection(
  ownerId: Types.ObjectId,
  input: { name: string; description: string; visibility?: 'private' | 'public' },
) {
  const nameKey = toNameKey(input.name);
  // Friendly pre-check; the unique index still guards against two requests racing.
  if (await Collection.exists({ owner: ownerId, nameKey })) throw nameTaken();

  const collection = await Collection.create({
    owner: ownerId,
    name: input.name,
    nameKey,
    description: input.description,
    visibility: input.visibility ?? 'private',
  });
  return { collection, stats: { ...emptyStats, palette: [] } };
}

// Item count, newest item (the cover, with its credit), and palette for each collection id.
export async function statsFor(
  collectionIds: Types.ObjectId[],
): Promise<Map<string, CollectionStats>> {
  const palettes = await palettesFor(collectionIds);
  const rows = await SavedItem.aggregate<{
    _id: Types.ObjectId;
    itemCount: number;
    coverAsset: Types.ObjectId;
    coverCreatorName: string;
    coverPageUrl: string;
  }>([
    { $match: { collectionId: { $in: collectionIds } } },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $group: {
        _id: '$collectionId',
        itemCount: { $sum: 1 },
        coverAsset: { $first: '$asset' },
        coverCreatorName: { $first: '$creatorName' },
        coverPageUrl: { $first: '$pageUrl' },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        itemCount: row.itemCount,
        coverAsset: row.coverAsset,
        coverCreatorName: row.coverCreatorName,
        coverPageUrl: row.coverPageUrl,
        palette: palettes.get(String(row._id)) ?? [],
      },
    ]),
  );
}

// Marks which collections already hold an image (for the save picker's "Already saved").
async function collectionsHolding(ids: Types.ObjectId[], sourceId?: string) {
  if (!sourceId) return null;
  const holding = await SavedItem.distinct('collectionId', {
    collectionId: { $in: ids },
    source: 'pixabay',
    sourceId,
  });
  return new Set(holding.map(String));
}

type PopulatedOwner = { owner: { _id: Types.ObjectId; username: string } };

// The user's own collections plus the ones shared with them, most recently updated first.
export async function listForUser(userId: Types.ObjectId, sourceId?: string) {
  const [owned, shared] = await Promise.all([
    Collection.find({ owner: userId }).sort({ updatedAt: -1, _id: -1 }),
    Collection.find({ 'members.user': userId })
      .sort({ updatedAt: -1, _id: -1 })
      .populate<PopulatedOwner>('owner', 'username'),
  ]);
  const ids = [...owned, ...shared].map((c) => c._id);
  const [stats, holding] = await Promise.all([statsFor(ids), collectionsHolding(ids, sourceId)]);

  const statsOf = (id: Types.ObjectId) => {
    const row = { ...(stats.get(String(id)) ?? emptyStats) };
    if (holding) row.containsImage = holding.has(String(id));
    return row;
  };

  return {
    owned: owned.map((collection) => ({ collection, stats: statsOf(collection._id) })),
    shared: shared.map((collection) => ({
      collection,
      stats: statsOf(collection._id),
      owner: collection.owner,
      role: (collection.members.find((m) => m.user.equals(userId))?.role ?? 'viewer') as
        'editor' | 'viewer',
    })),
  };
}

export async function updateCollection(
  userId: Types.ObjectId,
  collectionId: string,
  changes: { name?: string; description?: string; visibility?: 'private' | 'public' },
) {
  const { collection, role } = await resolveAccess(userId, collectionId);
  if (changes.name !== undefined) assertCan(role, 'rename');
  if (changes.visibility !== undefined) assertCan(role, 'changeVisibility');
  if (changes.description !== undefined) assertCan(role, 'editDescription');

  if (changes.name !== undefined) {
    const nameKey = toNameKey(changes.name);
    // Names are unique per owner; this collection's own name (in any casing) is fine.
    const clash = await Collection.exists({
      owner: collection.owner,
      nameKey,
      _id: { $ne: collection._id },
    });
    if (clash) throw nameTaken();
    collection.name = changes.name;
    collection.nameKey = nameKey;
  }
  if (changes.description !== undefined) collection.description = changes.description;
  if (changes.visibility !== undefined) collection.visibility = changes.visibility;

  await collection.save();
  const stats = await statsFor([collection._id]);
  return { collection, stats: stats.get(String(collection._id)) ?? { ...emptyStats } };
}

// Marks a collection as just changed so it moves to the top of the list.
export async function touchCollection(collectionId: Types.ObjectId): Promise<void> {
  await Collection.updateOne({ _id: collectionId }, { $set: { updatedAt: new Date() } });
}

// Items newest first with who added each one, plus cover stats computed from them.
export async function itemsWithStats(collectionId: Types.ObjectId) {
  const items = await SavedItem.find({ collectionId })
    .sort({ createdAt: -1, _id: -1 })
    .populate('addedBy', 'username');
  const newest = items[0];
  const stats: CollectionStats = newest
    ? {
        itemCount: items.length,
        coverAsset: newest.asset,
        coverCreatorName: newest.creatorName,
        coverPageUrl: newest.pageUrl,
        palette: (await palettesFor([collectionId])).get(String(collectionId)) ?? [],
      }
    : { ...emptyStats, palette: [] };
  return { items, stats };
}

type PopulatedDetail = PopulatedOwner & {
  members: { user: { _id: Types.ObjectId; username: string }; role: 'editor' | 'viewer' }[];
};

export async function getCollectionDetail(userId: Types.ObjectId, collectionId: string) {
  const access = await resolveAccess(userId, collectionId);
  assertCan(access.role, 'view');
  const collection = await access.collection.populate<PopulatedDetail>([
    { path: 'owner', select: 'username' },
    { path: 'members.user', select: 'username' },
  ]);
  const { items, stats } = await itemsWithStats(collection._id);
  return { collection, stats, items, role: access.role };
}

// Permanently deletes a collection, its saved items, and image copies no other collection uses.
export async function deleteCollection(userId: Types.ObjectId, collectionId: string) {
  const { collection, role } = await resolveAccess(userId, collectionId);
  assertCan(role, 'delete');
  const assetIds = await SavedItem.distinct('asset', { collectionId: collection._id });

  await SavedItem.deleteMany({ collectionId: collection._id });
  await removeOrphanAssets(assetIds);
  await removeActivity(collection._id);
  await collection.deleteOne();
}

// Turning the link on always makes a brand-new token, so an old link never comes back to life.
export async function enableShare(userId: Types.ObjectId, collectionId: string) {
  const { collection, role } = await resolveAccess(userId, collectionId);
  assertCan(role, 'share');
  collection.shareToken = randomBytes(18).toString('base64url');
  await collection.save();
  return collection.shareToken;
}

export async function disableShare(userId: Types.ObjectId, collectionId: string) {
  const { collection, role } = await resolveAccess(userId, collectionId);
  assertCan(role, 'share');
  collection.shareToken = null;
  await collection.save();
}

// The read-only board anyone with an active link can see (no members, no token).
export async function getSharedView(shareToken: string) {
  const collection = await Collection.findOne({ shareToken }).populate<PopulatedOwner>(
    'owner',
    'username',
  );
  if (!collection) {
    throw new AppError(404, 'SHARE_LINK_INACTIVE', 'This link is no longer active.');
  }
  const { items, stats } = await itemsWithStats(collection._id);
  return { collection, stats, items };
}

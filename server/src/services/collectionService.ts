// Business rules for collections: unique names per owner, listing with counts and covers.
import type { Types } from 'mongoose';
import { Collection } from '../models/Collection.js';
import { SavedItem } from '../models/SavedItem.js';
import { AppError } from '../utils/AppError.js';

export type CollectionStats = {
  itemCount: number;
  coverAsset: Types.ObjectId | null;
  coverCreatorName: string | null;
  coverPageUrl: string | null;
  containsImage?: boolean;
};

const emptyStats: CollectionStats = {
  itemCount: 0,
  coverAsset: null,
  coverCreatorName: null,
  coverPageUrl: null,
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
  input: { name: string; description: string },
) {
  const nameKey = toNameKey(input.name);
  // Friendly pre-check; the unique index still guards against two requests racing.
  if (await Collection.exists({ owner: ownerId, nameKey })) throw nameTaken();

  const collection = await Collection.create({
    owner: ownerId,
    name: input.name,
    nameKey,
    description: input.description,
  });
  return { collection, stats: { ...emptyStats } };
}

// Item count and newest item (the cover, with its credit) for each collection id.
async function statsFor(collectionIds: Types.ObjectId[]): Promise<Map<string, CollectionStats>> {
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
      },
    ]),
  );
}

// With a sourceId, each collection also says whether it already holds that image.
export async function listForOwner(ownerId: Types.ObjectId, sourceId?: string) {
  const collections = await Collection.find({ owner: ownerId }).sort({ updatedAt: -1, _id: -1 });
  const ids = collections.map((c) => c._id);
  const stats = await statsFor(ids);

  const holding = sourceId
    ? new Set(
        (
          await SavedItem.distinct('collectionId', {
            collectionId: { $in: ids },
            source: 'pixabay',
            sourceId,
          })
        ).map(String),
      )
    : null;

  return collections.map((collection) => {
    const row = { ...(stats.get(String(collection._id)) ?? emptyStats) };
    if (holding) row.containsImage = holding.has(String(collection._id));
    return { collection, stats: row };
  });
}

// Finds a collection only if it belongs to the owner; anything else looks like "not found".
export async function getOwnedCollection(ownerId: Types.ObjectId, collectionId: string) {
  const collection = await Collection.findOne({ _id: collectionId, owner: ownerId });
  if (!collection) {
    throw new AppError(404, 'COLLECTION_NOT_FOUND', "That collection doesn't exist.");
  }
  return collection;
}

// Marks a collection as just changed so it moves to the top of the list.
export async function touchCollection(collectionId: Types.ObjectId): Promise<void> {
  await Collection.updateOne({ _id: collectionId }, { $set: { updatedAt: new Date() } });
}

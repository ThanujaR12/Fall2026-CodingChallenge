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

export async function listForOwner(ownerId: Types.ObjectId) {
  const collections = await Collection.find({ owner: ownerId }).sort({ updatedAt: -1, _id: -1 });
  const stats = await statsFor(collections.map((c) => c._id));

  return collections.map((collection) => ({
    collection,
    stats: stats.get(String(collection._id)) ?? { ...emptyStats },
  }));
}

// Marks a collection as just changed so it moves to the top of the list.
export async function touchCollection(collectionId: Types.ObjectId): Promise<void> {
  await Collection.updateOne({ _id: collectionId }, { $set: { updatedAt: new Date() } });
}

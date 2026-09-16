// Business rules for saved items: saving (with a stored image copy), editing, and removing.
import type { Types } from 'mongoose';
import { ImageAsset } from '../models/ImageAsset.js';
import { SavedItem } from '../models/SavedItem.js';
import { AppError } from '../utils/AppError.js';
import { splitTags, titleFromTags } from '../utils/titleFromTags.js';
import { removeOrphanAssets } from './assetService.js';
import { getOwnedCollection, touchCollection } from './collectionService.js';
import * as pixabay from './pixabayService.js';

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

// Reuses the stored copy if any collection already saved this image; otherwise downloads it once.
async function findOrCreateAsset(hit: pixabay.PixabayHit) {
  const sourceId = String(hit.id);
  const existing = await ImageAsset.findOne({ source: 'pixabay', sourceId });
  if (existing) return existing;

  const { data, contentType } = await pixabay.downloadImage(hit.webformatURL);
  try {
    return await ImageAsset.create({
      source: 'pixabay',
      sourceId,
      data,
      contentType,
      byteLength: data.byteLength,
      width: hit.webformatWidth,
      height: hit.webformatHeight,
    });
  } catch (err) {
    // Two saves of the same new image can race; the loser uses the winner's copy.
    if (!isDuplicateKey(err)) throw err;
    const winner = await ImageAsset.findOne({ source: 'pixabay', sourceId });
    if (!winner) throw err;
    return winner;
  }
}

export async function saveItem(ownerId: Types.ObjectId, collectionId: string, sourceId: string) {
  const collection = await getOwnedCollection(ownerId, collectionId);

  if (await SavedItem.exists({ collectionId: collection._id, source: 'pixabay', sourceId })) {
    throw new AppError(409, 'ITEM_ALREADY_SAVED', 'This image is already in that collection.');
  }

  // Look the image up ourselves rather than trusting data sent by the browser.
  const hit = await pixabay.getImageById(sourceId);
  if (!hit) {
    throw new AppError(404, 'IMAGE_NOT_FOUND', 'That image is no longer available.');
  }

  const asset = await findOrCreateAsset(hit);
  const item = await SavedItem.create({
    collectionId: collection._id,
    addedBy: ownerId,
    source: 'pixabay',
    sourceId,
    asset: asset._id,
    width: hit.webformatWidth,
    height: hit.webformatHeight,
    pageUrl: hit.pageURL,
    tags: splitTags(hit.tags),
    creatorName: hit.user,
    title: titleFromTags(hit.tags),
  });

  await touchCollection(collection._id);
  return item;
}

async function getItemInCollection(collectionId: Types.ObjectId, itemId: string) {
  const item = await SavedItem.findOne({ _id: itemId, collectionId });
  if (!item) throw new AppError(404, 'ITEM_NOT_FOUND', "That image isn't in this collection.");
  return item;
}

export async function updateItem(
  ownerId: Types.ObjectId,
  collectionId: string,
  itemId: string,
  changes: { title?: string; note?: string },
) {
  const collection = await getOwnedCollection(ownerId, collectionId);
  const item = await getItemInCollection(collection._id, itemId);

  if (changes.title !== undefined) {
    // Clearing the title brings back the readable default built from the tags.
    item.title = changes.title || titleFromTags(item.tags.join(', '));
  }
  if (changes.note !== undefined) item.note = changes.note;

  await item.save();
  await touchCollection(collection._id);
  return item;
}

// Removes the image from this collection only; the same image in other collections is untouched.
export async function removeItem(ownerId: Types.ObjectId, collectionId: string, itemId: string) {
  const collection = await getOwnedCollection(ownerId, collectionId);
  const item = await getItemInCollection(collection._id, itemId);

  await item.deleteOne();
  await removeOrphanAssets([item.asset]);
  await touchCollection(collection._id);
}

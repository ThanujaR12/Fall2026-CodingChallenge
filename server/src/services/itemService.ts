// Business rules for saved items: saving (with a stored image copy), editing, and removing.
import type { Types } from 'mongoose';
import { ImageAsset } from '../models/ImageAsset.js';
import { SavedItem } from '../models/SavedItem.js';
import { AppError } from '../utils/AppError.js';
import { splitTags, titleFromTags } from '../utils/titleFromTags.js';
import { removeOrphanAssets } from './assetService.js';
import { touchCollection } from './collectionService.js';
import { recordActivity } from './activityService.js';
import { notifyItemChange } from './notificationService.js';
import { extractColors } from './paletteService.js';
import { assertCan, resolveAccess } from './permissionService.js';
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
      // Palette Boards: read the image's colors once, now, rather than on every page view.
      colors: await extractColors(data),
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

// Owners and editors may change items; viewers and outsiders are refused before anything happens.
async function editableCollection(userId: Types.ObjectId, collectionId: string) {
  const { collection, role } = await resolveAccess(userId, collectionId);
  assertCan(role, 'editItems');
  return collection;
}

export async function saveItem(userId: Types.ObjectId, collectionId: string, sourceId: string) {
  const collection = await editableCollection(userId, collectionId);

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
    addedBy: userId,
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
  const added = { type: 'item_added', itemTitle: item.title, asset: asset._id } as const;
  await recordActivity({ collectionId: collection._id, actor: userId, ...added });
  await notifyItemChange(collection, userId, added);
  return item.populate('addedBy', 'username');
}

async function getItemInCollection(collectionId: Types.ObjectId, itemId: string) {
  const item = await SavedItem.findOne({ _id: itemId, collectionId });
  if (!item) throw new AppError(404, 'ITEM_NOT_FOUND', "That image isn't in this collection.");
  return item;
}

// Last save wins: two members editing the same item simply overwrite in order (FR-024).
export async function updateItem(
  userId: Types.ObjectId,
  collectionId: string,
  itemId: string,
  changes: { title?: string; note?: string },
) {
  const collection = await editableCollection(userId, collectionId);
  const item = await getItemInCollection(collection._id, itemId);

  if (changes.title !== undefined) {
    // Clearing the title brings back the readable default built from the tags.
    item.title = changes.title || titleFromTags(item.tags.join(', '));
  }
  if (changes.note !== undefined) item.note = changes.note;

  await item.save();
  await touchCollection(collection._id);
  const edited = { type: 'item_edited', itemTitle: item.title, asset: item.asset } as const;
  await recordActivity({ collectionId: collection._id, actor: userId, ...edited });
  await notifyItemChange(collection, userId, edited);
  return item.populate('addedBy', 'username');
}

// Removes the image from this collection only; the same image in other collections is untouched.
export async function removeItem(userId: Types.ObjectId, collectionId: string, itemId: string) {
  const collection = await editableCollection(userId, collectionId);
  const item = await getItemInCollection(collection._id, itemId);

  await item.deleteOne();
  await removeOrphanAssets([item.asset]);
  await touchCollection(collection._id);
  const removed = { type: 'item_removed', itemTitle: item.title } as const;
  await recordActivity({ collectionId: collection._id, actor: userId, ...removed });
  await notifyItemChange(collection, userId, removed);
}

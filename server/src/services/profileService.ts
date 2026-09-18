// Your profile: who you are (display name, bio, avatar colour), what you've made (stats), your
// colour signature (every board's palette blended into one), and everything you've saved.
import type { Types } from 'mongoose';
import { Collection } from '../models/Collection.js';
import { SavedItem } from '../models/SavedItem.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { mergePalettes, palettesFor } from './paletteService.js';

export const SAVED_PAGE_SIZE = 30;

async function findUser(userId: Types.ObjectId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
  return user;
}

export async function getProfile(userId: Types.ObjectId) {
  const user = await findUser(userId);
  const [owned, shared, savedPhotos] = await Promise.all([
    Collection.find({ owner: userId }).select('_id members').lean(),
    Collection.find({ 'members.user': userId }).select('owner members').lean(),
    SavedItem.countDocuments({ addedBy: userId }),
  ]);

  // Everyone you build boards with: members of your boards, and owners/members of boards you're on.
  const people = new Set<string>();
  for (const board of owned) for (const m of board.members) people.add(String(m.user));
  for (const board of shared) {
    people.add(String(board.owner));
    for (const m of board.members) people.add(String(m.user));
  }
  people.delete(String(userId));

  // Your colour signature: the palettes of all your own boards, blended.
  const palettes = await palettesFor(owned.map((b) => b._id));
  const colorSignature = mergePalettes([...palettes.values()].filter((p) => p.length > 0));

  return {
    user,
    stats: {
      boards: owned.length,
      sharedWithYou: shared.length,
      savedPhotos,
      collaborators: people.size,
    },
    colorSignature,
  };
}

export async function updateProfile(
  userId: Types.ObjectId,
  changes: { displayName?: string; bio?: string; avatarColor?: string },
) {
  const user = await findUser(userId);
  if (changes.displayName !== undefined) user.displayName = changes.displayName;
  if (changes.bio !== undefined) user.bio = changes.bio;
  if (changes.avatarColor !== undefined) user.avatarColor = changes.avatarColor;
  await user.save();
  return user;
}

type PopulatedBoard = { collectionId: { _id: Types.ObjectId; name: string } | null };

/** Every photo you have saved, on any board, newest first. */
export async function listSaved(userId: Types.ObjectId, page: number) {
  const [items, total] = await Promise.all([
    SavedItem.find({ addedBy: userId })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * SAVED_PAGE_SIZE)
      .limit(SAVED_PAGE_SIZE)
      .populate<PopulatedBoard>('collectionId', 'name')
      .lean(),
    SavedItem.countDocuments({ addedBy: userId }),
  ]);
  return { items, total, hasMore: page * SAVED_PAGE_SIZE < total };
}

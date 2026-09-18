// Explore: public boards anyone can browse (newest activity first), optionally by color.
import { Collection } from '../models/Collection.js';
import { nearestImageColor, type ImageColor } from '../config/colors.js';
import { AppError } from '../utils/AppError.js';
import { itemsWithStats, statsFor } from './collectionService.js';

export const EXPLORE_PAGE_SIZE = 24;

type PopulatedOwner = { owner: { _id: import('mongoose').Types.ObjectId; username: string } };

/** A board matches a color when one of its three leading palette colors is closest to it. */
function matchesColor(palette: string[], color: ImageColor): boolean {
  if (color === 'grayscale') {
    return palette
      .slice(0, 3)
      .every((hex) => ['black', 'gray', 'white'].includes(nearestImageColor(hex)));
  }
  return palette.slice(0, 3).some((hex) => nearestImageColor(hex) === color);
}

export async function listPublicBoards(page: number, color?: ImageColor) {
  const collections = await Collection.find({ visibility: 'public' })
    .sort({ updatedAt: -1, _id: -1 })
    .populate<PopulatedOwner>('owner', 'username');
  const stats = await statsFor(collections.map((c) => c._id));

  // Empty public boards have nothing to show yet, so Explore skips them.
  const boards = collections
    .map((collection) => ({ collection, stats: stats.get(String(collection._id)) }))
    .filter((row): row is typeof row & { stats: NonNullable<typeof row.stats> } =>
      Boolean(row.stats && row.stats.itemCount > 0),
    )
    .filter((row) => !color || matchesColor(row.stats.palette, color));

  const start = (page - 1) * EXPLORE_PAGE_SIZE;
  return {
    boards: boards.slice(start, start + EXPLORE_PAGE_SIZE),
    total: boards.length,
    hasMore: start + EXPLORE_PAGE_SIZE < boards.length,
  };
}

export async function getPublicBoard(collectionId: string) {
  const collection = await Collection.findOne({
    _id: collectionId,
    visibility: 'public',
  }).populate<PopulatedOwner>('owner', 'username');
  if (!collection) {
    throw new AppError(404, 'BOARD_NOT_PUBLIC', "This board isn't public, or it no longer exists.");
  }
  const { items, stats } = await itemsWithStats(collection._id);
  return { collection, stats, items };
}

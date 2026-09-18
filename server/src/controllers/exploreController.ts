// Handles Explore: the public board list and a public board's read-only view.
import type { Request, Response } from 'express';
import type { IdParams } from '../schemas/common.js';
import type { ExploreQuery } from '../schemas/exploreSchemas.js';
import * as exploreService from '../services/exploreService.js';
import { toCollectionSummary, toPublicUser, toSharedView } from '../utils/toDto.js';

export async function listPublicBoards(_req: Request, res: Response) {
  const { color, page } = res.locals.query as ExploreQuery;
  const { boards, total, hasMore } = await exploreService.listPublicBoards(page, color);
  res.json({
    boards: boards.map(({ collection, stats }) => ({
      ...toCollectionSummary(collection, stats),
      owner: toPublicUser(collection.owner),
    })),
    page,
    perPage: exploreService.EXPLORE_PAGE_SIZE,
    total,
    hasMore,
  });
}

export async function getPublicBoard(_req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  const { collection, stats, items } = await exploreService.getPublicBoard(id);
  res.json({ collection: toSharedView(collection, stats, items) });
}

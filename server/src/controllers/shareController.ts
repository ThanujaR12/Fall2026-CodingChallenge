// Handles turning a collection's share link on and off, and the public shared view.
import type { Request, Response } from 'express';
import type { IdParams } from '../schemas/common.js';
import * as collectionService from '../services/collectionService.js';
import { toSharedView } from '../utils/toDto.js';

export async function enableShare(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  const shareToken = await collectionService.enableShare(req.userId, id);
  res.json({ shareToken });
}

export async function disableShare(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  await collectionService.disableShare(req.userId, id);
  res.status(204).end();
}

export async function getSharedView(_req: Request, res: Response) {
  const { token } = res.locals.params as { token: string };
  const { collection, stats, items } = await collectionService.getSharedView(token);
  res.json({ collection: toSharedView(collection, stats, items) });
}

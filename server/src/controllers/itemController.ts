// Handles saved-item requests: save, edit, and remove items within a collection.
import type { Request, Response } from 'express';
import type { IdParams } from '../schemas/common.js';
import type { ItemParams, SaveItemBody, UpdateItemBody } from '../schemas/itemSchemas.js';
import * as itemService from '../services/itemService.js';
import { toSavedItem } from '../utils/toDto.js';

export async function saveItem(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  const { sourceId } = req.body as SaveItemBody;
  const item = await itemService.saveItem(req.userId, id, sourceId);
  res.status(201).json({ item: toSavedItem(item) });
}

export async function updateItem(req: Request, res: Response) {
  const { id, itemId } = res.locals.params as ItemParams;
  const changes = req.body as UpdateItemBody;
  const item = await itemService.updateItem(req.userId, id, itemId, changes);
  res.json({ item: toSavedItem(item) });
}

export async function removeItem(req: Request, res: Response) {
  const { id, itemId } = res.locals.params as ItemParams;
  await itemService.removeItem(req.userId, id, itemId);
  res.status(204).end();
}

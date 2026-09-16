// Handles saved-item requests: save (and later edit and remove) items within a collection.
import type { Request, Response } from 'express';
import type { IdParams } from '../schemas/common.js';
import type { SaveItemBody } from '../schemas/itemSchemas.js';
import * as itemService from '../services/itemService.js';
import { toSavedItem } from '../utils/toDto.js';

export async function saveItem(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  const { sourceId } = req.body as SaveItemBody;
  const item = await itemService.saveItem(req.userId, id, sourceId);
  res.status(201).json({ item: toSavedItem(item) });
}

// Handles collection requests: reads validated input, calls the service, shapes the response.
import type { Request, Response } from 'express';
import type { CreateCollectionBody, ListCollectionsQuery } from '../schemas/collectionSchemas.js';
import * as collectionService from '../services/collectionService.js';
import { toCollectionSummary } from '../utils/toDto.js';

export async function listCollections(req: Request, res: Response) {
  const { sourceId } = res.locals.query as ListCollectionsQuery;
  const rows = await collectionService.listForOwner(req.userId, sourceId);
  res.json({ collections: rows.map((row) => toCollectionSummary(row.collection, row.stats)) });
}

export async function createCollection(req: Request, res: Response) {
  const body = req.body as CreateCollectionBody;
  const { collection, stats } = await collectionService.createCollection(req.userId, body);
  res.status(201).json({ collection: toCollectionSummary(collection, stats) });
}

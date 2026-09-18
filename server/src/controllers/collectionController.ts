// Handles collection requests: reads validated input, calls the service, shapes the response.
import type { Request, Response } from 'express';
import type {
  CreateCollectionBody,
  ListCollectionsQuery,
  UpdateCollectionBody,
} from '../schemas/collectionSchemas.js';
import type { IdParams } from '../schemas/common.js';
import * as collectionService from '../services/collectionService.js';
import { toCollectionDetail, toCollectionSummary, toSharedSummary } from '../utils/toDto.js';

export async function listCollections(req: Request, res: Response) {
  const { sourceId } = res.locals.query as ListCollectionsQuery;
  const { owned, shared } = await collectionService.listForUser(req.userId, sourceId);
  res.json({
    collections: owned.map((row) => toCollectionSummary(row.collection, row.stats)),
    shared: shared.map((row) => toSharedSummary(row.collection, row.stats, row.owner, row.role)),
  });
}

export async function createCollection(req: Request, res: Response) {
  const body = req.body as CreateCollectionBody;
  const { collection, stats } = await collectionService.createCollection(req.userId, body);
  res.status(201).json({ collection: toCollectionSummary(collection, stats) });
}

export async function getCollection(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  const { collection, stats, items, role } = await collectionService.getCollectionDetail(
    req.userId,
    id,
  );
  res.json({ collection: toCollectionDetail(collection, stats, items, role) });
}

export async function updateCollection(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  const changes = req.body as UpdateCollectionBody;
  const { collection, stats } = await collectionService.updateCollection(req.userId, id, changes);
  res.json({ collection: toCollectionSummary(collection, stats) });
}

export async function deleteCollection(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  await collectionService.deleteCollection(req.userId, id);
  res.status(204).end();
}

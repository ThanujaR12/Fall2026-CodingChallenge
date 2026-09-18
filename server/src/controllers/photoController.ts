// Handles photo pages: one photo with its colours, and photos like it.
import type { Request, Response } from 'express';
import type { PhotoParams, SimilarQuery, UnderstandBody } from '../schemas/photoSchemas.js';
import * as photoService from '../services/photoService.js';
import * as visionService from '../services/visionService.js';
import { PER_PAGE } from '../services/pixabayService.js';
import { toSearchResult } from '../utils/toDto.js';

export async function getPhoto(_req: Request, res: Response) {
  const { sourceId } = res.locals.params as PhotoParams;
  const { hit, palette } = await photoService.getPhoto(sourceId);
  res.json({ photo: { ...toSearchResult(hit), largeUrl: hit.largeImageURL }, palette });
}

export async function understandPhoto(req: Request, res: Response) {
  const { image } = req.body as UnderstandBody;
  const [header, base64] = image.split(',', 2);
  const mediaType = header.slice('data:'.length, header.indexOf(';')) as
    'image/jpeg' | 'image/png' | 'image/webp';
  const understanding = await visionService.understandPhoto(base64, mediaType);
  res.json({ understanding });
}

export function visionStatus(_req: Request, res: Response) {
  res.json({ enabled: visionService.visionEnabled() });
}

export async function getSimilar(_req: Request, res: Response) {
  const { sourceId } = res.locals.params as PhotoParams;
  const { by, page } = res.locals.query as SimilarQuery;
  const result = await photoService.similarPhotos(sourceId, by, page);
  res.json({
    by,
    basedOn: result.basedOn,
    color: result.color,
    results: result.hits.map(toSearchResult),
    page,
    perPage: PER_PAGE,
    total: result.total,
    hasMore: result.hasMore,
  });
}

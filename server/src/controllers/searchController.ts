// Handles image search: calls the Pixabay service and shapes the paged response.
import type { Request, Response } from 'express';
import type { SearchQuery } from '../schemas/searchSchemas.js';
import * as pixabay from '../services/pixabayService.js';
import { toSearchResult } from '../utils/toDto.js';

export async function searchImages(_req: Request, res: Response) {
  const { q, color, page } = res.locals.query as SearchQuery;
  const { hits, total } = await pixabay.searchImages(q, page, color);

  res.json({
    results: hits.map(toSearchResult),
    page,
    perPage: pixabay.PER_PAGE,
    total,
    hasMore: page * pixabay.PER_PAGE < total,
  });
}

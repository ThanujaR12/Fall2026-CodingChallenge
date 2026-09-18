// Handles the home feed: popular photos for a topic, in the same paged shape as search.
import type { Request, Response } from 'express';
import type { FeedQuery } from '../schemas/feedSchemas.js';
import * as pixabay from '../services/pixabayService.js';
import { toSearchResult } from '../utils/toDto.js';

export async function getFeed(_req: Request, res: Response) {
  const { topic, page } = res.locals.query as FeedQuery;
  const { hits, total } = await pixabay.browseImages(topic, page);

  res.json({
    topic,
    results: hits.map(toSearchResult),
    page,
    perPage: pixabay.PER_PAGE,
    total,
    hasMore: page * pixabay.PER_PAGE < total,
  });
}

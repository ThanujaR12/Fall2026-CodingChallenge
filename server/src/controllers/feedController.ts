// Handles the home feed: popular photos for a topic, in the same paged shape as search.
import type { Request, Response } from 'express';
import type { FeedQuery, ForYouQuery } from '../schemas/feedSchemas.js';
import * as forYouService from '../services/forYouService.js';
import * as pixabay from '../services/pixabayService.js';
import { toSearchResult } from '../utils/toDto.js';

export async function getForYou(req: Request, res: Response) {
  const { page, seed } = res.locals.query as ForYouQuery;
  const feed = await forYouService.forYou(req.userId, page, seed);
  res.json({
    personalized: feed.personalized,
    interests: feed.interests,
    results: feed.results.map(({ hit, reason }) => ({ ...toSearchResult(hit), reason })),
    page,
    hasMore: feed.hasMore,
  });
}

export async function getFeed(_req: Request, res: Response) {
  const { topic, color, page } = res.locals.query as FeedQuery;
  const { hits, total } = await pixabay.browseImages(topic, page, color);

  res.json({
    topic,
    color: color ?? null,
    results: hits.map(toSearchResult),
    page,
    perPage: pixabay.PER_PAGE,
    total,
    hasMore: page * pixabay.PER_PAGE < total,
  });
}

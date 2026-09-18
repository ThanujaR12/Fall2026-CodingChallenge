// Validation rules for the home feed (known topic and reachable page numbers).
import { z } from 'zod';
import { IMAGE_COLORS } from '../config/colors.js';
import { FEED_TOPIC_IDS } from '../config/feedTopics.js';

export const feedQuery = z
  .object({
    topic: z.enum(FEED_TOPIC_IDS, { error: 'Unknown topic.' }).default('all'),
    color: z.enum(IMAGE_COLORS, { error: 'Unknown color.' }).optional(),
    page: z.coerce.number().int().min(1, 'Page must be 1 or more.').default(1),
  })
  // Pixabay only exposes the first 500 results (25 pages of 20).
  .refine((value) => value.page * 20 <= 500, {
    path: ['page'],
    message: 'No more photos for this topic.',
  });

export type FeedQuery = z.infer<typeof feedQuery>;

// "For you": a page and a per-visit seed (the client picks a new one each visit or on Shuffle).
export const forYouQuery = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be 1 or more.')
    .max(20, 'No more photos.')
    .default(1),
  seed: z
    .string()
    .regex(/^[A-Za-z0-9-]{1,40}$/, 'Invalid seed.')
    .default('default'),
});

export type ForYouQuery = z.infer<typeof forYouQuery>;

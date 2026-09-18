// Validation rules for photo pages: a Pixabay photo id, and how "More like this" should match.
import { z } from 'zod';

export const photoParams = z.object({
  sourceId: z.string().regex(/^\d{1,12}$/, 'That is not a Pixabay photo id.'),
});

export const similarQuery = z.object({
  by: z.enum(['subject', 'color'], { error: 'Choose subject or color.' }).default('subject'),
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be 1 or more.')
    .max(25, 'No more photos.')
    .default(1),
});

export type PhotoParams = z.infer<typeof photoParams>;
export type SimilarQuery = z.infer<typeof similarQuery>;

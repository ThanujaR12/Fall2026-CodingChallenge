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

// A photo as a data URL (JPEG, PNG, or WebP), up to about 3 MB once decoded.
export const understandBody = z.object({
  image: z
    .string({ error: 'Send a photo.' })
    .max(4_000_000, 'That photo is too large. Try a smaller one.')
    .regex(
      /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/,
      'Send a JPEG, PNG, or WebP photo.',
    ),
});

export type PhotoParams = z.infer<typeof photoParams>;
export type UnderstandBody = z.infer<typeof understandBody>;
export type SimilarQuery = z.infer<typeof similarQuery>;

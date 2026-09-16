// Validation rules for image search requests (keyword length and reachable page numbers).
import { z } from 'zod';

export const searchQuery = z
  .object({
    q: z
      .string({ error: 'Enter a search term.' })
      .trim()
      .min(1, 'Enter a search term.')
      .max(100, 'Search terms can be at most 100 characters.'),
    page: z.coerce.number().int().min(1, 'Page must be 1 or more.').default(1),
  })
  // Pixabay only exposes the first 500 results (25 pages of 20).
  .refine((value) => value.page * 20 <= 500, {
    path: ['page'],
    message: 'No more results for this search.',
  });

export type SearchQuery = z.infer<typeof searchQuery>;

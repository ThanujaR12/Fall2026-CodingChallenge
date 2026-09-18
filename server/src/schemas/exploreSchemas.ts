// Validation rules for Explore: page number and optional color filter.
import { z } from 'zod';
import { IMAGE_COLORS } from '../config/colors.js';

export const exploreQuery = z.object({
  color: z.enum(IMAGE_COLORS, { error: 'Unknown color.' }).optional(),
  page: z.coerce.number().int().min(1, 'Page must be 1 or more.').default(1),
});

export type ExploreQuery = z.infer<typeof exploreQuery>;

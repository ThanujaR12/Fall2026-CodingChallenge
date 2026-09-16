// Validation rules for saved-item requests (image id, title, and note limits).
import { z } from 'zod';
import { objectIdParam } from './common.js';

export const saveItemBody = z.object({
  sourceId: z.string({ error: 'Invalid image id.' }).regex(/^\d{1,20}$/, 'Invalid image id.'),
});

export const itemParams = z.object({ id: objectIdParam, itemId: objectIdParam });

export type SaveItemBody = z.infer<typeof saveItemBody>;
export type ItemParams = z.infer<typeof itemParams>;

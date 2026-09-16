// Validation rules for saved-item requests (image id, title, and note limits).
import { z } from 'zod';
import { objectIdParam } from './common.js';

export const saveItemBody = z.object({
  sourceId: z.string({ error: 'Invalid image id.' }).regex(/^\d{1,20}$/, 'Invalid image id.'),
});

export const updateItemBody = z
  .object({
    // An empty title is allowed: the service resets it to the tag-based default.
    title: z.string().trim().max(100, 'Titles can be at most 100 characters.').optional(),
    note: z.string().max(500, 'Notes can be at most 500 characters.').optional(),
  })
  .refine((body) => body.title !== undefined || body.note !== undefined, {
    message: 'Nothing to update.',
  });

export const itemParams = z.object({ id: objectIdParam, itemId: objectIdParam });

export type SaveItemBody = z.infer<typeof saveItemBody>;
export type UpdateItemBody = z.infer<typeof updateItemBody>;
export type ItemParams = z.infer<typeof itemParams>;

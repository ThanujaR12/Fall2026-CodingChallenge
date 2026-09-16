// Validation rules for collection requests (name and description limits).
import { z } from 'zod';

export const nameField = z
  .string({ error: 'Give the collection a name.' })
  .trim()
  .min(1, 'Give the collection a name.')
  .max(60, 'Names can be at most 60 characters.');

export const descriptionField = z
  .string()
  .trim()
  .max(280, 'Descriptions can be at most 280 characters.');

export const createCollectionBody = z.object({
  name: nameField,
  description: descriptionField.default(''),
});

export const updateCollectionBody = z
  .object({ name: nameField.optional(), description: descriptionField.optional() })
  .refine((body) => body.name !== undefined || body.description !== undefined, {
    message: 'Nothing to update.',
  });

export const listCollectionsQuery = z.object({
  sourceId: z
    .string()
    .regex(/^\d{1,20}$/, 'Invalid image id.')
    .optional(),
});

export type CreateCollectionBody = z.infer<typeof createCollectionBody>;
export type UpdateCollectionBody = z.infer<typeof updateCollectionBody>;
export type ListCollectionsQuery = z.infer<typeof listCollectionsQuery>;

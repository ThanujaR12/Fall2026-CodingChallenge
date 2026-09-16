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

export const listCollectionsQuery = z.object({
  sourceId: z
    .string()
    .regex(/^\d{1,20}$/, 'Invalid image id.')
    .optional(),
});

export type CreateCollectionBody = z.infer<typeof createCollectionBody>;
export type ListCollectionsQuery = z.infer<typeof listCollectionsQuery>;

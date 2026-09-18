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

const visibilityField = z.enum(['private', 'public'], { error: 'Choose public or private.' });

export const createCollectionBody = z.object({
  name: nameField,
  description: descriptionField.default(''),
  visibility: visibilityField.default('private'),
});

export const updateCollectionBody = z
  .object({
    name: nameField.optional(),
    description: descriptionField.optional(),
    visibility: visibilityField.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Nothing to update.',
  });

export const listCollectionsQuery = z.object({
  sourceId: z
    .string()
    .regex(/^\d{1,20}$/, 'Invalid image id.')
    .optional(),
});

// Paging for board recommendations (Pixabay exposes 500 results: 25 pages of 20).
export const pageQuery = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be 1 or more.')
    .max(25, 'No more ideas.')
    .default(1),
});
export type PageQuery = z.infer<typeof pageQuery>;

export type CreateCollectionBody = z.infer<typeof createCollectionBody>;
export type UpdateCollectionBody = z.infer<typeof updateCollectionBody>;
export type ListCollectionsQuery = z.infer<typeof listCollectionsQuery>;

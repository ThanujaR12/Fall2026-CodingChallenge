// Validation rules for profile edits and the saved-photos page number.
import { z } from 'zod';

export const updateProfileBody = z
  .object({
    displayName: z.string().trim().max(50, 'Names can be at most 50 characters.').optional(),
    bio: z.string().trim().max(160, 'Bios can be at most 160 characters.').optional(),
    avatarColor: z
      .string()
      .regex(/^(#[0-9A-Fa-f]{6})?$/, 'Pick a colour like #2F6FD6.')
      .transform((v) => v.toUpperCase())
      .optional(),
  })
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: 'Nothing to update.',
  });

export const savedQuery = z.object({
  page: z.coerce.number().int().min(1, 'Page must be 1 or more.').default(1),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBody>;
export type SavedQuery = z.infer<typeof savedQuery>;

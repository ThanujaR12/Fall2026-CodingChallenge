// Validation rules for inviting members and changing their roles.
import { z } from 'zod';
import { objectIdParam } from './common.js';

const roleField = z.enum(['editor', 'viewer'], { error: 'Role must be editor or viewer.' });

export const inviteBody = z.object({
  usernameOrEmail: z
    .string({ error: 'Enter a username or email.' })
    .trim()
    .min(1, 'Enter a username or email.')
    .max(254, 'That is too long.'),
  role: roleField,
});

export const changeRoleBody = z.object({ role: roleField });

export const memberParams = z.object({ id: objectIdParam, userId: objectIdParam });

export type InviteBody = z.infer<typeof inviteBody>;
export type ChangeRoleBody = z.infer<typeof changeRoleBody>;
export type MemberParams = z.infer<typeof memberParams>;

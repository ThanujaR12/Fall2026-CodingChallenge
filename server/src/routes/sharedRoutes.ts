// Public share-link route: GET /api/shared/:token (no sign-in needed).
import { Router } from 'express';
import { z } from 'zod';
import { getSharedView } from '../controllers/shareController.js';
import { validate } from '../middleware/validate.js';

const tokenParams = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{10,64}$/, 'Invalid share link.'),
});

export const sharedRoutes = Router();

sharedRoutes.get('/:token', validate({ params: tokenParams }), getSharedView);

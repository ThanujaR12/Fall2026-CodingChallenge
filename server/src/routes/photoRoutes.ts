// Photo routes: photo pages (no sign-in) and "Search with a photo" understanding (signed in).
import { Router } from 'express';
import {
  getPhoto,
  getSimilar,
  understandPhoto,
  visionStatus,
} from '../controllers/photoController.js';
import { perUserLimit } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { photoParams, similarQuery, understandBody } from '../schemas/photoSchemas.js';

export const photoRoutes = Router();

// Signed in only, and rate limited: each photo is a paid request to the vision model.
photoRoutes.get('/understand/status', visionStatus);
photoRoutes.post(
  '/understand',
  requireAuth,
  perUserLimit(20, 60_000),
  validate({ body: understandBody }),
  understandPhoto,
);

photoRoutes.get('/:sourceId', validate({ params: photoParams }), getPhoto);
photoRoutes.get(
  '/:sourceId/similar',
  validate({ params: photoParams, query: similarQuery }),
  getSimilar,
);

// Photo page routes (no sign-in needed): GET /api/photos/:sourceId and /:sourceId/similar.
import { Router } from 'express';
import { getPhoto, getSimilar } from '../controllers/photoController.js';
import { validate } from '../middleware/validate.js';
import { photoParams, similarQuery } from '../schemas/photoSchemas.js';

export const photoRoutes = Router();

photoRoutes.get('/:sourceId', validate({ params: photoParams }), getPhoto);
photoRoutes.get(
  '/:sourceId/similar',
  validate({ params: photoParams, query: similarQuery }),
  getSimilar,
);

// Home feed route: GET /api/feed.
import { Router } from 'express';
import { getFeed } from '../controllers/feedController.js';
import { validate } from '../middleware/validate.js';
import { feedQuery } from '../schemas/feedSchemas.js';

export const feedRoutes = Router();

feedRoutes.get('/', validate({ query: feedQuery }), getFeed);

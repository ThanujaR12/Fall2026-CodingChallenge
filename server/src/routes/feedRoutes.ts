// Home feed routes: GET /api/feed (topics, public) and GET /api/feed/for-you (signed in).
import { Router } from 'express';
import { getFeed, getForYou } from '../controllers/feedController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { feedQuery, forYouQuery } from '../schemas/feedSchemas.js';

export const feedRoutes = Router();

feedRoutes.get('/for-you', requireAuth, validate({ query: forYouQuery }), getForYou);
feedRoutes.get('/', validate({ query: feedQuery }), getFeed);

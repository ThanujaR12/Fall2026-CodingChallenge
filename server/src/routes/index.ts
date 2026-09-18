// Mounts every resource router under /api; collections require sign-in, the rest are public.
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authRoutes } from './authRoutes.js';
import { collectionRoutes } from './collectionRoutes.js';
import { feedRoutes } from './feedRoutes.js';
import { imageRoutes } from './imageRoutes.js';
import { searchRoutes } from './searchRoutes.js';
import { sharedRoutes } from './sharedRoutes.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

routes.use('/auth', authRoutes);
routes.use('/search', searchRoutes);
routes.use('/feed', feedRoutes);
routes.use('/collections', requireAuth, collectionRoutes);
// Share links and image bytes must work for signed-out visitors.
routes.use('/shared', sharedRoutes);
routes.use('/images', imageRoutes);

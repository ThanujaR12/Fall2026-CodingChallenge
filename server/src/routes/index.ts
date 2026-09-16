// Mounts every resource router under /api.
import { Router } from 'express';
import { collectionRoutes } from './collectionRoutes.js';
import { searchRoutes } from './searchRoutes.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

routes.use('/search', searchRoutes);
routes.use('/collections', collectionRoutes);

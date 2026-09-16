// Mounts every resource router under /api.
import { Router } from 'express';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

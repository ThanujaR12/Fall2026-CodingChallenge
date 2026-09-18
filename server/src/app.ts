// Builds the Express app: security headers, CORS, JSON parsing, routes, and error handling.
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { routes } from './routes/index.js';

export function createApp() {
  const app = express();

  // Saved images are served from this origin to the client origin, so allow cross-origin loading.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  // Photos sent to "Search with a photo" need room; every other body stays small.
  const photoJson = express.json({ limit: '4mb' });
  const smallJson = express.json({ limit: '100kb' });
  app.use((req, res, next) =>
    req.path === '/api/photos/understand' ? photoJson(req, res, next) : smallJson(req, res, next),
  );
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

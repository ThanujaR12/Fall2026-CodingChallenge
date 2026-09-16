// Turns any request that matched no route into a standard 404 error.
import type { Request } from 'express';
import { AppError } from '../utils/AppError.js';

export function notFound(req: Request): never {
  throw new AppError(404, 'ROUTE_NOT_FOUND', `No route for ${req.method} ${req.path}.`);
}

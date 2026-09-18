// A small per-user rate limit for costly endpoints (in memory; resets when the server restarts).
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

export function perUserLimit(maxRequests: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = String(req.userId);
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= maxRequests) {
      throw new AppError(429, 'TOO_MANY_REQUESTS', 'Slow down a little and try again in a minute.');
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

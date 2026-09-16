// Attaches the acting user to each request. Feature 2 replaces this with JWT verification.
import type { NextFunction, Request, Response } from 'express';
import { getStandInUserId } from '../services/userService.js';

export function currentUser(req: Request, _res: Response, next: NextFunction): void {
  req.userId = getStandInUserId();
  next();
}

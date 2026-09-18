// Lets a request through only with a valid session token, and records who is making it.
import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { verifyToken } from '../services/authService.js';
import { AppError } from '../utils/AppError.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');

  const userId = verifyToken(token);
  // A token for a deleted account is treated like an expired one.
  if (!Types.ObjectId.isValid(userId) || !(await User.exists({ _id: userId, isStandIn: false }))) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
  }

  req.userId = new Types.ObjectId(userId);
  next();
}

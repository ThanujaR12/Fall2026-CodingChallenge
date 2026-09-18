// Handles sign-up, sign-in, and "who am I" requests.
import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import type { LoginBody, RegisterBody } from '../schemas/authSchemas.js';
import * as authService from '../services/authService.js';
import { AppError } from '../utils/AppError.js';
import { toAuthUser } from '../utils/toDto.js';

export async function register(req: Request, res: Response) {
  const user = await authService.register(req.body as RegisterBody);
  res.status(201).json({ token: authService.signToken(String(user._id)), user: toAuthUser(user) });
}

export async function login(req: Request, res: Response) {
  const { usernameOrEmail, password } = req.body as LoginBody;
  const user = await authService.login(usernameOrEmail, password);
  res.json({ token: authService.signToken(String(user._id)), user: toAuthUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
  res.json({ user: toAuthUser(user) });
}

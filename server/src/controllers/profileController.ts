// Handles your profile: read it, customise it, and list everything you've saved.
import type { Request, Response } from 'express';
import type { SavedQuery, UpdateProfileBody } from '../schemas/profileSchemas.js';
import * as profileService from '../services/profileService.js';
import { toProfileSaved, toProfileUser } from '../utils/toDto.js';

export async function getProfile(req: Request, res: Response) {
  const { user, stats, colorSignature } = await profileService.getProfile(req.userId);
  res.json({ profile: { user: toProfileUser(user), stats, colorSignature } });
}

export async function updateProfile(req: Request, res: Response) {
  const user = await profileService.updateProfile(req.userId, req.body as UpdateProfileBody);
  res.json({ user: toProfileUser(user) });
}

export async function listSaved(req: Request, res: Response) {
  const { page } = res.locals.query as SavedQuery;
  const { items, total, hasMore } = await profileService.listSaved(req.userId, page);
  res.json({
    items: items.map((item) => toProfileSaved(item)),
    page,
    perPage: profileService.SAVED_PAGE_SIZE,
    total,
    hasMore,
  });
}

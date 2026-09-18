// Handles the signed-in user's notifications: list with unread count, mark one or all as read.
import type { Request, Response } from 'express';
import type { IdParams } from '../schemas/common.js';
import * as notificationService from '../services/notificationService.js';
import { toNotification } from '../utils/toDto.js';

export async function listNotifications(req: Request, res: Response) {
  const { notifications, unreadCount } = await notificationService.listForUser(req.userId);
  res.json({ notifications: notifications.map(toNotification), unreadCount });
}

export async function markRead(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  await notificationService.markRead(req.userId, id);
  res.status(204).end();
}

export async function markAllRead(req: Request, res: Response) {
  await notificationService.markAllRead(req.userId);
  res.status(204).end();
}

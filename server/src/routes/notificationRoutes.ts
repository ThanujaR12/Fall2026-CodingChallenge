// Notification routes (signed in): GET /, POST /read-all, POST /:id/read.
import { Router } from 'express';
import * as notifications from '../controllers/notificationController.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../schemas/common.js';

export const notificationRoutes = Router();

notificationRoutes.get('/', notifications.listNotifications);
notificationRoutes.post('/read-all', notifications.markAllRead);
notificationRoutes.post('/:id/read', validate({ params: idParams }), notifications.markRead);

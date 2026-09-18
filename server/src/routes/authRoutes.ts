// Account routes: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me.
import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { loginBody, registerBody } from '../schemas/authSchemas.js';

export const authRoutes = Router();

authRoutes.post('/register', validate({ body: registerBody }), auth.register);
authRoutes.post('/login', validate({ body: loginBody }), auth.login);
authRoutes.get('/me', requireAuth, auth.me);

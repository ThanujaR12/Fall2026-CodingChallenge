// Account routes: register, login, Google sign-in, and GET /api/auth/me.
import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { googleBody, loginBody, registerBody } from '../schemas/authSchemas.js';

export const authRoutes = Router();

authRoutes.post('/register', validate({ body: registerBody }), auth.register);
authRoutes.post('/login', validate({ body: loginBody }), auth.login);
authRoutes.post('/google', validate({ body: googleBody }), auth.google);
authRoutes.get('/me', requireAuth, auth.me);

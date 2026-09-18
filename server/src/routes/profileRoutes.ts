// Profile routes (signed in): GET / and PATCH / for your profile, GET /saved for your saved photos.
import { Router } from 'express';
import * as profile from '../controllers/profileController.js';
import { validate } from '../middleware/validate.js';
import { savedQuery, updateProfileBody } from '../schemas/profileSchemas.js';

export const profileRoutes = Router();

profileRoutes.get('/', profile.getProfile);
profileRoutes.patch('/', validate({ body: updateProfileBody }), profile.updateProfile);
profileRoutes.get('/saved', validate({ query: savedQuery }), profile.listSaved);

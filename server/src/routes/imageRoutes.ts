// Image routes: GET /api/images/:id serves stored image bytes.
import { Router } from 'express';
import { getImage } from '../controllers/imageController.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../schemas/common.js';

export const imageRoutes = Router();

imageRoutes.get('/:id', validate({ params: idParams }), getImage);

// Search routes: GET /api/search/images.
import { Router } from 'express';
import { searchImages } from '../controllers/searchController.js';
import { validate } from '../middleware/validate.js';
import { searchQuery } from '../schemas/searchSchemas.js';

export const searchRoutes = Router();

searchRoutes.get('/images', validate({ query: searchQuery }), searchImages);

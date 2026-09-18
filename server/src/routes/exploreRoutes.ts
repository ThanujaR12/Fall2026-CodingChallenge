// Explore routes (no sign-in needed): GET /api/explore and GET /api/explore/:id.
import { Router } from 'express';
import { getPublicBoard, listPublicBoards } from '../controllers/exploreController.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../schemas/common.js';
import { exploreQuery } from '../schemas/exploreSchemas.js';

export const exploreRoutes = Router();

exploreRoutes.get('/', validate({ query: exploreQuery }), listPublicBoards);
exploreRoutes.get('/:id', validate({ params: idParams }), getPublicBoard);

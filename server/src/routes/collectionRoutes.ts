// Collection routes: /api/collections and the items nested under each collection.
import { Router } from 'express';
import * as collections from '../controllers/collectionController.js';
import * as items from '../controllers/itemController.js';
import { validate } from '../middleware/validate.js';
import {
  createCollectionBody,
  listCollectionsQuery,
  updateCollectionBody,
} from '../schemas/collectionSchemas.js';
import { idParams } from '../schemas/common.js';
import { itemParams, saveItemBody, updateItemBody } from '../schemas/itemSchemas.js';

export const collectionRoutes = Router();

collectionRoutes.get('/', validate({ query: listCollectionsQuery }), collections.listCollections);
collectionRoutes.post('/', validate({ body: createCollectionBody }), collections.createCollection);
collectionRoutes.get('/:id', validate({ params: idParams }), collections.getCollection);
collectionRoutes.patch(
  '/:id',
  validate({ params: idParams, body: updateCollectionBody }),
  collections.updateCollection,
);

collectionRoutes.post(
  '/:id/items',
  validate({ params: idParams, body: saveItemBody }),
  items.saveItem,
);
collectionRoutes.patch(
  '/:id/items/:itemId',
  validate({ params: itemParams, body: updateItemBody }),
  items.updateItem,
);

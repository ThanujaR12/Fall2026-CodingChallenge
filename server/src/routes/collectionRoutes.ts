// Collection routes (signed in): collections, their items, share link, and members.
import { Router } from 'express';
import * as collections from '../controllers/collectionController.js';
import * as items from '../controllers/itemController.js';
import * as members from '../controllers/memberController.js';
import * as share from '../controllers/shareController.js';
import { validate } from '../middleware/validate.js';
import {
  createCollectionBody,
  listCollectionsQuery,
  updateCollectionBody,
} from '../schemas/collectionSchemas.js';
import { idParams } from '../schemas/common.js';
import { itemParams, saveItemBody, updateItemBody } from '../schemas/itemSchemas.js';
import { changeRoleBody, inviteBody, memberParams } from '../schemas/memberSchemas.js';

export const collectionRoutes = Router();

collectionRoutes.get('/', validate({ query: listCollectionsQuery }), collections.listCollections);
collectionRoutes.post('/', validate({ body: createCollectionBody }), collections.createCollection);
collectionRoutes.get('/:id', validate({ params: idParams }), collections.getCollection);
collectionRoutes.get('/:id/activity', validate({ params: idParams }), collections.getActivity);
collectionRoutes.patch(
  '/:id',
  validate({ params: idParams, body: updateCollectionBody }),
  collections.updateCollection,
);
collectionRoutes.delete('/:id', validate({ params: idParams }), collections.deleteCollection);

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
collectionRoutes.delete('/:id/items/:itemId', validate({ params: itemParams }), items.removeItem);

collectionRoutes.post('/:id/share', validate({ params: idParams }), share.enableShare);
collectionRoutes.delete('/:id/share', validate({ params: idParams }), share.disableShare);

collectionRoutes.post(
  '/:id/members',
  validate({ params: idParams, body: inviteBody }),
  members.invite,
);
collectionRoutes.patch(
  '/:id/members/:userId',
  validate({ params: memberParams, body: changeRoleBody }),
  members.changeRole,
);
collectionRoutes.delete(
  '/:id/members/:userId',
  validate({ params: memberParams }),
  members.removeMember,
);

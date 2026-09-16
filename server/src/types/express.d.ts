// Adds the current user's id to Express requests (set by the currentUser middleware).
import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      userId: Types.ObjectId;
    }
  }
}

export {};

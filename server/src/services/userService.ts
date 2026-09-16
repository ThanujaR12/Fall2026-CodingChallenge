// Creates (once) and remembers the built-in stand-in user that owns everything in Feature 1.
import type { Types } from 'mongoose';
import { User } from '../models/User.js';

let standInUserId: Types.ObjectId | null = null;

export async function ensureStandInUser(): Promise<Types.ObjectId> {
  // Upsert keeps this idempotent across restarts: the same user is reused every time.
  const user = await User.findOneAndUpdate(
    { isStandIn: true },
    { $setOnInsert: { username: 'you', isStandIn: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  standInUserId = user._id;
  return user._id;
}

export function getStandInUserId(): Types.ObjectId {
  if (!standInUserId) {
    throw new Error('Stand-in user not initialized; call ensureStandInUser() at startup.');
  }
  return standInUserId;
}

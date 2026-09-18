// Board activity history: records each change once and lists a board's recent activity.
import type { Types } from 'mongoose';
import { Activity } from '../models/Activity.js';
import { resolveAccess } from './permissionService.js';

export const ACTIVITY_LIMIT = 30;

type ActivityInput = {
  collectionId: Types.ObjectId;
  actor: Types.ObjectId;
  type: 'item_added' | 'item_edited' | 'item_removed' | 'member_invited';
  itemTitle?: string;
  asset?: Types.ObjectId | null;
  target?: Types.ObjectId | null;
  role?: 'editor' | 'viewer' | null;
};

/** Records a change; like notifications, a failure here never blocks the change itself. */
export async function recordActivity(input: ActivityInput) {
  try {
    await Activity.create({
      ...input,
      asset: input.type === 'item_removed' ? null : (input.asset ?? null),
    });
  } catch (err) {
    console.error('Could not record activity:', err);
  }
}

type Populated = {
  actor: { _id: Types.ObjectId; username: string } | null;
  target: { _id: Types.ObjectId; username: string } | null;
};

/** Newest activity first, for anyone who can see the board. */
export async function listForCollection(userId: Types.ObjectId, collectionId: string) {
  const { collection } = await resolveAccess(userId, collectionId);
  return Activity.find({ collectionId: collection._id })
    .sort({ createdAt: -1, _id: -1 })
    .limit(ACTIVITY_LIMIT)
    .populate<Populated>([
      { path: 'actor', select: 'username' },
      { path: 'target', select: 'username' },
    ]);
}

export async function removeForCollection(collectionId: Types.ObjectId) {
  await Activity.deleteMany({ collectionId });
}

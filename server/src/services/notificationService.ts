// Activity notifications: tell a board's other members when items change, and invitees when added.
import type { Types } from 'mongoose';
import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

export const NOTIFICATION_LIMIT = 50;

type CollectionLike = {
  _id: Types.ObjectId;
  name: string;
  owner: Types.ObjectId;
  members: { user: Types.ObjectId }[];
};

type ItemEvent = {
  type: 'item_added' | 'item_edited' | 'item_removed';
  itemTitle: string;
  asset?: Types.ObjectId | null;
};

// A failed notification must never undo or block the change itself, so errors are only logged.
async function safely(work: () => Promise<unknown>) {
  try {
    await work();
  } catch (err) {
    console.error('Could not create notifications:', err);
  }
}

/** Notifies the owner and every member except the person who made the change. */
export function notifyItemChange(
  collection: CollectionLike,
  actorId: Types.ObjectId,
  event: ItemEvent,
) {
  const recipients = [collection.owner, ...collection.members.map((m) => m.user)].filter(
    (id) => !id.equals(actorId),
  );
  if (recipients.length === 0) return Promise.resolve();
  return safely(() =>
    Notification.insertMany(
      recipients.map((recipient) => ({
        recipient,
        actor: actorId,
        type: event.type,
        collectionId: collection._id,
        collectionName: collection.name,
        itemTitle: event.itemTitle,
        asset: event.type === 'item_removed' ? null : (event.asset ?? null),
      })),
    ),
  );
}

export function notifyInvite(
  collection: CollectionLike,
  actorId: Types.ObjectId,
  inviteeId: Types.ObjectId,
  role: 'editor' | 'viewer',
) {
  return safely(() =>
    Notification.create({
      recipient: inviteeId,
      actor: actorId,
      type: 'member_invited',
      collectionId: collection._id,
      collectionName: collection.name,
      role,
    }),
  );
}

export async function listForUser(userId: Types.ObjectId) {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(NOTIFICATION_LIMIT)
      .populate<{ actor: { _id: Types.ObjectId; username: string } | null }>('actor', 'username'),
    Notification.countDocuments({ recipient: userId, readAt: null }),
  ]);
  return { notifications, unreadCount };
}

export async function markRead(userId: Types.ObjectId, notificationId: string) {
  const result = await Notification.updateOne(
    { _id: notificationId, recipient: userId },
    { $set: { readAt: new Date() } },
  );
  // Someone else's notification looks exactly like a missing one.
  if (result.matchedCount === 0) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'That notification no longer exists.');
  }
}

export async function markAllRead(userId: Types.ObjectId) {
  await Notification.updateMany(
    { recipient: userId, readAt: null },
    { $set: { readAt: new Date() } },
  );
}

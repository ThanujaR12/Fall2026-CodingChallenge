// A notification for one person about something another member did (or an invite to a board).
import { Schema, model, type InferSchemaType } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'item_added',
  'item_edited',
  'item_removed',
  'member_invited',
] as const;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
    // Names are copied in so the notification still reads well after a rename or delete.
    collectionName: { type: String, required: true },
    itemTitle: { type: String, default: '' },
    // The photo's stored copy, for the thumbnail (none for removals: the copy may be gone).
    asset: { type: Schema.Types.ObjectId, ref: 'ImageAsset', default: null },
    // For invites: the role the person was given.
    role: { type: String, enum: ['editor', 'viewer', null], default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;
export const Notification = model('Notification', notificationSchema);

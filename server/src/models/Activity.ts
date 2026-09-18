// One entry in a board's activity history: who added, edited, or removed a photo, or invited someone.
import { Schema, model, type InferSchemaType } from 'mongoose';

export const ACTIVITY_TYPES = [
  'item_added',
  'item_edited',
  'item_removed',
  'member_invited',
] as const;

const activitySchema = new Schema(
  {
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    itemTitle: { type: String, default: '' },
    // Thumbnail for photo changes (none for removals: the stored copy may be gone).
    asset: { type: Schema.Types.ObjectId, ref: 'ImageAsset', default: null },
    // For invites: who was invited and as what.
    target: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, enum: ['editor', 'viewer', null], default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ collectionId: 1, createdAt: -1 });

export type ActivityDoc = InferSchemaType<typeof activitySchema>;
export const Activity = model('Activity', activitySchema);

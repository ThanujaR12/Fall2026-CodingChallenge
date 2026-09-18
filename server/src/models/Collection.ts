// Collection schema: a named group of saved images, its members, and its optional share link.
import { Schema, model, type InferSchemaType } from 'mongoose';

const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['editor', 'viewer'], required: true },
  },
  { _id: false },
);

const collectionSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 60 },
    // Lower-cased, trimmed name so "Kitchen" and "kitchen " count as the same name.
    nameKey: { type: String, required: true },
    description: { type: String, trim: true, maxlength: 280, default: '' },
    // Invited users; the owner is never listed here.
    members: { type: [memberSchema], default: [] },
    // Random token while the share link is on; null when it is off (the old link stops working).
    shareToken: { type: String, default: null },
    // Public boards are listed on Explore and viewable by anyone; private is the default.
    visibility: { type: String, enum: ['private', 'public'], default: 'private', index: true },
  },
  { timestamps: true },
);

collectionSchema.index({ owner: 1, nameKey: 1 }, { unique: true });
collectionSchema.index({ owner: 1, updatedAt: -1 });
collectionSchema.index({ 'members.user': 1 });
collectionSchema.index(
  { shareToken: 1 },
  { unique: true, partialFilterExpression: { shareToken: { $type: 'string' } } },
);

export type CollectionDoc = InferSchemaType<typeof collectionSchema>;
export type Role = 'owner' | 'editor' | 'viewer';
export const Collection = model('Collection', collectionSchema);

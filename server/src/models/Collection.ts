// Collection schema: a named group of saved images owned by one user.
import { Schema, model, type InferSchemaType } from 'mongoose';

const collectionSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 60 },
    // Lower-cased, trimmed name so "Kitchen" and "kitchen " count as the same name.
    nameKey: { type: String, required: true },
    description: { type: String, trim: true, maxlength: 280, default: '' },
  },
  { timestamps: true },
);

collectionSchema.index({ owner: 1, nameKey: 1 }, { unique: true });
collectionSchema.index({ owner: 1, updatedAt: -1 });

export type CollectionDoc = InferSchemaType<typeof collectionSchema>;
export const Collection = model('Collection', collectionSchema);

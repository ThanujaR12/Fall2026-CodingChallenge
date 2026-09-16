// SavedItem schema: one image saved into one collection, with its own title and note.
import { Schema, model, type InferSchemaType } from 'mongoose';

const savedItemSchema = new Schema(
  {
    // Named collectionId (not "collection") because Mongoose reserves "collection" on documents.
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['pixabay'], required: true },
    sourceId: { type: String, required: true },
    asset: { type: Schema.Types.ObjectId, ref: 'ImageAsset', required: true },
    width: { type: Number },
    height: { type: Number },
    // Copied from Pixabay at save time so the item still displays if the source changes.
    pageUrl: { type: String, default: '' },
    tags: { type: [String], default: [] },
    creatorName: { type: String, default: '' },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    note: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true },
);

savedItemSchema.index({ collectionId: 1, source: 1, sourceId: 1 }, { unique: true });
savedItemSchema.index({ collectionId: 1, createdAt: -1 });
savedItemSchema.index({ asset: 1 });

export type SavedItemDoc = InferSchemaType<typeof savedItemSchema>;
export const SavedItem = model('SavedItem', savedItemSchema);

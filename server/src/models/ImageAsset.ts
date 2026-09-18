// ImageAsset schema: our stored copy of a saved image, since Pixabay forbids permanent hotlinking.
import { Schema, model, type InferSchemaType } from 'mongoose';
import { MAX_IMAGE_BYTES } from '../config/limits.js';

const imageAssetSchema = new Schema(
  {
    source: { type: String, enum: ['pixabay'], required: true },
    sourceId: { type: String, required: true },
    // Excluded from queries by default so listing items never loads image bytes.
    data: { type: Buffer, required: true, select: false },
    contentType: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => value.startsWith('image/'),
        message: 'contentType must be an image type',
      },
    },
    byteLength: { type: Number, required: true, max: MAX_IMAGE_BYTES },
    width: { type: Number },
    height: { type: Number },
    // Dominant colors (hex, most common first), computed once when stored; absent on older copies.
    colors: { type: [String], default: undefined },
  },
  { timestamps: true },
);

imageAssetSchema.index({ source: 1, sourceId: 1 }, { unique: true });

export type ImageAssetDoc = InferSchemaType<typeof imageAssetSchema>;
export const ImageAsset = model('ImageAsset', imageAssetSchema);

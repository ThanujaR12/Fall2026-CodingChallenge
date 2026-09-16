// User schema. Feature 1 has only the built-in stand-in owner; Feature 2 adds email and password.
import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    // Marks the single built-in owner used until real accounts exist.
    isStandIn: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);

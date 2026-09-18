// User schema: an account with a unique username and email, plus the built-in stand-in owner.
import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    // Display casing is kept; uniqueness uses the lower-cased usernameKey.
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
    usernameKey: { type: String, required: true },
    // The stand-in has no email, so uniqueness only applies when one is set.
    email: { type: String, trim: true, lowercase: true },
    // Never returned by default; only login reads it explicitly. Absent for Google-only accounts.
    passwordHash: { type: String, select: false },
    // Google's stable id for the person, set when they use "Continue with Google".
    googleId: { type: String },
    // Marks the single built-in owner used before real accounts existed (Feature 1).
    isStandIn: { type: Boolean, default: false },
    // Profile, all optional: a friendlier name, a short bio, and the avatar's colour (hex).
    displayName: { type: String, trim: true, maxlength: 50, default: '' },
    bio: { type: String, trim: true, maxlength: 160, default: '' },
    avatarColor: { type: String, default: '' },
  },
  { timestamps: true },
);

userSchema.index({ usernameKey: 1 }, { unique: true });
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);

userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);

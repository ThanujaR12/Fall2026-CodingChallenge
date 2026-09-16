// Shared zod pieces: a MongoDB ObjectId string and the ":id" route parameter.
import mongoose from 'mongoose';
import { z } from 'zod';

export const objectIdParam = z
  .string()
  .refine((value) => mongoose.isValidObjectId(value), { message: 'Invalid id.' });

export const idParams = z.object({ id: objectIdParam });

export type IdParams = z.infer<typeof idParams>;

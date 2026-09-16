// The one place errors become HTTP responses, always shaped { error: { code, message } }.
import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

type ErrorBody = { error: { code: string; message: string; fields?: Record<string, string> } };

// Maps a MongoDB unique-index violation to the matching user-facing conflict.
function duplicateKeyError(err: { keyPattern?: Record<string, unknown> }): AppError {
  const keys = Object.keys(err.keyPattern ?? {});
  if (keys.includes('nameKey')) {
    return new AppError(
      409,
      'COLLECTION_NAME_TAKEN',
      'A collection with that name already exists.',
    );
  }
  if (keys.includes('collectionId') && keys.includes('sourceId')) {
    return new AppError(409, 'ITEM_ALREADY_SAVED', 'This image is already in that collection.');
  }
  return new AppError(409, 'CONFLICT', 'That already exists.');
}

// Express recognizes error handlers by their four parameters, so `next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let appError: AppError | null = null;

  if (err instanceof AppError) {
    appError = err;
  } else if (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  ) {
    appError = duplicateKeyError(err as { keyPattern?: Record<string, unknown> });
  } else if (
    err instanceof mongoose.Error.CastError ||
    err instanceof mongoose.Error.ValidationError
  ) {
    appError = new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid.');
  } else if (err instanceof SyntaxError && 'body' in err) {
    appError = new AppError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON.');
  }

  if (!appError) {
    // Unexpected: log details for the developer, show a generic message to the user.
    console.error(err);
    const body: ErrorBody = {
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
    };
    res.status(500).json(body);
    return;
  }

  const body: ErrorBody = { error: { code: appError.code, message: appError.message } };
  if (appError.fields) body.error.fields = appError.fields;
  res.status(appError.status).json(body);
}

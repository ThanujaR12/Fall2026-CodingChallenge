// Serves the stored copy of a saved image as raw bytes.
import type { Request, Response } from 'express';
import { ImageAsset } from '../models/ImageAsset.js';
import type { IdParams } from '../schemas/common.js';
import { AppError } from '../utils/AppError.js';

export async function getImage(_req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  const asset = await ImageAsset.findById(id).select('+data');
  if (!asset) throw new AppError(404, 'IMAGE_NOT_FOUND', "That image doesn't exist.");

  res.set({
    'Content-Type': asset.contentType,
    'Content-Length': String(asset.data.byteLength),
    // An asset's bytes never change, so browsers may cache it for a year.
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  res.send(asset.data);
}

// Cleans up stored image copies that no saved item uses any more.
import type { Types } from 'mongoose';
import { ImageAsset } from '../models/ImageAsset.js';
import { SavedItem } from '../models/SavedItem.js';

export async function removeOrphanAssets(assetIds: Types.ObjectId[]): Promise<void> {
  for (const assetId of assetIds) {
    // The same image can be saved in several collections; keep it while any item still uses it.
    const stillUsed = await SavedItem.exists({ asset: assetId });
    if (!stillUsed) await ImageAsset.deleteOne({ _id: assetId });
  }
}

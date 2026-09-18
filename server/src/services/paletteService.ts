// Palette Boards: dominant colors per stored image (computed once) and a merged palette per collection.
import type { Types } from 'mongoose';
import { Vibrant } from 'node-vibrant/node';
import { ImageAsset } from '../models/ImageAsset.js';
import { SavedItem } from '../models/SavedItem.js';

export const PALETTE_SIZE = 5;
// Older images saved before palettes existed get their colors filled in a few at a time.
const BACKFILL_PER_REQUEST = 24;

/** Up to five dominant colors of an image, most common first; [] if it can't be read. */
export async function extractColors(data: Buffer): Promise<string[]> {
  try {
    const palette = await Vibrant.from(data).getPalette();
    return Object.values(palette)
      .filter((swatch) => swatch && swatch.population > 0)
      .sort((a, b) => b!.population - a!.population)
      .slice(0, PALETTE_SIZE)
      .map((swatch) => swatch!.hex.toUpperCase());
  } catch {
    return [];
  }
}

function toRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * Merges image palettes into one: similar colors are grouped, each image's leading colors count
 * most, and the heaviest groups (averaged) win.
 */
export function mergePalettes(palettes: string[][], size = PALETTE_SIZE): string[] {
  const groups = new Map<string, { weight: number; sum: [number, number, number] }>();
  for (const palette of palettes) {
    palette.forEach((hex, rank) => {
      const rgb = toRgb(hex);
      const weight = PALETTE_SIZE - rank;
      const key = rgb.map((v) => v >> 5).join(',');
      const group = groups.get(key) ?? { weight: 0, sum: [0, 0, 0] };
      group.weight += weight;
      rgb.forEach((v, i) => (group.sum[i] += v * weight));
      groups.set(key, group);
    });
  }
  return [...groups.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, size)
    .map((group) => toHex(group.sum.map((v) => v / group.weight)));
}

// Fills in colors for stored images that don't have them yet (saved before palettes existed).
async function backfill(assetIds: Types.ObjectId[]): Promise<void> {
  const missing = await ImageAsset.find({ _id: { $in: assetIds }, colors: { $exists: false } })
    .select('+data')
    .limit(BACKFILL_PER_REQUEST);
  for (const asset of missing) {
    asset.set('colors', await extractColors(asset.data));
    await asset.save();
  }
}

/** The merged palette of each collection, keyed by collection id (empty collections get []). */
export async function palettesFor(collectionIds: Types.ObjectId[]): Promise<Map<string, string[]>> {
  const items = await SavedItem.find({ collectionId: { $in: collectionIds } })
    .select('collectionId asset')
    .lean();
  const assetIds = [...new Set(items.map((item) => String(item.asset)))].map(
    (id) => items.find((item) => String(item.asset) === id)!.asset,
  );
  await backfill(assetIds);

  const assets = await ImageAsset.find({ _id: { $in: assetIds } })
    .select('colors')
    .lean();
  const colorsOf = new Map(assets.map((asset) => [String(asset._id), asset.colors ?? []]));

  const byCollection = new Map<string, string[][]>();
  for (const item of items) {
    const key = String(item.collectionId);
    const list = byCollection.get(key) ?? [];
    list.push(colorsOf.get(String(item.asset)) ?? []);
    byCollection.set(key, list);
  }
  return new Map(
    collectionIds.map((id) => [String(id), mergePalettes(byCollection.get(String(id)) ?? [])]),
  );
}

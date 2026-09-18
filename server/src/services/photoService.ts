// A single Pixabay photo's page: its details and colours, and "More like this" by subject or colour.
import { nearestImageColor } from '../config/colors.js';
import { AppError } from '../utils/AppError.js';
import { splitTags } from '../utils/titleFromTags.js';
import { TtlCache } from '../utils/ttlCache.js';
import { extractColors } from './paletteService.js';
import * as pixabay from './pixabayService.js';
import { topTags } from './recommendationService.js';

const DAY_MS = 86_400_000;
// Colours are read from the small preview once per photo and remembered for a day.
const paletteCache = new TtlCache<string, string[]>(DAY_MS, 2000);

async function findPhoto(sourceId: string) {
  const hit = await pixabay.getImageById(sourceId);
  if (!hit) throw new AppError(404, 'IMAGE_NOT_FOUND', 'That image is no longer available.');
  return hit;
}

async function paletteOf(hit: pixabay.PixabayHit): Promise<string[]> {
  const key = String(hit.id);
  const cached = paletteCache.get(key);
  if (cached) return cached;
  let palette: string[] = [];
  try {
    const { data } = await pixabay.downloadImage(hit.previewURL);
    palette = await extractColors(data);
  } catch {
    // The page still works without colours; they are simply not shown.
  }
  paletteCache.set(key, palette);
  return palette;
}

export async function getPhoto(sourceId: string) {
  const hit = await findPhoto(sourceId);
  return { hit, palette: await paletteOf(hit) };
}

export type SimilarBy = 'subject' | 'color';

export async function similarPhotos(sourceId: string, by: SimilarBy, page: number) {
  const hit = await findPhoto(sourceId);
  const tags = topTags([splitTags(hit.tags)], 3);
  const palette = by === 'color' ? await paletteOf(hit) : [];
  const color = palette[0] ? nearestImageColor(palette[0]) : undefined;

  // By colour: the photo's main subject in its leading colour. By subject: its two main tags,
  // widening to one when that finds little.
  const attempts = by === 'color' ? [tags.slice(0, 1)] : [tags.slice(0, 2), tags.slice(0, 1)];
  for (const [index, terms] of attempts.entries()) {
    if (terms.length === 0) continue;
    const { hits, total } = await pixabay.searchImages(
      terms.join(' '),
      page,
      by === 'color' ? color : undefined,
    );
    if (total >= 20 || index === attempts.length - 1) {
      return {
        basedOn: terms,
        color: by === 'color' ? (color ?? null) : null,
        hits: hits.filter((h) => h.id !== hit.id),
        total,
        hasMore: page * pixabay.PER_PAGE < total,
      };
    }
  }
  return { basedOn: [] as string[], color: null, hits: [], total: 0, hasMore: false };
}

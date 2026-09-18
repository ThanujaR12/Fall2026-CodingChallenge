// "More ideas for this board": photos similar to what a board already holds, found by searching
// Pixabay for the board's most common photo tags (or its name while it is empty).
import type { Types } from 'mongoose';
import { SavedItem } from '../models/SavedItem.js';
import { resolveAccess } from './permissionService.js';
import * as pixabay from './pixabayService.js';

// Words that describe nothing on their own and would only blur the search.
const STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'of',
  'a',
  'an',
  'my',
  'our',
  'board',
  'ideas',
  'photos',
  'pictures',
  'inspo',
  'inspiration',
]);

// Tags Pixabay photographers add to almost everything; ranking by them would make every board's
// ideas look the same, so they are skipped (the board's specific tags win instead).
const GENERIC_TAGS = new Set([
  'nature',
  'landscape',
  'background',
  'beautiful',
  'beauty',
  'outdoors',
  'outdoor',
  'wallpaper',
  'photography',
  'photo',
  'image',
  'color',
  'colorful',
  'colors',
  'natural',
  'scenic',
  'scenery',
  'view',
]);

/** True for tags too common to say anything about someone's taste (e.g. "nature"). */
export function isGenericTag(tag: string): boolean {
  return GENERIC_TAGS.has(tag.trim().toLowerCase());
}

/** The board's most common tags, most frequent first (ties keep the newest photos' order). */
export function topTags(itemTags: string[][], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const tags of itemTags) {
    const cleaned = tags
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && !GENERIC_TAGS.has(t));
    for (const tag of new Set(cleaned)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

/** Search words from a board's name and description, for boards with no photos yet. */
export function wordsFrom(text: string, limit = 3): string[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return [...new Set(words)].slice(0, limit);
}

export async function recommendForCollection(
  userId: Types.ObjectId,
  collectionId: string,
  page: number,
) {
  const { collection } = await resolveAccess(userId, collectionId);
  const items = await SavedItem.find({ collectionId: collection._id })
    .sort({ createdAt: -1 })
    .select('tags sourceId')
    .lean();
  const saved = new Set(items.map((item) => item.sourceId));

  const tags = topTags(items.map((item) => item.tags));
  const fallback = wordsFrom(`${collection.name} ${collection.description ?? ''}`);
  const basis = tags.length > 0 ? tags : fallback;

  // Pixabay matches every word, so start specific (two terms) and widen if that finds little.
  const attempts = [basis.slice(0, 2), basis.slice(0, 1), fallback.slice(0, 1)].filter(
    (terms) => terms.length > 0,
  );
  for (const [index, terms] of attempts.entries()) {
    const { hits, total } = await pixabay.searchImages(terms.join(' '), page);
    const isLast = index === attempts.length - 1;
    if (total >= 20 || isLast) {
      return {
        basedOn: terms,
        hits: hits.filter((hit) => !saved.has(String(hit.id))),
        total,
        hasMore: page * pixabay.PER_PAGE < total,
      };
    }
  }
  // A board with neither photos nor a usable name: nothing specific to suggest.
  return { basedOn: [] as string[], hits: [], total: 0, hasMore: false };
}

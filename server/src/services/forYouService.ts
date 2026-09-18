// "For you": a home feed that learns from what you save. New people get a freshly shuffled mix of
// popular photos; once you save, the feed is built from your interests (the tags of photos you
// saved, recent saves counting most, plus your board names), with some popular discoveries mixed
// in, and never shows photos you already saved. A per-visit seed reshuffles it on every visit.
import type { Types } from 'mongoose';
import { Collection } from '../models/Collection.js';
import { SavedItem } from '../models/SavedItem.js';
import * as pixabay from './pixabayService.js';
import { isGenericTag, wordsFrom } from './recommendationService.js';

export const FOR_YOU_PAGE_LIMIT = 20;
const INTERESTS = 6;
const PER_PAGE = 30;

type Result = { hit: pixabay.PixabayHit; reason: string | null };

// A small deterministic random generator, so one visit's pages stay consistent while each visit
// (a new seed) gets a different feed.
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], random: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Your interests, strongest first: saved photos' tags (recent ones weigh more) and board names. */
export async function interestsFor(userId: Types.ObjectId): Promise<string[]> {
  const [items, boards] = await Promise.all([
    SavedItem.find({ addedBy: userId }).sort({ createdAt: -1 }).limit(200).select('tags').lean(),
    Collection.find({ owner: userId }).select('name').lean(),
  ]);
  const weights = new Map<string, number>();
  const add = (word: string, weight: number) => {
    const key = word.trim().toLowerCase();
    if (!key || isGenericTag(key)) return;
    weights.set(key, (weights.get(key) ?? 0) + weight);
  };
  items.forEach((item, index) => {
    // The 20 newest saves count triple, the next 20 double, then single.
    const weight = index < 20 ? 3 : index < 40 ? 2 : 1;
    new Set(item.tags).forEach((tag) => add(tag, weight));
  });
  for (const board of boards) wordsFrom(board.name, 2).forEach((word) => add(word, 2));
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, INTERESTS)
    .map(([word]) => word);
}

function interleave(lists: Result[][]): Result[] {
  const out: Result[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i += 1) for (const list of lists) if (list[i]) out.push(list[i]);
  return out;
}

export async function forYou(userId: Types.ObjectId, page: number, seed: string) {
  const random = seededRandom(`${seed}|${String(userId)}`);
  const interests = await interestsFor(userId);
  // Each visit starts every source at a different page, so the feed feels new every time.
  const offset = () => Math.floor(random() * 8);
  const popularPage = 1 + ((page - 1 + offset()) % 25);

  if (interests.length === 0) {
    const { hits } = await pixabay.browseImages('all', popularPage);
    return {
      personalized: false,
      interests,
      results: shuffle(hits, random).map((hit) => ({ hit, reason: null })),
      hasMore: page < FOR_YOU_PAGE_LIMIT,
    };
  }

  const saved = new Set(
    (await SavedItem.find({ addedBy: userId }).select('sourceId').lean()).map((i) => i.sourceId),
  );
  const perInterest = await Promise.all(
    interests.map(async (interest) => {
      const pageFor = 1 + ((page - 1 + offset()) % 10);
      const { hits } = await pixabay.searchImages(interest, pageFor).catch(() => ({ hits: [] }));
      return shuffle(hits, random)
        .slice(0, 8)
        .map((hit) => ({ hit, reason: `Because you save ${interest} photos` }));
    }),
  );
  const discovery = await pixabay
    .browseImages('all', popularPage)
    .then(({ hits }) =>
      shuffle(hits, random)
        .slice(0, 5)
        .map((hit) => ({ hit, reason: 'Popular right now' })),
    )
    .catch(() => [] as Result[]);

  const seen = new Set<string>();
  const results = interleave([...perInterest, discovery]).filter(({ hit }) => {
    const id = String(hit.id);
    if (saved.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return {
    personalized: true,
    interests,
    results: results.slice(0, PER_PAGE),
    hasMore: page < FOR_YOU_PAGE_LIMIT,
  };
}

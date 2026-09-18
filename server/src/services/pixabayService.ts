// Talks to the Pixabay API (server-side only, so the key stays secret) and caches responses 24 hours.
import { env } from '../config/env.js';
import type { ImageColor } from '../config/colors.js';
import { FEED_TOPICS, type FeedTopic } from '../config/feedTopics.js';
import { MAX_IMAGE_BYTES } from '../config/limits.js';
import { AppError } from '../utils/AppError.js';
import { TtlCache } from '../utils/ttlCache.js';

export const PER_PAGE = 20;
export const MAX_RESULTS = 500; // Pixabay never returns more than 500 hits per query.
const TIMEOUT_MS = 8000;
const DAY_MS = 86_400_000; // Pixabay requires caching API responses for 24 hours.
const API_URL = 'https://pixabay.com/api/';

export type PixabayHit = {
  id: number;
  pageURL: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  user: string;
};

type PixabayResponse = { total: number; totalHits: number; hits: PixabayHit[] };

const searchCache = new TtlCache<string, { hits: PixabayHit[]; total: number }>(DAY_MS, 500);
const hitCache = new TtlCache<string, PixabayHit>(DAY_MS, 5000);

function unavailable(): AppError {
  return new AppError(
    502,
    'IMAGE_SOURCE_UNAVAILABLE',
    "The image service didn't answer. Please try again.",
  );
}

// Fetch with a timeout; any network failure becomes the same friendly 502.
async function fetchWithTimeout(url: string): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw unavailable();
  }
}

// One cached page of safe-search photos for the given Pixabay filters.
async function fetchPage(
  cacheKey: string,
  filters: Record<string, string>,
  page: number,
): Promise<{ hits: PixabayHit[]; total: number }> {
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    key: env.PIXABAY_API_KEY,
    ...filters,
    page: String(page),
    per_page: String(PER_PAGE),
    safesearch: 'true',
    image_type: 'photo',
  });
  const res = await fetchWithTimeout(`${API_URL}?${params}`);
  if (!res.ok) throw unavailable();

  const body = (await res.json()) as PixabayResponse;
  for (const hit of body.hits) hitCache.set(String(hit.id), hit);

  const result = { hits: body.hits, total: Math.min(body.totalHits, MAX_RESULTS) };
  searchCache.set(cacheKey, result);
  return result;
}

// Adds Pixabay's color filter. Its "grayscale" filter alone lets many color photos through (in
// testing, 4–9 of every 20), but paired with the words "black and white" the results come back
// truly black and white (0 of 60), so grayscale always asks for both.
function withColor(filters: Record<string, string>, color?: ImageColor): Record<string, string> {
  if (!color) return filters;
  const next: Record<string, string> = { ...filters, colors: color };
  if (color === 'grayscale') next.q = [filters.q, 'black and white'].filter(Boolean).join(' ');
  return next;
}

export function searchImages(q: string, page: number, color?: ImageColor) {
  return fetchPage(`q:${q.toLowerCase()}|${color ?? ''}|${page}`, withColor({ q }, color), page);
}

/** Popular photos for a home-feed topic, no keyword needed, optionally in one color. */
export function browseImages(topic: FeedTopic, page: number, color?: ImageColor) {
  // Editor's choice is too small a pool once a color is applied, so "all" widens to popular.
  const base: Record<string, string> =
    color && topic === 'all' ? { order: 'popular' } : { ...FEED_TOPICS[topic] };
  return fetchPage(`feed:${topic}|${color ?? ''}|${page}`, withColor(base, color), page);
}

export async function getImageById(id: string): Promise<PixabayHit | null> {
  const cached = hitCache.get(id);
  if (cached) return cached;

  const params = new URLSearchParams({ key: env.PIXABAY_API_KEY, id });
  const res = await fetchWithTimeout(`${API_URL}?${params}`);
  // Pixabay answers 400 for an id that doesn't exist.
  if (res.status === 400) return null;
  if (!res.ok) throw unavailable();

  const body = (await res.json()) as PixabayResponse;
  const hit = body.hits[0];
  if (!hit) return null;
  hitCache.set(id, hit);
  return hit;
}

// Only Pixabay's own https hosts may be downloaded from, so the server never fetches arbitrary URLs.
function isPixabayUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === 'https:' && (hostname === 'pixabay.com' || hostname.endsWith('.pixabay.com'))
    );
  } catch {
    return false;
  }
}

export async function downloadImage(url: string): Promise<{ data: Buffer; contentType: string }> {
  if (!isPixabayUrl(url)) throw unavailable();

  const res = await fetchWithTimeout(url);
  const contentType = res.headers.get('content-type') ?? '';
  const declaredLength = Number(res.headers.get('content-length') ?? 0);
  if (!res.ok || !contentType.startsWith('image/') || declaredLength > MAX_IMAGE_BYTES) {
    throw unavailable();
  }

  const data = Buffer.from(await res.arrayBuffer());
  if (data.byteLength > MAX_IMAGE_BYTES) throw unavailable();
  return { data, contentType };
}

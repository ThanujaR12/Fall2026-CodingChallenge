// Talks to the Pixabay API (server-side only, so the key stays secret) and caches responses 24 hours.
import { env } from '../config/env.js';
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

export async function searchImages(
  q: string,
  page: number,
): Promise<{ hits: PixabayHit[]; total: number }> {
  const cacheKey = `${q.toLowerCase()}|${page}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    key: env.PIXABAY_API_KEY,
    q,
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

// Unit tests for the small helpers: tag-based titles and the expiring cache.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { splitTags, titleFromTags } from '../src/utils/titleFromTags.js';
import { TtlCache } from '../src/utils/ttlCache.js';

describe('titleFromTags', () => {
  it('uses the first two tags, capitalized', () => {
    expect(titleFromTags('mountain, lake, sky')).toBe('Mountain, lake');
  });

  it('falls back when there are no tags', () => {
    expect(titleFromTags('')).toBe('Untitled photo');
    expect(titleFromTags(' , ,')).toBe('Untitled photo');
  });

  it('splits and trims tags, dropping empties', () => {
    expect(splitTags(' fog,harbour , ,morning ')).toEqual(['fog', 'harbour', 'morning']);
    expect(splitTags('lighthouse, sea, Lighthouse')).toEqual(['lighthouse', 'sea']);
  });
});

describe('TtlCache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns values until they expire', () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string, number>(1000, 10);
    cache.set('a', 1);
    vi.advanceTimersByTime(999);
    expect(cache.get('a')).toBe(1);
    vi.advanceTimersByTime(1);
    expect(cache.get('a')).toBeUndefined();
  });

  it('evicts the oldest entry past maxSize', () => {
    const cache = new TtlCache<string, number>(60_000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });
});

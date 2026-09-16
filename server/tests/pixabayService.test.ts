// Tests the real Pixabay service (not the shared mock) with fetch stubbed: caching, errors, safety.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hits } from './fixtures/pixabay.js';

type Service = typeof import('../src/services/pixabayService.js');

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let service: Service;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  // Fresh module per test so the in-memory caches start empty.
  vi.resetModules();
  service = await vi.importActual<Service>('../src/services/pixabayService.js');
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchImages', () => {
  it('caps total at 500 and sends safe-search paging parameters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 9000, totalHits: 9000, hits }));

    const result = await service.searchImages('Fog', 1);

    expect(result.total).toBe(500);
    expect(result.hits).toHaveLength(3);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('safesearch=true');
    expect(url).toContain('per_page=20');
    expect(url).toContain('image_type=photo');
  });

  it('serves repeated searches from the 24 h cache, ignoring case', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 3, totalHits: 3, hits }));

    await service.searchImages('Fog', 1);
    await service.searchImages('fog', 1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('turns a 429 rate limit into IMAGE_SOURCE_UNAVAILABLE', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 429));
    await expect(service.searchImages('fog', 1)).rejects.toMatchObject({
      status: 502,
      code: 'IMAGE_SOURCE_UNAVAILABLE',
    });
  });

  it('turns a timeout into IMAGE_SOURCE_UNAVAILABLE without leaking the key', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'));
    const error = await service.searchImages('fog', 1).catch((e: Error) => e);
    expect(error).toMatchObject({ status: 502, code: 'IMAGE_SOURCE_UNAVAILABLE' });
    expect(String((error as Error).message)).not.toContain('test-pixabay-key');
  });
});

describe('getImageById', () => {
  it('reuses hits seen in a search without another request', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 3, totalHits: 3, hits }));
    await service.searchImages('fog', 1);

    const hit = await service.getImageById('102');

    expect(hit?.user).toBe('L. Marchetti');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null when Pixabay has no such image', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 0, totalHits: 0, hits: [] }));
    expect(await service.getImageById('999')).toBeNull();
  });

  it('returns null for the 400 Pixabay sends for unknown ids', async () => {
    fetchMock.mockResolvedValueOnce(new Response('[ERROR 400] id out of range', { status: 400 }));
    expect(await service.getImageById('999999999')).toBeNull();
  });
});

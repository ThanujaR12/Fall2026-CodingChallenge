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

describe('browseImages', () => {
  it('applies the topic filters without a keyword', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 50, totalHits: 50, hits }));

    await service.browseImages('architecture', 2);

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('category')).toBe('buildings');
    expect(url.searchParams.get('order')).toBe('popular');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('safesearch')).toBe('true');
    expect(url.searchParams.has('q')).toBe(false);
  });

  it('adds the color filter and widens "all" beyond editor\'s choice', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 50, totalHits: 50, hits }));

    await service.browseImages('all', 1, 'blue');

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('colors')).toBe('blue');
    expect(url.searchParams.has('editors_choice')).toBe(false);
  });

  it('asks for "black and white" with the grayscale filter so color photos stay out', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ total: 50, totalHits: 50, hits }));

    await service.browseImages('all', 1, 'grayscale');
    await service.searchImages('flowers', 1, 'grayscale');
    await service.browseImages('interiors', 1, 'grayscale');

    const [browse, search, topic] = fetchMock.mock.calls.map((call) => new URL(String(call[0])));
    expect(browse.searchParams.get('q')).toBe('black and white');
    expect(browse.searchParams.get('colors')).toBe('grayscale');
    expect(search.searchParams.get('q')).toBe('flowers black and white');
    expect(topic.searchParams.get('q')).toBe('interior design black and white');
  });

  it('caches each topic page separately from searches', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ total: 3, totalHits: 3, hits }));

    await service.browseImages('food', 1);
    await service.browseImages('food', 1);
    await service.searchImages('food', 1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
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

describe('downloadImage', () => {
  function imageResponse(contentType: string, bytes = 12, length?: number): Response {
    const headers: Record<string, string> = { 'Content-Type': contentType };
    if (length !== undefined) headers['Content-Length'] = String(length);
    return new Response(new Uint8Array(bytes), { status: 200, headers });
  }

  it('downloads an image from a Pixabay host', async () => {
    fetchMock.mockResolvedValueOnce(imageResponse('image/jpeg'));

    const result = await service.downloadImage('https://cdn.pixabay.com/photo/a.jpg');

    expect(result.contentType).toBe('image/jpeg');
    expect(result.data.byteLength).toBe(12);
  });

  it.each([
    ['plain http', 'http://cdn.pixabay.com/photo/a.jpg'],
    ['another host', 'https://evil.example.com/x.jpg'],
    ['a lookalike host', 'https://pixabay.com.evil.example/x.jpg'],
    ['not a URL', 'nonsense'],
  ])('refuses %s without making a request', async (_label, url) => {
    await expect(service.downloadImage(url)).rejects.toMatchObject({
      status: 502,
      code: 'IMAGE_SOURCE_UNAVAILABLE',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects responses that are not images', async () => {
    fetchMock.mockResolvedValueOnce(imageResponse('text/html'));
    await expect(service.downloadImage('https://pixabay.com/get/a.jpg')).rejects.toMatchObject({
      status: 502,
    });
  });

  it('rejects images over 5 MB by header or by actual size', async () => {
    fetchMock.mockResolvedValueOnce(imageResponse('image/jpeg', 12, 6 * 1024 * 1024));
    await expect(service.downloadImage('https://pixabay.com/get/a.jpg')).rejects.toMatchObject({
      status: 502,
    });

    fetchMock.mockResolvedValueOnce(imageResponse('image/jpeg', 5 * 1024 * 1024 + 1));
    await expect(service.downloadImage('https://pixabay.com/get/b.jpg')).rejects.toMatchObject({
      status: 502,
    });
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

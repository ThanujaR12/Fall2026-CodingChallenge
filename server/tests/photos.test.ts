// Photo pages: a photo with its colours, and "More like this" by subject or by colour.
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import * as pixabay from '../src/services/pixabayService.js';
import { hits } from './fixtures/pixabay.js';

const app = createApp();

describe('GET /api/photos/:sourceId', () => {
  it('returns the photo with a large version and its colours, without sign-in', async () => {
    const res = await request(app).get('/api/photos/101');

    expect(res.status).toBe(200);
    expect(res.body.photo).toMatchObject({ sourceId: '101', title: 'Lighthouse, coast' });
    expect(res.body.photo.largeUrl).toEqual(expect.any(String));
    expect(Array.isArray(res.body.palette)).toBe(true);
    expect(pixabay.downloadImage).toHaveBeenCalledWith(hits[0].previewURL);
  });

  it('answers 404 for a photo Pixabay no longer has', async () => {
    const res = await request(app).get('/api/photos/999999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('IMAGE_NOT_FOUND');
  });

  it('rejects an id that is not a Pixabay id', async () => {
    const res = await request(app).get('/api/photos/abc');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/photos/:sourceId/similar', () => {
  it("searches the photo's main tags and leaves the photo itself out", async () => {
    vi.mocked(pixabay.searchImages).mockResolvedValueOnce({ hits, total: 300 });

    const res = await request(app).get('/api/photos/101/similar');

    expect(res.status).toBe(200);
    expect(pixabay.searchImages).toHaveBeenCalledWith('lighthouse coast', 1, undefined);
    expect(res.body).toMatchObject({
      by: 'subject',
      basedOn: ['lighthouse', 'coast'],
      color: null,
    });
    expect(res.body.results.map((r: { sourceId: string }) => r.sourceId)).not.toContain('101');
  });

  it("matches the main subject in the photo's leading colour when asked", async () => {
    vi.mocked(pixabay.searchImages).mockResolvedValueOnce({ hits, total: 80 });

    const res = await request(app).get('/api/photos/101/similar?by=color');

    expect(res.status).toBe(200);
    expect(res.body.by).toBe('color');
    expect(res.body.basedOn).toEqual(['lighthouse']);
    const [, , color] = vi.mocked(pixabay.searchImages).mock.calls[0];
    expect(res.body.color).toBe(color ?? null);
  });

  it('rejects an unknown match type', async () => {
    const res = await request(app).get('/api/photos/101/similar?by=mood');
    expect(res.status).toBe(400);
  });
});

// Integration tests for GET /api/search/images with the Pixabay service mocked.
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import * as pixabay from '../src/services/pixabayService.js';
import { AppError } from '../src/utils/AppError.js';
import { hits } from './fixtures/pixabay.js';

const app = createApp();

describe('GET /api/search/images', () => {
  it('maps Pixabay hits to SearchResult objects with paging info', async () => {
    vi.mocked(pixabay.searchImages).mockResolvedValueOnce({ hits, total: 500 });

    const res = await request(app).get('/api/search/images?q=fog');

    expect(res.status).toBe(200);
    expect(pixabay.searchImages).toHaveBeenCalledWith('fog', 1);
    expect(res.body).toMatchObject({ page: 1, perPage: 20, total: 500, hasMore: true });
    expect(res.body.results[0]).toEqual({
      sourceId: '101',
      title: 'Lighthouse, coast',
      tags: ['lighthouse', 'coast', 'sea'],
      creatorName: 'Ines Okonkwo',
      pageUrl: 'https://pixabay.com/photos/example-101/',
      thumbnailUrl: 'https://pixabay.com/get/webformat-101.jpg',
      width: 640,
      height: 427,
    });
  });

  it('reports no more pages on the last page', async () => {
    vi.mocked(pixabay.searchImages).mockResolvedValueOnce({ hits, total: 43 });
    const res = await request(app).get('/api/search/images?q=fog&page=3');
    expect(res.body).toMatchObject({ page: 3, total: 43, hasMore: false });
  });

  it.each([
    ['missing q', '/api/search/images'],
    ['whitespace q', '/api/search/images?q=%20%20'],
    ['101-character q', `/api/search/images?q=${'a'.repeat(101)}`],
    ['page 0', '/api/search/images?q=fog&page=0'],
    ['page beyond 500 results', '/api/search/images?q=fog&page=26'],
  ])('rejects %s with VALIDATION_ERROR', async (_label, url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(pixabay.searchImages).not.toHaveBeenCalled();
  });

  it('passes through upstream failures as 502 with the standard shape', async () => {
    vi.mocked(pixabay.searchImages).mockRejectedValueOnce(
      new AppError(502, 'IMAGE_SOURCE_UNAVAILABLE', "The image service didn't answer."),
    );
    const res = await request(app).get('/api/search/images?q=fog');
    expect(res.status).toBe(502);
    expect(res.body).toEqual({
      error: { code: 'IMAGE_SOURCE_UNAVAILABLE', message: "The image service didn't answer." },
    });
  });
});

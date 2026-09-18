// Integration tests for GET /api/feed with the Pixabay service mocked.
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import * as pixabay from '../src/services/pixabayService.js';
import { hits } from './fixtures/pixabay.js';

const app = createApp();

describe('GET /api/feed', () => {
  it('serves the "all" topic by default in the search result shape', async () => {
    vi.mocked(pixabay.browseImages).mockResolvedValueOnce({ hits, total: 500 });

    const res = await request(app).get('/api/feed');

    expect(res.status).toBe(200);
    expect(pixabay.browseImages).toHaveBeenCalledWith('all', 1);
    expect(res.body).toMatchObject({
      topic: 'all',
      page: 1,
      perPage: 20,
      total: 500,
      hasMore: true,
    });
    expect(res.body.results[0]).toMatchObject({ sourceId: '101', width: 640, height: 427 });
  });

  it('passes the topic and page through', async () => {
    vi.mocked(pixabay.browseImages).mockResolvedValueOnce({ hits, total: 43 });

    const res = await request(app).get('/api/feed?topic=nature&page=3');

    expect(pixabay.browseImages).toHaveBeenCalledWith('nature', 3);
    expect(res.body).toMatchObject({ topic: 'nature', page: 3, hasMore: false });
  });

  it('needs no sign-in', async () => {
    const res = await request(app).get('/api/feed?topic=food');
    expect(res.status).toBe(200);
  });

  it.each([
    ['an unknown topic', '/api/feed?topic=nope'],
    ['page 0', '/api/feed?page=0'],
    ['a page beyond 500 results', '/api/feed?page=26'],
  ])('rejects %s with VALIDATION_ERROR', async (_label, url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(pixabay.browseImages).not.toHaveBeenCalled();
  });
});

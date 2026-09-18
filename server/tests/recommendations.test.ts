// "More ideas for this board": searches the board's most common tags, skips photos already saved.
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import * as pixabay from '../src/services/pixabayService.js';
import { topTags, wordsFrom } from '../src/services/recommendationService.js';
import { hits } from './fixtures/pixabay.js';
import { registerUser } from './helpers.js';

const app = createApp();

describe('topTags / wordsFrom', () => {
  it('ranks tags by how many photos share them', () => {
    expect(topTags([['sea', 'boat'], ['boat', 'harbor'], ['Boat', 'sea'], ['fog']])).toEqual([
      'boat',
      'sea',
      'harbor',
    ]);
  });

  it('skips generic tags such as "nature" so ideas stay specific', () => {
    expect(
      topTags([
        ['nature', 'harbor'],
        ['nature', 'boat'],
        ['harbor', 'landscape'],
      ]),
    ).toEqual(['harbor', 'boat']);
  });

  it('turns a board name into search words, skipping filler', () => {
    expect(wordsFrom('My Coastal Mornings board ideas')).toEqual(['coastal', 'mornings']);
  });
});

describe('GET /api/collections/:id/recommendations', () => {
  it('searches the most common tags and leaves out photos already on the board', async () => {
    const { agent } = await registerUser(app);
    const created = await agent.post('/api/collections').send({ name: 'Coast' });
    const id = created.body.collection.id;
    await agent.post(`/api/collections/${id}/items`).send({ sourceId: '101' });
    vi.mocked(pixabay.searchImages).mockResolvedValue({ hits, total: 300 });

    const res = await agent.get(`/api/collections/${id}/recommendations`);

    expect(res.status).toBe(200);
    expect(pixabay.searchImages).toHaveBeenCalledWith('lighthouse coast', 1);
    expect(res.body.basedOn).toEqual(['lighthouse', 'coast']);
    expect(res.body.results.map((r: { sourceId: string }) => r.sourceId)).not.toContain('101');
    expect(res.body).toMatchObject({ page: 1, total: 300, hasMore: true });
  });

  it('widens to one tag when two find too little', async () => {
    const { agent } = await registerUser(app);
    const created = await agent.post('/api/collections').send({ name: 'Coast' });
    const id = created.body.collection.id;
    await agent.post(`/api/collections/${id}/items`).send({ sourceId: '101' });
    vi.mocked(pixabay.searchImages)
      .mockResolvedValueOnce({ hits: [], total: 3 })
      .mockResolvedValueOnce({ hits, total: 200 });

    const res = await agent.get(`/api/collections/${id}/recommendations`);

    expect(pixabay.searchImages).toHaveBeenLastCalledWith('lighthouse', 1);
    expect(res.body.basedOn).toEqual(['lighthouse']);
  });

  it('uses the board name while the board is empty', async () => {
    const { agent } = await registerUser(app);
    const created = await agent.post('/api/collections').send({ name: 'Misty harbor mornings' });
    vi.mocked(pixabay.searchImages).mockResolvedValue({ hits, total: 120 });

    const res = await agent.get(`/api/collections/${created.body.collection.id}/recommendations`);

    expect(pixabay.searchImages).toHaveBeenCalledWith('misty harbor', 1);
    expect(res.body.basedOn).toEqual(['misty', 'harbor']);
  });

  it('is hidden from people outside the board', async () => {
    const owner = await registerUser(app);
    const stranger = await registerUser(app);
    const created = await owner.agent.post('/api/collections').send({ name: 'Coast' });
    const res = await stranger.agent.get(
      `/api/collections/${created.body.collection.id}/recommendations`,
    );
    expect(res.status).toBe(404);
  });
});

// "For you": shuffled popular photos for new people, then a feed built from what they save.
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import * as pixabay from '../src/services/pixabayService.js';
import { interestsFor } from '../src/services/forYouService.js';
import { hits } from './fixtures/pixabay.js';
import { registerUser } from './helpers.js';

const app = createApp();

describe('GET /api/feed/for-you', () => {
  it('gives new people a shuffled mix of popular photos', async () => {
    const { agent } = await registerUser(app);

    const res = await agent.get('/api/feed/for-you?seed=visit1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ personalized: false, interests: [], page: 1, hasMore: true });
    expect(pixabay.browseImages).toHaveBeenCalled();
    expect(res.body.results.length).toBe(hits.length);
    expect(res.body.results[0].reason).toBeNull();
  });

  it('learns interests from saved photos and never shows what you already saved', async () => {
    const { agent, user } = await registerUser(app);
    const board = await agent.post('/api/collections').send({ name: 'Coast' });
    await agent
      .post(`/api/collections/${board.body.collection.id}/items`)
      .send({ sourceId: '101' });

    const res = await agent.get('/api/feed/for-you?seed=visit1');

    expect(res.body.personalized).toBe(true);
    // Saved photo 101 is tagged lighthouse, coast, sea; the board is called "Coast".
    expect(res.body.interests[0]).toBe('coast');
    expect(res.body.interests).toEqual(expect.arrayContaining(['lighthouse', 'sea']));
    const ids = res.body.results.map((r: { sourceId: string }) => r.sourceId);
    expect(ids).not.toContain('101');
    expect(res.body.results[0].reason).toMatch(/^Because you save .+ photos$|^Popular right now$/);
    expect(await interestsFor(new (await import('mongoose')).Types.ObjectId(user.id))).toEqual(
      res.body.interests,
    );
  });

  it('keeps one visit consistent and shuffles a new visit differently', async () => {
    const { agent } = await registerUser(app);
    const many = Array.from({ length: 12 }, (_, i) => ({ ...hits[0], id: 900 + i }));
    vi.mocked(pixabay.browseImages).mockResolvedValue({ hits: many, total: 500 });
    const order = async (seed: string) =>
      (await agent.get(`/api/feed/for-you?seed=${seed}`)).body.results.map(
        (r: { sourceId: string }) => r.sourceId,
      );

    expect(await order('same')).toEqual(await order('same'));
    expect(await order('visit-a')).not.toEqual(await order('visit-b'));
  });

  it('requires sign-in and a sensible seed', async () => {
    expect((await request(app).get('/api/feed/for-you')).status).toBe(401);
    const { agent } = await registerUser(app);
    expect((await agent.get('/api/feed/for-you?seed=bad%20seed!')).status).toBe(400);
  });
});

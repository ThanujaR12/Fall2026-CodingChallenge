// Your profile: stats, colour signature, customising it, and the list of everything you've saved.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { ImageAsset } from '../src/models/ImageAsset.js';
import { registerUser } from './helpers.js';

const app = createApp();

describe('GET /api/profile', () => {
  it('shows stats, collaborators, and a colour signature blended from your boards', async () => {
    const me = await registerUser(app);
    const friend = await registerUser(app);
    const board = await me.agent.post('/api/collections').send({ name: 'Coast' });
    const id = board.body.collection.id;
    await me.agent.post(`/api/collections/${id}/items`).send({ sourceId: '101' });
    await ImageAsset.updateOne({ sourceId: '101' }, { colors: ['#1E4FD8', '#F2F2F2'] });
    await me.agent
      .post(`/api/collections/${id}/members`)
      .send({ usernameOrEmail: friend.user.username, role: 'editor' });

    const res = await me.agent.get('/api/profile');

    expect(res.status).toBe(200);
    expect(res.body.profile.user).toMatchObject({
      username: me.user.username,
      bio: '',
      displayName: '',
    });
    expect(res.body.profile.stats).toEqual({
      boards: 1,
      sharedWithYou: 0,
      savedPhotos: 1,
      collaborators: 1,
    });
    expect(res.body.profile.colorSignature[0]).toBe('#1E4FD8');

    const theirs = await friend.agent.get('/api/profile');
    expect(theirs.body.profile.stats).toMatchObject({
      boards: 0,
      sharedWithYou: 1,
      collaborators: 1,
    });
  });

  it('requires sign-in', async () => {
    expect((await request(app).get('/api/profile')).status).toBe(401);
  });
});

describe('PATCH /api/profile', () => {
  it('saves a display name, bio, and avatar colour, and sign-in reflects them', async () => {
    const me = await registerUser(app);
    const res = await me.agent
      .patch('/api/profile')
      .send({ displayName: '  Thanuja R ', bio: 'Collecting coastlines.', avatarColor: '#2f6fd6' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      displayName: 'Thanuja R',
      bio: 'Collecting coastlines.',
      avatarColor: '#2F6FD6',
    });
    const meRes = await me.agent.get('/api/auth/me');
    expect(meRes.body.user).toMatchObject({ displayName: 'Thanuja R', avatarColor: '#2F6FD6' });
  });

  it.each([
    ['a too-long bio', { bio: 'x'.repeat(161) }],
    ['a colour that is not hex', { avatarColor: 'blue' }],
    ['an empty change', {}],
  ])('rejects %s', async (_label, body) => {
    const me = await registerUser(app);
    const res = await me.agent.patch('/api/profile').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/profile/saved', () => {
  it('lists what you saved across boards, newest first, with each board', async () => {
    const me = await registerUser(app);
    const a = await me.agent.post('/api/collections').send({ name: 'A' });
    const b = await me.agent.post('/api/collections').send({ name: 'B' });
    await me.agent.post(`/api/collections/${a.body.collection.id}/items`).send({ sourceId: '101' });
    await me.agent.post(`/api/collections/${b.body.collection.id}/items`).send({ sourceId: '102' });

    const res = await me.agent.get('/api/profile/saved');

    expect(res.status).toBe(200);
    expect(res.body.items.map((i: { board: { name: string } }) => i.board.name)).toEqual([
      'B',
      'A',
    ]);
    expect(res.body.items[0]).toMatchObject({ sourceId: '102', savedAt: expect.any(String) });
    expect(res.body).toMatchObject({ page: 1, total: 2, hasMore: false });
  });
});

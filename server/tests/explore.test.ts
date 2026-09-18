// Public/private boards and Explore: who can change visibility, what Explore lists, public views.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { ImageAsset } from '../src/models/ImageAsset.js';
import { registerUser } from './helpers.js';

const app = createApp();

async function boardWithImage(agent: ReturnType<typeof request.agent>, name: string) {
  const created = await agent.post('/api/collections').send({ name });
  const id = created.body.collection.id as string;
  await agent.post(`/api/collections/${id}/items`).send({ sourceId: '101' });
  return id;
}

describe('visibility', () => {
  it('starts private and only the owner can make a board public', async () => {
    const owner = await registerUser(app);
    const editor = await registerUser(app);
    const id = await boardWithImage(owner.agent, 'Coast');
    await owner.agent
      .post(`/api/collections/${id}/members`)
      .send({ usernameOrEmail: editor.user.username, role: 'editor' });

    const before = await owner.agent.get(`/api/collections/${id}`);
    expect(before.body.collection.visibility).toBe('private');

    const denied = await editor.agent
      .patch(`/api/collections/${id}`)
      .send({ visibility: 'public' });
    expect(denied.status).toBe(403);

    const res = await owner.agent.patch(`/api/collections/${id}`).send({ visibility: 'public' });
    expect(res.status).toBe(200);
    expect(res.body.collection.visibility).toBe('public');
  });

  it('can create a board as public from the start', async () => {
    const owner = await registerUser(app);
    const res = await owner.agent
      .post('/api/collections')
      .send({ name: 'Open from day one', visibility: 'public' });
    expect(res.status).toBe(201);
    expect(res.body.collection.visibility).toBe('public');
  });

  it('rejects an unknown visibility', async () => {
    const owner = await registerUser(app);
    const id = await boardWithImage(owner.agent, 'Coast');
    const res = await owner.agent.patch(`/api/collections/${id}`).send({ visibility: 'secret' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/explore', () => {
  it('lists public boards with images to anyone, and never private or empty ones', async () => {
    const owner = await registerUser(app);
    const publicId = await boardWithImage(owner.agent, 'Public one');
    await boardWithImage(owner.agent, 'Private one');
    const empty = await owner.agent.post('/api/collections').send({ name: 'Empty public' });
    await owner.agent.patch(`/api/collections/${publicId}`).send({ visibility: 'public' });
    await owner.agent
      .patch(`/api/collections/${empty.body.collection.id}`)
      .send({ visibility: 'public' });

    const res = await request(app).get('/api/explore');

    expect(res.status).toBe(200);
    expect(res.body.boards.map((b: { name: string }) => b.name)).toEqual(['Public one']);
    expect(res.body.boards[0]).toMatchObject({
      owner: { username: owner.user.username },
      itemCount: 1,
      visibility: 'public',
    });
    expect(res.body).toMatchObject({ page: 1, total: 1, hasMore: false });
  });

  it('filters by the color of a board palette', async () => {
    const owner = await registerUser(app);
    const id = await boardWithImage(owner.agent, 'Blue board');
    await owner.agent.patch(`/api/collections/${id}`).send({ visibility: 'public' });
    await ImageAsset.updateOne({ sourceId: '101' }, { colors: ['#1E4FD8', '#F2F2F2'] });

    const blue = await request(app).get('/api/explore?color=blue');
    const red = await request(app).get('/api/explore?color=red');

    expect(blue.body.boards).toHaveLength(1);
    expect(red.body.boards).toHaveLength(0);
  });

  it('rejects an unknown color', async () => {
    const res = await request(app).get('/api/explore?color=plaid');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/explore/:id', () => {
  it('shows a public board read-only to anyone', async () => {
    const owner = await registerUser(app);
    const id = await boardWithImage(owner.agent, 'Open');
    await owner.agent.patch(`/api/collections/${id}`).send({ visibility: 'public' });

    const res = await request(app).get(`/api/explore/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.collection).toMatchObject({
      name: 'Open',
      owner: { username: owner.user.username },
    });
    expect(res.body.collection.items).toHaveLength(1);
    expect(res.body.collection.members).toBeUndefined();
    expect(res.body.collection.shareToken).toBeUndefined();
  });

  it('hides private boards', async () => {
    const owner = await registerUser(app);
    const id = await boardWithImage(owner.agent, 'Closed');
    const res = await request(app).get(`/api/explore/${id}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOARD_NOT_PUBLIC');
  });
});

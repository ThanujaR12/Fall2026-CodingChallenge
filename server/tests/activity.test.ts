// Board activity history: every change recorded once, visible to anyone who can see the board.
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { registerUser } from './helpers.js';

const app = createApp();

async function newBoard(agent: Awaited<ReturnType<typeof registerUser>>['agent'], name = 'Coast') {
  const res = await agent.post('/api/collections').send({ name });
  return res.body.collection.id as string;
}

describe('GET /api/collections/:id/activity', () => {
  it('records each change once, newest first, even on a board with no members', async () => {
    const owner = await registerUser(app);
    const id = await newBoard(owner.agent);
    const saved = await owner.agent.post(`/api/collections/${id}/items`).send({ sourceId: '101' });
    const itemId = saved.body.item.id;
    await owner.agent.patch(`/api/collections/${id}/items/${itemId}`).send({ note: 'hi' });
    await owner.agent.delete(`/api/collections/${id}/items/${itemId}`);

    const res = await owner.agent.get(`/api/collections/${id}/activity`);

    expect(res.status).toBe(200);
    expect(res.body.activity.map((a: { type: string }) => a.type)).toEqual([
      'item_removed',
      'item_edited',
      'item_added',
    ]);
    expect(res.body.activity[2]).toMatchObject({
      actor: { username: owner.user.username },
      itemTitle: 'Lighthouse, coast',
      imageUrl: expect.stringMatching(/^\/api\/images\//),
    });
    expect(res.body.activity[0].imageUrl).toBeNull();
  });

  it('shows invites and one entry per change to every member', async () => {
    const owner = await registerUser(app);
    const viewer = await registerUser(app);
    const editor = await registerUser(app);
    const id = await newBoard(owner.agent);
    for (const [who, role] of [
      [viewer, 'viewer'],
      [editor, 'editor'],
    ] as const) {
      await owner.agent
        .post(`/api/collections/${id}/members`)
        .send({ usernameOrEmail: who.user.username, role });
    }
    await editor.agent.post(`/api/collections/${id}/items`).send({ sourceId: '101' });

    const res = await viewer.agent.get(`/api/collections/${id}/activity`);

    expect(res.status).toBe(200);
    expect(res.body.activity).toHaveLength(3);
    expect(res.body.activity[0]).toMatchObject({
      type: 'item_added',
      actor: { username: editor.user.username },
    });
    expect(res.body.activity[2]).toMatchObject({
      type: 'member_invited',
      target: { username: viewer.user.username },
      role: 'viewer',
    });
  });

  it('is hidden from people outside the board', async () => {
    const owner = await registerUser(app);
    const stranger = await registerUser(app);
    const id = await newBoard(owner.agent);
    const res = await stranger.agent.get(`/api/collections/${id}/activity`);
    expect(res.status).toBe(404);
  });

  it('is cleared when the board is deleted', async () => {
    const owner = await registerUser(app);
    const id = await newBoard(owner.agent);
    await owner.agent.post(`/api/collections/${id}/items`).send({ sourceId: '101' });
    await owner.agent.delete(`/api/collections/${id}`);
    const { Activity } = await import('../src/models/Activity.js');
    expect(await Activity.countDocuments()).toBe(0);
  });
});

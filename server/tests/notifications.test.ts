// Activity notifications: who gets told about item changes and invites, and marking them read.
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { registerUser } from './helpers.js';

const app = createApp();

type Session = Awaited<ReturnType<typeof registerUser>>;
let owner: Session;
let editor: Session;
let viewer: Session;
let boardId: string;

beforeEach(async () => {
  owner = await registerUser(app);
  editor = await registerUser(app);
  viewer = await registerUser(app);
  const created = await owner.agent.post('/api/collections').send({ name: 'Coast' });
  boardId = created.body.collection.id;
  await owner.agent
    .post(`/api/collections/${boardId}/members`)
    .send({ usernameOrEmail: editor.user.username, role: 'editor' });
  await owner.agent
    .post(`/api/collections/${boardId}/members`)
    .send({ usernameOrEmail: viewer.user.username, role: 'viewer' });
});

async function inbox(session: Session) {
  const res = await session.agent.get('/api/notifications');
  expect(res.status).toBe(200);
  return res.body as {
    notifications: { id: string; type: string; read: boolean; actor: { username: string } }[];
    unreadCount: number;
  };
}

describe('notifications', () => {
  it('tells invitees they were added, with their role', async () => {
    const { notifications, unreadCount } = await inbox(editor);
    expect(unreadCount).toBe(1);
    expect(notifications[0]).toMatchObject({
      type: 'member_invited',
      role: 'editor',
      actor: { username: owner.user.username },
      collection: { id: boardId, name: 'Coast' },
      read: false,
    });
  });

  it('tells every other member when an item is added, edited, or removed', async () => {
    const saved = await editor.agent
      .post(`/api/collections/${boardId}/items`)
      .send({ sourceId: '101' });
    const itemId = saved.body.item.id;
    await editor.agent.patch(`/api/collections/${boardId}/items/${itemId}`).send({ note: 'hi' });
    await editor.agent.delete(`/api/collections/${boardId}/items/${itemId}`);

    const ownerInbox = await inbox(owner);
    expect(ownerInbox.notifications.map((n) => n.type)).toEqual([
      'item_removed',
      'item_edited',
      'item_added',
    ]);
    expect(ownerInbox.notifications[2]).toMatchObject({
      actor: { username: editor.user.username },
      itemTitle: 'Lighthouse, coast',
      imageUrl: expect.stringMatching(/^\/api\/images\//),
    });
    expect(ownerInbox.notifications[0]).toMatchObject({ imageUrl: null });

    const viewerTypes = (await inbox(viewer)).notifications.map((n) => n.type);
    expect(viewerTypes).toContain('item_added');

    // The person who made the change is not notified about it.
    const editorTypes = (await inbox(editor)).notifications.map((n) => n.type);
    expect(editorTypes).toEqual(['member_invited']);
  });

  it('marks one or all as read', async () => {
    await owner.agent.post(`/api/collections/${boardId}/items`).send({ sourceId: '101' });
    const before = await inbox(viewer);
    expect(before.unreadCount).toBe(2);

    const one = await viewer.agent.post(`/api/notifications/${before.notifications[0].id}/read`);
    expect(one.status).toBe(204);
    expect((await inbox(viewer)).unreadCount).toBe(1);

    const all = await viewer.agent.post('/api/notifications/read-all');
    expect(all.status).toBe(204);
    const after = await inbox(viewer);
    expect(after.unreadCount).toBe(0);
    expect(after.notifications.every((n) => n.read)).toBe(true);
  });

  it("cannot mark someone else's notification", async () => {
    const theirs = (await inbox(editor)).notifications[0].id;
    const res = await viewer.agent.post(`/api/notifications/${theirs}/read`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
  });

  it('requires sign-in', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

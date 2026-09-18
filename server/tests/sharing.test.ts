// Tests for share links: on/off, the public read-only view, and new tokens on re-enable.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { registerUser } from './helpers.js';

const app = createApp();

async function ownerWithCollection() {
  const owner = await registerUser(app, { username: 'owner1' });
  const created = await owner.agent.post('/api/collections').send({ name: 'Coast trip' });
  const id = created.body.collection.id as string;
  await owner.agent.post(`/api/collections/${id}/items`).send({ sourceId: '101' });
  return { owner, id };
}

describe('share links', () => {
  it('shows a read-only view to anyone while the link is on', async () => {
    const { owner, id } = await ownerWithCollection();

    const on = await owner.agent.post(`/api/collections/${id}/share`);
    expect(on.status).toBe(200);
    expect(on.body.shareToken).toMatch(/^[A-Za-z0-9_-]{24}$/);

    const view = await request(app).get(`/api/shared/${on.body.shareToken}`);
    expect(view.status).toBe(200);
    expect(view.body.collection).toMatchObject({
      name: 'Coast trip',
      itemCount: 1,
      owner: { username: 'owner1' },
    });
    expect(view.body.collection.items[0].addedBy.username).toBe('owner1');
    expect(view.body.collection).not.toHaveProperty('members');
    expect(view.body.collection).not.toHaveProperty('shareToken');
  });

  it('stops the old link when turned off, and a re-enabled link is new', async () => {
    const { owner, id } = await ownerWithCollection();
    const first = (await owner.agent.post(`/api/collections/${id}/share`)).body.shareToken;

    const off = await owner.agent.delete(`/api/collections/${id}/share`);
    expect(off.status).toBe(204);
    const dead = await request(app).get(`/api/shared/${first}`);
    expect(dead.status).toBe(404);
    expect(dead.body.error.code).toBe('SHARE_LINK_INACTIVE');

    const second = (await owner.agent.post(`/api/collections/${id}/share`)).body.shareToken;
    expect(second).not.toBe(first);
    expect((await request(app).get(`/api/shared/${first}`)).status).toBe(404);
    expect((await request(app).get(`/api/shared/${second}`)).status).toBe(200);
  });

  it('shows the token to the owner only', async () => {
    const { owner, id } = await ownerWithCollection();
    const editor = await registerUser(app);
    await owner.agent
      .post(`/api/collections/${id}/members`)
      .send({ usernameOrEmail: editor.user.username, role: 'editor' });
    await owner.agent.post(`/api/collections/${id}/share`);

    const ownerView = await owner.agent.get(`/api/collections/${id}`);
    const editorView = await editor.agent.get(`/api/collections/${id}`);
    expect(ownerView.body.collection.shareToken).toEqual(expect.any(String));
    expect(editorView.body.collection.shareToken).toBeNull();
  });

  it('returns SHARE_LINK_INACTIVE for an unknown token', async () => {
    const res = await request(app).get('/api/shared/abcdefghijklmnopqrstuvwx');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('SHARE_LINK_INACTIVE');
  });
});

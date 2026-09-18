// Tests for inviting members, changing roles, removing members, and leaving.
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { registerUser } from './helpers.js';

const app = createApp();

async function setup() {
  const owner = await registerUser(app, { username: 'owner1' });
  const bob = await registerUser(app, { username: 'bob' });
  const cara = await registerUser(app, { username: 'cara' });
  const created = await owner.agent.post('/api/collections').send({ name: 'Shared board' });
  return { owner, bob, cara, id: created.body.collection.id as string };
}

describe('members', () => {
  it('invites by username or email and shows the collection as shared', async () => {
    const { owner, bob, cara, id } = await setup();

    const byName = await owner.agent
      .post(`/api/collections/${id}/members`)
      .send({ usernameOrEmail: 'BOB', role: 'editor' });
    expect(byName.status).toBe(201);

    const byEmail = await owner.agent
      .post(`/api/collections/${id}/members`)
      .send({ usernameOrEmail: 'Cara@Example.com', role: 'viewer' });
    expect(byEmail.body.members).toEqual([
      { user: { id: bob.user.id, username: 'bob' }, role: 'editor' },
      { user: { id: cara.user.id, username: 'cara' }, role: 'viewer' },
    ]);

    const bobList = await bob.agent.get('/api/collections');
    expect(bobList.body.collections).toEqual([]);
    expect(bobList.body.shared).toHaveLength(1);
    expect(bobList.body.shared[0]).toMatchObject({
      id,
      role: 'editor',
      owner: { username: 'owner1' },
    });
  });

  it('rejects unknown users, the owner, existing members, and bad roles', async () => {
    const { owner, id } = await setup();
    const invite = (usernameOrEmail: string, role = 'editor') =>
      owner.agent.post(`/api/collections/${id}/members`).send({ usernameOrEmail, role });

    expect((await invite('nobody')).body.error.code).toBe('USER_NOT_FOUND');
    expect((await invite('owner1')).body.error.code).toBe('CANNOT_INVITE_SELF');
    await invite('bob');
    const again = await invite('bob');
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('ALREADY_MEMBER');
    expect((await invite('cara', 'admin')).status).toBe(400);
  });

  it('changes roles and removes members', async () => {
    const { owner, bob, id } = await setup();
    await owner.agent
      .post(`/api/collections/${id}/members`)
      .send({ usernameOrEmail: 'bob', role: 'viewer' });

    const changed = await owner.agent
      .patch(`/api/collections/${id}/members/${bob.user.id}`)
      .send({ role: 'editor' });
    expect(changed.status).toBe(200);
    expect(changed.body.members[0].role).toBe('editor');

    const removed = await owner.agent.delete(`/api/collections/${id}/members/${bob.user.id}`);
    expect(removed.status).toBe(204);
    expect((await bob.agent.get(`/api/collections/${id}`)).status).toBe(404);
  });

  it('lets members leave, but not the owner', async () => {
    const { owner, bob, cara, id } = await setup();
    for (const [name, role] of [
      ['bob', 'editor'],
      ['cara', 'viewer'],
    ]) {
      await owner.agent
        .post(`/api/collections/${id}/members`)
        .send({ usernameOrEmail: name, role });
    }

    for (const member of [bob, cara]) {
      const left = await member.agent.delete(`/api/collections/${id}/members/${member.user.id}`);
      expect(left.status).toBe(204);
      expect((await member.agent.get('/api/collections')).body.shared).toEqual([]);
    }

    const ownerLeaves = await owner.agent.delete(`/api/collections/${id}/members/${owner.user.id}`);
    expect(ownerLeaves.status).toBe(400);
    expect(ownerLeaves.body.error.code).toBe('CANNOT_LEAVE_OWN_COLLECTION');
  });
});

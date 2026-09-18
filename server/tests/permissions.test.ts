// Checks every row of the permission table for owner, editor, viewer, and non-member (SC-003).
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { registerUser } from './helpers.js';

const app = createApp();

type Agent = Awaited<ReturnType<typeof registerUser>>['agent'];
type Actor = 'owner' | 'editor' | 'viewer' | 'outsider';

let agents: Record<Actor, Agent>;
let ids: Record<Actor, string>;
let collectionId: string;
let itemId: string;

beforeEach(async () => {
  const [owner, editor, viewer, outsider] = await Promise.all([
    registerUser(app, { username: 'p_owner' }),
    registerUser(app, { username: 'p_editor' }),
    registerUser(app, { username: 'p_viewer' }),
    registerUser(app, { username: 'p_outsider' }),
  ]);
  agents = {
    owner: owner.agent,
    editor: editor.agent,
    viewer: viewer.agent,
    outsider: outsider.agent,
  };
  ids = {
    owner: owner.user.id,
    editor: editor.user.id,
    viewer: viewer.user.id,
    outsider: outsider.user.id,
  };

  collectionId = (await owner.agent.post('/api/collections').send({ name: 'Board' })).body
    .collection.id;
  itemId = (
    await owner.agent.post(`/api/collections/${collectionId}/items`).send({ sourceId: '101' })
  ).body.item.id;
  await owner.agent
    .post(`/api/collections/${collectionId}/members`)
    .send({ usernameOrEmail: 'p_editor', role: 'editor' });
  await owner.agent
    .post(`/api/collections/${collectionId}/members`)
    .send({ usernameOrEmail: 'p_viewer', role: 'viewer' });
});

// Each action returns the status an allowed actor gets; others get 403 (members) or 404 (outsider).
const actions: {
  name: string;
  allowed: Actor[];
  okStatus: number;
  run: (agent: Agent, actor: Actor) => Promise<{ status: number }>;
}[] = [
  {
    name: 'view',
    allowed: ['owner', 'editor', 'viewer'],
    okStatus: 200,
    run: (a) => a.get(`/api/collections/${collectionId}`),
  },
  {
    name: 'save item',
    allowed: ['owner', 'editor'],
    okStatus: 201,
    run: (a) => a.post(`/api/collections/${collectionId}/items`).send({ sourceId: '102' }),
  },
  {
    name: 'edit item',
    allowed: ['owner', 'editor'],
    okStatus: 200,
    run: (a) => a.patch(`/api/collections/${collectionId}/items/${itemId}`).send({ note: 'hi' }),
  },
  {
    name: 'remove item',
    allowed: ['owner', 'editor'],
    okStatus: 204,
    run: (a) => a.delete(`/api/collections/${collectionId}/items/${itemId}`),
  },
  {
    name: 'edit description',
    allowed: ['owner', 'editor'],
    okStatus: 200,
    run: (a) => a.patch(`/api/collections/${collectionId}`).send({ description: 'new' }),
  },
  {
    name: 'rename',
    allowed: ['owner'],
    okStatus: 200,
    run: (a) => a.patch(`/api/collections/${collectionId}`).send({ name: 'Renamed' }),
  },
  {
    name: 'share on',
    allowed: ['owner'],
    okStatus: 200,
    run: (a) => a.post(`/api/collections/${collectionId}/share`),
  },
  {
    name: 'share off',
    allowed: ['owner'],
    okStatus: 204,
    run: (a) => a.delete(`/api/collections/${collectionId}/share`),
  },
  {
    name: 'invite',
    allowed: ['owner'],
    okStatus: 201,
    run: (a) =>
      a
        .post(`/api/collections/${collectionId}/members`)
        .send({ usernameOrEmail: 'p_outsider', role: 'viewer' }),
  },
  {
    name: 'change role',
    allowed: ['owner'],
    okStatus: 200,
    run: (a) =>
      a.patch(`/api/collections/${collectionId}/members/${ids.viewer}`).send({ role: 'editor' }),
  },
  {
    name: 'remove member',
    allowed: ['owner'],
    okStatus: 204,
    // Target someone other than the actor; removing yourself is "leave", tested separately.
    run: (a, actor) =>
      a.delete(
        `/api/collections/${collectionId}/members/${actor === 'viewer' ? ids.editor : ids.viewer}`,
      ),
  },
  {
    name: 'delete collection',
    allowed: ['owner'],
    okStatus: 204,
    run: (a) => a.delete(`/api/collections/${collectionId}`),
  },
];

const actors: Actor[] = ['owner', 'editor', 'viewer', 'outsider'];

describe('permission table', () => {
  for (const action of actions) {
    for (const actor of actors) {
      const allowed = action.allowed.includes(actor);
      const expected = allowed ? action.okStatus : actor === 'outsider' ? 404 : 403;
      it(`${actor} → ${action.name} → ${expected}`, async () => {
        const res = await action.run(agents[actor], actor);
        expect(res.status).toBe(expected);
      });
    }
  }

  it('lets editors and viewers leave', async () => {
    for (const actor of ['editor', 'viewer'] as const) {
      const res = await agents[actor].delete(
        `/api/collections/${collectionId}/members/${ids[actor]}`,
      );
      expect(res.status).toBe(204);
    }
  });

  it('keeps the latest of two quick edits to the same item', async () => {
    const url = `/api/collections/${collectionId}/items/${itemId}`;
    const first = await agents.owner.patch(url).send({ note: 'from owner' });
    const second = await agents.editor.patch(url).send({ note: 'from editor' });
    expect([first.status, second.status]).toEqual([200, 200]);
    const detail = await agents.viewer.get(`/api/collections/${collectionId}`);
    expect(detail.body.collection.items[0].note).toBe('from editor');
  });

  it('shows who added each item', async () => {
    await agents.editor.post(`/api/collections/${collectionId}/items`).send({ sourceId: '103' });
    const detail = await agents.viewer.get(`/api/collections/${collectionId}`);
    const byWho = detail.body.collection.items.map(
      (item: { addedBy: { username: string } }) => item.addedBy.username,
    );
    expect(byWho).toEqual(['p_editor', 'p_owner']);
  });
});

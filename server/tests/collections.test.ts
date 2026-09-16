// Integration tests for collection endpoints: create, list, detail, update, and delete.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Collection } from '../src/models/Collection.js';
import { getStandInUserId } from '../src/services/userService.js';

const app = createApp();

async function createCollection(name: string, description = '') {
  const res = await request(app).post('/api/collections').send({ name, description });
  expect(res.status).toBe(201);
  return res.body.collection as { id: string; name: string; updatedAt: string };
}

describe('POST /api/collections', () => {
  it('creates a collection with zero items and no cover', async () => {
    const res = await request(app)
      .post('/api/collections')
      .send({ name: 'Kitchen ideas', description: 'Warm wood and tile' });

    expect(res.status).toBe(201);
    expect(res.body.collection).toMatchObject({
      name: 'Kitchen ideas',
      description: 'Warm wood and tile',
      itemCount: 0,
      coverImageUrl: null,
      coverCreatorName: null,
      coverPageUrl: null,
    });
    expect(res.body.collection.id).toEqual(expect.any(String));
  });

  it('rejects a duplicate name regardless of case and surrounding spaces', async () => {
    await createCollection('Kitchen ideas');
    const res = await request(app).post('/api/collections').send({ name: ' kitchen IDEAS ' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('COLLECTION_NAME_TAKEN');
  });

  it.each([
    ['empty', ''],
    ['whitespace-only', '   '],
    ['61 characters', 'x'.repeat(61)],
  ])('rejects a %s name with a field message', async (_label, name) => {
    const res = await request(app).post('/api/collections').send({ name });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toEqual(expect.any(String));
  });

  it('rejects a 281-character description', async () => {
    const res = await request(app)
      .post('/api/collections')
      .send({ name: 'Too long', description: 'd'.repeat(281) });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.description).toEqual(expect.any(String));
  });
});

describe('GET /api/collections', () => {
  it('lists collections most recently updated first, all owned by the stand-in user', async () => {
    await createCollection('First');
    await new Promise((resolve) => setTimeout(resolve, 10));
    await createCollection('Second');

    const res = await request(app).get('/api/collections');

    expect(res.status).toBe(200);
    expect(res.body.collections.map((c: { name: string }) => c.name)).toEqual(['Second', 'First']);
    const owners = await Collection.distinct('owner');
    expect(owners.map(String)).toEqual([String(getStandInUserId())]);
  });
});

describe('collection covers and detail', () => {
  async function saveItem(collectionId: string, sourceId: string) {
    const res = await request(app)
      .post(`/api/collections/${collectionId}/items`)
      .send({ sourceId });
    expect(res.status).toBe(201);
    return res.body.item as { id: string; imageUrl: string };
  }

  it('uses the newest item as the cover, with its credit, and counts items', async () => {
    const { id } = await createCollection('Coast trip');
    const empty = await createCollection('Empty');
    await saveItem(id, '101');
    await new Promise((resolve) => setTimeout(resolve, 10));
    const newest = await saveItem(id, '102');

    const res = await request(app).get('/api/collections');
    const byId = Object.fromEntries(res.body.collections.map((c: { id: string }) => [c.id, c]));

    expect(byId[id]).toMatchObject({
      itemCount: 2,
      coverImageUrl: newest.imageUrl,
      coverCreatorName: 'L. Marchetti',
      coverPageUrl: 'https://pixabay.com/photos/example-102/',
    });
    expect(byId[empty.id]).toMatchObject({
      itemCount: 0,
      coverImageUrl: null,
      coverCreatorName: null,
      coverPageUrl: null,
    });
  });

  it('returns a collection with its items newest first', async () => {
    const { id } = await createCollection('Coast trip');
    await saveItem(id, '101');
    await new Promise((resolve) => setTimeout(resolve, 10));
    await saveItem(id, '102');

    const res = await request(app).get(`/api/collections/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.collection).toMatchObject({ id, name: 'Coast trip', itemCount: 2 });
    expect(res.body.collection.items.map((item: { sourceId: string }) => item.sourceId)).toEqual([
      '102',
      '101',
    ]);
  });

  it('returns 404 for an unknown collection and 400 for a malformed id', async () => {
    const missing = await request(app).get('/api/collections/66e8a1f2c3b4d5e6f7a8b9c0');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('COLLECTION_NOT_FOUND');

    const malformed = await request(app).get('/api/collections/nope');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/collections/:id', () => {
  it('renames a collection and bumps updatedAt', async () => {
    const created = await createCollection('Kitchen ideas');
    await new Promise((resolve) => setTimeout(resolve, 10));

    const res = await request(app)
      .patch(`/api/collections/${created.id}`)
      .send({ name: 'Kitchen', description: 'Only the good ones' });

    expect(res.status).toBe(200);
    expect(res.body.collection).toMatchObject({
      name: 'Kitchen',
      description: 'Only the good ones',
    });
    expect(new Date(res.body.collection.updatedAt).getTime()).toBeGreaterThan(
      new Date(created.updatedAt).getTime(),
    );
  });

  it('rejects renaming to the name of another collection in different case', async () => {
    await createCollection('Garden');
    const other = await createCollection('Kitchen');
    const res = await request(app).patch(`/api/collections/${other.id}`).send({ name: 'GARDEN' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('COLLECTION_NAME_TAKEN');
  });

  it('allows changing only the case of its own name', async () => {
    const created = await createCollection('kitchen');
    const res = await request(app)
      .patch(`/api/collections/${created.id}`)
      .send({ name: 'Kitchen' });
    expect(res.status).toBe(200);
    expect(res.body.collection.name).toBe('Kitchen');
  });

  it('rejects an empty update and an over-long description', async () => {
    const created = await createCollection('Kitchen');
    const empty = await request(app).patch(`/api/collections/${created.id}`).send({});
    expect(empty.status).toBe(400);

    const long = await request(app)
      .patch(`/api/collections/${created.id}`)
      .send({ description: 'd'.repeat(281) });
    expect(long.status).toBe(400);
    expect(long.body.error.fields.description).toEqual(expect.any(String));
  });
});

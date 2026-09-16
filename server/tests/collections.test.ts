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

// Integration tests for saved items: save, image serving, edit, and remove.
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { Collection } from '../src/models/Collection.js';
import { ImageAsset } from '../src/models/ImageAsset.js';
import { SavedItem } from '../src/models/SavedItem.js';
import * as pixabay from '../src/services/pixabayService.js';
import { AppError } from '../src/utils/AppError.js';

const app = createApp();

async function createCollection(name: string) {
  const res = await request(app).post('/api/collections').send({ name });
  expect(res.status).toBe(201);
  return res.body.collection.id as string;
}

async function saveItem(collectionId: string, sourceId: string) {
  return request(app).post(`/api/collections/${collectionId}/items`).send({ sourceId });
}

describe('POST /api/collections/:id/items', () => {
  it('saves an image with a tag-derived title and a stored image copy', async () => {
    const collectionId = await createCollection('Coast trip');

    const res = await saveItem(collectionId, '101');

    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({
      collectionId,
      sourceId: '101',
      title: 'Lighthouse, coast',
      note: '',
      tags: ['lighthouse', 'coast', 'sea'],
      creatorName: 'Ines Okonkwo',
      pageUrl: 'https://pixabay.com/photos/example-101/',
      width: 640,
      height: 427,
    });
    expect(res.body.item.imageUrl).toMatch(/^\/api\/images\/[a-f0-9]{24}$/);
    expect(await ImageAsset.countDocuments()).toBe(1);
    expect(pixabay.downloadImage).toHaveBeenCalledWith('https://pixabay.com/get/webformat-101.jpg');
  });

  it('prevents saving the same image twice to one collection', async () => {
    const collectionId = await createCollection('Coast trip');
    await saveItem(collectionId, '101');

    const res = await saveItem(collectionId, '101');

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ITEM_ALREADY_SAVED');
  });

  it('allows the same image in another collection and reuses the stored copy', async () => {
    const a = await createCollection('A');
    const b = await createCollection('B');
    await saveItem(a, '101');

    const res = await saveItem(b, '101');

    expect(res.status).toBe(201);
    expect(await ImageAsset.countDocuments()).toBe(1);
    expect(pixabay.downloadImage).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for an unknown collection and 400 for a malformed id', async () => {
    const missing = await saveItem('66e8a1f2c3b4d5e6f7a8b9c0', '101');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('COLLECTION_NOT_FOUND');

    const malformed = await saveItem('not-an-id', '101');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a non-numeric sourceId', async () => {
    const collectionId = await createCollection('Coast trip');
    const res = await saveItem(collectionId, 'abc');
    expect(res.status).toBe(400);
    expect(res.body.error.fields.sourceId).toEqual(expect.any(String));
  });

  it('returns IMAGE_NOT_FOUND when Pixabay no longer has the image', async () => {
    const collectionId = await createCollection('Coast trip');
    vi.mocked(pixabay.getImageById).mockResolvedValueOnce(null);
    const res = await saveItem(collectionId, '999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('IMAGE_NOT_FOUND');
  });

  it('creates nothing when Pixabay is unavailable', async () => {
    const collectionId = await createCollection('Coast trip');
    vi.mocked(pixabay.getImageById).mockRejectedValueOnce(
      new AppError(502, 'IMAGE_SOURCE_UNAVAILABLE', "The image service didn't answer."),
    );
    const res = await saveItem(collectionId, '101');
    expect(res.status).toBe(502);
    expect(await SavedItem.countDocuments()).toBe(0);
  });

  it('moves the collection to the top by bumping updatedAt', async () => {
    const collectionId = await createCollection('Coast trip');
    const before = (await Collection.findById(collectionId))!.updatedAt;
    await new Promise((resolve) => setTimeout(resolve, 10));

    await saveItem(collectionId, '101');

    const after = (await Collection.findById(collectionId))!.updatedAt;
    expect(after.getTime()).toBeGreaterThan(before.getTime());
  });
});

describe('GET /api/collections?sourceId=', () => {
  it('marks only the collections that already contain the image', async () => {
    const withImage = await createCollection('With image');
    const without = await createCollection('Without image');
    await saveItem(withImage, '101');

    const res = await request(app).get('/api/collections?sourceId=101');

    const marks = Object.fromEntries(
      res.body.collections.map((c: { id: string; containsImage: boolean }) => [
        c.id,
        c.containsImage,
      ]),
    );
    expect(marks).toEqual({ [withImage]: true, [without]: false });
  });
});

describe('GET /api/images/:id', () => {
  it('serves stored image bytes with long-lived cache headers', async () => {
    const collectionId = await createCollection('Coast trip');
    const saved = await saveItem(collectionId, '101');

    const res = await request(app).get(saved.body.item.imageUrl);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/jpeg');
    expect(res.headers['cache-control']).toContain('immutable');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  it('returns IMAGE_NOT_FOUND for an unknown image', async () => {
    const res = await request(app).get('/api/images/66e8a1f2c3b4d5e6f7a8b9c0');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('IMAGE_NOT_FOUND');
  });
});

async function savedItemIn(collectionName: string, sourceId = '101') {
  const collectionId = await createCollection(collectionName);
  const res = await saveItem(collectionId, sourceId);
  expect(res.status).toBe(201);
  return { collectionId, itemId: res.body.item.id as string };
}

describe('PATCH /api/collections/:id/items/:itemId', () => {
  it('updates the title and note', async () => {
    const { collectionId, itemId } = await savedItemIn('Coast trip');

    const res = await request(app)
      .patch(`/api/collections/${collectionId}/items/${itemId}`)
      .send({ title: 'Hallway light', note: 'for the hallway' });

    expect(res.status).toBe(200);
    expect(res.body.item).toMatchObject({ title: 'Hallway light', note: 'for the hallway' });
  });

  it('rejects a 501-character note and a 101-character title', async () => {
    const { collectionId, itemId } = await savedItemIn('Coast trip');
    const url = `/api/collections/${collectionId}/items/${itemId}`;

    const note = await request(app)
      .patch(url)
      .send({ note: 'n'.repeat(501) });
    expect(note.status).toBe(400);
    expect(note.body.error.code).toBe('VALIDATION_ERROR');
    expect(note.body.error.fields.note).toEqual(expect.any(String));

    const title = await request(app)
      .patch(url)
      .send({ title: 't'.repeat(101) });
    expect(title.status).toBe(400);
    expect(title.body.error.fields.title).toEqual(expect.any(String));
  });

  it('resets a blank title to the tag-derived default', async () => {
    const { collectionId, itemId } = await savedItemIn('Coast trip');
    const url = `/api/collections/${collectionId}/items/${itemId}`;
    await request(app).patch(url).send({ title: 'Custom' });

    const res = await request(app).patch(url).send({ title: '   ' });

    expect(res.status).toBe(200);
    expect(res.body.item.title).toBe('Lighthouse, coast');
  });

  it('returns ITEM_NOT_FOUND when the item belongs to another collection', async () => {
    const { itemId } = await savedItemIn('Coast trip');
    const otherCollection = await createCollection('Other');

    const res = await request(app)
      .patch(`/api/collections/${otherCollection}/items/${itemId}`)
      .send({ note: 'hi' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ITEM_NOT_FOUND');
  });

  it('rejects an empty update', async () => {
    const { collectionId, itemId } = await savedItemIn('Coast trip');
    const res = await request(app)
      .patch(`/api/collections/${collectionId}/items/${itemId}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// Palette Boards: color extraction, merging, and the palette on every collection summary.
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { ImageAsset } from '../src/models/ImageAsset.js';
import { SavedItem } from '../src/models/SavedItem.js';
import * as paletteService from '../src/services/paletteService.js';
import { createApp } from '../src/app.js';
import { registerUser } from './helpers.js';
import { tinyJpeg } from './fixtures/pixabay.js';

const { mergePalettes } = paletteService;
const app = createApp();

describe('mergePalettes', () => {
  it('keeps the colors that lead across images, most weighty first', () => {
    const merged = mergePalettes([['#FF0000', '#0000FF'], ['#FE0101', '#00FF00'], ['#FF0202']]);
    expect(merged[0]).toMatch(/^#F[EF]0[0-1]0[0-1]$/);
    expect(merged).toHaveLength(3);
  });

  it('returns at most five colors and nothing for no images', () => {
    const many = [
      ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'],
      ['#FFFF00', '#00FFFF'],
    ];
    expect(mergePalettes(many)).toHaveLength(5);
    expect(mergePalettes([])).toEqual([]);
  });
});

describe('extractColors', () => {
  it('reads colors from an image as uppercase hex', async () => {
    const colors = await paletteService.extractColors(tinyJpeg);
    expect(colors.length).toBeLessThanOrEqual(5);
    for (const color of colors) expect(color).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('returns no colors for bytes that are not an image', async () => {
    expect(await paletteService.extractColors(Buffer.from('not an image'))).toEqual([]);
  });
});

describe('collection palettes', () => {
  it('stores colors when an image is saved and shows the palette on the collection', async () => {
    const { agent } = await registerUser(app);
    const created = await agent.post('/api/collections').send({ name: 'Warm' });
    await agent
      .post(`/api/collections/${created.body.collection.id}/items`)
      .send({ sourceId: '101' });

    const asset = await ImageAsset.findOne({ sourceId: '101' });
    expect(Array.isArray(asset!.colors)).toBe(true);

    const list = await agent.get('/api/collections');
    const summary = list.body.collections[0];
    expect(summary.palette.length).toBeLessThanOrEqual(5);
    for (const color of summary.palette) expect(color).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('fills in colors for images saved before palettes existed', async () => {
    const { agent } = await registerUser(app);
    const created = await agent.post('/api/collections').send({ name: 'Old' });
    await agent
      .post(`/api/collections/${created.body.collection.id}/items`)
      .send({ sourceId: '101' });
    await ImageAsset.updateOne({ sourceId: '101' }, { $unset: { colors: 1 } });

    const res = await agent.get(`/api/collections/${created.body.collection.id}`);

    expect(res.status).toBe(200);
    expect((await ImageAsset.findOne({ sourceId: '101' }))!.colors).toBeDefined();
  });

  it('gives empty collections an empty palette', async () => {
    const { agent } = await registerUser(app);
    const created = await agent.post('/api/collections').send({ name: 'Empty' });
    expect(created.body.collection.palette).toEqual([]);
    const detail = await agent.get(`/api/collections/${created.body.collection.id}`);
    expect(detail.body.collection.palette).toEqual([]);
  });

  it('merges the colors of every image in the collection', async () => {
    const { agent } = await registerUser(app);
    const created = await agent.post('/api/collections').send({ name: 'Mixed' });
    await agent
      .post(`/api/collections/${created.body.collection.id}/items`)
      .send({ sourceId: '101' });
    await ImageAsset.updateOne({ sourceId: '101' }, { colors: ['#112233', '#AABBCC'] });
    const other = await ImageAsset.create({
      source: 'pixabay',
      sourceId: 'x-1',
      data: tinyJpeg,
      contentType: 'image/jpeg',
      byteLength: tinyJpeg.byteLength,
      colors: ['#112233'],
    });
    const { user } = await registerUser(app, { username: 'second' });
    await SavedItem.create({
      collectionId: new Types.ObjectId(created.body.collection.id),
      addedBy: new Types.ObjectId(user.id),
      source: 'pixabay',
      sourceId: 'x-1',
      asset: other._id,
      title: 'Other',
    });

    const detail = await agent.get(`/api/collections/${created.body.collection.id}`);

    expect(detail.body.collection.palette[0]).toBe('#112233');
    expect(detail.body.collection.palette).toContain('#AABBCC');
  });
});

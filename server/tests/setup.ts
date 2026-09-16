// Shared test setup: in-memory MongoDB per test file, the stand-in user, and a fake Pixabay service.
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { hits, tinyJpeg } from './fixtures/pixabay.js';

vi.mock('../src/services/pixabayService.js', () => ({
  searchImages: vi.fn(async () => ({ hits, total: hits.length })),
  getImageById: vi.fn(async (id: string) => hits.find((h) => String(h.id) === id) ?? null),
  downloadImage: vi.fn(async () => ({ data: tinyJpeg, contentType: 'image/jpeg' })),
}));

let mongo: MongoMemoryServer;

// MongoDB ships no Windows ARM64 build; Windows on ARM runs the x64 binary through emulation.
const binaryArch = process.platform === 'win32' && process.arch === 'arm64' ? 'x64' : undefined;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ binary: { arch: binaryArch } });
  await mongoose.connect(mongo.getUri());
  // Build unique indexes before tests rely on them for duplicate detection.
  const { Collection } = await import('../src/models/Collection.js');
  const { SavedItem } = await import('../src/models/SavedItem.js');
  const { ImageAsset } = await import('../src/models/ImageAsset.js');
  const { User } = await import('../src/models/User.js');
  await Promise.all([Collection.init(), SavedItem.init(), ImageAsset.init(), User.init()]);
  const { ensureStandInUser } = await import('../src/services/userService.js');
  await ensureStandInUser();
});

afterEach(async () => {
  vi.clearAllMocks();
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.entries(collections)
      .filter(([name]) => name !== 'users')
      .map(([, collection]) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

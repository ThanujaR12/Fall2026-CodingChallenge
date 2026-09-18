// "Search with a photo" with understanding switched on (Claude mocked, so no real requests).
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { registerUser } from './helpers.js';

vi.mock('../src/services/visionService.js', () => ({
  visionEnabled: () => true,
  understandPhoto: vi.fn(async () => ({
    description: 'A box of 12 Crayola chalk sticks held up in a classroom',
    subject: 'chalk box',
    brands: ['Crayola'],
    text: ['Crayola', 'Chalk', '12'],
    keywords: ['crayola chalk', 'chalk box', 'classroom chalkboard'],
  })),
}));

const app = createApp();

describe('POST /api/photos/understand (enabled)', () => {
  it('returns brands, printed words, and search keywords for the photo', async () => {
    const { agent } = await registerUser(app);
    const image = `data:image/png;base64,${Buffer.from('png bytes').toString('base64')}`;

    const res = await agent.post('/api/photos/understand').send({ image });

    expect(res.status).toBe(200);
    expect(res.body.understanding).toMatchObject({
      brands: ['Crayola'],
      keywords: ['crayola chalk', 'chalk box', 'classroom chalkboard'],
    });
    const { understandPhoto } = await import('../src/services/visionService.js');
    expect(understandPhoto).toHaveBeenCalledWith(
      Buffer.from('png bytes').toString('base64'),
      'image/png',
    );
  });
});

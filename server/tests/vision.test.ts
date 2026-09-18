// "Search with a photo" on the server: sign-in, input checks, and the no-key fallback signal.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { registerUser } from './helpers.js';

const app = createApp();
const tinyPhoto = `data:image/jpeg;base64,${Buffer.from('not really a jpeg').toString('base64')}`;

describe('POST /api/photos/understand', () => {
  it('requires sign-in', async () => {
    const res = await request(app).post('/api/photos/understand').send({ image: tinyPhoto });
    expect(res.status).toBe(401);
  });

  it('rejects anything that is not a JPEG, PNG, or WebP data URL', async () => {
    const { agent } = await registerUser(app);
    const res = await agent
      .post('/api/photos/understand')
      .send({ image: 'data:text/plain;base64,aGk=' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('says photo understanding is off when no API key is configured', async () => {
    const { agent } = await registerUser(app);
    const res = await agent.post('/api/photos/understand').send({ image: tinyPhoto });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('VISION_DISABLED');
  });

  it('accepts photos larger than ordinary request bodies', async () => {
    const { agent } = await registerUser(app);
    const big = `data:image/jpeg;base64,${Buffer.alloc(600_000, 1).toString('base64')}`;
    const res = await agent.post('/api/photos/understand').send({ image: big });
    expect(res.status).not.toBe(413);
  });

  it('reports whether understanding is available', async () => {
    const res = await request(app).get('/api/photos/understand/status');
    expect(res.body).toEqual({ enabled: false });
  });
});

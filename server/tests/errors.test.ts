// Checks the health endpoint and that unknown routes use the standard error shape.
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('error pipeline', () => {
  it('returns ok from /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns ROUTE_NOT_FOUND with exactly { error: { code, message } }', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(Object.keys(res.body)).toEqual(['error']);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(typeof res.body.error.message).toBe('string');
    expect(Object.keys(res.body.error).sort()).toEqual(['code', 'message']);
  });

  it('rejects malformed JSON bodies with VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

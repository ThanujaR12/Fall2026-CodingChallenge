// Test helpers: sign up a user and get a request agent that is already signed in.
import type { Express } from 'express';
import request from 'supertest';

let counter = 0;

export async function registerUser(app: Express, overrides: { username?: string } = {}) {
  counter += 1;
  const username = overrides.username ?? `user${counter}_${Date.now() % 100000}`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, email: `${username}@example.com`, password: 'password123' });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);

  const token = res.body.token as string;
  const agent = request.agent(app).set('Authorization', `Bearer ${token}`);
  return { agent, token, user: res.body.user as { id: string; username: string; email: string } };
}

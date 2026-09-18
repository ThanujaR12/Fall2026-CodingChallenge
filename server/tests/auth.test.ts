// Tests for sign-up, sign-in, sessions, and handing Feature 1 data to the first account.
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Collection } from '../src/models/Collection.js';
import { User } from '../src/models/User.js';
import { getStandInUserId } from '../src/services/userService.js';

const app = createApp();

function signUp(body: Record<string, string>) {
  return request(app).post('/api/auth/register').send(body);
}

const alice = { username: 'Alice_1', email: 'Alice@Example.com', password: 'password123' };

describe('POST /api/auth/register', () => {
  it('creates an account, signs it in, and never returns the password', async () => {
    const res = await signUp(alice);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: expect.any(String),
      username: 'Alice_1',
      email: 'alice@example.com',
    });
    expect(JSON.stringify(res.body)).not.toContain('password123');

    const stored = await User.findById(res.body.user.id).select('+passwordHash');
    expect(stored!.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(stored!.passwordHash).not.toBe('password123');
  });

  it('rejects duplicate usernames and emails regardless of case', async () => {
    await signUp(alice);

    const sameName = await signUp({ ...alice, username: 'ALICE_1', email: 'other@example.com' });
    expect(sameName.status).toBe(409);
    expect(sameName.body.error.code).toBe('USERNAME_TAKEN');

    const sameEmail = await signUp({ ...alice, username: 'someone', email: 'ALICE@example.COM' });
    expect(sameEmail.status).toBe(409);
    expect(sameEmail.body.error.code).toBe('EMAIL_TAKEN');
  });

  it.each([
    ['a 2-character username', { username: 'ab' }, 'username'],
    ['a 31-character username', { username: 'a'.repeat(31) }, 'username'],
    ['a username with spaces', { username: 'bad name' }, 'username'],
    ['an invalid email', { email: 'not-an-email' }, 'email'],
    ['a 7-character password', { password: 'short12' }, 'password'],
  ])('rejects %s with a field message', async (_label, change, field) => {
    const res = await signUp({ ...alice, ...change });
    expect(res.status).toBe(400);
    expect(res.body.error.fields[field]).toEqual(expect.any(String));
  });
});

describe('POST /api/auth/login and GET /api/auth/me', () => {
  it('signs in with username or email in any capitalization', async () => {
    await signUp(alice);

    for (const usernameOrEmail of ['alice_1', 'ALICE@EXAMPLE.COM']) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail, password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('Alice_1');
    }
  });

  it('gives the same generic error for a wrong password and an unknown user', async () => {
    await signUp(alice);

    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'alice_1', password: 'wrongpass1' });
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'nobody', password: 'password123' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns the signed-in user and rejects missing, invalid, or expired tokens', async () => {
    const { body } = await signUp(alice);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(body.user.id);

    const expired = jwt.sign({}, 'test-jwt-secret-at-least-16-chars', {
      subject: body.user.id,
      expiresIn: -1,
    });
    for (const header of [undefined, 'Bearer nonsense', `Bearer ${expired}`]) {
      const req = request(app).get('/api/auth/me');
      const res = header ? await req.set('Authorization', header) : await req;
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('requires sign-in for collections', async () => {
    const res = await request(app).get('/api/collections');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('Feature 1 data transfer', () => {
  it('gives stand-in collections to the first account only', async () => {
    const standIn = getStandInUserId();
    await Collection.create({ owner: standIn, name: 'Old board', nameKey: 'old board' });

    const first = await signUp(alice);
    const second = await signUp({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123',
    });

    const firstList = await request(app)
      .get('/api/collections')
      .set('Authorization', `Bearer ${first.body.token}`);
    const secondList = await request(app)
      .get('/api/collections')
      .set('Authorization', `Bearer ${second.body.token}`);

    expect(firstList.body.collections.map((c: { name: string }) => c.name)).toEqual(['Old board']);
    expect(secondList.body.collections).toEqual([]);
  });
});

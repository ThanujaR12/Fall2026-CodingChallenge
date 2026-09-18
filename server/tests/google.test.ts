// Tests for "Continue with Google" with Google's verification mocked out.
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { verifyGoogleCredential } from '../src/services/googleService.js';
import { AppError } from '../src/utils/AppError.js';

vi.mock('../src/services/googleService.js', () => ({ verifyGoogleCredential: vi.fn() }));

const app = createApp();
const credential = 'a-google-credential-long-enough';

function googleSignIn(mode: 'login' | 'signup' = 'signup') {
  return request(app).post('/api/auth/google').send({ credential, mode });
}

function asGoogleUser(googleId: string, email: string) {
  vi.mocked(verifyGoogleCredential).mockResolvedValue({ googleId, email, name: 'Test' });
}

beforeEach(() => {
  vi.mocked(verifyGoogleCredential).mockReset();
});

describe('POST /api/auth/google', () => {
  it('creates an account from the Google email and signs it in', async () => {
    asGoogleUser('g-1', 'thanuja.r@gmail.com');

    const res = await googleSignIn();

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ username: 'thanuja_r', email: 'thanuja.r@gmail.com' });
    const stored = await User.findOne({ googleId: 'g-1' }).select('+passwordHash');
    expect(stored!.passwordHash).toBeUndefined();
  });

  it('signs the same Google account into the same PixBoard account', async () => {
    asGoogleUser('g-1', 'thanuja.r@gmail.com');
    const first = await googleSignIn();
    const second = await googleSignIn();
    expect(second.body.user.id).toBe(first.body.user.id);
    expect(await User.countDocuments({ isStandIn: false })).toBe(1);
  });

  it('links to an existing password account with the same email', async () => {
    const registered = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'password123' });
    asGoogleUser('g-2', 'alice@example.com');

    const res = await googleSignIn();

    expect(res.body.user.id).toBe(registered.body.user.id);
    expect((await User.findById(registered.body.user.id))!.googleId).toBe('g-2');
  });

  it('adds a number when the username from the email is taken', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'sam', email: 'sam@work.com', password: 'password123' });
    asGoogleUser('g-3', 'sam@gmail.com');

    const res = await googleSignIn();

    expect(res.body.user.username).toBe('sam2');
  });

  it('rejects a credential Google does not confirm', async () => {
    vi.mocked(verifyGoogleCredential).mockRejectedValue(
      new AppError(401, 'GOOGLE_SIGN_IN_FAILED', "Google sign-in didn't work. Please try again."),
    );
    const res = await googleSignIn();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('GOOGLE_SIGN_IN_FAILED');
  });

  it('keeps password sign-in closed for Google-only accounts', async () => {
    asGoogleUser('g-4', 'google.only@gmail.com');
    await googleSignIn();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'google.only@gmail.com', password: 'anything123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('refuses to create an account from the Log in tab', async () => {
    asGoogleUser('g-5', 'new.person@gmail.com');

    const res = await googleSignIn('login');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    expect(await User.countDocuments({ email: 'new.person@gmail.com' })).toBe(0);
  });

  it('logs into an existing account from the Log in tab', async () => {
    asGoogleUser('g-6', 'returning@gmail.com');
    const created = await googleSignIn('signup');

    const res = await googleSignIn('login');

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(created.body.user.id);
  });

  it('requires a credential', async () => {
    const res = await request(app).post('/api/auth/google').send({});
    expect(res.status).toBe(400);
  });
});

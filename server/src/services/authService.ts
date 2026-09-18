// Accounts: password hashing, session tokens, sign-up (with Feature 1 data transfer), sign-in,
// and "Continue with Google".
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Collection } from '../models/Collection.js';
import { SavedItem } from '../models/SavedItem.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { verifyGoogleCredential } from './googleService.js';
import { getStandInUserId } from './userService.js';

const SESSION_LENGTH = '7d';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function signToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: SESSION_LENGTH });
}

// Returns the user id inside a valid token; any problem (bad, tampered, expired) means "sign in".
export function verifyToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'object' && typeof payload.sub === 'string') return payload.sub;
  } catch {
    // fall through
  }
  throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
}

type RegisterInput = { username: string; email: string; password: string };

export async function register(input: RegisterInput) {
  const usernameKey = input.username.toLowerCase();
  const email = input.email.toLowerCase();
  if (await User.exists({ usernameKey })) {
    throw new AppError(409, 'USERNAME_TAKEN', 'That username is already taken.', {
      username: 'That username is already taken.',
    });
  }
  if (await User.exists({ email })) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with that email already exists.', {
      email: 'An account with that email already exists.',
    });
  }

  return createAccount({
    username: input.username,
    usernameKey,
    email,
    passwordHash: await hashPassword(input.password),
  });
}

// Creates the user; the very first account also inherits Feature 1 (stand-in) data.
async function createAccount(fields: {
  username: string;
  usernameKey: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
}) {
  const isFirstAccount = !(await User.exists({ isStandIn: false }));
  const user = await User.create(fields);

  if (isFirstAccount) {
    const standIn = getStandInUserId();
    await Collection.updateMany({ owner: standIn }, { $set: { owner: user._id } });
    await SavedItem.updateMany({ addedBy: standIn }, { $set: { addedBy: user._id } });
  }
  return user;
}

// Builds a free username from an email, e.g. "thanuja.r@gmail.com" -> "thanuja_r" (or "thanuja_r2").
async function usernameFromEmail(email: string): Promise<string> {
  let base = email
    .split('@')[0]
    .replace(/[^A-Za-z0-9_]/g, '_')
    .slice(0, 25);
  if (base.length < 3) base = `${base}user`.slice(0, 25);
  let candidate = base;
  for (let n = 2; await User.exists({ usernameKey: candidate.toLowerCase() }); n += 1) {
    candidate = `${base}${n}`;
  }
  return candidate;
}

// "Continue with Google": the same person always reaches the same account. Logging in never
// creates an account; signing up creates one (or signs in if it already exists).
export async function loginWithGoogle(credential: string, mode: 'login' | 'signup') {
  const profile = await verifyGoogleCredential(credential);

  const byGoogleId = await User.findOne({ googleId: profile.googleId });
  if (byGoogleId) return byGoogleId;

  // Google has verified this email, so an existing account with it is theirs: link it.
  const byEmail = await User.findOne({ email: profile.email, isStandIn: false });
  if (byEmail) {
    byEmail.googleId = profile.googleId;
    await byEmail.save();
    return byEmail;
  }

  if (mode === 'login') {
    throw new AppError(
      404,
      'ACCOUNT_NOT_FOUND',
      'No PaletteBoard account uses this Google account yet. Create one to get started.',
    );
  }

  const username = await usernameFromEmail(profile.email);
  return createAccount({
    username,
    usernameKey: username.toLowerCase(),
    email: profile.email,
    googleId: profile.googleId,
  });
}

// Same error for an unknown user and a wrong password, so sign-in never reveals which accounts exist.
export async function login(usernameOrEmail: string, password: string) {
  const key = usernameOrEmail.trim().toLowerCase();
  const user = await User.findOne({
    isStandIn: false,
    $or: [{ usernameKey: key }, { email: key }],
  }).select('+passwordHash');

  const ok = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username/email or password.');
  }
  return user;
}

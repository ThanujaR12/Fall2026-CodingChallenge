// Validation rules for sign-up and sign-in.
import { z } from 'zod';

export const registerBody = z.object({
  username: z
    .string({ error: 'Choose a username.' })
    .trim()
    .min(3, 'Usernames need at least 3 characters.')
    .max(30, 'Usernames can be at most 30 characters.')
    .regex(/^[A-Za-z0-9_]+$/, 'Use only letters, numbers, and underscores.'),
  email: z
    .string({ error: 'Enter your email.' })
    .trim()
    .max(254, 'That email is too long.')
    .pipe(z.email('Enter a valid email address.')),
  password: z
    .string({ error: 'Choose a password.' })
    .min(8, 'Passwords need at least 8 characters.')
    .max(128, 'Passwords can be at most 128 characters.'),
});

export const loginBody = z.object({
  usernameOrEmail: z
    .string({ error: 'Enter your username or email.' })
    .trim()
    .min(1, 'Enter your username or email.'),
  password: z.string({ error: 'Enter your password.' }).min(1, 'Enter your password.'),
});

export const googleBody = z.object({
  credential: z
    .string({ error: 'Missing Google credential.' })
    .min(20, 'Missing Google credential.'),
  // "login" only reaches existing accounts; "signup" may create one.
  mode: z.enum(['login', 'signup']).default('login'),
});

export type GoogleBody = z.infer<typeof googleBody>;
export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;

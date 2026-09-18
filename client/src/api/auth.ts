// HTTP calls for accounts: sign up, log in (password or Google), and restore the signed-in user.
import type { AuthResponse, AuthUser } from '@/types/api';
import { request } from './client';

export function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
}

export function login(input: { usernameOrEmail: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
}

/** Trades Google's sign-in credential for a PixBoard session. */
export function loginWithGoogle(credential: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function me(): Promise<AuthUser> {
  const body = await request<{ user: AuthUser }>('/auth/me');
  return body.user;
}

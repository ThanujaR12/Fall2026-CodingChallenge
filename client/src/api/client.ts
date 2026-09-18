// The single fetch wrapper: JSON in/out, the sign-in token, and every failure turned into an ApiError.
import type { ApiErrorBody } from '@/types/api';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const TOKEN_KEY = 'pixboard.token';
// Remembers (even after logging out) that someone has signed in on this device before.
const RETURNING_KEY = 'pixboard.hasSignedIn';

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// Storage can be unavailable (private mode, blocked site data), so every access is guarded.
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(RETURNING_KEY, '1');
  } catch {
    // Signed in for this tab only.
  }
}

/** True once someone has signed in on this device, so the sign-in page can say "Welcome back". */
export function hasSignedInBefore(): boolean {
  try {
    return localStorage.getItem(RETURNING_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored.
  }
}

// Set by the auth provider: what to do when the server says the session is over.
let onUnauthenticated: (() => void) | null = null;
export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  onUnauthenticated = handler;
}

// The free API host sleeps when idle, so the first request after a quiet spell can take up to a
// minute. Requests slower than this count as "the server is waking up" and show a friendly note.
const SLOW_REQUEST_MS = 5000;
let slowRequests = 0;
const slowListeners = new Set<() => void>();

export function isServerSlow(): boolean {
  return slowRequests > 0;
}

export function subscribeServerSlow(listener: () => void): () => void {
  slowListeners.add(listener);
  return () => slowListeners.delete(listener);
}

function changeSlowRequests(delta: number) {
  const before = isServerSlow();
  slowRequests += delta;
  if (before !== isServerSlow()) slowListeners.forEach((listener) => listener());
}

/** Starts waking the API server as soon as the app opens, before the first real request. */
export function wakeServer(): void {
  void request('/health').catch(() => undefined);
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  let slow = false;
  const slowTimer = setTimeout(() => {
    slow = true;
    changeSlowRequests(1);
  }, SLOW_REQUEST_MS);
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      "Can't reach the server. Check your connection and try again.",
    );
  } finally {
    clearTimeout(slowTimer);
    if (slow) changeSlowRequests(-1);
  }

  if (res.status === 204) return undefined as T;

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    const apiError = new ApiError(
      res.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Something went wrong. Please try again.',
      error?.fields,
    );
    // An expired or missing session sends the user to sign in (login failures are shown inline).
    if (apiError.code === 'UNAUTHENTICATED' && token) {
      clearToken();
      onUnauthenticated?.();
    }
    throw apiError;
  }
  return body as T;
}

/** Turns an API image path like "/api/images/abc" into a full URL on the API server. */
export function assetUrl(path: string): string {
  return new URL(path, API_URL).toString();
}

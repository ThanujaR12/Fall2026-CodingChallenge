// The single fetch wrapper: JSON in/out, and every failure turned into an ApiError with a code.
import type { ApiErrorBody } from '@/types/api';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

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

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      "Can't reach the server. Check your connection and try again.",
    );
  }

  if (res.status === 204) return undefined as T;

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Something went wrong. Please try again.',
      error?.fields,
    );
  }
  return body as T;
}

/** Turns an API image path like "/api/images/abc" into a full URL on the API server. */
export function assetUrl(path: string): string {
  return new URL(path, API_URL).toString();
}

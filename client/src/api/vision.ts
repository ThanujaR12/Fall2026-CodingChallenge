// HTTP calls for "Search with a photo": whether the server can understand photos, and asking it to.
import type { PhotoUnderstanding } from '@/types/api';
import { request } from './client';

let status: Promise<boolean> | null = null;

/** Whether the server has photo understanding switched on (asked once per visit). */
export function visionEnabled(): Promise<boolean> {
  status ??= request<{ enabled: boolean }>('/photos/understand/status')
    .then((body) => body.enabled)
    .catch(() => false);
  return status;
}

export async function understandPhoto(image: string): Promise<PhotoUnderstanding> {
  const body = await request<{ understanding: PhotoUnderstanding }>('/photos/understand', {
    method: 'POST',
    body: JSON.stringify({ image }),
  });
  return body.understanding;
}

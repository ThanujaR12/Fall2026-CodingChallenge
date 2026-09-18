// HTTP calls for your profile: read it, customise it, and page through everything you've saved.
import type { Profile, ProfileSavedPage, ProfileUser } from '@/types/api';
import { request } from './client';

export async function getProfile(): Promise<Profile> {
  const body = await request<{ profile: Profile }>('/profile');
  return body.profile;
}

export async function updateProfile(
  changes: Partial<Pick<ProfileUser, 'displayName' | 'bio' | 'avatarColor'>>,
): Promise<ProfileUser> {
  const body = await request<{ user: ProfileUser }>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
  return body.user;
}

export function listSaved(page: number): Promise<ProfileSavedPage> {
  return request<ProfileSavedPage>(`/profile/saved?${new URLSearchParams({ page: String(page) })}`);
}

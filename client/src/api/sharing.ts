// HTTP calls for share links, the public shared view, and collection members.
import type { Member, MemberRole, SharedView } from '@/types/api';
import { request } from './client';

export async function enableShare(collectionId: string): Promise<string> {
  const body = await request<{ shareToken: string }>(`/collections/${collectionId}/share`, {
    method: 'POST',
  });
  return body.shareToken;
}

export function disableShare(collectionId: string): Promise<void> {
  return request<void>(`/collections/${collectionId}/share`, { method: 'DELETE' });
}

export async function getSharedView(token: string): Promise<SharedView> {
  const body = await request<{ collection: SharedView }>(`/shared/${token}`);
  return body.collection;
}

export async function inviteMember(
  collectionId: string,
  input: { usernameOrEmail: string; role: MemberRole },
): Promise<Member[]> {
  const body = await request<{ members: Member[] }>(`/collections/${collectionId}/members`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.members;
}

export async function changeMemberRole(
  collectionId: string,
  userId: string,
  role: MemberRole,
): Promise<Member[]> {
  const body = await request<{ members: Member[] }>(
    `/collections/${collectionId}/members/${userId}`,
    { method: 'PATCH', body: JSON.stringify({ role }) },
  );
  return body.members;
}

/** Removes a member (owner), or leaves the collection when userId is yourself. */
export function removeMember(collectionId: string, userId: string): Promise<void> {
  return request<void>(`/collections/${collectionId}/members/${userId}`, { method: 'DELETE' });
}

export function shareUrl(token: string): string {
  return `${window.location.origin}/s/${token}`;
}

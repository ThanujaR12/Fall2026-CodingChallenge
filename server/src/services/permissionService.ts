// Who may do what to a collection: one table mirroring the spec, checked on every request.
import type { Types } from 'mongoose';
import { Collection, type Role } from '../models/Collection.js';
import { AppError } from '../utils/AppError.js';

export type Action =
  | 'view'
  | 'editItems'
  | 'editDescription'
  | 'rename'
  | 'delete'
  | 'share'
  | 'manageMembers'
  | 'leave';

// The permission table from the spec (FR-019). Link visitors use the separate public view.
export const PERMISSIONS: Record<Action, Role[]> = {
  view: ['owner', 'editor', 'viewer'],
  editItems: ['owner', 'editor'],
  editDescription: ['owner', 'editor'],
  rename: ['owner'],
  delete: ['owner'],
  share: ['owner'],
  manageMembers: ['owner'],
  leave: ['editor', 'viewer'],
};

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[action].includes(role);
}

export function assertCan(role: Role, action: Action): void {
  if (!can(role, action)) {
    throw new AppError(403, 'FORBIDDEN', "You don't have permission to do that.");
  }
}

// Loads a collection with the user's role in it; people without access get "not found" (FR-020).
export async function resolveAccess(userId: Types.ObjectId, collectionId: string) {
  const collection = await Collection.findById(collectionId);
  const role = collection ? roleOf(userId, collection) : null;
  if (!collection || !role) {
    throw new AppError(404, 'COLLECTION_NOT_FOUND', "That collection doesn't exist.");
  }
  return { collection, role };
}

export function roleOf(
  userId: Types.ObjectId,
  collection: { owner: Types.ObjectId; members: { user: Types.ObjectId; role: string }[] },
): Role | null {
  if (collection.owner.equals(userId)) return 'owner';
  const member = collection.members.find((m) => m.user.equals(userId));
  return member ? (member.role as Role) : null;
}

// Collaborators: invite by username or email, change roles, remove members, or leave.
import type { Types } from 'mongoose';
import { Collection } from '../models/Collection.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { assertCan, resolveAccess } from './permissionService.js';
import { notifyInvite } from './notificationService.js';

type MemberRole = 'editor' | 'viewer';

async function membersWithUsers(collectionId: Types.ObjectId) {
  const collection = await Collection.findById(collectionId).populate<{
    members: { user: { _id: Types.ObjectId; username: string }; role: MemberRole }[];
  }>('members.user', 'username');
  return collection?.members ?? [];
}

export async function invite(
  userId: Types.ObjectId,
  collectionId: string,
  usernameOrEmail: string,
  role: MemberRole,
) {
  const { collection, role: myRole } = await resolveAccess(userId, collectionId);
  assertCan(myRole, 'manageMembers');

  const key = usernameOrEmail.trim().toLowerCase();
  const invitee = await User.findOne({
    isStandIn: false,
    $or: [{ usernameKey: key }, { email: key }],
  });
  if (!invitee) {
    throw new AppError(
      404,
      'USER_NOT_FOUND',
      `No user found with the username or email "${usernameOrEmail}".`,
    );
  }
  if (invitee._id.equals(collection.owner)) {
    throw new AppError(400, 'CANNOT_INVITE_SELF', 'You already own this collection.');
  }
  if (collection.members.some((m) => m.user.equals(invitee._id))) {
    throw new AppError(409, 'ALREADY_MEMBER', `${invitee.username} is already a member.`);
  }

  collection.members.push({ user: invitee._id, role });
  await collection.save();
  await notifyInvite(collection, userId, invitee._id, role);
  return membersWithUsers(collection._id);
}

export async function changeRole(
  userId: Types.ObjectId,
  collectionId: string,
  memberId: string,
  role: MemberRole,
) {
  const { collection, role: myRole } = await resolveAccess(userId, collectionId);
  assertCan(myRole, 'manageMembers');
  const member = collection.members.find((m) => m.user.equals(memberId));
  if (!member) throw new AppError(404, 'MEMBER_NOT_FOUND', "That person isn't a member.");
  member.role = role;
  await collection.save();
  return membersWithUsers(collection._id);
}

// The owner can remove anyone; members can only remove themselves (leave).
export async function removeMember(userId: Types.ObjectId, collectionId: string, memberId: string) {
  const { collection, role: myRole } = await resolveAccess(userId, collectionId);
  const removingSelf = userId.equals(memberId);

  if (removingSelf && myRole === 'owner') {
    throw new AppError(
      400,
      'CANNOT_LEAVE_OWN_COLLECTION',
      "Owners can delete a collection but can't leave it.",
    );
  }
  assertCan(myRole, removingSelf ? 'leave' : 'manageMembers');

  if (!collection.members.some((m) => m.user.equals(memberId))) {
    throw new AppError(404, 'MEMBER_NOT_FOUND', "That person isn't a member.");
  }
  collection.set(
    'members',
    collection.members.filter((m) => !m.user.equals(memberId)),
  );
  await collection.save();
}

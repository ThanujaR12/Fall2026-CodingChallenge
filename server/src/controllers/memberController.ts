// Handles inviting members, changing their roles, and removing them (or leaving).
import type { Request, Response } from 'express';
import type { IdParams } from '../schemas/common.js';
import type { ChangeRoleBody, InviteBody, MemberParams } from '../schemas/memberSchemas.js';
import * as memberService from '../services/memberService.js';
import { toMembers } from '../utils/toDto.js';

export async function invite(req: Request, res: Response) {
  const { id } = res.locals.params as IdParams;
  const { usernameOrEmail, role } = req.body as InviteBody;
  const members = await memberService.invite(req.userId, id, usernameOrEmail, role);
  res.status(201).json({ members: toMembers(members) });
}

export async function changeRole(req: Request, res: Response) {
  const { id, userId } = res.locals.params as MemberParams;
  const { role } = req.body as ChangeRoleBody;
  const members = await memberService.changeRole(req.userId, id, userId, role);
  res.json({ members: toMembers(members) });
}

export async function removeMember(req: Request, res: Response) {
  const { id, userId } = res.locals.params as MemberParams;
  await memberService.removeMember(req.userId, id, userId);
  res.status(204).end();
}

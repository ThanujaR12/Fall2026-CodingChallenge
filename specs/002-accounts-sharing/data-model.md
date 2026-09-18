# Data Model: Accounts, Sharing & Collaboration

**Feature**: [spec.md](./spec.md) | Changes relative to
[Feature 1 data model](../001-discover-collect/data-model.md). Unchanged entities are not repeated.

## User (extended)

| Field | Type | Rules | Spec |
|-------|------|-------|------|
| `username` | string | required; trimmed; 3–30 chars; `^[A-Za-z0-9_]+$`; display casing kept | FR-001 |
| `usernameKey` | string | `username.toLowerCase()`; unique | FR-002 |
| `email` | string | lower-cased, trimmed, valid email; unique (sparse: stand-in has none) | FR-001, FR-002 |
| `passwordHash` | string | bcrypt hash; `select: false`; absent for the stand-in | FR-007 |
| `isStandIn` | boolean | unchanged from Feature 1 | FR-009 |

Indexes: `{ usernameKey: 1 }` unique, `{ email: 1 }` unique sparse.

The stand-in keeps `username: "you"`; new usernames may not be `you` case-insensitively only if
already taken (the unique index handles it).

## Collection (extended)

| Field | Type | Rules | Spec |
|-------|------|-------|------|
| `members` | `[{ user: ObjectId → User, role: 'editor' \| 'viewer' }]` | no duplicates; never contains the owner | FR-014–FR-017 |
| `shareToken` | string \| null | 24 URL-safe random chars when sharing is on, `null` when off | FR-010, FR-011 |

Indexes: add `{ 'members.user': 1 }` (Shared with me) and `{ shareToken: 1 }` unique sparse.

**Lifecycle**
- Share on → new `shareToken`; share off → `null` (old link 404 immediately).
- Invite → push member; change role → update entry; remove / leave → pull entry.
- Delete (owner only) → as in Feature 1; members and token go with the document.

## SavedItem (unchanged fields)

`addedBy` now points to a real user and is returned as `{ id, username }` (FR-022).

## Derived access

`role(user, collection)` = `owner` if `collection.owner == user`, else the member's role, else none
(→ 404). Permission table: [spec FR-019](./spec.md).

## Validation summary

| Input | Rule | Error |
|-------|------|-------|
| register `username` | 3–30, letters/numbers/underscores | `VALIDATION_ERROR` |
| register `email` | valid email, ≤ 254 | `VALIDATION_ERROR` |
| register `password` | 8–128 chars | `VALIDATION_ERROR` |
| duplicate username / email | case-insensitive | `409 USERNAME_TAKEN` / `EMAIL_TAKEN` |
| login `usernameOrEmail`, `password` | non-empty | `VALIDATION_ERROR`; wrong → `401 INVALID_CREDENTIALS` |
| invite `usernameOrEmail` | 1–254 | unknown → `404 USER_NOT_FOUND` |
| invite / role `role` | `editor` \| `viewer` | `VALIDATION_ERROR` |

# Research: Accounts, Sharing & Collaboration

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-17

Decision → Rationale → Alternatives considered. Builds on
[Feature 1 research](../001-discover-collect/research.md).

## R1. Session mechanism

**Decision**: A signed JWT (`jsonwebtoken`, HS256, `JWT_SECRET`, 7-day expiry, payload `{ sub:
userId }`) returned by register/login, stored by the client in `localStorage`, and sent as
`Authorization: Bearer <token>`. `GET /api/auth/me` restores the user on reload.

**Rationale**: Matches the tech-stack input (bcrypt + JWT). Client (5173) and server (4000) are
different origins and may be deployed to different domains; a header token avoids cross-site cookie
(SameSite/Secure/CORS-credentials) setup that is easy to get wrong before the deadline. Easy to read
and test.

**Alternatives**: httpOnly cookie sessions (safer against XSS, but cross-site cookie config on
Vercel/Render adds risk); server-side session store (another collection and cleanup job).

**Trade-off noted**: a token in `localStorage` is readable by injected script; mitigated by React's
default escaping, no `dangerouslySetInnerHTML`, and `helmet` headers.

## R2. Password hashing

**Decision**: `bcryptjs` with cost 10; `passwordHash` field `select: false`; the password is never
logged (request logging only prints method, path, status).

**Rationale**: Constitution V requires bcrypt. `bcryptjs` is pure JavaScript, so it installs on
every OS including Windows on ARM (the native `bcrypt` package needs a compiler toolchain).

## R3. Stand-in data transfer (Feature 1 clarification Q1)

**Decision**: In `register`, if no non-stand-in user exists yet, move every collection owned by the
stand-in and every item `addedBy` the stand-in to the new user in the same request. The stand-in
user record stays (harmless) and later registrations skip the transfer.

**Rationale**: Implements FR-009 with two `updateMany` calls; no migration script.

## R4. Permission model

**Decision**: Collection gets `members: [{ user, role: 'editor' | 'viewer' }]`. One service function
`resolveAccess(userId, collectionId)` returns `{ collection, role: 'owner' | 'editor' | 'viewer' }`
or throws `404 COLLECTION_NOT_FOUND` for non-members (FR-020). A small table
`can(role, action)` mirrors the spec's permission table; disallowed → `403 FORBIDDEN` with
"You don't have permission to do that." (FR-019). Every collection/item/member/share controller goes
through it.

**Rationale**: One readable place for the rules, directly testable row by row (SC-003).

**Alternatives**: separate Membership collection (more joins, no benefit at this scale); per-route
ad-hoc checks (duplication, easy to miss one).

## R5. Share links

**Decision**: `shareToken: string | null` on Collection (unique sparse index). Enabling generates
`crypto.randomBytes(18).toString('base64url')` (24 URL-safe chars, 144 bits); disabling sets it to
`null`. Public route `GET /api/shared/:token`; client page `/s/:token` (design `06`).

**Rationale**: Unguessable (FR-011, NFR), instant revocation (SC-005), new token on re-enable
(US3/AC4).

## R6. Images stay public

**Decision**: `GET /api/images/:id` stays unauthenticated.

**Rationale**: `<img>` tags cannot send an `Authorization` header, and share-link visitors must see
images. Asset ids are random ObjectIds that are only revealed to people who can see the collection.
Documented as a known limitation in `server/API.md`.

## R7. Collections listing shape

**Decision**: `GET /api/collections` returns `{ collections: CollectionSummary[] (owned),
shared: SharedCollectionSummary[] }` where shared entries add `owner: { id, username }` and
`role`. `?sourceId=` keeps adding `containsImage` to both lists. The save picker shows owned +
shared-as-editor (FR-023).

## R8. Client auth flow

**Decision**: `AuthProvider` React context (token + user, `login`, `register`, `logout`), a
`RequireAuth` route wrapper that redirects to `/login?next=<path>`, and `api/client.ts` attaching
the token and, on any `401 UNAUTHENTICATED`, clearing it and redirecting to sign-in (FR-008,
US2/AC6). Login and register responses with 401 `INVALID_CREDENTIALS` are shown inline instead.

## R9. Testing

**Decision**: Existing tests switch from the stand-in middleware to real accounts through a helper
(`tests/helpers.ts`: `registerUser()` returning a Supertest agent with the `Authorization` header
set). New suites: `auth.test.ts`, `permissions.test.ts` (one case per permission-table row and role),
`sharing.test.ts`, `members.test.ts`.

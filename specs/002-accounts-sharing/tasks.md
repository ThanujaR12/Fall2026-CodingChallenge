---

description: "Task list for Feature 2 — Accounts, Sharing & Collaboration"
---

# Tasks: Accounts, Sharing & Collaboration

**Input**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md), [quickstart.md](./quickstart.md)

**Tests**: Server tests are required for auth and every permission-table row (Constitution VIII,
SC-003). Client verified with quickstart scenarios A1–A5.

## Rules that apply to every task

- One-line purpose comment on every new file; `AppError` + central `errorHandler` only.
- Every added or changed endpoint is documented in `server/API.md` in the same commit.
- `npm run lint` and `npm run format:check` pass in each touched project before each commit.
- Passwords are never logged or returned; `passwordHash` is `select: false`.

---

## Phase 1: Setup

- [X] T001 Install `jsonwebtoken bcryptjs` and dev `@types/jsonwebtoken @types/bcryptjs` in `server/package.json`
- [X] T002 Add `JWT_SECRET` (zod: string, min 16 chars, message "JWT_SECRET must be at least 16 characters") to `server/src/config/env.ts`, `server/.env.example` (with a comment and the generate command), `server/vitest.config.ts` test env, and the local `server/.env` (random 64-hex value)

**Checkpoint**: server starts; lint/format pass. Commit `chore: add auth dependencies and JWT secret`.

---

## Phase 2: Foundational (blocking)

- [X] T003 Extend `server/src/models/User.ts` per data-model: `username` (trim, 3–30), `usernameKey` (unique), `email` (lowercase, trim, unique sparse), `passwordHash` (`select: false`), keep `isStandIn`; set `usernameKey: "you"` on the stand-in upsert in `server/src/services/userService.ts`
- [X] T004 Extend `server/src/models/Collection.ts`: `members: [{ user: ObjectId ref User required, role: enum ['editor','viewer'] required, _id: false }]` default `[]`, `shareToken: String default null`; indexes `{ 'members.user': 1 }` and `{ shareToken: 1 }` unique partial (only when string)
- [X] T005 Create `server/src/services/authService.ts`: `hashPassword` (bcryptjs cost 10), `verifyPassword`, `signToken(userId)` (HS256, `expiresIn: '7d'`, `sub`), `verifyToken(token)` → userId or throws `AppError(401,'UNAUTHENTICATED','Please sign in to continue.')`
- [X] T006 Create `server/src/middleware/requireAuth.ts` (reads `Authorization: Bearer`, verifies, confirms the user exists, sets `req.userId`; else 401 `UNAUTHENTICATED`) and delete `server/src/middleware/currentUser.ts`; in `server/src/app.ts` stop applying a global user middleware, and in `server/src/routes/index.ts` apply `requireAuth` to `/collections` only (health, search, images, auth, shared stay public)
- [X] T007 Create `server/src/services/permissionService.ts`: `type Role = 'owner'|'editor'|'viewer'`; `type Action = 'view'|'editItems'|'editDescription'|'rename'|'delete'|'share'|'manageMembers'|'leave'`; `PERMISSIONS: Record<Action, Role[]>` exactly mirroring the spec table; `resolveAccess(userId, collectionId)` → `{ collection, role }` or 404 `COLLECTION_NOT_FOUND`; `assertCan(role, action)` → 403 `FORBIDDEN` "You don't have permission to do that."
- [X] T008 Add `toPublicUser(user)` and `addedBy` (populated `{ id, username }` or `null`) to `toSavedItem` in `server/src/utils/toDto.ts`; populate `addedBy` (`username`) wherever items are loaded
- [X] T009 Create `server/tests/helpers.ts`: `registerUser(app, overrides?)` → `{ agent, user, token }` where `agent` is a Supertest agent with the `Authorization` header set; update `server/tests/setup.ts` so the stand-in still exists and all collections (including `users` except the stand-in) are cleared between tests
- [X] T010 Migrate `server/tests/collections.test.ts` and `server/tests/items.test.ts` to use a registered user's agent instead of anonymous requests (owner assertions compare with that user); all existing expectations still pass
- [X] T011 [P] Client: extend `client/src/types/api.ts` with `PublicUser`, `AuthUser`, `Role`, `Member`, `SharedCollectionSummary`, `SharedView`, `addedBy`, and the new `CollectionDetail` fields; `CollectionsResponse = { collections, shared }`
- [X] T012 [P] Client: `client/src/api/client.ts` reads the token from `localStorage` key `pixboard.token`, sends `Authorization: Bearer`; on 401 `UNAUTHENTICATED` clears the token and calls a registered `onUnauthenticated` handler; export `setToken/getToken/clearToken`
- [X] T013 Client: `client/src/features/auth/AuthProvider.tsx` (+ `useAuth.ts`): state `{ user, status: 'loading'|'signedIn'|'signedOut' }`, restores via `GET /auth/me` on load, `login`, `register`, `logout` (clears token, clears query cache, navigates to `/login`); registers the 401 handler to navigate to `/login?next=<current path>` with a toast "Your session ended. Please sign in again."
- [X] T014 Client: `client/src/features/auth/RequireAuth.tsx` (spinner while loading, redirect to `/login?next=` when signed out) and restructure `client/src/App.tsx`: public routes `/login`, `/s/:token`; protected layout for `/`, `/search`, `/collections`, `/collections/:id`; wrap app in `AuthProvider` in `client/src/main.tsx`
- [X] T015 Client: `client/src/components/AppHeader.tsx` shows `@username` and a ghost **Log out** button when signed in

**Checkpoint**: all existing server tests green with real accounts; client builds. Commit
`feat: accounts foundation (users, sessions, permissions)`.

---

## Phase 3: US1 — Sign up (P1)

- [X] T016 [P] [US1] `server/tests/auth.test.ts` sign-up cases: 201 with token + user (no password fields); username/email duplicates differing only in case → 409 `USERNAME_TAKEN`/`EMAIL_TAKEN`; invalid username (2 chars, 31 chars, spaces), invalid email, 7-char password → 400 with field messages; the stored document has a bcrypt `passwordHash` not equal to the password
- [X] T017 [US1] `server/src/schemas/authSchemas.ts` (`registerBody`, `loginBody` per data-model), `authService.register` (pre-check duplicates → 409; create; FR-009 transfer when no real user existed: `Collection.updateMany({ owner: standIn }, { owner: new })` and `SavedItem.updateMany({ addedBy: standIn }, { addedBy: new })`), `server/src/controllers/authController.ts` `register`, `server/src/routes/authRoutes.ts` `POST /register`; mount `/auth`; map Mongo duplicate `usernameKey`/`email` in `errorHandler`; document in `server/API.md`
- [X] T018 [P] [US1] `client/src/api/auth.ts` (`register`, `login`, `me`) and `client/src/features/auth/SignupForm.tsx` (username, email, password with "At least 8 characters" hint; client-side checks mirror server; server field errors under fields; pending spinner)
- [X] T019 [US1] `client/src/pages/LoginPage.tsx` per `design/screens/01-login.png`: two columns (stacked on phones), wordmark, "Welcome back." / "Create your account.", segmented **Log in / Sign up** tabs (`?mode=signup`), forms, right panel with value points; on success navigate to `next` or `/collections`; signed-in users visiting `/login` are redirected

**Checkpoint**: A1 passes. Commit `feat: sign up`.

---

## Phase 4: US2 — Log in and out (P1)

- [X] T020 [P] [US2] Add to `server/tests/auth.test.ts`: login by username and by email (any case) → 200; wrong password and unknown user → identical 401 `INVALID_CREDENTIALS` body; `GET /auth/me` with token → user, without/invalid/expired token (sign with `expiresIn: -1`) → 401 `UNAUTHENTICATED`; `/api/collections` without token → 401; first registered user receives stand-in collections and items, second user does not
- [X] T021 [US2] `authService.login` (lookup by `usernameKey` or lower-cased `email`, `select('+passwordHash')`, same error for both failures), `authController.login` / `me`, routes `POST /login`, `GET /me` (with `requireAuth`); document in `server/API.md`
- [X] T022 [US2] `client/src/features/auth/LoginForm.tsx` ("Username or email", "Password", error box "Invalid username/email or password.") wired into `LoginPage`; Log out in header verified; expired session flow returns to `next`

**Checkpoint**: A2 passes. Commit `feat: log in and out with 7-day sessions`.

---

## Phase 5: US3 — Share by link (P1)

- [X] T023 [P] [US3] `server/tests/sharing.test.ts`: owner `POST /collections/:id/share` → token of 24 URL-safe chars; `GET /shared/:token` without auth → collection, owner username, items with `addedBy`, no `members`/`shareToken`; `DELETE …/share` → 204 and old token → 404 `SHARE_LINK_INACTIVE`; re-enable → different token, old still 404; editor/viewer share attempts → 403; unknown token → 404
- [X] T024 [US3] `collectionService.enableShare/disableShare/getSharedView`, `server/src/controllers/shareController.ts`, routes `POST/DELETE /collections/:id/share` (owner via `assertCan('share')`) and public `server/src/routes/sharedRoutes.ts` `GET /shared/:token`; `toSharedView` in `toDto.ts`; document in `server/API.md`
- [X] T025 [P] [US3] `client/src/components/ui/switch.tsx` (Radix Switch, Broadsheet cyan, 44px hit area on phones) and `client/src/api/sharing.ts` (`enableShare`, `disableShare`, `getShared`)
- [X] T026 [US3] `client/src/features/sharing/ShareLinkToggle.tsx` ("Anyone with the link can view" + switch, read-only URL field `${origin}/s/${token}`, **Copy** with "Link copied" toast, hint "Turning the link off immediately breaks the old address.")
- [X] T027 [US3] `client/src/pages/SharedCollectionPage.tsx` per `design/screens/06-public-shared-view.png` (label "SHARED BOARD · VIEW ONLY", title, description, "A board by {owner} · N images · updated …", 4/2-column grid of items with credits and "added by", loading skeleton, "This link is no longer active" state with link to sign in); public header variant (wordmark + Log in / My collections)

**Checkpoint**: A3 passes. Commit `feat: share collections by link`.

---

## Phase 6: US4 — Invite collaborators (P1)

- [X] T028 [P] [US4] `server/tests/members.test.ts`: invite by username and by email (any case) as editor/viewer → 201 members list; unknown → 404 `USER_NOT_FOUND`; self → 400 `CANNOT_INVITE_SELF`; existing member → 409 `ALREADY_MEMBER`; bad role → 400; change role → 200; remove → 204; invitee's `GET /collections` lists it under `shared` with owner and role, not under `collections`; non-owner invite/role/remove → 403
- [X] T029 [US4] `server/src/schemas/memberSchemas.ts`, `server/src/services/memberService.ts` (`invite`, `changeRole`, `removeMember`), `server/src/controllers/memberController.ts`, routes `POST /collections/:id/members`, `PATCH|DELETE /collections/:id/members/:userId`; `collectionService.listForUser` returns `{ owned, shared }` (shared via `members.user`, with owner populated and role; `containsImage` on both when `sourceId`); `getCollectionDetail` adds `role`, `owner`, `members` (populated), `shareToken` only for owner; document all in `server/API.md`
- [X] T030 [US4] Client: `client/src/api/collections.ts` `listCollections` returns `{ collections, shared }`; `members` API functions in `client/src/api/sharing.ts`; update `useCollections` and all callers (`CollectionsPage`, `SaveToCollectionPopover`) to the new shape
- [X] T031 [US4] `client/src/features/sharing/MemberList.tsx` (owner row fixed "Owner"; member rows with initials avatar, username, role `<select>` for owner or text for others, Remove icon button for owner) and `InviteForm.tsx` (input "Username or email", role select, **Invite**, specific error box)
- [X] T032 [US4] `client/src/features/sharing/ShareDialog.tsx` per `design/screens/05-share-dialog.png` combining `ShareLinkToggle`, MEMBERS label, `MemberList`, `InviteForm`; subtitle "You're the owner. Only you can manage members or delete this board."; `client/src/features/sharing/useSharing.ts` mutations invalidate `collection(id)` and `collections`
- [X] T033 [US4] `CollectionsPage`: "Shared with me" section (H4 + hint) below owned grid using `CollectionCard` with a "by @owner · Editor/Viewer" meta line; empty state only when both lists are empty

**Checkpoint**: A4 invite part passes. Commit `feat: invite collaborators with roles`.

---

## Phase 7: US5 — Collaborate (P1)

- [X] T034 [P] [US5] `server/tests/permissions.test.ts`: for owner, editor, viewer, and non-member, assert every permission-table row (view, save item, edit item, remove item, edit description, rename, delete, share on/off, invite/role/remove, leave) returns the allowed status or 403/404 exactly per the table; last-write-wins: two sequential PATCHes on one item → second value stored, both 200
- [X] T035 [US5] Route every collection and item service call through `resolveAccess` + `assertCan` (`view` for GET, `editItems` for item POST/PATCH/DELETE, `rename` when `name` present, `editDescription` when `description` present, `delete`, `share`, `manageMembers`); `touchCollection` unchanged; items saved by editors keep `addedBy` = editor
- [X] T036 [US5] Client role awareness in `client/src/pages/CollectionPage.tsx`: owner → Edit, Share, Delete; editor → Edit (description only — name field read-only with hint), Members; viewer → Members; label caps shows "COLLECTION · SHARED WITH YOU AS EDITOR/VIEWER" for members
- [X] T037 [US5] `client/src/features/items/*`: `SavedItemCard` meta "added by @user" ("added by you" for self); `ItemDetailPanel`/`ItemEditForm` hide Edit and Remove for viewers; `EditCollectionDialog`/`CollectionForm` support `nameReadOnly`
- [X] T038 [US5] `SaveToCollectionPopover`: list owned collections then shared-as-editor collections (with "· shared by @owner" meta); viewer-only collections excluded
- [X] T039 [US5] Client handling of 403 `FORBIDDEN` (toast with message, refetch collection) and 404 on a previously visible collection ("You no longer have access to this collection." then navigate to `/collections`)

**Checkpoint**: A4 collaboration part passes; tests green. Commit `feat: role-based collaboration`.

---

## Phase 8: US6 — Leave (P2)

- [X] T040 [P] [US6] Add to `server/tests/members.test.ts`: editor and viewer `DELETE /collections/:id/members/<self>` → 204 and access lost; owner removing themselves → 400 `CANNOT_LEAVE_OWN_COLLECTION`
- [X] T041 [US6] Server: allow self-removal via `assertCan('leave')`; owner self-removal → 400 `CANNOT_LEAVE_OWN_COLLECTION` "Owners can delete a collection but can't leave it."; document in `server/API.md`
- [X] T042 [US6] Client `client/src/features/sharing/MembersDialog.tsx` (read-only member list + destructive-ghost **Leave collection** with confirm) opened from the Members button; on leave navigate to `/collections` with toast "You left {name}"

**Checkpoint**: A5 passes. Commit `feat: leave a shared collection`.

---

## Phase 9: Polish

- [X] T043 [P] Update `README.txt` (JWT_SECRET setup, sign-up first to keep existing data, feature list additions) and `server/API.md` review (auth header section, new error codes, permission table, known limitations)
- [X] T044 Responsive and accessibility pass for `LoginPage`, `ShareDialog`, `MembersDialog`, `SharedCollectionPage` at 375/768/1280 (labels, focus, 44px targets, no overflow)
- [X] T045 Run lint, format:check, tests (server), lint/format/build (client); fix everything
- [ ] T046 Run quickstart A1–A5 against real Atlas with three accounts; fix differences

---

## Phase 10: US7 — Continue with Google (P2, added at the author's request)

- [X] T047 Install `google-auth-library` in `server/`; add optional `GOOGLE_CLIENT_ID` to `server/src/config/env.ts`, `server/.env.example`, and local `server/.env`; add `googleId` (unique sparse) to `server/src/models/User.ts`
- [X] T048 [P] [US7] `server/src/services/googleService.ts`: `verifyGoogleCredential(credential)` using `OAuth2Client.verifyIdToken({ audience: GOOGLE_CLIENT_ID })`, returning `{ googleId, email, name }` only when `email_verified`; otherwise 401 `GOOGLE_SIGN_IN_FAILED`; 503 `GOOGLE_SIGN_IN_DISABLED` when not configured
- [X] T049 [US7] `authService.loginWithGoogle` (match `googleId`, else link by email, else create with a unique username from the email local part; first-account data transfer), `POST /auth/google` `{ credential }` route + controller + zod schema; document in `server/API.md`
- [X] T050 [P] [US7] `server/tests/google.test.ts` with `googleService` mocked: new user created and signed in; same Google id signs into the same account; existing email is linked; unverified/invalid → 401; username collision gets a suffix; Google-only account cannot use password login
- [X] T051 [US7] Client: `VITE_GOOGLE_CLIENT_ID` in `client/.env.example` and `client/.env`; `client/src/features/auth/GoogleButton.tsx` loads Google Identity Services, renders the official button, posts the credential via `loginWithGoogle` in `AuthProvider`; shown on both Log in and Sign up with an "or" divider; hidden when no client id
- [X] T052 Update `README.txt` (Google sign-in note, test-user limitation) and run lint/format/tests/build

---

## Dependencies

Setup → Foundational → US1 → US2 → US3 → US4 → US5 → US6 → Polish. US3 and US4 touch different
files after US2 and may interleave, but share `server/API.md` and `collectionRoutes.ts` (sequential
edits).

## Implementation strategy

MVP for grading: Phases 1–7 (accounts + link sharing + collaborators with enforced roles). US6 and
Polish follow; push after each checkpoint.

# Implementation Plan: Accounts, Sharing & Collaboration

**Branch**: `main` (feature dir `002-accounts-sharing`) | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-accounts-sharing/spec.md`; tech stack from
`docs/requirements/requirements/06-tech-stack-plan-input.md`; design `design/screens/01`, `05`, `06`.

## Summary

Add accounts (sign up, sign in with username or email, 7-day sessions, sign out), move Feature 1's
stand-in data to the first account, and add collaboration: owners share a read-only link (on/off,
new unguessable token each time) and invite existing users as editors or viewers. One server-side
permission table governs every action. The client gains a Log in / Sign up screen, a signed-in
shell, a Share dialog (link toggle + members), "Shared with me", role-aware controls, "added by" on
items, and a public shared-board page.

## Technical Context

**Language/Version**: TypeScript 5 on Node.js 22 (server) and browser (client) — unchanged

**Primary Dependencies**: adds `jsonwebtoken`, `bcryptjs` (+ `@types/jsonwebtoken`,
`@types/bcryptjs`) on the server; adds shadcn-style `Switch` and `Select`-free native `<select>`
on the client (no new client packages)

**Storage**: MongoDB Atlas via Mongoose — User extended, Collection gains `members` and `shareToken`

**Testing**: Vitest + Supertest + mongodb-memory-server; new suites for auth, permissions, sharing,
members; existing suites move to real accounts via a test helper

**Target Platform / Project Type**: unchanged web app (`client/` + `server/`)

**Performance Goals**: sign-up to collections < 1 min for a person (SC-002); share-off effective
immediately (SC-005)

**Constraints**: permissions enforced server-side on every request (Constitution V); passwords
bcrypt-hashed and never logged; `JWT_SECRET` only in `server/.env`; deadline 2026-09-18 23:59 CT

**Scale/Scope**: a handful of users per collection; ~12 new/changed endpoints; 2 new pages, 2 new
dialogs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How this plan complies | Status |
|---|-----------|------------------------|--------|
| I | Working software first | Feature 1 is complete and pushed; F2 stories built in P1 order (sign up → log in → share link → invite → collaborate), US6 (P2) last | ✅ |
| II | Readable | One permission table (`can(role, action)`), one `resolveAccess`, small auth middleware; typed request/response shapes; purpose comments; lint/format per commit | ✅ |
| III | Organized | New `authRoutes/Controller/Service`, `shareRoutes`, `memberController`, `permissionService`, `middleware/requireAuth`; client `features/auth`, `features/sharing`, `api/auth.ts`, `api/sharing.ts` | ✅ |
| IV | Clear API | REST resources `/auth`, `/collections/:id/share`, `/collections/:id/members`, `/shared/:token`; new codes in the one error handler; every endpoint added to `server/API.md` in the same commit | ✅ |
| V | Security | bcryptjs hashes, `passwordHash` `select: false`; JWT secret in env (validated at startup); owner/editor/viewer enforced server-side for every action with tests per row; share tokens 144-bit random | ✅ |
| VI | Polished UX | Login and share dialog follow designs `01`/`05`, shared page follows `06` (without F3 palette); loading/empty/error states on new views; role-appropriate controls | ✅ |
| VII | Performance | No new heavy queries; member lookups indexed (`members.user`) | ✅ |
| VIII | Verifiable | Tests for auth and every permission row (SC-003); README run steps add `JWT_SECRET`; conventional commits | ✅ |

**Gate**: PASS. **Post-design re-check**: PASS — images stay public (research R6) is a documented,
necessary trade-off, not a violation (it is not a collection or item action).

## Project Structure

### Documentation (this feature)

```text
specs/002-accounts-sharing/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (new ✚ / changed ✎)

```text
server/
├── .env.example                 ✎ JWT_SECRET
├── API.md                       ✎ auth, share, members, shared view, role rules
├── src/config/env.ts            ✎ JWT_SECRET (min 16 chars)
├── src/models/User.ts           ✎ usernameKey, email, passwordHash
├── src/models/Collection.ts     ✎ members, shareToken
├── src/middleware/requireAuth.ts ✚ replaces currentUser.ts (deleted)
├── src/services/authService.ts   ✚ register (with stand-in transfer), login, token sign/verify
├── src/services/permissionService.ts ✚ resolveAccess, can(), assertCan()
├── src/services/collectionService.ts ✎ owned + shared lists, role-aware detail, share on/off, public view
├── src/services/memberService.ts ✚ invite, change role, remove/leave
├── src/services/itemService.ts   ✎ uses assertCan; addedBy populated
├── src/controllers/authController.ts ✚   memberController.ts ✚   shareController.ts ✚
├── src/controllers/collectionController.ts ✎   itemController.ts ✎
├── src/schemas/authSchemas.ts ✚   memberSchemas.ts ✚
├── src/routes/authRoutes.ts ✚   sharedRoutes.ts ✚   collectionRoutes.ts ✎   index.ts ✎
├── src/utils/toDto.ts            ✎ toPublicUser, addedBy, role/members/owner, shared view
└── tests/helpers.ts ✚  auth.test.ts ✚  permissions.test.ts ✚  sharing.test.ts ✚  members.test.ts ✚
    (collections/items tests ✎ to use signed-in agents)

client/src/
├── api/client.ts            ✎ bearer token, 401 → sign-in redirect
├── api/auth.ts ✚   api/sharing.ts ✚   api/collections.ts ✎
├── types/api.ts             ✎ auth, roles, members, shared types
├── features/auth/AuthProvider.tsx ✚  RequireAuth.tsx ✚  LoginForm.tsx ✚  SignupForm.tsx ✚  useAuth.ts ✚
├── features/sharing/ShareDialog.tsx ✚  MemberList.tsx ✚  InviteForm.tsx ✚  ShareLinkToggle.tsx ✚
│   MembersDialog.tsx ✚ (read-only list + Leave for members)  useSharing.ts ✚
├── features/collections/*   ✎ Shared with me section, role-aware header actions, editor edits description only
├── features/items/*         ✎ "added by", viewer read-only panel
├── features/search/SaveToCollectionPopover.tsx ✎ owned + editable shared collections
├── components/AppHeader.tsx ✎ username + Log out
├── components/ui/switch.tsx ✚
└── pages/LoginPage.tsx ✚  SharedCollectionPage.tsx ✚  App.tsx ✎ (public vs protected routes)
```

**Structure Decision**: Same two-project layout; new code slots into the existing layers.

## Design mapping

| Design | Implementation |
|--------|----------------|
| `01-login` | Two-column page: left wordmark, "Welcome back.", Log in / Sign up segmented tabs, labeled fields, magenta-tint error box, primary full-width button; right surface panel with the app's pitch (Explore list is Feature 3, so the panel shows a static palette illustration and three value points) |
| `05-share-dialog` | Dialog "Share “{name}”": link row with switch + URL field + Copy; hairline; MEMBERS label; rows with initials avatar, username, email/handle, role `<select>` (owner row fixed); invite row input + role select + Invite; magenta-tint error |
| `06-public-shared-view` | Label caps "SHARED BOARD · VIEW ONLY", H1 display, description, "A board by {owner} · N images · updated …", 4-column unboxed grid with credits; no palette (Feature 3) |

## Complexity Tracking

No violations.

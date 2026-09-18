# API Contract: Accounts, Sharing & Collaboration

Changes and additions to the [Feature 1 contract](../../001-discover-collect/contracts/api.md).
Error shape and conventions are unchanged. Documented in `server/API.md` (Constitution IV).

## Authentication

All endpoints require `Authorization: Bearer <token>` **except**: `GET /health`,
`POST /auth/register`, `POST /auth/login`, `GET /shared/:token`, `GET /images/:id`,
`GET /search/images` (search stays public so it keeps working for anyone; saving requires sign-in).

New error codes:

| Status | Code | When |
|--------|------|------|
| 401 | `UNAUTHENTICATED` | Missing, invalid, or expired token |
| 401 | `INVALID_CREDENTIALS` | Login failed (same message for unknown user and wrong password) |
| 403 | `FORBIDDEN` | Signed in and a member, but the role does not allow the action |
| 404 | `USER_NOT_FOUND` | Invite target does not exist |
| 404 | `SHARE_LINK_INACTIVE` | Unknown or turned-off share token |
| 409 | `USERNAME_TAKEN` / `EMAIL_TAKEN` | Registration duplicates |
| 409 | `ALREADY_MEMBER` | Invite target is already a member |
| 400 | `CANNOT_INVITE_SELF` | Owner invited themselves |

## Types (additions)

```ts
type PublicUser = { id: string; username: string };
type AuthUser = PublicUser & { email: string };
type Role = 'owner' | 'editor' | 'viewer';
type Member = { user: PublicUser; role: 'editor' | 'viewer' };

type SavedItem = /* Feature 1 fields */ & { addedBy: PublicUser | null };

type SharedCollectionSummary = CollectionSummary & { owner: PublicUser; role: 'editor' | 'viewer' };

type CollectionDetail = CollectionSummary & {
  items: SavedItem[];
  role: Role;
  owner: PublicUser;
  members: Member[];
  shareToken: string | null; // only for the owner; always null for others
};

type SharedView = CollectionSummary & { owner: PublicUser; items: SavedItem[] };
```

## Auth

| Method & path | Body | Success | Errors |
|---------------|------|---------|--------|
| `POST /auth/register` | `{ username, email, password }` | 201 `{ token, user: AuthUser }` | 400, 409 `USERNAME_TAKEN` / `EMAIL_TAKEN` |
| `POST /auth/login` | `{ usernameOrEmail, password }` | 200 `{ token, user: AuthUser }` | 400, 401 `INVALID_CREDENTIALS` |
| `GET /auth/me` | — | 200 `{ user: AuthUser }` | 401 `UNAUTHENTICATED` |

## Collections (changed)

| Method & path | Who | Change |
|---------------|-----|--------|
| `GET /collections[?sourceId=]` | signed in | Response `{ collections: CollectionSummary[] (owned), shared: SharedCollectionSummary[] }` |
| `POST /collections` | signed in | Owner = current user |
| `GET /collections/:id` | owner, editor, viewer | Adds `role`, `owner`, `members`, `shareToken` (owner only); items include `addedBy` |
| `PATCH /collections/:id` | owner: `name`, `description`; editor: `description` only | editor sending `name` → 403 |
| `DELETE /collections/:id` | owner | others → 403 |
| `POST/PATCH/DELETE /collections/:id/items…` | owner, editor | viewer → 403 |

## Sharing

| Method & path | Who | Success |
|---------------|-----|---------|
| `POST /collections/:id/share` | owner | 200 `{ shareToken }` (new token every call) |
| `DELETE /collections/:id/share` | owner | 204 |
| `GET /shared/:token` | anyone | 200 `{ collection: SharedView }`; unknown/off → 404 `SHARE_LINK_INACTIVE` |

## Members

| Method & path | Who | Body | Success |
|---------------|-----|------|---------|
| `POST /collections/:id/members` | owner | `{ usernameOrEmail, role }` | 201 `{ members: Member[] }` |
| `PATCH /collections/:id/members/:userId` | owner | `{ role }` | 200 `{ members: Member[] }` |
| `DELETE /collections/:id/members/:userId` | owner (anyone), or the member themself (leave) | — | 204 |

## Client routes (additions)

| Path | Screen | Auth |
|------|--------|------|
| `/login` | Log in / Sign up tabs (`design/screens/01-login.png`) | public |
| `/s/:token` | Read-only shared board (`06-public-shared-view.png`) | public |
| `/search`, `/collections`, `/collections/:id` | unchanged | require sign-in → `/login?next=` |

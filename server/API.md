# PixBoard API

REST API for PixBoard: search Pixabay images, organize them into
collections, edit or remove saved items, and share collections by link or with collaborators.

- **Base URL**: `http://localhost:4000/api`
- **Format**: JSON request and response bodies, except `GET /images/:id` (image bytes).
- **Auth**: sign up or log in to get a token, then send `Authorization: Bearer <token>`. Tokens
  last 7 days. Endpoints marked **public** need no token; all `/collections` endpoints require one.

## Errors

Every error response has this shape:

```json
{ "error": { "code": "COLLECTION_NOT_FOUND", "message": "That collection doesn't exist." } }
```

`VALIDATION_ERROR` responses also include `fields`, mapping each invalid field to its message:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "fields": { "name": "Names can be at most 60 characters." }
  }
}
```

| Status | Code                          | When                                                                 |
| ------ | ----------------------------- | -------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`            | Body, query, or params fail validation (or the JSON is malformed)    |
| 400    | `CANNOT_INVITE_SELF`          | The owner tried to invite themselves                                 |
| 400    | `CANNOT_LEAVE_OWN_COLLECTION` | The owner tried to leave (owners delete instead)                     |
| 401    | `UNAUTHENTICATED`             | Missing, invalid, or expired token                                   |
| 401    | `INVALID_CREDENTIALS`         | Wrong username/email or password (same message for both)             |
| 401    | `GOOGLE_SIGN_IN_FAILED`       | Google did not confirm the sign-in, or the email is unverified       |
| 503    | `GOOGLE_SIGN_IN_DISABLED`     | Google sign-in is not configured on the server                       |
| 403    | `FORBIDDEN`                   | You can see the collection, but your role doesn't allow the action   |
| 404    | `COLLECTION_NOT_FOUND`        | Collection missing, or you are not its owner or a member             |
| 404    | `ACCOUNT_NOT_FOUND`           | Google log-in for someone without a PixBoard account (sign up first) |
| 404    | `USER_NOT_FOUND`              | No account matches the invited username or email                     |
| 404    | `MEMBER_NOT_FOUND`            | That user isn't a member of the collection                           |
| 404    | `SHARE_LINK_INACTIVE`         | The share link is unknown or has been turned off                     |
| 404    | `BOARD_NOT_PUBLIC`            | The board is private or no longer exists (Explore view)              |
| 404    | `NOTIFICATION_NOT_FOUND`      | The notification doesn't exist or isn't yours                        |
| 404    | `ITEM_NOT_FOUND`              | Item missing or not in that collection                               |
| 404    | `IMAGE_NOT_FOUND`             | Stored image missing, or the Pixabay image no longer exists          |
| 404    | `ROUTE_NOT_FOUND`             | Unknown path                                                         |
| 409    | `COLLECTION_NAME_TAKEN`       | Name matches another of your collections (ignoring case and spaces)  |
| 409    | `ITEM_ALREADY_SAVED`          | The image is already in that collection                              |
| 409    | `USERNAME_TAKEN`              | Sign-up username already used (ignoring capitalization)              |
| 409    | `EMAIL_TAKEN`                 | Sign-up email already used (ignoring capitalization)                 |
| 409    | `ALREADY_MEMBER`              | The invited user is already a member                                 |

## Roles and permissions

Every collection has one **owner**; the owner can invite **editors** and **viewers**. Anyone with an
active share link can view read-only (see `GET /shared/:token`). The server checks this table on
every request: a member without permission gets `403 FORBIDDEN`; a non-member gets
`404 COLLECTION_NOT_FOUND`.

| Action                              |           Owner            |                            Editor                            | Viewer |
| ----------------------------------- | :------------------------: | :----------------------------------------------------------: | :----: |
| View collection and items           |             ✓              |                              ✓                               |   ✓    |
| Save, edit, remove items            |             ✓              |                              ✓                               |   –    |
| Edit description                    |             ✓              |                              ✓                               |   –    |
| Rename or delete collection         |             ✓              |                              –                               |   –    |
| Make public or private              |             ✓              |                              –                               |   –    |
| Turn share link on/off              |             ✓              |                              –                               |   –    |
| Invite, change role, remove members |             ✓              |                              –                               |   –    |
| Leave collection                    |             –              |                              ✓                               |   ✓    |
| 502                                 | `IMAGE_SOURCE_UNAVAILABLE` | Pixabay failed, timed out (8 s), or rate-limited the request |
| 500                                 |      `INTERNAL_ERROR`      |   Anything unexpected (details are only in the server log)   |

## Shared types

**Palettes**: each stored image's dominant colors are read once, when it is first saved, and kept
with the image. A collection's `palette` merges its images' colors. Images saved before palettes
existed get their colors filled in the next time a collection holding them is loaded.

```ts
type SearchResult = {
  sourceId: string; // Pixabay image id
  title: string; // derived from the first tags
  tags: string[];
  creatorName: string;
  pageUrl: string; // Pixabay page, used for the credit link
  thumbnailUrl: string; // temporary Pixabay URL, for displaying search results only
  width: number;
  height: number;
};

type CollectionSummary = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  coverImageUrl: string | null; // "/api/images/<assetId>" of the newest item
  coverCreatorName: string | null;
  coverPageUrl: string | null;
  palette: string[]; // up to 5 dominant colors ("#RRGGBB", most prominent first); [] when empty
  visibility: 'private' | 'public'; // public boards appear on Explore; new boards are private
  createdAt: string; // ISO 8601
  updatedAt: string;
  containsImage?: boolean; // only when ?sourceId= is given
};

type SavedItem = {
  id: string;
  collectionId: string;
  sourceId: string;
  title: string;
  note: string;
  tags: string[];
  creatorName: string;
  pageUrl: string;
  imageUrl: string; // "/api/images/<assetId>"
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
};

type PublicUser = { id: string; username: string };
type AuthUser = PublicUser & { email: string };
type Member = { user: PublicUser; role: 'editor' | 'viewer' };

// SavedItem also includes: addedBy: PublicUser | null  (who saved it)

type SharedCollectionSummary = CollectionSummary & { owner: PublicUser; role: 'editor' | 'viewer' };

type CollectionDetail = CollectionSummary & {
  items: SavedItem[]; // newest first
  role: 'owner' | 'editor' | 'viewer'; // your role
  owner: PublicUser;
  members: Member[];
  shareToken: string | null; // only shown to the owner
};

type SharedView = CollectionSummary & { owner: PublicUser; items: SavedItem[] };
```

---

## Health

### `GET /health`

Confirms the server is running.

- **Auth**: none
- **Response 200**: `{ "status": "ok" }`

```bash
curl http://localhost:4000/api/health
```

## Auth

### `POST /auth/register`

Creates an account and signs it in. The very first account also receives every collection created
before accounts existed.

- **Auth**: public
- **Body**: `username` (3–30 letters, numbers, underscores), `email`, `password` (8–128 characters)
- **Response 201**: `{ "token": "<jwt>", "user": AuthUser }` — passwords are never returned
- **Errors**: `400 VALIDATION_ERROR` (with `fields`), `409 USERNAME_TAKEN`, `409 EMAIL_TAKEN`

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"password123"}'
```

### `POST /auth/login`

- **Auth**: public
- **Body**: `usernameOrEmail` (either, any capitalization), `password`
- **Response 200**: `{ "token": "<jwt>", "user": AuthUser }`
- **Errors**: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"alice","password":"password123"}'
```

### `POST /auth/google`

"Continue with Google". The client gets a credential from Google's sign-in button and sends it
here; the server confirms it with Google, then signs the person in. The same Google account always
reaches the same PixBoard account; an existing account with the same (Google-verified) email is
linked; otherwise a new account is created with a username based on the email (e.g. `thanuja_r`).
Google-only accounts have no password.

- **Auth**: public
- **Body**: `{ "credential": "<Google ID token>", "mode": "login" | "signup" }` — `mode` defaults to
  `login`, which only signs into an existing account; `signup` creates one if needed
- **Response 200**: `{ "token": "<jwt>", "user": AuthUser }`
- **Errors**: `400 VALIDATION_ERROR`, `404 ACCOUNT_NOT_FOUND` (`login` mode and no account yet),
  `401 GOOGLE_SIGN_IN_FAILED` (Google did not confirm it, or
  the email is unverified), `503 GOOGLE_SIGN_IN_DISABLED` (no `GOOGLE_CLIENT_ID` configured)

```bash
curl -X POST http://localhost:4000/api/auth/google \
  -H "Content-Type: application/json" -d '{"credential":"<credential from Google>","mode":"login"}'
```

### `GET /auth/me`

Returns the signed-in user (used to restore a session after a page reload).

- **Auth**: token required
- **Response 200**: `{ "user": AuthUser }`
- **Errors**: `401 UNAUTHENTICATED`

```bash
curl http://localhost:4000/api/auth/me -H "Authorization: Bearer <token>"
```

## Feed

### `GET /feed?topic=&color=&page=`

Popular photos for the home feed, no keyword needed (safe search on, 20 per page, cached 24 hours).

- **Auth**: none
- **Query**:
  - `topic` (optional): one of `all` (editor's choice, the default), `nature`, `travel`, `food`,
    `fashion`, `animals`, `architecture`, `interiors`, `flowers`, `cozy`, `city`, `art`
  - `color` (optional): one of `red`, `orange`, `yellow`, `green`, `turquoise`, `blue`, `lilac`,
    `pink`, `brown`, `black`, `gray`, `white`, `grayscale` (with `all`, widens to all popular photos;
    `grayscale` also adds the words "black and white" to the query, since Pixabay's grayscale filter
    alone lets color photos through)
  - `page` (optional): integer ≥ 1, default `1`; `page × 20` must be ≤ 500
- **Response 200**: the same shape as `GET /search/images`, plus `"topic": "all"` and `"color": null` (or the color name)
- **Errors**: `400 VALIDATION_ERROR` (unknown topic or unreachable page), `502 IMAGE_SOURCE_UNAVAILABLE`

```bash
curl "http://localhost:4000/api/feed?topic=nature&page=1"
```

## Photos

A single Pixabay photo's page and photos like it. No sign-in needed.

### `GET /photos/:sourceId`

- **Response 200**: `{ "photo": SearchResult & { "largeUrl": string }, "palette": ["#RRGGBB", …] }`
  (up to 5 colours read from the photo's preview, cached for a day; `[]` if they can't be read)
- **Errors**: `400 VALIDATION_ERROR` (not a numeric id), `404 IMAGE_NOT_FOUND`,
  `502 IMAGE_SOURCE_UNAVAILABLE`

### `POST /photos/understand`

"Search with a photo": what a photo shows, for finding similar photos. The photo is sent to Claude
(`claude-opus-5`, low effort, structured output) and discarded; it is never stored or logged. Needs
`ANTHROPIC_API_KEY` on the server; without it the client falls back to on-device recognition.

- **Auth**: token required; limited to 20 photos per minute per person
- **Body**: `{ "image": "data:image/jpeg;base64,…" }` (JPEG, PNG, or WebP; up to about 3 MB)
- **Response 200**:
  `{ "understanding": { "description": "A box of 12 Crayola chalk sticks…", "subject": "chalk box", "brands": ["Crayola"], "text": ["Crayola", "Chalk", "12"], "keywords": ["crayola chalk", "chalk box"] } }`
- **Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `422 VISION_NO_RESULT`,
  `429 TOO_MANY_REQUESTS` / `429 VISION_BUSY`, `502 VISION_UNAVAILABLE`, `503 VISION_DISABLED`

### `GET /photos/understand/status`

- **Auth**: none
- **Response 200**: `{ "enabled": true }` when the server has an Anthropic API key

### `GET /photos/:sourceId/similar?by=&page=`

"More like this". `by=subject` (default) searches the photo's two main tags (widening to one if that
finds fewer than 20); `by=color` searches its main tag in the named colour nearest its leading colour.
The photo itself is left out.

- **Query**: `by` (`subject` | `color`), `page` (1–25, default 1)
- **Response 200**: the same shape as `GET /search/images`, plus `"by"`, `"basedOn": ["lighthouse"]`,
  and `"color": "blue" | null`
- **Errors**: `400 VALIDATION_ERROR`, `404 IMAGE_NOT_FOUND`, `502 IMAGE_SOURCE_UNAVAILABLE`

```bash
curl "http://localhost:4000/api/photos/736877/similar?by=color"
```

## Search

### `GET /search/images?q=&color=&page=`

Searches Pixabay photos (safe search on, 20 per page). Identical searches are cached for 24 hours,
as Pixabay requires.

- **Auth**: none
- **Query**:
  - `q` (required): keyword, 1–100 characters after trimming
  - `color` (optional): the same color names as `GET /feed`
  - `page` (optional): integer ≥ 1, default `1`; `page × 20` must be ≤ 500 (Pixabay's limit)
- **Response 200**:

  ```json
  {
    "results": [
      {
        "sourceId": "736877",
        "title": "Lighthouse, coast",
        "tags": ["lighthouse", "coast", "sea"],
        "creatorName": "jplenio",
        "pageUrl": "https://pixabay.com/photos/lighthouse-736877/",
        "thumbnailUrl": "https://pixabay.com/get/...jpg",
        "width": 640,
        "height": 427
      }
    ],
    "page": 1,
    "perPage": 20,
    "total": 500,
    "hasMore": true
  }
  ```

  `total` is at most 500. No matches → `results: []`, `total: 0`, `hasMore: false`.

- **Errors**: `400 VALIDATION_ERROR` (empty or too-long `q`, bad `page`),
  `502 IMAGE_SOURCE_UNAVAILABLE`

```bash
curl "http://localhost:4000/api/search/images?q=lighthouse&page=1"
```

## Collections

### `GET /collections`

Lists your own collections and the ones shared with you, each most recently updated first.
Creating, renaming, or editing a collection, or saving, editing, or removing one of its items,
counts as an update.

- **Auth**: token required
- **Query**:
  - `sourceId` (optional): a Pixabay image id (digits). When given, each summary also includes
    `containsImage: true | false`, used by the save picker to mark collections that already hold
    that image.
- **Response 200**: `{ "collections": [CollectionSummary], "shared": [SharedCollectionSummary] }`

  ```json
  {
    "collections": [
      {
        "id": "66e8a1f2c3b4d5e6f7a8b9c0",
        "name": "Coast trip",
        "description": "Lighthouses and fog",
        "itemCount": 3,
        "coverImageUrl": "/api/images/66e8a2...",
        "coverCreatorName": "jplenio",
        "coverPageUrl": "https://pixabay.com/photos/lighthouse-736877/",
        "palette": ["#2E3A40", "#C1663C", "#F3E3D3"],
        "createdAt": "2026-09-16T18:02:11.000Z",
        "updatedAt": "2026-09-16T18:10:45.000Z"
      }
    ],
    "shared": [
      {
        "id": "66e8b0...",
        "name": "Studio moodboard",
        "role": "editor",
        "owner": { "id": "66e8af...", "username": "devi" }
      }
    ]
  }
  ```

  (`shared` entries have every `CollectionSummary` field; shortened here.)

- **Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`

```bash
curl http://localhost:4000/api/collections -H "Authorization: Bearer <token>"
curl "http://localhost:4000/api/collections?sourceId=736877" -H "Authorization: Bearer <token>"
```

### `POST /collections`

Creates a collection.

- **Auth**: token required
- **Body**:
  - `name` (required): 1–60 characters after trimming; must not match another of your collections
    (ignoring case and surrounding spaces)
  - `description` (optional): up to 280 characters, default `""`
  - `visibility` (optional): `"private"` (default) or `"public"` (listed on Explore once it has images)
- **Response 201**: `{ "collection": CollectionSummary }` (with `itemCount: 0` and null cover fields)
- **Errors**: `400 VALIDATION_ERROR` (with `fields.name` / `fields.description`),
  `409 COLLECTION_NAME_TAKEN`

```bash
curl -X POST http://localhost:4000/api/collections \
  -H "Content-Type: application/json" \
  -d '{"name":"Coast trip","description":"Lighthouses and fog"}'
```

### `GET /collections/:id`

Returns one collection with its saved items (newest first, each with `addedBy`), your role, the
owner, and the member list. `shareToken` is only included for the owner.

- **Auth**: token required
- **Params**: `id` — collection id
- **Who**: owner, editor, viewer
- **Response 200**: `{ "collection": CollectionDetail }`
- **Errors**: `400 VALIDATION_ERROR` (malformed id), `404 COLLECTION_NOT_FOUND`

```bash
curl http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0
```

### `PATCH /collections/:id`

Renames a collection, edits its description, and/or makes it public or private. Uses the same rules
as creation. The owner may change all three; an editor may change only the description (sending
`name` or `visibility` → `403 FORBIDDEN`).

- **Auth**: token required
- **Params**: `id` — collection id
- **Body** (at least one field):
  - `name`: 1–60 characters after trimming; must not match another of your collections (changing
    only the capitalization of its own name is allowed)
  - `description`: up to 280 characters
  - `visibility`: `"public"` (listed on Explore, viewable by anyone) or `"private"`
- **Response 200**: `{ "collection": CollectionSummary }`
- **Errors**: `400 VALIDATION_ERROR` (including an empty body), `403 FORBIDDEN`,
  `404 COLLECTION_NOT_FOUND`, `409 COLLECTION_NAME_TAKEN`

```bash
curl -X PATCH http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0 \
  -H "Content-Type: application/json" \
  -d '{"name":"Coast","description":"Lighthouses only"}'
```

### `GET /collections/:id/activity`

The board's recent activity (newest 30, newest first): photos added, edited, and removed, and
invites. Each change appears once. Visible to the owner and every member.

- **Auth**: token required
- **Response 200**:
  `{ "activity": [{ "id", "type", "actor": PublicUser, "itemTitle", "imageUrl": string | null, "target": PublicUser | null, "role": "editor" | "viewer" | null, "createdAt" }] }`
  (`type` is `item_added`, `item_edited`, `item_removed`, or `member_invited`)
- **Errors**: `400 VALIDATION_ERROR`, `404 COLLECTION_NOT_FOUND`

```bash
curl http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/activity \
  -H "Authorization: Bearer $TOKEN"
```

### `GET /collections/:id/recommendations?page=`

"More ideas for this board": photos similar to the board's, found by searching for its most common
photo tags (two terms, widening to one if that finds fewer than 20), or words from its name and
description while it is empty. Photos already on the board are left out. Anyone who can view the
board may ask.

- **Auth**: token required
- **Query**: `page` (optional): 1–25, default `1`
- **Response 200**: the same shape as `GET /search/images`, plus `"basedOn": ["harbor", "boat"]`
  (the words searched)
- **Errors**: `400 VALIDATION_ERROR`, `404 COLLECTION_NOT_FOUND`, `502 IMAGE_SOURCE_UNAVAILABLE`

```bash
curl "http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/recommendations" \
  -H "Authorization: Bearer $TOKEN"
```

### `DELETE /collections/:id`

Permanently deletes a collection and everything saved in it. Stored image copies are removed too,
unless another collection still uses the same image. Members lose access and any share link stops
working. Owner only. (The client asks for confirmation first.)

- **Auth**: token required
- **Params**: `id` — collection id
- **Response 204**: no body
- **Errors**: `400 VALIDATION_ERROR` (malformed id), `403 FORBIDDEN`, `404 COLLECTION_NOT_FOUND`

```bash
curl -X DELETE http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0 \
  -H "Authorization: Bearer <token>"
```

## Items

All item endpoints: owners and editors only (viewers get `403 FORBIDDEN`). Items record who added
them (`addedBy`).

### `POST /collections/:id/items`

Saves a Pixabay image into a collection. The server looks the image up by id itself (it never
trusts image data or URLs from the browser) and stores its own copy of the image, because Pixabay
does not allow permanent hotlinking.

- **Auth**: token required
- **Params**: `id` — collection id
- **Body**: `{ "sourceId": "736877" }` — the Pixabay image id (digits only)
- **Response 201**: `{ "item": SavedItem }` — `title` defaults to the first two tags, `note` is `""`

  ```json
  {
    "item": {
      "id": "66e8a3b1c2d4e5f6a7b8c9d0",
      "collectionId": "66e8a1f2c3b4d5e6f7a8b9c0",
      "sourceId": "736877",
      "title": "Lighthouse, coast",
      "note": "",
      "tags": ["lighthouse", "coast", "sea"],
      "creatorName": "jplenio",
      "pageUrl": "https://pixabay.com/photos/lighthouse-736877/",
      "imageUrl": "/api/images/66e8a3b0c2d4e5f6a7b8c9cf",
      "width": 640,
      "height": 427,
      "createdAt": "2026-09-16T18:10:45.000Z",
      "updatedAt": "2026-09-16T18:10:45.000Z"
    }
  }
  ```

- **Errors**: `400 VALIDATION_ERROR` (bad id or `sourceId`), `404 COLLECTION_NOT_FOUND`,
  `404 IMAGE_NOT_FOUND` (Pixabay no longer has it), `409 ITEM_ALREADY_SAVED`,
  `502 IMAGE_SOURCE_UNAVAILABLE`

```bash
curl -X POST http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/items \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"736877"}'
```

### `PATCH /collections/:id/items/:itemId`

Edits a saved image's display title and/or personal note.

- **Auth**: token required
- **Params**: `id` — collection id; `itemId` — saved item id
- **Body** (at least one field):
  - `title`: up to 100 characters after trimming; an empty title resets it to the tag-based default
  - `note`: up to 500 characters
- **Response 200**: `{ "item": SavedItem }`
- **Errors**: `400 VALIDATION_ERROR` (with `fields.title` / `fields.note`, or an empty body),
  `404 COLLECTION_NOT_FOUND`, `404 ITEM_NOT_FOUND`

```bash
curl -X PATCH http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/items/66e8a3b1c2d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -d '{"title":"Hallway light","note":"For the upstairs hallway"}'
```

### `DELETE /collections/:id/items/:itemId`

Removes a saved image from one collection. The same image saved in other collections (with its own
title and note) is not affected.

- **Auth**: token required
- **Params**: `id` — collection id; `itemId` — saved item id
- **Response 204**: no body
- **Errors**: `400 VALIDATION_ERROR` (malformed ids), `404 COLLECTION_NOT_FOUND`,
  `404 ITEM_NOT_FOUND`

```bash
curl -X DELETE http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/items/66e8a3b1c2d4e5f6a7b8c9d0
```

## Explore

Public boards anyone can browse, no sign-in needed. Boards with no images are left out.

### `GET /explore?color=&page=`

- **Auth**: none
- **Query**:
  - `color` (optional): a color name from `GET /feed`; keeps boards whose palette leads with that
    color (`grayscale` keeps boards made only of black, gray, and white)
  - `page` (optional): integer ≥ 1, default `1`; 24 boards per page, most recently updated first
- **Response 200**:
  `{ "boards": (CollectionSummary & { owner: PublicUser })[], "page": 1, "perPage": 24, "total": 3, "hasMore": false }`
- **Errors**: `400 VALIDATION_ERROR`

```bash
curl "http://localhost:4000/api/explore?color=blue"
```

### `GET /explore/:id`

A public board's read-only view: the same shape as `GET /shared/:token` (no members, no token).

- **Auth**: none
- **Response 200**: `{ "collection": CollectionSummary & { owner: PublicUser, items: SavedItem[] } }`
- **Errors**: `400 VALIDATION_ERROR` (malformed id), `404 BOARD_NOT_PUBLIC`

```bash
curl http://localhost:4000/api/explore/66e8a1f2c3b4d5e6f7a8b9c0
```

## Notifications

Board members are notified when someone else adds, edits, or removes an item, and people are
notified when they are invited to a board. The person who acted is never notified about their own
change. The newest 50 are returned.

```ts
type Notification = {
  id: string;
  type: 'item_added' | 'item_edited' | 'item_removed' | 'member_invited';
  actor: PublicUser | null; // who did it
  collection: { id: string; name: string }; // name as it was at the time
  itemTitle: string; // "" for invites
  imageUrl: string | null; // thumbnail; null for removals and invites
  role: 'editor' | 'viewer' | null; // for invites
  read: boolean;
  createdAt: string;
};
```

### `GET /notifications`

- **Auth**: token required
- **Response 200**: `{ "notifications": Notification[], "unreadCount": 3 }` (newest first)

```bash
curl http://localhost:4000/api/notifications -H "Authorization: Bearer $TOKEN"
```

### `POST /notifications/:id/read`

Marks one notification as read.

- **Auth**: token required
- **Response 204**
- **Errors**: `400 VALIDATION_ERROR`, `404 NOTIFICATION_NOT_FOUND`

### `POST /notifications/read-all`

Marks all of your notifications as read.

- **Auth**: token required
- **Response 204**

```bash
curl -X POST http://localhost:4000/api/notifications/read-all -H "Authorization: Bearer $TOKEN"
```

## Sharing

### `POST /collections/:id/share`

Turns the share link on. Every call creates a **new** random token (24 URL-safe characters), so a
link that was turned off never works again. Owner only.

- **Auth**: token required
- **Response 200**: `{ "shareToken": "7fQ2vMk9Ld3XpRt..." }` — the client link is `/s/<shareToken>`
- **Errors**: `403 FORBIDDEN`, `404 COLLECTION_NOT_FOUND`

```bash
curl -X POST http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/share \
  -H "Authorization: Bearer <token>"
```

### `DELETE /collections/:id/share`

Turns the share link off; the old link stops working immediately. Owner only.

- **Auth**: token required
- **Response 204**: no body
- **Errors**: `403 FORBIDDEN`, `404 COLLECTION_NOT_FOUND`

```bash
curl -X DELETE http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/share \
  -H "Authorization: Bearer <token>"
```

### `GET /shared/:token`

The read-only board anyone with an active link can see. No members or token are included.

- **Auth**: public
- **Response 200**: `{ "collection": SharedView }`
- **Errors**: `400 VALIDATION_ERROR` (malformed token), `404 SHARE_LINK_INACTIVE`

```bash
curl http://localhost:4000/api/shared/7fQ2vMk9Ld3XpRtAbCdEfGhI
```

## Members

### `POST /collections/:id/members`

Invites an existing user as an editor or viewer; they get access immediately. Owner only.

- **Auth**: token required
- **Body**: `{ "usernameOrEmail": "bob", "role": "editor" }` (`role` is `editor` or `viewer`)
- **Response 201**: `{ "members": [Member] }`
- **Errors**: `400 VALIDATION_ERROR`, `400 CANNOT_INVITE_SELF`, `403 FORBIDDEN`,
  `404 USER_NOT_FOUND`, `409 ALREADY_MEMBER`

```bash
curl -X POST http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/members \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"bob","role":"editor"}'
```

### `PATCH /collections/:id/members/:userId`

Changes a member's role. Owner only.

- **Auth**: token required
- **Body**: `{ "role": "viewer" }`
- **Response 200**: `{ "members": [Member] }`
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 MEMBER_NOT_FOUND`

```bash
curl -X PATCH http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/members/66e8af00c2d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"role":"viewer"}'
```

### `DELETE /collections/:id/members/:userId`

The owner removes a member, or a member removes themselves ("leave"). The owner cannot leave.

- **Auth**: token required
- **Response 204**: no body
- **Errors**: `400 CANNOT_LEAVE_OWN_COLLECTION`, `403 FORBIDDEN`, `404 MEMBER_NOT_FOUND`

```bash
curl -X DELETE http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/members/66e8af00c2d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer <token>"
```

## Images

### `GET /images/:id`

Returns the stored bytes of a saved image. `imageUrl` and `coverImageUrl` fields point here.

- **Auth**: public (image tags can't send tokens, and share-link visitors need the images)
- **Params**: `id` — image asset id
- **Response 200**: image bytes with `Content-Type` (e.g. `image/jpeg`) and
  `Cache-Control: public, max-age=31536000, immutable`
- **Errors**: `400 VALIDATION_ERROR` (malformed id), `404 IMAGE_NOT_FOUND`

```bash
curl -o photo.jpg http://localhost:4000/api/images/66e8a3b0c2d4e5f6a7b8c9cf
```

## Known limitations

- `GET /images/:id` is public: `<img>` tags cannot send a token, and share-link visitors must see
  images. Asset ids are random ObjectIds only revealed to people who can see the collection.
- Sessions are 7-day tokens stored by the client; there is no server-side sign-out of other devices
  and no password reset (out of scope).
- The Pixabay response cache lives in server memory, so it resets when the server restarts.

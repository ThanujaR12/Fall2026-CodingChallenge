# API Contract: Discover & Collect (Core)

**Feature**: [spec.md](../spec.md) | **Data model**: [data-model.md](../data-model.md)

Base URL: `http://localhost:4000/api` (`VITE_API_URL` on the client). JSON in and out, except
`GET /images/:id` (image bytes). This document is the source for `server/API.md`
(Constitution IV) and for `client/src/types/api.ts`.

**Auth (Feature 1)**: none. Every request acts as the stand-in owner. Feature 2 adds
`Authorization: Bearer <jwt>` without changing these shapes.

## Conventions

- Success: `200 OK` (read/update), `201 Created` (create), `204 No Content` (delete).
- Every error body has exactly this shape:

```json
{ "error": { "code": "COLLECTION_NOT_FOUND", "message": "That collection doesn't exist." } }
```

- `VALIDATION_ERROR` responses may add `"fields": { "name": "Name must be 1–60 characters." }`
  inside `error` so forms can show per-field messages (FR-026).

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | body/query/params fail validation |
| 404 | `COLLECTION_NOT_FOUND` | collection missing or not owned by current user |
| 404 | `ITEM_NOT_FOUND` | item missing or not in that collection |
| 404 | `IMAGE_NOT_FOUND` | asset missing / Pixabay id unknown |
| 404 | `ROUTE_NOT_FOUND` | unknown path |
| 409 | `COLLECTION_NAME_TAKEN` | name matches another of the owner's collections (case-insensitive) |
| 409 | `ITEM_ALREADY_SAVED` | image already in that collection |
| 502 | `IMAGE_SOURCE_UNAVAILABLE` | Pixabay failed, timed out (8 s), or rate-limited |
| 500 | `INTERNAL_ERROR` | anything unexpected (message is generic; details only in server log) |

## Shared types

```ts
type SearchResult = {
  sourceId: string;          // Pixabay id
  title: string;             // derived from tags
  tags: string[];
  creatorName: string;
  pageUrl: string;           // Pixabay page (credit link)
  thumbnailUrl: string;      // temporary Pixabay URL, display only
  width: number;
  height: number;
};

type CollectionSummary = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  coverImageUrl: string | null;   // "/api/images/<assetId>" of newest item
  coverCreatorName: string | null; // credit for the cover image (Pixabay attribution)
  coverPageUrl: string | null;     // Pixabay page of the cover image
  createdAt: string;              // ISO 8601
  updatedAt: string;
  containsImage?: boolean;        // only when ?sourceId= was given
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
  imageUrl: string;               // "/api/images/<assetId>"
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
};

type CollectionDetail = CollectionSummary & { items: SavedItem[] };  // items newest first
```

---

## Health

### `GET /health`
- **200** `{ "status": "ok" }` — used by quickstart to confirm the server is up.

## Search

### `GET /search/images?q=&page=`
Proxies Pixabay (safe search, photos, 20 per page). Cached 24 h per `q|page`.

| Query | Rules |
|-------|-------|
| `q` | required, trimmed, 1–100 chars |
| `page` | optional integer ≥ 1, default 1; `page × 20 ≤ 500` |

- **200**
  ```json
  { "results": [SearchResult], "page": 1, "perPage": 20, "total": 500, "hasMore": true }
  ```
  `total` = `min(totalHits, 500)`; `hasMore` = `page × perPage < total`. Zero matches →
  `results: []`, `total: 0`, `hasMore: false`.
- **400** `VALIDATION_ERROR` (empty/too-long `q`, bad `page`)
- **502** `IMAGE_SOURCE_UNAVAILABLE`

## Collections

### `GET /collections[?sourceId=]`
Current user's collections, most recently updated first (FR-009).
- `sourceId` (optional, digits): adds `containsImage` to each summary (FR-015a).
- **200** `{ "collections": [CollectionSummary] }`

### `POST /collections`
Body: `{ "name": string, "description"?: string }`
- **201** `{ "collection": CollectionSummary }`
- **400** `VALIDATION_ERROR` · **409** `COLLECTION_NAME_TAKEN`

### `GET /collections/:id`
- **200** `{ "collection": CollectionDetail }`
- **400** `VALIDATION_ERROR` (bad id) · **404** `COLLECTION_NOT_FOUND`

### `PATCH /collections/:id`
Body: `{ "name"?: string, "description"?: string }` — at least one field.
- **200** `{ "collection": CollectionSummary }`
- **400** `VALIDATION_ERROR` · **404** `COLLECTION_NOT_FOUND` · **409** `COLLECTION_NAME_TAKEN`
  (renaming to its own name with different case is allowed)

### `DELETE /collections/:id`
Deletes the collection, its items, and orphaned image assets. Confirmation is a UI concern.
- **204** · **404** `COLLECTION_NOT_FOUND`

## Items

### `POST /collections/:id/items`
Body: `{ "sourceId": string }` — the server looks up Pixabay data itself and stores a copy of the
image (research R1).
- **201** `{ "item": SavedItem }`
- **400** `VALIDATION_ERROR` · **404** `COLLECTION_NOT_FOUND` / `IMAGE_NOT_FOUND`
- **409** `ITEM_ALREADY_SAVED` · **502** `IMAGE_SOURCE_UNAVAILABLE`

### `PATCH /collections/:id/items/:itemId`
Body: `{ "title"?: string, "note"?: string }` — at least one field. Empty `title` resets it to the
tag-derived default.
- **200** `{ "item": SavedItem }`
- **400** `VALIDATION_ERROR` · **404** `COLLECTION_NOT_FOUND` / `ITEM_NOT_FOUND`

### `DELETE /collections/:id/items/:itemId`
- **204** · **404** `COLLECTION_NOT_FOUND` / `ITEM_NOT_FOUND`

## Images

### `GET /images/:id`
Returns stored image bytes for saved items.
- **200** body = image bytes; `Content-Type` from asset;
  `Cache-Control: public, max-age=31536000, immutable`
- **400** `VALIDATION_ERROR` · **404** `IMAGE_NOT_FOUND`
- **Known limitation**: not owner-scoped in Feature 1 (single stand-in user; asset ids are
  unguessable ObjectIds). Revisit when Feature 2 adds private collections and multiple accounts.

---

## Client route contract (UI)

| Path | Screen | Design reference |
|------|--------|------------------|
| `/` | redirects to `/search` | — |
| `/search?q=` | Search: field, results grid, Load more, save popover | `02-search.png`, `02b-search-states.png`, `08-phone…` |
| `/collections` | My collections grid + New collection dialog | `03-my-collections.png` |
| `/collections/:id?item=<itemId>` | Collection header, Edit, Delete, item grid, item detail panel (side panel ≥1024 px, sheet on phone) | `04-collection.png`, `08-phone…` |
| `*` | Not-found page with link to search | — |

The `q` and `item` query parameters make searches and open detail views reload-safe and shareable
within the browser (back button works).

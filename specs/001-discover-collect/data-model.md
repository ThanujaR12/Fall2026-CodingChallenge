# Data Model: Discover & Collect (Core)

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

Store: MongoDB (Atlas) via Mongoose. All documents get `createdAt` / `updatedAt` from
`{ timestamps: true }`. IDs are ObjectIds, exposed to the API as `id` strings.

```text
User (stand-in) 1 ──< Collection 1 ──< SavedItem >── 1 ImageAsset
                                        (asset shared by items of the same Pixabay image)
```

---

## User

Feature 1 has exactly one user: the stand-in owner (clarification Q1). Feature 2 adds credentials.

| Field | Type | Rules |
|-------|------|-------|
| `username` | string | required, unique. Stand-in value: `"you"` |
| `isStandIn` | boolean | default `false`; `true` for the built-in owner |
| `createdAt`, `updatedAt` | Date | automatic |

- Created idempotently at server start (`ensureStandInUser`, upsert on `isStandIn: true`).
- Feature 2 will add `email` and `passwordHash` and transfer stand-in collections to the first
  registered account (FR-029).

## Collection

| Field | Type | Rules | Spec |
|-------|------|-------|------|
| `owner` | ObjectId → User | required, indexed | FR-029 |
| `name` | string | required; trimmed; 1–60 chars | FR-007, FR-011 |
| `nameKey` | string | `name.trim().toLowerCase()`, set by service | FR-008 |
| `description` | string | trimmed; 0–280 chars; default `""` | FR-007 |
| `createdAt`, `updatedAt` | Date | `updatedAt` bumped on any item change | FR-009 |

**Indexes**
- `{ owner: 1, nameKey: 1 }` **unique** → duplicate names per owner rejected (409).
- `{ owner: 1, updatedAt: -1 }` → list ordering.

**Derived (not stored)**: `itemCount`, `cover` (newest item's asset id or `null`), and the cover's
credit `coverCreatorName` / `coverPageUrl` (newest item's `creatorName` / `pageUrl`, or `null`) so
collection cards can show Pixabay attribution (FR-025) — computed per
[research R5](./research.md#r5-collection-list-counts-covers-ordering).

**Lifecycle**
- Create → appears first in list (newest `updatedAt`).
- Rename / edit description → `updatedAt` bumped; same validation as create.
- Item saved / edited / removed → `touchCollection` bumps `updatedAt`.
- Delete (after UI confirmation) → deletes all its `SavedItem`s, then orphaned `ImageAsset`s, then
  the collection (FR-012).

## SavedItem

One image saved into one collection.

| Field | Type | Rules | Spec |
|-------|------|-------|------|
| `collectionId` | ObjectId → Collection | required, indexed (named `collectionId` because Mongoose reserves `collection` on documents) | |
| `addedBy` | ObjectId → User | required (stand-in in F1; used for "added by" in F2) | |
| `source` | `"pixabay"` | required, enum | |
| `sourceId` | string | required (Pixabay image id as string) | FR-015 |
| `asset` | ObjectId → ImageAsset | required | FR-017 |
| `width`, `height` | number | from downloaded image; used for layout placeholders | |
| `pageUrl` | string | Pixabay page URL (credit link) | FR-022, FR-025 |
| `tags` | string[] | split + trimmed from Pixabay `tags` | FR-003, FR-022 |
| `creatorName` | string | Pixabay `user` | FR-025 |
| `title` | string | trimmed; 1–100 chars; default `titleFromTags(tags)`; empty input → default | FR-018, FR-019 |
| `note` | string | 0–500 chars; default `""` | FR-019 |
| `createdAt`, `updatedAt` | Date | `createdAt` = "saved time" for ordering | FR-021 |

**Indexes**
- `{ collectionId: 1, source: 1, sourceId: 1 }` **unique** → same image once per collection (409).
- `{ collectionId: 1, createdAt: -1 }` → newest-first grid.
- `{ asset: 1 }` → orphan check on removal.

**Lifecycle**
- Save → server resolves image by `sourceId` (cache → Pixabay `?id=`), finds or creates the
  `ImageAsset`, inserts item; duplicate → `409 ITEM_ALREADY_SAVED`.
- Edit → only `title` and `note` are editable (explicit Save, clarification Q2).
- Remove → delete item; if no other item references its `asset`, delete the asset. Other
  collections' items are untouched (FR-020).

## ImageAsset

Locally stored copy of a saved image (Pixabay forbids permanent hotlinking — research R1).

| Field | Type | Rules |
|-------|------|-------|
| `source` | `"pixabay"` | required |
| `sourceId` | string | required |
| `data` | Buffer | required; image bytes (webformat, ~640 px) |
| `contentType` | string | e.g. `image/jpeg`; must start with `image/` |
| `byteLength` | number | ≤ 5 MB (reject larger) |
| `width`, `height` | number | from Pixabay `webformatWidth/Height` |
| `createdAt` | Date | automatic |

**Indexes**: `{ source: 1, sourceId: 1 }` **unique**.

- `data` is excluded from all queries by default (`select: false`) and read only by
  `GET /api/images/:id`.
- Never exposed except as bytes; API responses reference it as `imageUrl: "/api/images/<id>"`.

## Non-persisted shapes

### SearchResult (from Pixabay, cached 24 h)

| Field | Source |
|-------|--------|
| `sourceId` | `String(hit.id)` |
| `title` | `titleFromTags(hit.tags)` |
| `tags` | `hit.tags` split |
| `creatorName` | `hit.user` |
| `pageUrl` | `hit.pageURL` |
| `thumbnailUrl` | `hit.webformatURL` (temporary display only) |
| `width`, `height` | `hit.webformatWidth`, `hit.webformatHeight` |

### Validation summary (shared zod schemas, server `src/schemas/`)

| Input | Rule | Error code |
|-------|------|-----------|
| search `q` | trimmed, 1–100 chars | `VALIDATION_ERROR` |
| search `page` | integer ≥ 1; `page * 20 ≤ 500` | `VALIDATION_ERROR` |
| collection `name` | trimmed, 1–60 | `VALIDATION_ERROR` |
| collection `description` | ≤ 280 | `VALIDATION_ERROR` |
| item `sourceId` | digits only, 1–20 chars | `VALIDATION_ERROR` |
| item `title` | trimmed, ≤ 100 (empty → default) | `VALIDATION_ERROR` |
| item `note` | ≤ 500 | `VALIDATION_ERROR` |
| any `:id` param | valid ObjectId | `VALIDATION_ERROR` |

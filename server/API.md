# PixBoard API

REST API for PixBoard (displayed as "Palette Boards"): search Pixabay images, organize them into
collections, and edit or remove saved items.

- **Base URL**: `http://localhost:4000/api`
- **Format**: JSON request and response bodies, except `GET /images/:id` (image bytes).
- **Auth (Feature 1)**: none — every request acts as the built-in stand-in user. Feature 2 adds
  `Authorization: Bearer <token>` without changing these shapes.

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

| Status | Code                       | When                                                                |
| ------ | -------------------------- | ------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`         | Body, query, or params fail validation (or the JSON is malformed)   |
| 404    | `COLLECTION_NOT_FOUND`     | Collection missing or not owned by the current user                 |
| 404    | `ITEM_NOT_FOUND`           | Item missing or not in that collection                              |
| 404    | `IMAGE_NOT_FOUND`          | Stored image missing, or the Pixabay image no longer exists         |
| 404    | `ROUTE_NOT_FOUND`          | Unknown path                                                        |
| 409    | `COLLECTION_NAME_TAKEN`    | Name matches another of your collections (ignoring case and spaces) |
| 409    | `ITEM_ALREADY_SAVED`       | The image is already in that collection                             |
| 502    | `IMAGE_SOURCE_UNAVAILABLE` | Pixabay failed, timed out (8 s), or rate-limited the request        |
| 500    | `INTERNAL_ERROR`           | Anything unexpected (details are only in the server log)            |

## Shared types

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

type CollectionDetail = CollectionSummary & { items: SavedItem[] }; // items newest first
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

## Search

### `GET /search/images?q=&page=`

Searches Pixabay photos (safe search on, 20 per page). Identical searches are cached for 24 hours,
as Pixabay requires.

- **Auth**: none
- **Query**:
  - `q` (required): keyword, 1–100 characters after trimming
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

Lists the current user's collections, most recently updated first. Creating, renaming, or editing
a collection, or saving, editing, or removing one of its items, counts as an update.

- **Auth**: none (stand-in user)
- **Query**:
  - `sourceId` (optional): a Pixabay image id (digits). When given, each summary also includes
    `containsImage: true | false`, used by the save picker to mark collections that already hold
    that image.
- **Response 200**: `{ "collections": [CollectionSummary] }`

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
        "createdAt": "2026-09-16T18:02:11.000Z",
        "updatedAt": "2026-09-16T18:10:45.000Z"
      }
    ]
  }
  ```

- **Errors**: `400 VALIDATION_ERROR`

```bash
curl http://localhost:4000/api/collections
curl "http://localhost:4000/api/collections?sourceId=736877"
```

### `POST /collections`

Creates a collection.

- **Auth**: none (stand-in user)
- **Body**:
  - `name` (required): 1–60 characters after trimming; must not match another of your collections
    (ignoring case and surrounding spaces)
  - `description` (optional): up to 280 characters, default `""`
- **Response 201**: `{ "collection": CollectionSummary }` (with `itemCount: 0` and null cover fields)
- **Errors**: `400 VALIDATION_ERROR` (with `fields.name` / `fields.description`),
  `409 COLLECTION_NAME_TAKEN`

```bash
curl -X POST http://localhost:4000/api/collections \
  -H "Content-Type: application/json" \
  -d '{"name":"Coast trip","description":"Lighthouses and fog"}'
```

### `GET /collections/:id`

Returns one collection with all of its saved items, newest first.

- **Auth**: none (stand-in user)
- **Params**: `id` — collection id
- **Response 200**: `{ "collection": CollectionDetail }` — a `CollectionSummary` plus `items: [SavedItem]`
- **Errors**: `400 VALIDATION_ERROR` (malformed id), `404 COLLECTION_NOT_FOUND`

```bash
curl http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0
```

### `PATCH /collections/:id`

Renames a collection and/or edits its description. Uses the same rules as creation.

- **Auth**: none (stand-in user)
- **Params**: `id` — collection id
- **Body** (at least one field):
  - `name`: 1–60 characters after trimming; must not match another of your collections (changing
    only the capitalization of its own name is allowed)
  - `description`: up to 280 characters
- **Response 200**: `{ "collection": CollectionSummary }`
- **Errors**: `400 VALIDATION_ERROR` (including an empty body), `404 COLLECTION_NOT_FOUND`,
  `409 COLLECTION_NAME_TAKEN`

```bash
curl -X PATCH http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0 \
  -H "Content-Type: application/json" \
  -d '{"name":"Coast","description":"Lighthouses only"}'
```

### `DELETE /collections/:id`

Permanently deletes a collection and everything saved in it. Stored image copies are removed too,
unless another collection still uses the same image. (The client asks for confirmation first.)

- **Auth**: none (stand-in user)
- **Params**: `id` — collection id
- **Response 204**: no body
- **Errors**: `400 VALIDATION_ERROR` (malformed id), `404 COLLECTION_NOT_FOUND`

```bash
curl -X DELETE http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0
```

## Items

### `POST /collections/:id/items`

Saves a Pixabay image into a collection. The server looks the image up by id itself (it never
trusts image data or URLs from the browser) and stores its own copy of the image, because Pixabay
does not allow permanent hotlinking.

- **Auth**: none (stand-in user)
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

- **Auth**: none (stand-in user)
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

- **Auth**: none (stand-in user)
- **Params**: `id` — collection id; `itemId` — saved item id
- **Response 204**: no body
- **Errors**: `400 VALIDATION_ERROR` (malformed ids), `404 COLLECTION_NOT_FOUND`,
  `404 ITEM_NOT_FOUND`

```bash
curl -X DELETE http://localhost:4000/api/collections/66e8a1f2c3b4d5e6f7a8b9c0/items/66e8a3b1c2d4e5f6a7b8c9d0
```

## Images

### `GET /images/:id`

Returns the stored bytes of a saved image. `imageUrl` and `coverImageUrl` fields point here.

- **Auth**: none
- **Params**: `id` — image asset id
- **Response 200**: image bytes with `Content-Type` (e.g. `image/jpeg`) and
  `Cache-Control: public, max-age=31536000, immutable`
- **Errors**: `400 VALIDATION_ERROR` (malformed id), `404 IMAGE_NOT_FOUND`

```bash
curl -o photo.jpg http://localhost:4000/api/images/66e8a3b0c2d4e5f6a7b8c9cf
```

## Known limitations (Feature 1)

- There are no accounts yet: every request acts as one built-in stand-in user. Feature 2 adds
  sign-in and hands the stand-in user's collections to the first account that registers.
- `GET /images/:id` is not scoped to an owner. With a single user this is harmless (and asset ids
  are unguessable ObjectIds); revisit it when Feature 2 adds private collections.
- The Pixabay response cache lives in server memory, so it resets when the server restarts.

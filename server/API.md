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
- **Query**: none
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

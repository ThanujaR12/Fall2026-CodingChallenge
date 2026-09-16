# Research: Discover & Collect (Core)

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-16

Each entry: Decision → Rationale → Alternatives considered. All Technical Context unknowns are
resolved here.

---

## R1. Pixabay usage rules (search, caching, hotlinking, attribution)

Source: https://pixabay.com/api/docs/ (fetched 2026-09-16).

Facts that shape the design:

- Rate limit: 100 requests / 60 s per key; `429` when exceeded. `X-RateLimit-*` headers returned.
- API responses **must be cached for 24 hours**.
- **Permanent hotlinking is not allowed** — images an app keeps must be downloaded to its own
  server. `webformatURL` is valid for only 24 hours. Temporary display of search results via
  Pixabay URLs is fine.
- Attribution: show users where images come from whenever search results are displayed.
- `q` max 100 chars; `per_page` 3–200 (default 20); `safesearch=true` available; at most 500 hits
  reachable per query; `id` parameter fetches a single image.
- Hit fields used: `id`, `pageURL`, `tags`, `previewURL`, `webformatURL`, `largeImageURL`,
  `webformatWidth/Height`, `user`.

**Decision**:
1. All Pixabay calls happen in `server/src/services/pixabayService.ts`; the key never reaches the
   client (Constitution V).
2. Search responses are cached in memory for 24 h keyed by `q|page|perPage`; every hit is also
   cached by `id` for 24 h so a later save needs no extra request.
3. Search results are displayed with Pixabay's temporary URLs (allowed).
4. **On save, the server downloads the `webformatURL` image (~640 px) once and stores the bytes in
   the database** (`ImageAsset`); saved items are displayed from `GET /api/images/:assetId`.
5. The client sends only `{ sourceId }` when saving. The server looks the image up itself (cache,
   then `?id=`), so it never fetches an arbitrary client-supplied URL (prevents SSRF and spoofed
   metadata).
6. `safesearch=true`, `image_type=photo`, `per_page=20` on every search.
7. Every card, detail view, and the search page show "Photo by {user} on Pixabay" linking to
   `pageURL`.

**Rationale**: Satisfies Pixabay's caching and hotlinking terms (spec FR-025, Edge Case "source
removes an image"), keeps saved items working after `webformatURL` expires, and protects the rate
limit (Constitution VII).

**Alternatives considered**:
- *Store Pixabay URLs only* — rejected: violates hotlinking rule; `webformatURL` breaks after 24 h.
- *Store `largeImageURL`* (permanent URL) — still hotlinking; rejected.
- *Save files to server disk* — lost on free-tier redeploys (Render ephemeral disk); rejected.
- *Cloud object storage (S3/Cloudinary)* — another account and secret for a two-day project;
  rejected as unneeded complexity.
- *Download the large image* — 3–10× the bytes of webformat for little visible gain at card and
  side-panel sizes; rejected.

## R2. Where saved image bytes live

**Decision**: A separate `ImageAsset` MongoDB collection holding `data: Buffer` (~40–150 KB each),
`contentType`, `width`, `height`, unique on `(source, sourceId)`. Assets are shared by all saved
items of the same image and deleted when the last item referencing them is removed.

**Rationale**: One datastore (Atlas) that already survives restarts and redeploys; far below the
16 MB document limit; Atlas free tier (512 MB) holds thousands of images. Keeping bytes out of
`SavedItem` keeps list queries small.

**Alternatives considered**: GridFS (built for >16 MB files; more API surface than needed);
inline Buffer on `SavedItem` (bloats every collection-grid query; duplicates bytes across
collections).

## R3. Stand-in owner (clarification Q1)

**Decision**: On server start, `ensureStandInUser()` upserts one `User` with
`username: "you"`, `isStandIn: true`. Middleware `currentUser` sets `req.userId` to that user's
id for every request. All collection queries filter by `owner: req.userId`.

**Rationale**: Feature 2 replaces only the `currentUser` middleware (JWT) and adds a one-time
transfer (`Collection.updateMany({ owner: standInId }, { owner: firstUserId })`). Permission and
query code written now does not change.

**Alternatives considered**: No owner field (Feature 2 would need a data migration and query
rewrites); owner as a free string (no referential shape for Feature 2).

## R4. Case-insensitive unique collection names

**Decision**: Store `nameKey = name.trim().toLowerCase()` alongside `name`; unique index
`{ owner: 1, nameKey: 1 }`. The service pre-checks for a friendly error; the index is the final
guard (duplicate-key error → `409 COLLECTION_NAME_TAKEN`).

**Rationale**: Readable, explicit, and race-safe.

**Alternatives considered**: Collation-based index (`strength: 2`) — correct but less obvious to a
reader and easy to break by querying without the same collation.

## R5. Collection list: counts, covers, ordering

**Decision**: `collectionService.listForOwner` runs one query for collections sorted by
`updatedAt` desc and one `SavedItem.aggregate` grouped by `collection` for `itemCount` and newest
item's `asset` (cover). Any item save/edit/remove calls `touchCollection(id)` to bump `updatedAt`.

**Rationale**: Always correct (no denormalized counter to drift); two simple queries at this scale.

**Alternatives considered**: Stored `itemCount`/`coverAssetId` counters — faster but can drift on
partial failures; unnecessary at single-user scale.

## R6. "Already saved" marker in the save step (clarification Q3)

**Decision**: `GET /api/collections?sourceId=<pixabayId>` returns the normal summaries plus
`containsImage: boolean` per collection (one extra `SavedItem.find({ sourceId }).distinct(...)`).
The popover requests it when opened.

**Rationale**: One request, reuses the list endpoint and its types, no per-result lookups for the
whole search grid.

**Alternatives considered**: Annotate every search hit with `savedIn[]` (couples search to
collections, extra work on every page); separate `/items/lookup` endpoint (more surface for the
same data).

## R7. Frontend stack details

**Decision**:
- Vite 7 + React 19 + TypeScript (strict).
- Tailwind CSS v4 (`@tailwindcss/vite`) with Broadsheet tokens in `@theme` in `src/index.css`.
- shadcn/ui components copied into `src/components/ui/`: `button`, `input`, `textarea`, `label`,
  `popover`, `dialog`, `alert-dialog`, `sheet`, `skeleton`, `sonner`. Restyled once via tokens to
  2 px radius, serif type, cyan accent.
- Icons: `@phosphor-icons/react` (duotone), per `design/design-notes.md`.
- Font: Source Serif 4 from Google Fonts (400, 600, italic 400).
- React Router 7 (data-less `BrowserRouter` usage); TanStack Query 5 (`useInfiniteQuery` for search,
  `useMutation` with cache updates for edits/removes).
- Toasts (`sonner`) for save confirmation and errors.

**Rationale**: Matches the tech-stack input and rubric top tier (TypeScript + component library);
shadcn components are plain source files a student can read and restyle to Broadsheet.

**Alternatives considered**: Mantine (heavier theming to reach the flat, square Broadsheet look);
lucide icons (shadcn default, but design specifies Phosphor duotone).

## R8. Backend stack details

**Decision**: Node 22 LTS, Express 5 (rejected promises reach the error handler without wrappers),
Mongoose 8, zod 4, `cors`, `helmet`, `morgan` (dev request logs), `dotenv`. Dev runner `tsx watch`;
build `tsc` → `dist/`. Config loaded and validated once with zod in `src/config/env.ts` (fails fast
on missing `MONGODB_URI` / `PIXABAY_API_KEY`).

**Rationale**: Express 5 removes async try/catch boilerplate, keeping controllers short and
readable. Env validation gives a clear message on a fresh clone (Constitution VIII).

**Alternatives considered**: Express 4 + `express-async-handler` (extra wrapper on every route);
`ts-node` (slower, ESM friction).

## R9. In-memory cache

**Decision**: A small `TtlCache<K, V>` utility (`server/src/utils/ttlCache.ts`): `Map` with expiry
timestamps and a max size (500 search pages, 5,000 hits), evicting oldest on overflow.

**Rationale**: ~30 lines, no dependency, easy to explain and unit test. A single server process
makes a shared cache (Redis) unnecessary.

**Alternatives considered**: `lru-cache` package (fine, but hides simple logic); Redis (extra
service).

## R10. Testing approach

**Decision**:
- Server: Vitest + Supertest against the real Express app, with `mongodb-memory-server` for an
  isolated database and `pixabayService` mocked via `vi.mock` (no network, no key needed).
- Required coverage (Constitution VIII): collection create/rename/delete rules, duplicate names,
  save item (incl. duplicate 409 and asset download), edit item validation, remove item (asset
  cleanup, other collections unaffected), error shape, search validation and upstream failure.
- Unit test for `TtlCache` and `titleFromTags`.
- Client: no automated tests in Feature 1 (not required by the constitution); verified through
  `quickstart.md` scenarios.

**Rationale**: Covers the critical paths the constitution names without slowing delivery.

**Alternatives considered**: Testing against Atlas (slow, shared state, needs secrets in CI);
Playwright end-to-end (valuable but time-costly before the deadline).

## R11. Default display title

**Decision**: `titleFromTags(tags)` takes the first two comma-separated Pixabay tags, capitalizes
the first letter, joins with ", " (e.g., `"mountain, lake, sky"` → `"Mountain, lake"`), falls back
to `"Untitled photo"`. Used for search cards and as the stored default when saving; clearing the
title on edit restores it.

**Rationale**: Pixabay has no title field; the design's cards show a title line.

## R12. Search "Load more" vs design mockup (clarification Q4)

The mockup `design/screens/02-search.png` shows "Loading more as you scroll…". The clarified spec
(FR-004) requires a keyboard-accessible **Load more** button.

**Decision**: Follow the spec: a secondary-style "Load more" button under the grid, styled with
the mockup's footer treatment; "End of results" note when `hasMore` is false.

**Rationale**: The spec is the source of truth after clarification; a button is accessible and
testable. Auto-loading can be layered on later without changing the API.

## R13. Brand name

The design wordmark reads "Palette Boards"; the repository is PixBoard. **Decision**: the header
wordmark and page titles read from one constant `APP_NAME` in `client/src/lib/constants.ts`,
initially `"Palette Boards"` to match the design. Change in one place if desired.

## R14. Out of scope for this feature (noted for later features)

Color filter swatches, palettes and palette-themed headers, avatar/notification bell, Explore,
Share, members, public/private tags — all visible in the design but belong to Features 2–3. The
Feature 1 nav shows **Search** and **My collections** only.

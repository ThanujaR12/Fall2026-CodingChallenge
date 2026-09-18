---

description: "Task list for Feature 1 — Discover & Collect (Core)"
---

# Tasks: Discover & Collect (Core)

**Input**: Design documents from `specs/001-discover-collect/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md), [quickstart.md](./quickstart.md)

**Tests**: Included for server critical paths only. Constitution VIII requires automated tests for
collection rules and add/edit/remove items (Vitest + Supertest, in-memory MongoDB, Pixabay mocked).
The client has no automated tests in this feature; it is verified with the quickstart scenarios.

**Organization**: Tasks are grouped by user story so each story can be built, run, and committed
as one increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story from spec.md (US1–US7)
- Paths are relative to the repository root: `server/…` and `client/…` (web app, see plan.md)

## Rules that apply to every task

- Every new source file starts with a one-line purpose comment (Constitution II).
- Server errors are thrown as `AppError(status, code, message)` and rendered only by
  `errorHandler` as `{ "error": { "code", "message" } }` (Constitution IV).
- Client HTTP calls live only in `client/src/api/*` (Constitution III).
- Styling uses the Broadsheet tokens from `client/src/index.css`; never hard-code hex values in
  components (Constitution VI).
- Any task that adds or changes an endpoint also documents it in `server/API.md` (method, path,
  auth, body, responses, `curl` example) in the same commit (Constitution IV).
- Before every commit: `npm run lint` and `npm run format:check` pass in each project touched
  (Constitution II).
- Commit after each task group with a conventional message, e.g. `feat(api): add save item endpoint`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the two projects, tooling, and environment templates.

- [X] T001 Create `server/package.json` (name `pixboard-server`, `"type": "module"`, Node ≥22) with scripts `dev` (`tsx watch src/server.ts`), `build` (`tsc`), `start` (`node dist/server.js`), `test` (`vitest run`), `lint` (`eslint .`), `format` (`prettier --write .`), `format:check` (`prettier --check .`); install deps `express@5 mongoose@8 zod@4 cors helmet morgan dotenv` and dev deps `typescript tsx vitest supertest mongodb-memory-server @types/express @types/cors @types/morgan @types/supertest @types/node eslint @eslint/js typescript-eslint prettier eslint-config-prettier`
- [X] T002 Create `server/tsconfig.json` (strict, `target` ES2022, `module`/`moduleResolution` NodeNext, `outDir` `dist`, `rootDir` `src`, include `src`) and `server/vitest.config.ts` (environment node, `setupFiles: ['tests/setup.ts']`, `testTimeout` 30000)
- [X] T003 [P] Create `server/eslint.config.js` (flat config: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier`, ignore `dist`), `server/.prettierrc` (`{"singleQuote": true, "semi": true, "printWidth": 100, "trailingComma": "all"}`), and `server/.prettierignore` (`dist`, `node_modules`)
- [X] T004 [P] Create `server/.env.example` with `PORT=4000`, `MONGODB_URI=`, `PIXABAY_API_KEY=`, `CLIENT_ORIGIN=http://localhost:5173`, each with a one-line comment explaining where to get it
- [X] T005 [P] Scaffold `client/` with Vite React + TypeScript template (`npm create vite@latest client -- --template react-ts`), remove the demo assets/CSS, and install `react-router@7 @tanstack/react-query@5 @phosphor-icons/react sonner` plus `tailwindcss @tailwindcss/vite` (dev); add scripts `lint`, `format` (`prettier --write .`), `format:check` (`prettier --check .`) to `client/package.json`
- [X] T006 Configure `client/vite.config.ts` (react plugin, `@tailwindcss/vite`, alias `@` → `./src`) and add `"paths": { "@/*": ["./src/*"] }` with `baseUrl` to `client/tsconfig.app.json`; initialize shadcn/ui with `npx shadcn@latest init` producing `client/components.json` and `client/src/lib/utils.ts` (`cn()`)
- [X] T007 [P] Add `client/.prettierrc` (same settings as server) and `client/.prettierignore`; ensure `client/eslint.config.js` includes `eslint-config-prettier`
- [X] T008 [P] Create `client/.env.example` with `VITE_API_URL=http://localhost:4000/api` and a comment
- [X] T009 [P] Update root `.gitignore` to also ignore `server/dist/`, `client/dist/`, `coverage/`, and `**/.env` while keeping `**/.env.example` tracked

**Checkpoint**: in `server/`, `npm run lint` and `npm run format:check` pass; in `client/`,
`npm run lint`, `npm run format:check`, and `npm run dev` work. Commit `chore: scaffold client and server`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server skeleton (config, DB, all models, error pipeline, stand-in user) and client
shell (tokens, layout, routing, API client, shared state components).

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

### Server foundation

- [X] T010 Create `server/src/config/env.ts`: load `dotenv`, validate with zod `{ PORT: coerce number default 4000, MONGODB_URI: non-empty string, PIXABAY_API_KEY: non-empty string, CLIENT_ORIGIN: url default "http://localhost:5173", NODE_ENV: default "development" }`; on failure print `Missing or invalid environment variable: <NAME>` for each issue and `process.exit(1)`; export typed `env`. No test special case: tests set dummy values before importing the app (T027)
- [X] T011 [P] Create `server/src/utils/AppError.ts`: `class AppError extends Error { status: number; code: string; fields?: Record<string,string> }` with constructor `(status, code, message, fields?)`
- [X] T012 [P] Create `server/src/db/connect.ts`: `connectDb(uri)` calls `mongoose.connect`, logs `Connected to MongoDB`; `disconnectDb()`
- [X] T013 [P] Create `server/src/models/User.ts` per data-model: `username` "required, unique", `isStandIn` boolean "default `false`", `{ timestamps: true }`
- [X] T014 [P] Create `server/src/models/Collection.ts` per data-model: `owner` ObjectId ref User "required, indexed"; `name` string "required; trimmed; 1–60 chars" (`trim`, `minlength 1`, `maxlength 60`); `nameKey` string required; `description` string "trimmed; 0–280 chars; default `""`"; `{ timestamps: true }`; indexes `{ owner: 1, nameKey: 1 }` **unique** and `{ owner: 1, updatedAt: -1 }`
- [X] T015 [P] Create `server/src/models/ImageAsset.ts` per data-model: `source` enum `["pixabay"]` required; `sourceId` string required; `data` Buffer required with `select: false`; `contentType` string (validator: must start with `image/`); `byteLength` number "≤ 5 MB"; `width`, `height` numbers; `{ timestamps: true }`; index `{ source: 1, sourceId: 1 }` **unique**
- [X] T016 [P] Create `server/src/models/SavedItem.ts` per data-model: `collection` ObjectId ref Collection required indexed; `addedBy` ObjectId ref User required; `source` enum `["pixabay"]` required; `sourceId` string required; `asset` ObjectId ref ImageAsset required; `width`, `height` numbers; `pageUrl` string; `tags` string[]; `creatorName` string; `title` string "trimmed; 1–100 chars"; `note` string "0–500 chars; default `""`"; `{ timestamps: true }`; indexes `{ collection: 1, source: 1, sourceId: 1 }` **unique**, `{ collection: 1, createdAt: -1 }`, `{ asset: 1 }`
- [X] T017 Create `server/src/services/userService.ts`: `ensureStandInUser()` upserts `{ isStandIn: true }` with `username: "you"` (`findOneAndUpdate` with `upsert: true, new: true, setDefaultsOnInsert: true`) and caches/returns its `_id`; `getStandInUserId()` returns the cached id or throws if not initialized
- [X] T018 [P] Create `server/src/types/express.d.ts` augmenting `Express.Request` with `userId: import('mongoose').Types.ObjectId`
- [X] T019 [P] Create `server/src/middleware/currentUser.ts`: sets `req.userId = getStandInUserId()`; comment that Feature 2 replaces this with JWT verification
- [X] T020 [P] Create `server/src/middleware/validate.ts`: `validate({ body?, query?, params? }: zod schemas)` parses each part, stores parsed values (`req.body = parsed`, `res.locals.query`, `res.locals.params`), and on failure throws `AppError(400, "VALIDATION_ERROR", "Some fields are invalid.", fields)` where `fields` maps each issue path to its message
- [X] T021 [P] Create `server/src/schemas/common.ts`: `objectIdParam` (zod string refined with `mongoose.isValidObjectId`, message "Invalid id.") and `idParams = z.object({ id: objectIdParam })`
- [X] T022 [P] Create `server/src/middleware/notFound.ts`: throws `AppError(404, "ROUTE_NOT_FOUND", "No route for <METHOD> <path>.")`
- [X] T023 Create `server/src/middleware/errorHandler.ts`: `AppError` → its status and `{ error: { code, message, fields? } }`; Mongo duplicate-key (`code === 11000`) → 409 using key pattern (`nameKey` → `COLLECTION_NAME_TAKEN` "A collection with that name already exists."; `sourceId` → `ITEM_ALREADY_SAVED` "This image is already in that collection."); Mongoose `CastError`/`ValidationError` → 400 `VALIDATION_ERROR`; anything else → log full error with `console.error` and respond 500 `{ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } }` (no stack in response)
- [X] T024 Create `server/src/routes/index.ts` (Router mounting `GET /health` → `{ status: "ok" }`; later stories mount `/search`, `/collections`, `/images` here) and `server/src/app.ts` (`createApp()`: `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })`, `cors({ origin: env.CLIENT_ORIGIN })`, `express.json({ limit: "100kb" })`, `morgan("dev")` unless test, `currentUser`, `app.use("/api", routes)`, `notFound`, `errorHandler`)
- [X] T025 Create `server/src/server.ts`: `connectDb(env.MONGODB_URI)` → `ensureStandInUser()` → `createApp().listen(env.PORT)` logging `API listening on http://localhost:<PORT>`; exit with a clear message if the DB connection fails
- [X] T026 Create `server/src/utils/toDto.ts` with the mapper signatures `toCollectionSummary(doc, stats)`, `toSavedItem(doc)` returning the shapes in contracts/api.md (`id` strings, ISO dates, `imageUrl: "/api/images/<assetId>"`, `coverImageUrl` or `null`); implement bodies as stories need them
- [X] T027 Create `server/tests/setup.ts`: start `MongoMemoryServer` in `beforeAll`, `connectDb`, `ensureStandInUser`; clear all collections in `afterEach` except `users`; stop in `afterAll`; set `process.env.NODE_ENV = "test"` and dummy `MONGODB_URI`/`PIXABAY_API_KEY` before importing app; `vi.mock("../src/services/pixabayService.ts")` with fixtures `tests/fixtures/pixabay.ts` (three hits with ids `"101"`, `"102"`, `"103"`, tags, user, pageURL, webformat sizes, and a tiny JPEG buffer)
- [X] T028 [P] Write `server/tests/errors.test.ts`: `GET /api/nope` → 404 `ROUTE_NOT_FOUND` with exact `{ error: { code, message } }` shape; `GET /api/health` → 200 `{ status: "ok" }`
- [X] T029 [P] Create `server/API.md` skeleton from `specs/001-discover-collect/contracts/api.md`: overview, base URL, auth note ("none — every request acts as the built-in stand-in user in Feature 1"), error body shape, full error-code table, shared types, and the `GET /api/health` entry with a `curl` example; later tasks append their endpoints

### Client foundation

- [X] T030 Write Broadsheet tokens in `client/src/index.css`: `@import "tailwindcss";` then `@theme` with `--color-paper: #F3F2F2`, `--color-surface: #EAE9E9`, `--color-ink: #201E1D`, `--color-accent: #0088B0`, `--color-accent-pressed: #1186AC`, `--color-accent-deep: #006786`, `--color-accent-tint: #E9F8FF`, `--color-accent2: #D6006C`, `--color-accent2-tint: #FFF1F4`, `--color-accent2-deep: #AA0B56`, `--color-divider: rgba(32,30,29,0.16)`, neutral ramp `--color-neutral-50…900` (`#F8F4F4 #EAE7E7 #D7D3D3 #BAB6B6 #9B9797 #7D7979 #605D5D #444141 #2D2B2B`), `--font-serif: "Source Serif 4", Georgia, serif`, `--radius-sm: 1px`, `--radius: 2px`, `--radius-lg: 4px`, `--shadow-float: 0 12px 32px rgba(45,43,43,0.22)`; base layer: body `bg-paper text-ink font-serif text-[15px] leading-[1.55]`, headings weight 600 and `letter-spacing: -0.015em`, global `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`, `.label-caps` (11px, 0.12em, uppercase, opacity .55), `.newsprint` (`filter: grayscale(0.35) contrast(1.15)`); map shadcn CSS variables (`--background`, `--foreground`, `--primary`, `--border`, `--ring`, `--radius`) to these tokens
- [X] T031 [P] Add Source Serif 4 to `client/index.html` (`<link>` preconnect + `https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap`), set `<title>` and meta description
- [X] T032 Add shadcn components with `npx shadcn@latest add button input textarea label popover dialog alert-dialog sheet skeleton sonner` into `client/src/components/ui/`; add a one-line purpose comment at the top of each generated file; then edit `client/src/components/ui/button.tsx` variants to: `primary` (bg accent, white text, hover accent-pressed), `secondary` (bg surface, 1px divider border, ink text, hover accent-tint), `ghost` (transparent, hover accent-tint), `destructive-ghost` (text accent2-deep), `icon` (square 36px ghost), and keep shadcn's built-in names as aliases so generated components still style correctly: `default` = primary styles, `outline` = secondary styles, `destructive` = solid accent2-deep with white text, `link` = accent text underline on hover; verify `alert-dialog.tsx` Action/Cancel render as primary/secondary; sizes: height 36px (`min-h-11` i.e. 44px below `md`), padding `0 14px`, 14px weight 600, `rounded-[2px]`, `whitespace-nowrap`, gap 6px; set input min height 36px (search 42px), textarea min height 124px, surface fill, hairline border, focus border accent
- [X] T033 [P] Create `client/src/types/api.ts` with `SearchResult`, `SearchResponse` (`results, page, perPage, total, hasMore`), `CollectionSummary` (including `coverCreatorName: string | null` and `coverPageUrl: string | null`), `SavedItem`, `CollectionDetail`, and `ApiErrorBody` (`{ error: { code: string; message: string; fields?: Record<string,string> } }`) exactly as in contracts/api.md
- [X] T034 [P] Create `client/src/api/client.ts`: `API_URL = import.meta.env.VITE_API_URL`; `class ApiError extends Error { status; code; fields? }`; `request<T>(path, init?)` sets JSON headers, returns `undefined` for 204, parses error bodies into `ApiError` (network failure → `ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check your connection and try again.")`); `assetUrl(path)` resolves `/api/images/...` against the API origin
- [X] T035 [P] Create `client/src/lib/constants.ts` (`APP_NAME = "Palette Boards"`, `PAGE_SIZE = 20`, `MAX_QUERY = 100`, `NAME_MAX = 60`, `DESCRIPTION_MAX = 280`, `TITLE_MAX = 100`, `NOTE_MAX = 500`), `client/src/lib/queryKeys.ts` (`search(q)`, `collections(sourceId?)`, `collection(id)`), and `client/src/lib/format.ts` (`imageCount(n)` → "1 image"/"N images", `updatedAgo(iso)` → "updated today"/"2 days ago" via `Intl.RelativeTimeFormat`)
- [X] T036 [P] Create shared components: `client/src/components/PageContainer.tsx` (max width, 40px desktop / 16px phone gutter), `client/src/components/LazyImage.tsx` (`<img loading="lazy" decoding="async">` inside an aspect-ratio box from `width`/`height`, `newsprint` class, required `alt`, on error shows striped neutral placeholder), `client/src/components/ImageCredit.tsx` ("Photo by {creatorName} on Pixabay", link to `pageUrl`, `target="_blank" rel="noopener noreferrer"`, 12px @ 0.6 opacity)
- [X] T037 [P] Create state components: `client/src/components/EmptyState.tsx` (icon, title, body, optional action; Phosphor duotone accent icon), `client/src/components/ErrorState.tsx` (magenta `CloudSlash` duotone icon, title, message, primary **Retry** button with `ArrowClockwise`), `client/src/components/GridSkeleton.tsx` (`count`, `variant: "card" | "board"` using shadcn `Skeleton`) matching `design/screens/02b-search-states.png`
- [X] T038 Create `client/src/components/AppHeader.tsx`: wordmark `APP_NAME` (links to `/search`) left; `NavLink`s **Search** and **My collections** right, active link in accent color; 16px gutter on phone; matches `design/screens/02-search.png` header (no bell/avatar in Feature 1)
- [X] T039 Create `client/src/pages/NotFoundPage.tsx` and placeholder `client/src/pages/SearchPage.tsx`, `CollectionsPage.tsx`, `CollectionPage.tsx`; wire `client/src/App.tsx` (layout with `AppHeader` + `<Outlet/>`; routes `/` → `<Navigate to="/search" replace/>`, `/search`, `/collections`, `/collections/:id`, `*`) and `client/src/main.tsx` (`QueryClientProvider` with `retry: 1` and `refetchOnWindowFocus: false`, `BrowserRouter`, `<Toaster position="bottom-center" />`)

**Checkpoint**: `npm test` passes `errors.test.ts`; server starts against Atlas and logs the stand-in
user; client shows the header and routes between placeholder pages; lint + format:check pass in
both projects. Commit `feat: server and client foundation`.

---

## Phase 3: User Story 1 — Search for images (Priority: P1) 🎯 MVP

**Goal**: Keyword search with a results grid, credits, Load more, and loading/empty/error states.

**Independent Test**: quickstart S2 — search `mountain`, Load more appends 20, nonsense keyword shows
empty state, invalid key shows error with Retry, empty box sends nothing, 101st character refused.

### Tests for User Story 1

- [X] T040 [P] [US1] Write `server/tests/utils.test.ts`: `titleFromTags("mountain, lake, sky")` → `"Mountain, lake"`, `""` → `"Untitled photo"`; `TtlCache` returns value before expiry, `undefined` after (use `vi.useFakeTimers`), evicts oldest past `maxSize`
- [X] T041 [P] [US1] Write `server/tests/search.test.ts`: `GET /api/search/images?q=fog` → 200 with `results` mapped to `SearchResult` fields, `page: 1`, `perPage: 20`, `total` = `min(totalHits, 500)`, `hasMore`; `q` missing/whitespace/101 chars → 400 `VALIDATION_ERROR`; `page=0` and `page=26` → 400; mocked `searchImages` rejecting with `AppError(502, "IMAGE_SOURCE_UNAVAILABLE", …)` → 502 with standard shape
- [X] T042 [P] [US1] Write `server/tests/pixabayService.test.ts` testing the real service (not the global mock): load it with `await vi.importActual("../src/services/pixabayService.ts")` and stub network with `vi.stubGlobal("fetch", vi.fn())`; cases: success maps `totalHits: 9000` → `total: 500`; identical second `searchImages("Fog", 1)` / `("fog", 1)` makes no second `fetch` call (24 h cache, case-insensitive key); `getImageById` for an id seen in a search makes no `fetch`; response `{ hits: [] }` → `null`; `fetch` resolving status 429 → `AppError` 502 `IMAGE_SOURCE_UNAVAILABLE`; `fetch` rejecting with a `TimeoutError` → 502; the stubbed request URL contains `safesearch=true` and `per_page=20` and the thrown error message never contains the API key

### Implementation for User Story 1

- [X] T043 [P] [US1] Create `server/src/utils/titleFromTags.ts`: split on commas, trim, drop empties, take first two, capitalize first letter of the result, join with ", "; fallback `"Untitled photo"`; also export `splitTags(tags: string): string[]`
- [X] T044 [P] [US1] Create `server/src/utils/ttlCache.ts`: `class TtlCache<K, V> { constructor(ttlMs, maxSize); get(key); set(key, value) }` using a `Map` of `{ value, expiresAt }`; delete expired on read; when size exceeds `maxSize` delete the first (oldest) key
- [X] T045 [US1] Create `server/src/services/pixabayService.ts`: constants `PER_PAGE = 20`, `MAX_RESULTS = 500`, `TIMEOUT_MS = 8000`, `DAY_MS = 86_400_000`; caches `searchCache = new TtlCache(DAY_MS, 500)` keyed `q.toLowerCase()|page` and `hitCache = new TtlCache(DAY_MS, 5000)` keyed by id; `searchImages(q, page)` calls `https://pixabay.com/api/?key=…&q=…&page=…&per_page=20&safesearch=true&image_type=photo` with `AbortSignal.timeout(8000)`, stores every hit in `hitCache`, returns `{ hits, total: Math.min(totalHits, 500) }`; `getImageById(id)` checks `hitCache` then calls `?id=`; returns `null` when Pixabay returns no hits (or 400 for unknown id); any network error, timeout, 429, or non-OK status → `AppError(502, "IMAGE_SOURCE_UNAVAILABLE", "The image service didn't answer. Please try again.")`; never log the API key
- [X] T046 [P] [US1] Create `server/src/schemas/searchSchemas.ts`: `searchQuery = z.object({ q: z.string().trim().min(1, "Enter a search term.").max(100, "Search terms can be at most 100 characters."), page: z.coerce.number().int().min(1).default(1) }).refine(v => v.page * 20 <= 500, { path: ["page"], message: "No more results for this search." })`
- [X] T047 [US1] Implement `toSearchResult(hit)` in `server/src/utils/toDto.ts` (`sourceId: String(hit.id)`, `title: titleFromTags(hit.tags)`, `tags: splitTags(hit.tags)`, `creatorName: hit.user`, `pageUrl: hit.pageURL`, `thumbnailUrl: hit.webformatURL`, `width: hit.webformatWidth`, `height: hit.webformatHeight`)
- [X] T048 [US1] Create `server/src/controllers/searchController.ts` (`searchImages`: reads the validated query from `res.locals.query` (Express 5 `req.query` is read-only, see T020), calls service, responds `{ results, page, perPage: 20, total, hasMore: page * 20 < total }`) and `server/src/routes/searchRoutes.ts` (`GET /images` with `validate({ query: searchQuery })`); mount at `/search` in `server/src/routes/index.ts`; document `GET /api/search/images` in `server/API.md`
- [X] T049 [P] [US1] Create `client/src/api/search.ts`: `searchImages(q, page): Promise<SearchResponse>` using `request` with `URLSearchParams`
- [X] T050 [US1] Create `client/src/features/search/useImageSearch.ts`: `useInfiniteQuery({ queryKey: queryKeys.search(q), queryFn: ({ pageParam }) => searchImages(q, pageParam), initialPageParam: 1, getNextPageParam: last => last.hasMore ? last.page + 1 : undefined, enabled: q.trim().length > 0, staleTime: 5 * 60_000 })`; returns flattened `results` and `total`
- [X] T051 [P] [US1] Create `client/src/features/search/SearchBar.tsx`: labeled input (visually hidden label "Search images", `MagnifyingGlass` icon, 42px tall, `maxLength={MAX_QUERY}`) + primary **Search** button (`0 22px` padding); submit trims and does nothing when empty; calls `onSearch(q)`
- [X] T052 [P] [US1] Create `client/src/features/search/SearchResultCard.tsx` (boxed card per design-notes: surface fill, 2px radius, `LazyImage` flush top with `alt={title}`, 15px padding, title 16px/600, `ImageCredit`, up to 3 tags as `tag-neutral` chips, action row with a secondary full-width **Save** button (`BookmarkSimple` icon) rendered via a `renderSaveAction` prop and an icon link `ArrowSquareOut` to `pageUrl` labeled "View on Pixabay"); phone layout per `design/screens/08-phone-search-and-collection.png` (title + credit left, Save right) but still showing up to 2 tag chips under the credit, because FR-003 requires tags on every result
- [X] T053 [US1] Create `client/src/features/search/SearchResults.tsx`: states — idle (prompt copy), loading (`GridSkeleton count={6}`), error (`ErrorState` "The image service didn't answer." / "Your collections are unaffected. This usually clears in a moment." with Retry → `refetch`), empty (`EmptyState` binoculars "Nothing for "{q}"." / "Try a broader or different word."); otherwise results count line ("{total} results"), 3-column grid (gap 20px; 2 columns at tablet; 1 column with 12px gap on phone), then **Load more** secondary button (shows spinner + disabled while `isFetchingNextPage`; hidden when `!hasNextPage`, replaced by "End of results" meta text); failed next-page fetch shows inline error with Retry without clearing existing results
- [X] T054 [US1] Implement `client/src/pages/SearchPage.tsx`: H1 "Find something worth keeping." (display size), `SearchBar` bound to `?q=` via `useSearchParams` (submitting sets `q`; reload restores search), `SearchResults` below; `document.title` = `"Search · " + APP_NAME`

**Checkpoint**: quickstart S2 passes; `npm test` green; lint + format:check pass (server, client);
`server/API.md` documents search. Commit `feat: image search with load more`.

---

## Phase 4: User Story 2 — Create a collection (Priority: P1)

**Goal**: Create collections with validated name/description; they appear in My collections at once.

**Independent Test**: quickstart S3 (create part) — `Kitchen ideas` appears with 0 images;
`kitchen ideas ` rejected; empty/61-char name and 281-char description rejected with field messages.

### Tests for User Story 2

- [X] T055 [P] [US2] Write create/list cases in `server/tests/collections.test.ts`: `POST /api/collections { name: "Kitchen ideas", description: "…" }` → 201 summary with `itemCount: 0`, `coverImageUrl: null`; `" kitchen IDEAS "` → 409 `COLLECTION_NAME_TAKEN`; name `""`, `"   "`, 61 chars → 400 `VALIDATION_ERROR` with `fields.name`; description 281 chars → 400 with `fields.description`; `GET /api/collections` → collections ordered by `updatedAt` desc, all owned by stand-in user

### Implementation for User Story 2

- [X] T056 [P] [US2] Create `server/src/schemas/collectionSchemas.ts`: `nameField = z.string().trim().min(1, "Give the collection a name.").max(60, "Names can be at most 60 characters.")`; `descriptionField = z.string().trim().max(280, "Descriptions can be at most 280 characters.")`; `createCollectionBody = z.object({ name: nameField, description: descriptionField.default("") })`; `listCollectionsQuery = z.object({ sourceId: z.string().regex(/^\d{1,20}$/).optional() })`
- [X] T057 [US2] Create `server/src/services/collectionService.ts` with `toNameKey(name) = name.trim().toLowerCase()`; `createCollection(ownerId, { name, description })` (pre-check `findOne({ owner, nameKey })` → `AppError(409, "COLLECTION_NAME_TAKEN", "A collection with that name already exists.")`, then create); `listForOwner(ownerId)` (collections sorted `updatedAt: -1`, plus one `SavedItem.aggregate` for those ids: `$sort createdAt -1`, `$group { _id: "$collection", itemCount: { $sum: 1 }, coverAsset: { $first: "$asset" }, coverCreatorName: { $first: "$creatorName" }, coverPageUrl: { $first: "$pageUrl" } }`) returning docs with stats; `touchCollection(id)` (`updateOne` setting `updatedAt: new Date()`)
- [X] T058 [US2] Implement `toCollectionSummary(doc, stats)` in `server/src/utils/toDto.ts` (`itemCount` default 0, `coverImageUrl` = `/api/images/<coverAsset>` or `null`, `coverCreatorName` and `coverPageUrl` from stats or `null`, optional `containsImage`)
- [X] T059 [US2] Create `server/src/controllers/collectionController.ts` (`listCollections`, `createCollection` → 201 `{ collection }`) and `server/src/routes/collectionRoutes.ts` (`GET /` with `validate({ query: listCollectionsQuery })`, `POST /` with `validate({ body: createCollectionBody })`); mount at `/collections` in `server/src/routes/index.ts`; document `GET /api/collections` and `POST /api/collections` in `server/API.md`
- [X] T060 [P] [US2] Create `client/src/api/collections.ts`: `listCollections(sourceId?)`, `createCollection({ name, description })` returning `CollectionSummary`
- [X] T061 [US2] Create `client/src/features/collections/useCollections.ts`: `useCollections(sourceId?)` query and `useCreateCollection()` mutation that on success prepends the new summary into the `queryKeys.collections()` cache and invalidates `["collections"]`
- [X] T062 [P] [US2] Create `client/src/features/collections/CollectionForm.tsx`: controlled Name (`maxLength` 60, required) and Description textarea (`maxLength` 280, live "n / 280" counter) with `Label`s; client-side trim/length checks mirror server messages; shows server `ApiError.fields` and `COLLECTION_NAME_TAKEN` under Name; props `initialValues`, `submitLabel`, `onSubmit`, `onCancel`, `isPending` (submit disabled while pending — prevents double submit)
- [X] T063 [US2] Create `client/src/features/collections/NewCollectionDialog.tsx`: shadcn `Dialog` titled "New collection" (H3) containing `CollectionForm`; on success closes and toasts "Created {name}"
- [X] T064 [P] [US2] Create `client/src/features/collections/CollectionCard.tsx` (unboxed board card per design-notes: `Link` to `/collections/:id`, cover `LazyImage` in 16:9 box or striped placeholder when `coverImageUrl` is null, a small `ImageCredit` line for the cover when `coverCreatorName` is present (the credit link sits outside the card's main `Link` to avoid nested anchors), name 20px/600, description (1 line, 0.75 opacity), meta "{imageCount} · {updatedAgo}" at 0.6) and `client/src/features/collections/CollectionGrid.tsx` (3 columns desktop, gap 30px; 2 tablet; 1 phone)
- [X] T065 [US2] Implement `client/src/pages/CollectionsPage.tsx`: H2 "My collections", subtitle "{n} collections · {total} images", primary **New collection** button (`Plus`) opening `NewCollectionDialog`; states: loading `GridSkeleton variant="board"`, error `ErrorState` with Retry, empty `EmptyState` "No collections yet" / "Create your first collection to start saving images." with New collection action; else `CollectionGrid` per `design/screens/03-my-collections.png` (no Public/Private tags, no palette strip, no Shared with me)

**Checkpoint**: quickstart S3 create cases pass; tests green; lint + format:check pass;
`server/API.md` updated. Commit `feat: create and list collections`.

---

## Phase 5: User Story 3 — Save an image to a collection (Priority: P1)

**Goal**: Save any search result to a chosen or newly created collection, with "Saved" markers,
duplicate prevention, confirmation, and a stored image copy.

**Independent Test**: quickstart S4 — save → toast; reopen popover shows "Saved"; save to a second
collection works; create-from-popover keeps scroll position; double-click creates one item; direct
duplicate POST → 409.

### Tests for User Story 3

- [X] T066 [P] [US3] Write `server/tests/items.test.ts` save cases: `POST /api/collections/:id/items { sourceId: "101" }` → 201 `SavedItem` with `title` from tags, `note: ""`, `imageUrl` `/api/images/<id>`, one `ImageAsset` stored; same again → 409 `ITEM_ALREADY_SAVED`; same image to a second collection → 201 and still one `ImageAsset`; unknown collection id → 404 `COLLECTION_NOT_FOUND`; malformed id → 400; `sourceId: "abc"` → 400; mocked `getImageById` returning `null` → 404 `IMAGE_NOT_FOUND`; mocked 502 → 502 and no item created; collection `updatedAt` increases after save; `GET /api/collections?sourceId=101` → `containsImage` true only for collections holding it; `GET /api/images/:assetId` → 200 with `Content-Type` image and `Cache-Control` containing `immutable`, unknown id → 404 `IMAGE_NOT_FOUND`
- [X] T067 [US3] Add `downloadImage` cases to `server/tests/pixabayService.test.ts` (real service, stubbed `fetch`): `https://cdn.pixabay.com/…jpg` with `image/jpeg` → `{ data, contentType }`; `http://cdn.pixabay.com/…` (not https), `https://evil.example.com/x.jpg`, and `https://pixabay.com.evil.example/x.jpg` → 502 without calling `fetch`; `text/html` response → 502; `Content-Length`/body over 5 MB → 502

### Implementation for User Story 3

- [X] T068 [US3] Add `downloadImage(url): Promise<{ data: Buffer; contentType: string }>` to `server/src/services/pixabayService.ts`: only allow `https:` URLs whose host is `pixabay.com` or ends with `.pixabay.com` (else `AppError(502, "IMAGE_SOURCE_UNAVAILABLE", …)`); 8 s timeout; reject non-`image/*` content type or bodies over 5 MB (`5 * 1024 * 1024`)
- [X] T069 [P] [US3] Create `server/src/schemas/itemSchemas.ts`: `saveItemBody = z.object({ sourceId: z.string().regex(/^\d{1,20}$/, "Invalid image id.") })`; `itemParams = z.object({ id: objectIdParam, itemId: objectIdParam })`
- [X] T070 [US3] Add `getOwnedCollection(ownerId, id)` to `server/src/services/collectionService.ts` (`findOne({ _id: id, owner })` or `AppError(404, "COLLECTION_NOT_FOUND", "That collection doesn't exist.")`) and extend `listForOwner(ownerId, sourceId?)` to set `containsImage` from `SavedItem.distinct("collection", { source: "pixabay", sourceId })`
- [X] T071 [US3] Create `server/src/services/itemService.ts` `saveItem(ownerId, collectionId, sourceId)`: `getOwnedCollection`; if `SavedItem.exists({ collection, source: "pixabay", sourceId })` → `AppError(409, "ITEM_ALREADY_SAVED", "This image is already in that collection.")`; `hit = await getImageById(sourceId)` or `AppError(404, "IMAGE_NOT_FOUND", "That image is no longer available.")`; `asset = ImageAsset.findOne({ source, sourceId })` or download `hit.webformatURL` and create it (on duplicate-key race, re-find); create `SavedItem` with `addedBy: ownerId`, copied `tags` (`splitTags`), `creatorName: hit.user`, `pageUrl: hit.pageURL`, `width`/`height`, `title: titleFromTags(hit.tags)`; `touchCollection`; return item
- [X] T072 [US3] Implement `toSavedItem(doc)` in `server/src/utils/toDto.ts` per `SavedItem` contract type
- [X] T073 [US3] Create `server/src/controllers/itemController.ts` `saveItem` → 201 `{ item }`; add `POST /:id/items` with `validate({ params: idParams, body: saveItemBody })` to `server/src/routes/collectionRoutes.ts` (controllers read params from `res.locals.params`); pass `sourceId` from `res.locals.query` to `listForOwner` in `listCollections`; document `POST /api/collections/:id/items` and the `?sourceId=` / `containsImage` addition to `GET /api/collections` in `server/API.md`
- [X] T074 [P] [US3] Create `server/src/controllers/imageController.ts` (`getImage`: `ImageAsset.findById(id).select("+data")` or 404 `IMAGE_NOT_FOUND`; set `Content-Type`, `Content-Length`, `Cache-Control: public, max-age=31536000, immutable`; send bytes) and `server/src/routes/imageRoutes.ts` (`GET /:id` with `validate({ params: idParams })`); mount at `/images` in `server/src/routes/index.ts`; document `GET /api/images/:id` in `server/API.md`
- [X] T075 [P] [US3] Create `client/src/api/items.ts` with `saveItem(collectionId, sourceId): Promise<SavedItem>`
- [X] T076 [US3] Create `client/src/features/items/useItems.ts` with `useSaveItem()` mutation: on success invalidate `["collections"]` (list and `?sourceId` variants) and `queryKeys.collection(collectionId)`
- [X] T077 [P] [US3] Create `client/src/features/search/CollectionPickerRow.tsx` (presentational only): props `collection: CollectionSummary`, `isSaving: boolean`, `disabled: boolean`, `onSave()`; shows name + "{n} images"; right side is a ghost **Save** button, a small spinner with "Saving…" while `isSaving`, or muted "Saved" text with `Check` icon when `collection.containsImage` (row `aria-disabled`, not clickable); bottom hairline divider
- [X] T078 [P] [US3] Create `client/src/features/search/NewCollectionInline.tsx` (presentational only): labeled input "New collection name…" (`maxLength` 60, trimmed, empty disables the button) + primary **Create** button that shows a spinner and "Saving…" while `isPending`; props `onCreate(name)`, `isPending`, `disabled`, `error?: string` shown under the input; clears input after success
- [X] T079 [US3] Create `client/src/features/search/SaveToCollectionPopover.tsx` per `design/screens/02-search.png`, composing `CollectionPickerRow` and `NewCollectionInline` and owning the data logic: trigger = the card's Save button; content (H4 "Save to collection", close icon button) loads `useCollections(result.sourceId)` when opened (skeleton rows while loading, error + Retry); list of `CollectionPickerRow`; `NewCollectionInline` footer whose `onCreate` calls `useCreateCollection` then `useSaveItem` on the new id; when there are no collections, show "Create your first collection" copy above the footer; while any mutation is pending all rows and the footer are `disabled` and the active row/button shows its spinner (visible feedback within 1 s, SC-004); success → close + toast "Saved to {name}"; `ITEM_ALREADY_SAVED` → toast "Already saved in {name}" and refetch markers; `COLLECTION_NOT_FOUND` → toast "That collection no longer exists." and refetch the collection list; `COLLECTION_NAME_TAKEN`/validation → `error` message under the input; other errors → toast with the server message; no navigation, so the page scroll position is preserved
- [X] T080 [US3] Wire `SaveToCollectionPopover` into `SearchResultCard` via `renderSaveAction` in `client/src/features/search/SearchResults.tsx`

**Checkpoint**: quickstart S4 passes; tests green; lint + format:check pass; `server/API.md`
updated. Commit `feat: save search results to collections`.

---

## Phase 6: User Story 4 — View my collections (Priority: P1)

**Goal**: Collection list with covers and counts; collection page with newest-first grid and
empty state linking to search.

**Independent Test**: quickstart S1 steps 4–5 — cover is newest item, counts correct, collection
page newest first, empty collection links to Search, no-collections state on a fresh DB.

### Tests for User Story 4

- [X] T081 [P] [US4] Add detail/list cases to `server/tests/collections.test.ts`: after saving `101` then `102`, `GET /api/collections` → `itemCount: 2`, `coverImageUrl` = asset of `102`, `coverCreatorName`/`coverPageUrl` = those of `102`; an empty collection has all three cover fields `null`; `GET /api/collections/:id` → `items` ordered `102`, `101`; unknown id → 404 `COLLECTION_NOT_FOUND`; malformed id → 400 `VALIDATION_ERROR`

### Implementation for User Story 4

- [X] T082 [US4] Add `getCollectionDetail(ownerId, id)` to `server/src/services/collectionService.ts` (`getOwnedCollection` + `SavedItem.find({ collection }).sort({ createdAt: -1 })`; stats from the items) and `getCollection` handler in `server/src/controllers/collectionController.ts` responding `{ collection: { ...summary, items } }`; add `GET /:id` with `validate({ params: idParams })` in `server/src/routes/collectionRoutes.ts`; document `GET /api/collections/:id` in `server/API.md`
- [X] T083 [P] [US4] Add `getCollection(id): Promise<CollectionDetail>` to `client/src/api/collections.ts` and `useCollection(id)` query to `client/src/features/collections/useCollections.ts`
- [X] T084 [P] [US4] Create `client/src/features/items/SavedItemCard.tsx` (unboxed: button wrapping `LazyImage` with `alt={title}` using `assetUrl(imageUrl)`, title 15px/600 below, then `ImageCredit` ("Photo by {creatorName} on Pixabay" linking to `pageUrl`, placed outside the open button to avoid nesting interactive elements); `onOpen` prop) and `client/src/features/items/SavedItemGrid.tsx` (3 columns desktop gap 20px, 2 columns phone gap 12px, per `design/screens/04-collection.png` and `08-phone…`)
- [X] T085 [US4] Create `client/src/features/collections/CollectionHeader.tsx` (label caps "COLLECTION", H1 42–44px (29px phone), description at 0.75, meta "{imageCount} · {updatedAgo}", right-aligned action slot) — no palette band/swatches or Share in Feature 1
- [X] T086 [US4] Implement `client/src/pages/CollectionPage.tsx`: `useCollection(id)`; loading (header skeleton + `GridSkeleton`), 404 → `EmptyState` "Collection not found" with link to My collections, other error → `ErrorState` Retry; `CollectionHeader`; empty → `EmptyState` (`Images` icon) "Nothing saved here yet" / "Find images worth keeping and save them to {name}." with primary link **Search images** to `/search`; else `SavedItemGrid`; `document.title` = `"{name} · " + APP_NAME`
- [X] T087 [US4] Update `client/src/features/collections/CollectionCard.tsx` to show the cover via `assetUrl(coverImageUrl)` now that saved images exist, and confirm the cover credit (`coverCreatorName` → `coverPageUrl`) renders for non-empty collections

**Checkpoint**: quickstart S1 steps 1–4 pass; tests green; lint + format:check pass;
`server/API.md` updated. Commit `feat: collection list and collection page`.

---

## Phase 7: User Story 5 — Edit saved content (Priority: P1)

**Goal**: Edit item title/note and collection name/description with explicit Save/Cancel;
changes persist.

**Independent Test**: quickstart S3 rename/cancel cases and S1 step 5 — edits show immediately,
survive reload; Cancel discards; 501-char note and duplicate rename rejected.

### Tests for User Story 5

- [X] T088 [P] [US5] Add update cases to `server/tests/collections.test.ts`: `PATCH /api/collections/:id { name: "Kitchen" }` → 200 and `updatedAt` increases; rename to another collection's name (different case) → 409 `COLLECTION_NAME_TAKEN`; rename to its own name in different case → 200; `{}` → 400; description 281 chars → 400
- [X] T089 [P] [US5] Add edit cases to `server/tests/items.test.ts`: `PATCH /api/collections/:id/items/:itemId { title: "Hallway light", note: "for the hallway" }` → 200 with both; `note` 501 chars → 400 `VALIDATION_ERROR` `fields.note`; `title` 101 chars → 400; `title: "   "` → title reset to tag-derived default; item from another collection id → 404 `ITEM_NOT_FOUND`; `{}` → 400

### Implementation for User Story 5

- [X] T090 [US5] Add `updateCollectionBody = z.object({ name: nameField.optional(), description: descriptionField.optional() }).refine(b => b.name !== undefined || b.description !== undefined, "Nothing to update.")` to `server/src/schemas/collectionSchemas.ts`; add `updateCollection(ownerId, id, changes)` to `server/src/services/collectionService.ts` (`getOwnedCollection`; if name changes, duplicate check on `nameKey` excluding this `_id`; set `name`, `nameKey`, `description`; save) and `PATCH /:id` in controller/routes returning `{ collection }` summary; document `PATCH /api/collections/:id` in `server/API.md`
- [X] T091 [US5] Add `updateItemBody = z.object({ title: z.string().trim().max(100, "Titles can be at most 100 characters.").optional(), note: z.string().max(500, "Notes can be at most 500 characters.").optional() }).refine(b => b.title !== undefined || b.note !== undefined, "Nothing to update.")` to `server/src/schemas/itemSchemas.ts`; add `updateItem(ownerId, collectionId, itemId, changes)` to `server/src/services/itemService.ts` (`getOwnedCollection`; `SavedItem.findOne({ _id: itemId, collection })` or `AppError(404, "ITEM_NOT_FOUND", "That image isn't in this collection.")`; empty title → `titleFromTags(tags.join(", "))`; save; `touchCollection`) and `PATCH /:id/items/:itemId` with `validate({ params: itemParams, body: updateItemBody })` in `server/src/controllers/itemController.ts` / `server/src/routes/collectionRoutes.ts`; document `PATCH /api/collections/:id/items/:itemId` in `server/API.md`
- [X] T092 [P] [US5] Add `updateCollection(id, changes)` to `client/src/api/collections.ts` and `updateItem(collectionId, itemId, changes)` to `client/src/api/items.ts`
- [X] T093 [US5] Add `useUpdateCollection(id)` to `client/src/features/collections/useCollections.ts` and `useUpdateItem(collectionId)` to `client/src/features/items/useItems.ts`: on success write the returned object into `queryKeys.collection(id)` cache (so the change shows immediately) and invalidate `["collections"]`; on error leave cache untouched (display stays at last saved value) and rethrow for the form
- [X] T094 [US5] Create `client/src/features/items/ItemEditForm.tsx` per `design/screens/04-collection.png`: read-only view (title, note or italic "No note yet", ghost **Edit** button with `PencilSimple`); edit mode with labeled "Display title" input (`maxLength` 100, placeholder shows default title) and "Personal note — n / 500" textarea (`maxLength` 500); primary **Save changes** (disabled + spinner while pending) and ghost **Cancel** (restores last saved values, nothing stored); server field errors shown under fields; error toast on other failures; success toast "Changes saved"
- [X] T095 [US5] Create `client/src/features/items/ItemDetailPanel.tsx` (initial version): shows larger `LazyImage` and `ItemEditForm` for the selected item; desktop (≥1024 px) renders as right-hand column labeled "ITEM DETAIL" beside the grid; below 1024 px renders inside shadcn `Sheet` (`side="bottom"`); close button
- [X] T096 [US5] In `client/src/pages/CollectionPage.tsx`, track the selected item in `?item=<itemId>` via `useSearchParams` (card `onOpen` sets it; closing removes it with `replace: false` so Back closes the panel) and render `ItemDetailPanel`; unknown `item` id is ignored
- [X] T097 [US5] Add collection editing: `CollectionHeader` action slot gets a secondary **Edit** button (`PencilSimple`) opening a `Dialog` "Edit collection" with `CollectionForm` (`submitLabel="Save changes"`, Cancel closes without storing) wired to `useUpdateCollection` in `client/src/pages/CollectionPage.tsx`

**Checkpoint**: quickstart S3 rename/cancel and S1 step 5 pass; tests green; lint + format:check
pass; `server/API.md` updated. Commit `feat: edit items and collections`.

---

## Phase 8: User Story 6 — Remove content (Priority: P1)

**Goal**: Remove an item from one collection only; delete a collection after confirmation.

**Independent Test**: quickstart S5 — remove from A leaves B intact; delete dialog Cancel keeps it,
Delete removes it permanently (gone after reload).

### Tests for User Story 6

- [X] T098 [P] [US6] Add remove cases to `server/tests/items.test.ts`: image `101` in A and B → `DELETE` from A → 204; B still has it with its own title/note; `ImageAsset` still exists; `DELETE` from B → asset deleted; repeat delete → 404 `ITEM_NOT_FOUND`; A's `updatedAt` increases
- [X] T099 [P] [US6] Add delete cases to `server/tests/collections.test.ts`: `DELETE /api/collections/:id` → 204; its items gone; assets used only by it gone; assets also used by another collection kept; `GET` it → 404; delete unknown → 404 `COLLECTION_NOT_FOUND`

### Implementation for User Story 6

- [X] T100 [US6] Add `removeOrphanAssets(assetIds)` to `server/src/services/itemService.ts` (delete each `ImageAsset` where `!SavedItem.exists({ asset })`) and `removeItem(ownerId, collectionId, itemId)` (`getOwnedCollection`; find item or 404 `ITEM_NOT_FOUND`; delete; `removeOrphanAssets([asset])`; `touchCollection`); add `removeItem` → 204 in `server/src/controllers/itemController.ts` and `DELETE /:id/items/:itemId` with `validate({ params: itemParams })` in `server/src/routes/collectionRoutes.ts`; document `DELETE /api/collections/:id/items/:itemId` in `server/API.md`
- [X] T101 [US6] Add `deleteCollection(ownerId, id)` to `server/src/services/collectionService.ts` (`getOwnedCollection`; collect distinct `asset` ids of its items; `SavedItem.deleteMany({ collection })`; `removeOrphanAssets(ids)`; delete collection) and `DELETE /:id` → 204 in controller/routes; document `DELETE /api/collections/:id` in `server/API.md`
- [X] T102 [P] [US6] Add `deleteCollection(id)` to `client/src/api/collections.ts` and `removeItem(collectionId, itemId)` to `client/src/api/items.ts`
- [X] T103 [US6] Add `useRemoveItem(collectionId)` to `client/src/features/items/useItems.ts` with optimistic update (snapshot `queryKeys.collection(id)`, remove the item and decrement `itemCount`; on error restore snapshot and toast the error; on settle invalidate `["collections"]`) and `useDeleteCollection()` to `client/src/features/collections/useCollections.ts` (on success remove `queryKeys.collection(id)` and invalidate `["collections"]`)
- [X] T104 [US6] Add a destructive-ghost **Remove from collection** button (`Trash` icon) to `client/src/features/items/ItemDetailPanel.tsx`; on click run `useRemoveItem`, close the panel, toast "Removed from {collection name}"
- [X] T105 [US6] Create `client/src/features/collections/DeleteCollectionDialog.tsx` (shadcn `AlertDialog`: title "Delete {name}?", body "This permanently removes the collection and its {n} saved images. This can't be undone.", **Cancel** and destructive **Delete collection** with pending state) and add a destructive-ghost **Delete** button to `CollectionHeader` actions in `client/src/pages/CollectionPage.tsx`; on success navigate to `/collections` and toast "Deleted {name}"

**Checkpoint**: quickstart S5 passes; tests green; lint + format:check pass; `server/API.md`
updated. Commit `feat: remove items and delete collections`.

---

## Phase 9: User Story 7 — View an image in detail (Priority: P2)

**Goal**: The detail panel shows everything known about a saved image with a source link.

**Scope note**: The panel shell (larger image, edit form, `?item=` URL state, phone Sheet) already
exists from US5 (T095–T096) because editing lives there. US7 adds only metadata (tags, credit,
saved date), the source link, and focus/scroll handling — so it can be cut without losing editing.

**Independent Test**: quickstart S6 — larger image, title, note, tags, credit, "View on Pixabay"
opens in new tab; closing returns to the same grid position; Back closes the panel.

### Implementation for User Story 7

- [X] T106 [US7] Complete `client/src/features/items/ItemDetailPanel.tsx`: add tag chips (all tags, `tag-neutral`), `ImageCredit`, a secondary link-button **View on Pixabay** (`ArrowSquareOut`, `target="_blank" rel="noopener noreferrer"`), saved date meta ("Saved {date}"); image uses the item's `width`/`height` aspect ratio; `Escape` closes; focus moves to the panel heading on open and back to the originating card on close
- [X] T107 [US7] In `client/src/pages/CollectionPage.tsx`, keep grid scroll position when opening/closing the detail (desktop column must not reflow the grid width; phone uses the Sheet overlay) and highlight the selected card with a 2px accent outline

**Checkpoint**: quickstart S6 passes; lint + format:check pass (client). Commit `feat: item detail view`.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, deliverables, and whole-app verification.

- [X] T108 [P] Review `server/API.md` (built up since T029) against `specs/001-discover-collect/contracts/api.md`: all 11 endpoints present with method, path, auth, body, responses, and one `curl` example each; error-code table complete; add a "Known limitations" note that `GET /api/images/:id` is not owner-scoped in Feature 1 (revisit for private collections in Feature 2)
- [X] T109 [P] Create `README.txt` at repo root (plain text): full name and Vanderbilt email placeholders `TODO: name` / `TODO: vanderbilt email` for the author to fill, project summary, prerequisites, install/run steps from `specs/001-discover-collect/quickstart.md` written as one command per line (no `&&`, which fails in Windows PowerShell 5.1), test commands, a note that the app's display name is "Palette Boards" (repository name PixBoard; change `APP_NAME` in `client/src/lib/constants.ts`), `TODO` reflection (<100 words) and feedback sections for the author
- [X] T110 Responsive pass at 375 px, 768 px, 1280 px across `client/src/pages/*.tsx` and feature components: no horizontal scroll, buttons ≥44 px tall below `md`, 16 px gutters, detail Sheet usable (quickstart S8)
- [X] T111 Accessibility pass across `client/src/components/**` and `client/src/features/**`: every `img` has meaningful `alt`, every input has a `Label`, icon-only buttons have `aria-label`, popover/dialog focus trap and return focus, visible focus ring everywhere, muted text contrast ≥ 4.5:1 on paper
- [X] T112 [P] Verify every source file in `server/src/`, `server/tests/`, and `client/src/` (including shadcn files in `client/src/components/ui/`) starts with a one-line purpose comment; add missing ones
- [X] T113 Run `npm run lint`, `npm run format:check` (and `npm run format` if needed), `npm test` in `server/`, and `npm run lint`, `npm run format:check`, `npm run build` in `client/`; fix all errors
- [X] T114 Run all quickstart scenarios S1–S8 in `specs/001-discover-collect/quickstart.md` against the running app with a fresh database; fix any failures; confirm SC-001 (full flow under 2 minutes) and SC-003 (server restart keeps data)
- [X] T115 Fresh-clone check: clone the repo into a temp directory, follow only `README.txt`, confirm the app runs; update `README.txt` for any missing step

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup — blocks all stories. All four models live here because
  several stories share them.
- **US1 Search (Phase 3)**: after Foundational.
- **US2 Create collection (Phase 4)**: after Foundational (independent of US1).
- **US3 Save (Phase 5)**: after US1 (needs search results and `pixabayService`) and US2 (needs
  collections to save into).
- **US4 View (Phase 6)**: after US2; its item grid is only meaningful after US3 has saved items
  (server tests seed items via the save endpoint).
- **US5 Edit (Phase 7)**: after US4 (edits happen on the collection page and detail panel).
- **US6 Remove (Phase 8)**: after US5 — the item remove button lives in the detail panel created in
  US5, and collection delete sits beside the US5 Edit button.
- **US7 Detail (Phase 9)**: after US5 (completes `ItemDetailPanel`).
- **Polish (Phase 10)**: after all stories.

```text
Setup → Foundational ─┬─ US1 ─┐
                      └─ US2 ─┴─ US3 ─ US4 ─ US5 ─┬─ US6
                                                  └─ US7 ─ Polish
```

### Within Each Story

- Server tests (written first, expected to fail) → schemas → services → DTO → controller/routes →
  client api → hooks → components → page wiring.
- Tasks touching the same file (`toDto.ts`, `collectionRoutes.ts`, `collectionService.ts`,
  `collections.test.ts`, `items.test.ts`, `CollectionPage.tsx`) run in sequence.

### Parallel Opportunities

- Setup: T003, T004, T005, T007, T008, T009 (server and client scaffolds are separate folders).
- US3: `CollectionPickerRow` and `NewCollectionInline` (presentational) can be built alongside the
  server save endpoint.
- Foundational: models T013–T016; middleware T018–T022; client T031, T033–T037 run alongside the
  server foundation.
- After Foundational, **US1 and US2 can proceed in parallel** (different files except
  `routes/index.ts` mounts and `toDto.ts` — do those two edits sequentially).
- Within stories: tests marked [P], schema files, client `api/*` files, and presentational
  components marked [P].

---

## Parallel Example: User Story 1

```bash
# Tests first (both new files):
Task: "Write server/tests/utils.test.ts (titleFromTags, TtlCache)"
Task: "Write server/tests/search.test.ts (search endpoint cases)"

# Independent building blocks:
Task: "Create server/src/utils/titleFromTags.ts"
Task: "Create server/src/utils/ttlCache.ts"
Task: "Create server/src/schemas/searchSchemas.ts"
Task: "Create client/src/api/search.ts"
Task: "Create client/src/features/search/SearchBar.tsx"
Task: "Create client/src/features/search/SearchResultCard.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "Write save/list/image cases in server/tests/items.test.ts"
Task: "Create client/src/features/search/CollectionPickerRow.tsx"
Task: "Create client/src/features/search/NewCollectionInline.tsx"
Task: "Create server/src/schemas/itemSchemas.ts"
Task: "Create imageController.ts + imageRoutes.ts"
Task: "Create client/src/api/items.ts"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → Phase 2 Foundational → commit.
2. Phase 3 US1 → **STOP and VALIDATE** with quickstart S2 → commit. Search alone is demoable.
3. Phase 4 US2 → Phase 5 US3 → validate S4. At this point images can be found and kept.
4. Phase 6 US4 → validate S1 steps 1–4. This is the smallest submittable app (find, save, view).

### Incremental Delivery (deadline 2026-09-18 23:59 CT)

1. US5 Edit and US6 Remove complete every challenge requirement → run S1 end to end → commit.
2. US7 Detail (P2) adds polish; cut it first if time is short (Constitution I) — the edit form
   still works in the basic panel from US5.
3. Phase 10: `server/API.md` review, `README.txt`, final lint/format, quickstart S1–S8, fresh-clone check.
   `README.txt` is never cut.
4. Only then start Feature 2.

---

## Notes

- [P] = different files, no dependency on unfinished tasks.
- Implement one phase (or a few tasks) at a time: run the app → test → read the code until it can
  be explained → commit (Constitution workflow gate).
- Keep Feature 2/3 elements (color filter, palettes, share, explore, bell, avatar) out of this
  feature.

---

## Phase 11: Convergence

- [X] T116 CRITICAL: Replace the four `TODO` placeholders in `README.txt` with the author's full name, Vanderbilt email, a reflection under 100 words, and challenge feedback (author-supplied content; cannot be generated) per Constitution: Project Constraints & Deliverables (partial)
- [X] T117 Run quickstart scenarios S1–S8 in `specs/001-discover-collect/quickstart.md` against real MongoDB Atlas and a real Pixabay key in `server/.env` (not the local harness), time the S1 flow for SC-001, confirm search results appear in about 2 seconds, and fix any differences found per SC-001, SC-002, T114 (partial)
- [X] T118 In `client/src/features/items/ItemEditForm.tsx`, when saving fails with a non-validation error (network, 5xx, not found), leave edit mode so the panel shows the last saved title and note, keep the error toast, and stay in edit mode only for field validation errors per US5/AC5 (partial)

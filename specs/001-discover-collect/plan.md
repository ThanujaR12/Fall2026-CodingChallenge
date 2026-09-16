# Implementation Plan: Discover & Collect (Core)

**Branch**: `main` (feature dir `001-discover-collect`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-discover-collect/spec.md`, tech stack from
`docs/requirements/requirements/06-tech-stack-plan-input.md`, visual design from `design/`.

## Summary

Build the minimum complete app: keyword image search (Pixabay, proxied and cached by the server),
named collections, saving search results into collections, editing item titles/notes and
collection name/description, removing items and deleting collections, and an item detail view.
A Vite + React + TypeScript client (shadcn/ui restyled to the Broadsheet design) talks to a separate
Express + TypeScript REST API backed by MongoDB Atlas. All collections are owned by a built-in
stand-in user so Feature 2 can swap in real accounts without reshaping data. Saved images are
copied into the database on save because Pixabay forbids permanent hotlinking.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 LTS (server) and in the browser (client)

**Primary Dependencies**:
- Server: Express 5, Mongoose 8, zod 4, cors, helmet, morgan, dotenv; dev: tsx
- Client: Vite 7, React 19, React Router 7, TanStack Query 5, Tailwind CSS 4, shadcn/ui (Radix),
  sonner, @phosphor-icons/react
- Tooling: ESLint (flat config, typescript-eslint), Prettier

**Storage**: MongoDB Atlas (free tier) via Mongoose — collections `users`, `collections`,
`saveditems`, `imageassets` (image bytes). In-memory 24 h TTL cache for Pixabay responses.

**Testing**: Vitest + Supertest + mongodb-memory-server (server); Pixabay mocked. Client verified via
[quickstart.md](./quickstart.md) scenarios, lint, and type-checked build.

**Target Platform**: Modern evergreen browsers, 375 px phone → desktop; Node 22 server (local; optional
Render/Vercel deploy later)

**Project Type**: Web application — separate `client/` (SPA) and `server/` (REST API)

**Performance Goals**: Search results visible ≈ 2 s under normal conditions (SC-002); repeated
searches served from cache (< 100 ms server time); action feedback within 1 s (SC-004)

**Constraints**: Pixabay 100 req/60 s, 24 h caching required, no permanent hotlinking, max 500 hits
per query, `q` ≤ 100 chars; API key server-only; Atlas free tier 512 MB (≈ thousands of saved
images at ~40–150 KB each); deadline 2026-09-18 23:59 CT

**Scale/Scope**: Single user; tens of collections; hundreds of saved items; 3 main screens + detail
panel; 11 REST endpoints (including `/health` and `/images/:id`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How this plan complies | Status |
|---|-----------|------------------------|--------|
| I | Working software first | Feature 1 only; P1 stories first (search → collections → save → view → edit → remove), US7 (P2) last; color filter, palettes, sharing explicitly excluded (research R14) | ✅ Pass |
| II | Readable | TypeScript strict both sides; API types in `client/src/types/api.ts` mirror [contracts/api.md](./contracts/api.md); one-line purpose comment per file; ESLint + Prettier scripts in both projects; no clever abstractions (plain services, tiny `TtlCache`) | ✅ Pass |
| III | Organized for extension | Separate `client/` and `server/`; server routes → controllers → services → models + middleware; client `api/` layer, `features/`, `components/`, `types/`, `lib/`; stand-in owner seam in `currentUser` middleware for Feature 2 | ✅ Pass |
| IV | Clear, consistent API | REST plural resources under `/api`; single `errorHandler` producing `{ error: { code, message } }`; zod `validate` middleware on every route; `server/API.md` generated from the contract. Adds `502 IMAGE_SOURCE_UNAVAILABLE` for upstream failure — a correct status the constitution's list doesn't forbid | ✅ Pass |
| V | Security basics | Pixabay key only in `server/.env`; server fetches images by id (never client URLs → no SSRF); `helmet`, CORS locked to `CLIENT_ORIGIN`; `.env` gitignored, `.env.example` committed. No passwords/authorization in F1 (single stand-in owner); every query still scoped by `owner` | ✅ Pass |
| VI | Polished UX | Broadsheet tokens defined once in Tailwind `@theme`; shadcn components restyled once; loading/empty/error for search, collections, collection; toasts + disabled states; alt text, labels, focus ring; 375 px layouts per `08-phone…` | ✅ Pass |
| VII | Performance | `loading="lazy"` images with fixed aspect boxes; 20-per-page Load more; server 24 h cache; saved images served with immutable cache headers | ✅ Pass |
| VIII | Verifiable progress | Conventional small commits per task group; Vitest/Supertest for collection rules, item save/edit/remove, error shape; quickstart doubles as README.txt run steps | ✅ Pass |

**Gate result (pre-research)**: PASS — no violations.

**Post-design re-check (after Phase 1)**: PASS. Design added `ImageAsset` storage and the
`?sourceId=` list filter; both stay within the layered structure, add no new services or
datastores, and are documented in the contract. One noted deviation from the *mockup* (not the
constitution): Load more button instead of scroll-triggered loading, per clarified FR-004
(research R12).

## Project Structure

### Documentation (this feature)

```text
specs/001-discover-collect/
├── plan.md              # This file
├── research.md          # Phase 0 decisions (R1–R14)
├── data-model.md        # Entities, indexes, lifecycles, validation
├── quickstart.md        # Setup, run, automated checks, E2E scenarios S1–S8
├── contracts/
│   └── api.md           # REST endpoints, error codes, shared types, client routes
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
server/
├── package.json             # scripts: dev, build, start, test, lint, format, format:check
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── .env.example
├── API.md                   # endpoint docs (from contracts/api.md)
├── src/
│   ├── server.ts            # loads env, connects DB, ensures stand-in user, listens
│   ├── app.ts               # express app: helmet, cors, json, morgan, routes, notFound, errorHandler
│   ├── config/
│   │   └── env.ts           # zod-validated environment
│   ├── db/
│   │   └── connect.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Collection.ts
│   │   ├── SavedItem.ts
│   │   └── ImageAsset.ts
│   ├── schemas/             # zod request schemas
│   │   ├── searchSchemas.ts
│   │   ├── collectionSchemas.ts
│   │   └── itemSchemas.ts
│   ├── routes/
│   │   ├── index.ts         # mounts /health, /search, /collections, /images
│   │   ├── searchRoutes.ts
│   │   ├── collectionRoutes.ts   # includes nested /:id/items
│   │   └── imageRoutes.ts
│   ├── controllers/
│   │   ├── searchController.ts
│   │   ├── collectionController.ts
│   │   ├── itemController.ts
│   │   └── imageController.ts
│   ├── services/
│   │   ├── pixabayService.ts     # search, getById, downloadImage; 24 h caches
│   │   ├── collectionService.ts  # list/create/get/update/delete, touchCollection
│   │   ├── itemService.ts        # save/edit/remove, asset find-or-create & cleanup
│   │   └── userService.ts        # ensureStandInUser
│   ├── middleware/
│   │   ├── currentUser.ts        # sets req.userId (stand-in; JWT in Feature 2)
│   │   ├── validate.ts
│   │   ├── notFound.ts
│   │   └── errorHandler.ts
│   ├── utils/
│   │   ├── AppError.ts
│   │   ├── ttlCache.ts
│   │   ├── titleFromTags.ts
│   │   └── toDto.ts              # model → API shape mappers
│   └── types/
│       └── express.d.ts          # req.userId
└── tests/
    ├── setup.ts                  # mongodb-memory-server lifecycle, pixabay mock
    ├── collections.test.ts
    ├── items.test.ts
    ├── search.test.ts
    ├── errors.test.ts
    ├── pixabayService.test.ts    # real service with stubbed fetch (cache, 502 mapping, host allowlist)
    └── utils.test.ts

client/
├── package.json             # scripts: dev, build, preview, lint, format, format:check
├── vite.config.ts
├── tsconfig.json
├── components.json          # shadcn config
├── eslint.config.js
├── .prettierrc
├── .env.example
├── index.html               # Source Serif 4 font link
└── src/
    ├── main.tsx             # QueryClientProvider, BrowserRouter, Toaster
    ├── App.tsx              # routes + layout
    ├── index.css            # Tailwind + Broadsheet tokens (@theme)
    ├── api/
    │   ├── client.ts        # fetch wrapper → throws ApiError with code/message/fields
    │   ├── search.ts
    │   ├── collections.ts
    │   └── items.ts
    ├── types/
    │   └── api.ts
    ├── lib/
    │   ├── constants.ts     # APP_NAME, PAGE_SIZE, limits
    │   ├── queryKeys.ts
    │   ├── utils.ts         # cn()
    │   └── format.ts        # counts, relative dates
    ├── components/
    │   ├── ui/              # shadcn: button, input, textarea, label, popover, dialog,
    │   │                    #         alert-dialog, sheet, skeleton, sonner
    │   ├── AppHeader.tsx
    │   ├── PageContainer.tsx
    │   ├── ImageCredit.tsx
    │   ├── LazyImage.tsx
    │   ├── EmptyState.tsx
    │   ├── ErrorState.tsx
    │   └── GridSkeleton.tsx
    ├── features/
    │   ├── search/
    │   │   ├── SearchBar.tsx
    │   │   ├── SearchResultCard.tsx
    │   │   ├── SearchResults.tsx       # grid + states + Load more
    │   │   ├── SaveToCollectionPopover.tsx  # data logic; composes the two below
    │   │   ├── CollectionPickerRow.tsx
    │   │   ├── NewCollectionInline.tsx
    │   │   └── useImageSearch.ts       # useInfiniteQuery
    │   ├── collections/
    │   │   ├── CollectionCard.tsx
    │   │   ├── CollectionGrid.tsx
    │   │   ├── CollectionForm.tsx       # shared create/edit fields + validation messages
    │   │   ├── NewCollectionDialog.tsx
    │   │   ├── CollectionHeader.tsx     # title, description, Edit, Delete
    │   │   ├── DeleteCollectionDialog.tsx
    │   │   └── useCollections.ts        # queries + mutations
    │   └── items/
    │       ├── SavedItemCard.tsx
    │       ├── SavedItemGrid.tsx
    │       ├── ItemDetailPanel.tsx      # side panel ≥1024px, Sheet on smaller screens
    │       ├── ItemEditForm.tsx         # explicit Save / Cancel
    │       └── useItems.ts
    └── pages/
        ├── SearchPage.tsx
        ├── CollectionsPage.tsx
        ├── CollectionPage.tsx
        └── NotFoundPage.tsx
```

**Structure Decision**: Web application with two independent npm projects, `server/` and `client/`,
matching Constitution III and the tech-stack input. No root `package.json`; each project is run
from its own directory (see [quickstart.md](./quickstart.md)). Feature 2 adds `auth` files to the
same layers and `features/auth` on the client; nothing here is renamed.

## Design mapping (from `design/`)

| Design element | Implementation |
|----------------|----------------|
| Colors, radius, spacing, type scale (`design-notes.md`) | Tailwind `@theme` tokens in `client/src/index.css`: `--color-paper #F3F2F2`, `--color-surface #EAE9E9`, `--color-ink #201E1D`, `--color-accent #0088B0` (+ pressed/deep/tint), `--color-accent-2 #D6006C` (+ tint/deep), neutral ramp; `--radius-sm 1px / default 2px / lg 4px`; spacing 5/10/15/20/30/40 |
| Source Serif 4 everywhere | Google Fonts link in `index.html`; `--font-serif` as the only family |
| Buttons (primary/secondary/ghost/icon; 36 px, 44 px on phone; cyan focus outline) | shadcn `button` variants rewritten to these four |
| Boxed search card (02) | `SearchResultCard`: image flush top, title 16/600, credit 12 @ 0.6, tags, Save + external-link icon |
| Save-to-collection popover (02) | `SaveToCollectionPopover`: rows with name + count, "Save" / "Already saved"; new-name input + Create |
| Result states (02b) | `GridSkeleton`, `EmptyState` (binoculars icon), `ErrorState` (cloud-slash icon, magenta, Retry) |
| Unboxed board card (03) | `CollectionCard`: cover image with its Pixabay credit, name, description, "N images · updated …"; the palette strip is a Feature 3 slot left out for now |
| Collection page (04) | `CollectionHeader` (label caps "COLLECTION", H1, description, meta, Edit + Delete); item grid + `ItemDetailPanel` right column with Display title / Personal note (n / 500) / Save changes / Cancel |
| Phone (08) | 16 px gutter, single-column search cards with inline Save, 2-column item grid, header actions stacked; detail as bottom `Sheet` |
| Photos | `LazyImage` applies `grayscale(0.35) contrast(1.15)` newsprint filter; credit always visible |

Omitted in Feature 1 (visible in mockups): color filter swatches, palette band/swatches and themed
header, Share, Explore, bell, avatar, Public/Private tags, "added by".

## Complexity Tracking

No constitution violations — table intentionally empty.

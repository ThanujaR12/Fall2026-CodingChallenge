# PixBoard Constitution

## Core Principles

### I. Working Software First, Scope Second

- Every feature MUST work end to end (UI → API → database and back) before work on the next
  feature begins.
- Features MUST be built in priority order: Feature 1 (core: search + collections) →
  Feature 2 (accounts, sharing, collaboration) → Feature 3 (standout/bonus).
- When time is short, stretch items MUST be cut first. Core requirements and `README.txt` MUST
  NOT be cut.

**Rationale**: The deadline (2026-09-18 11:59 PM CT) is fixed, and a working core app is
submittable on its own; a half-built ambitious app is not.

### II. Readable by a First-Time Reader

- TypeScript MUST be used in both `/client` and `/server`. API request and response shapes MUST
  have explicit types.
- Every source file MUST start with a one-line comment stating its purpose. Other comments MUST
  explain *why*, not restate *what*.
- Formatting and linting MUST be enforced by Prettier and ESLint; code MUST pass both before
  commit.
- Code MUST stay simple enough for the author (a first-year student) to explain line by line.
  Clear code is preferred over clever code; abstractions require a concrete, present need.

**Rationale**: Graders read the code without prior context, and style/readability is scored
directly.

### III. Organized for Extension

- Frontend and backend MUST be separate projects (`/client`, `/server`) running as separate
  servers.
- Frontend: components MUST be small and single-purpose; all HTTP calls MUST live in the
  `client/src/api/` service layer, never inside components; shared API types MUST live in one
  place (`client/src/types/`).
- Backend: code MUST follow the layered structure routes → controllers → services → models,
  with cross-cutting concerns in middleware (auth, validation, error handling, not-found).
- Logic MUST NOT be duplicated; shared helpers belong in `utils/` (server) or `lib/` (client).

**Rationale**: Organization and extensibility are grading criteria, and a predictable layout
lets anyone find where a change belongs.

### IV. Clear, Consistent API

- Endpoints MUST be RESTful: plural resource nouns under `/api`, correct HTTP verbs, and correct
  status codes (200/201 success, 204 delete, 400 validation, 401 unauthenticated, 403 forbidden,
  404 not found, 409 duplicate, 500 unexpected).
- A single central error handler MUST produce every error response in exactly this shape:
  `{ "error": { "code": string, "message": string } }`.
- All request input MUST be validated at the edge by validation middleware (zod schemas) before
  reaching controllers.
- Every endpoint MUST be documented in `server/API.md` (method, path, auth, body, responses,
  example) in the same change that adds or alters it.

**Rationale**: "Documented endpoints, clear error handling" is the top backend-style tier, and a
uniform contract keeps the client simple.

### V. Security Basics

- Third-party API keys (e.g., Pixabay) and secrets (JWT secret, database URI) MUST live only in
  server environment variables. They MUST NOT appear in frontend code, logs, or git history.
  Pixabay MUST be called only from the backend.
- Passwords MUST be hashed (bcrypt) and MUST NOT be stored or logged in plain text.
- Authorization MUST be enforced on the server for every collection and item action according
  to role (owner / editor / viewer). Client-side checks are for UX only.
- `.env` files MUST be gitignored; `server/.env.example` (and client equivalent) MUST be
  committed with every required variable listed.

**Rationale**: The app has accounts and shared data; leaking a key or trusting the client would
be a real defect, not a style issue.

### VI. Polished, Consistent User Experience

- The UI MUST follow `design/` (Broadsheet design system: colors, Source Serif 4 typography,
  spacing, components). Design tokens MUST be defined once (Tailwind theme / CSS variables) and
  reused, not hard-coded per component.
- Layouts MUST be responsive from ~375px phone width to desktop.
- Every data view MUST have loading, empty, and error states.
- User actions MUST give immediate feedback via optimistic updates or a visible progress
  indicator.
- Accessibility basics MUST be met: alt text on images, labeled inputs, keyboard-reachable
  controls, and sufficient text contrast (contrast wins over palette theme fidelity).

**Rationale**: Aesthetics are scored for feeling "like a real app," and consistency comes from
shared tokens and states, not per-screen effort.

### VII. Performance by Default

- Images MUST lazy-load.
- Search results MUST paginate or load incrementally; the client MUST NOT fetch unbounded result
  sets.
- The backend MUST cache identical image-search queries for a short period, within Pixabay's
  caching rules.

**Rationale**: Low latency and lazy/optimistic loading are explicitly listed bonus criteria, and
caching protects the Pixabay rate limit.

### VIII. Verifiable Progress

- Commits MUST be small and use conventional messages (`feat:`, `fix:`, `docs:`, `refactor:`,
  `chore:`, optionally scoped, e.g. `feat(api): add remove-item endpoint`).
- Critical backend paths — authentication, collection permissions, and add/edit/remove items —
  MUST have automated tests (Vitest + Supertest) that pass before the feature is considered done.
- A fresh clone MUST install and run using only the instructions in `README.txt`.

**Rationale**: Commit history and reproducibility are how graders verify the work; tests on
permission logic catch the bugs that are hardest to see manually.

## Project Constraints & Deliverables

- **Deadline**: Friday 2026-09-18, 11:59 PM Central Time. The completion form MUST be submitted.
- **Stack** (per `docs/requirements/requirements/06-tech-stack-plan-input.md`): Vite + React +
  TypeScript with a component library (shadcn/ui + Tailwind); React Router; TanStack Query;
  Node.js + Express + TypeScript; MongoDB Atlas + Mongoose; bcrypt + JWT; zod; Pixabay API.
  Deviations MUST be justified in the feature's `plan.md`. C++ MUST NOT be used.
- **Required capabilities**: create collections, search images, save and edit saved content,
  remove content, view own collections, share collections, and a good-looking UI.
- **Required backend endpoints**: save an image to a collection, delete an image from a
  collection, share a collection — backed by a real database.
- **README.txt** (plain `.txt`, not `.md`) MUST include full name and Vanderbilt email,
  install/run instructions, a reflection under 100 words, and challenge feedback.
- **Attribution**: Pixabay image credit (creator name + link to the Pixabay page) MUST be shown
  wherever saved or searched images are displayed, and Pixabay hotlinking rules MUST be followed.
- **Planning artifacts**: the `specs/` folder produced by Spec Kit MUST be committed.

## Development Workflow & Quality Gates

- Each feature follows the Spec Kit loop: specify → clarify → plan → tasks → analyze →
  implement → converge.
- Implementation proceeds one phase (or a few tasks) at a time. After each chunk, the author
  MUST: run the app, test the change, read the code until it can be explained, then commit.
- Feature 2 MUST NOT start until Feature 1 works end to end and is committed; Feature 3 likewise
  waits on Feature 2.
- A chunk is done only when: lint and format pass, relevant tests pass, affected endpoints are
  documented in `server/API.md`, and loading/empty/error states exist for affected views.
- Every `plan.md` MUST include a Constitution Check against Principles I–VIII; any violation
  MUST be recorded with justification in the plan's complexity tracking.

## Governance

- This constitution supersedes other project practices and guidance. Where a spec, plan, or
  task conflicts with it, the constitution wins until amended.
- **Amendments**: edit `.specify/memory/constitution.md` via `/speckit-constitution`, state the
  reason in the commit message (`docs: amend constitution to vX.Y.Z (...)`), and check existing
  specs/plans for conflicts introduced by the change.
- **Versioning** (semantic):
  - MAJOR — a principle is removed or redefined in a backward-incompatible way.
  - MINOR — a principle or section is added or materially expanded.
  - PATCH — clarifications, wording, or typo fixes with no change in meaning.
- **Compliance review**: `/speckit-plan` MUST run the Constitution Check gate;
  `/speckit-analyze` MUST flag constitution conflicts as critical; before the final submission,
  the Deadline checklist in `docs/requirements/requirements/00-START-HERE.md` MUST be verified
  against this document.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16

# Constitution Input

Project: Change++ Fall 2026 Coding Challenge — image saving/sharing app.
Context: a first-year student's application project, graded on functionality, readability, organization, aesthetics, and creativity, with a hard deadline of 9/18 11:59 PM CT.

## Principles

### 1. Working software first, scope second
- Every feature must work end to end before the next one starts.
- Features are built in priority order: core → collaboration → standout.
- When time is short, cut stretch items, never core requirements or the README.txt.

### 2. Readable by a grader who has never seen the code
- TypeScript everywhere (frontend and backend), with explicit types for API request/response shapes.
- Comments explain *why*, not what. Every file starts with a one-line purpose comment.
- Consistent formatting enforced by Prettier and ESLint.
- Code stays simple enough for a first-year student to explain line by line. Prefer clear code over clever code.

### 3. Organized for extension
- Frontend and backend are separate projects (`/client`, `/server`) and separate servers.
- Frontend: small, single-purpose components; API calls live in one service layer, not inside components; shared types in one place.
- Backend: layered structure — routes → controllers → services → models, plus middleware (auth, validation, error handling).
- No duplicated logic; shared helpers go in `utils/`.

### 4. Clear, consistent API
- RESTful resource naming (plural nouns, correct HTTP verbs, correct status codes).
- One central error handler; every error response has the same JSON shape: `{ "error": { "code": string, "message": string } }`.
- Validate all input at the edge (request validation middleware).
- Every endpoint is documented (method, path, auth, body, responses).

### 5. Security basics
- Third-party API keys and secrets live only in server environment variables, never in frontend code or git.
- Passwords are hashed; never stored or logged in plain text.
- Authorization is checked on the server for every collection action (owner / editor / viewer).
- `.env` is gitignored; a `.env.example` is committed.

### 6. Polished, consistent user experience
- The UI follows the design in `design/` (colors, typography, spacing, components).
- Responsive from phone width (~375px) to desktop.
- Every data view has loading, empty, and error states.
- User actions give immediate feedback (optimistic updates or clear progress indicators).
- Accessible basics: alt text on images, labeled inputs, keyboard-reachable controls, sufficient contrast.

### 7. Performance
- Images lazy-load; search results paginate or load incrementally.
- The backend caches repeated image-search queries for a short period.

### 8. Verifiable progress
- Small commits with conventional messages (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Critical backend paths (auth, collection permissions, add/remove items) have automated tests.
- A fresh clone must run using only the README.txt instructions.

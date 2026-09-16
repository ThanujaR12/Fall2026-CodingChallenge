# Quickstart & Validation: Discover & Collect (Core)

**Feature**: [spec.md](./spec.md) | **API**: [contracts/api.md](./contracts/api.md) |
**Data model**: [data-model.md](./data-model.md)

A run guide and a set of end-to-end checks that prove Feature 1 works. The final `README.txt`
install steps are derived from this file.

## Prerequisites

- Node.js 22 LTS and npm 10 (`node -v`, `npm -v`)
- A MongoDB Atlas free cluster connection string (Database → Connect → Drivers), with your IP
  allowed under Network Access
- A Pixabay API key (https://pixabay.com/api/docs/, free account)

## Setup

```bash
cd server
npm install
cp .env.example .env      # then fill MONGODB_URI and PIXABAY_API_KEY
```

`server/.env` (see [research R8](./research.md#r8-backend-stack-details)):

```text
PORT=4000
MONGODB_URI=mongodb+srv://...
PIXABAY_API_KEY=...
CLIENT_ORIGIN=http://localhost:5173
```

`JWT_SECRET` is not needed until Feature 2.

```bash
cd client
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
```

## Run

Commands are written one per line so they work in bash, zsh, cmd, and Windows PowerShell 5.1
(which does not support `&&`). On Windows, use `copy .env.example .env` instead of `cp`.

Terminal 1:

```bash
cd server
npm run dev
```

Expected: log lines `Connected to MongoDB` and `API listening on http://localhost:4000`.
Missing env vars stop the server with a message naming the variable.

Terminal 2:

```bash
cd client
npm run dev
```

Open http://localhost:5173 → redirects to `/search`.

Smoke check: `curl http://localhost:4000/api/health` → `{"status":"ok"}`.

## Automated checks

In `server/`:

```bash
npm test
npm run lint
npm run format:check
```

In `client/`:

```bash
npm run lint
npm run format:check
npm run build
```

Expected: all pass. Tests need no API keys; the first `npm test` run downloads a MongoDB binary
for `mongodb-memory-server` (one-time, needs internet).

## End-to-end validation scenarios

Run against the live app. Each maps to spec stories/requirements.

### S1 — The success-criterion run (SC-001)
1. Search `lighthouse` → grid of 20 photos, each with a title, tags, "Photo by … on Pixabay".
2. Save a result → popover prompts to create a first collection → create `Coast trip` → toast
   "Saved to Coast trip".
3. Save two more results to `Coast trip`.
4. Open **My collections** → `Coast trip`, 3 images, cover = last saved image with its
   "Photo by … on Pixabay" credit.
5. Open it → 3 images newest first. Open one → detail panel → Edit → note "for the hallway" → Save.
6. Remove a different image → count shows 2.
7. Reload the page → 2 images, note still present.
- **Pass**: completed in under 2 minutes without instructions.

### S2 — Search states (US1, FR-002/004/005)
- Submit with the box empty or spaces → no request (Network tab shows none).
- Search `mountain` → press **Load more** → 20 more appended, scroll position kept.
- Search `zzqqxxnonsense` → empty state with a suggestion.
- Stop the server (or set an invalid `PIXABAY_API_KEY` and restart) → search shows error with
  **Retry**; restore → Retry succeeds.
- Search a common word and press Load more until the end → button replaced by "End of results"
  (≤ 25 pages).
- The search box refuses a 101st character.

### S3 — Collection rules (US2, US5, FR-007/008/011)
- Create `Kitchen ideas`; then `kitchen ideas ` → "A collection with that name already exists."
- Name empty or 61 chars, description 281 chars → field-level messages, nothing created.
- Rename `Kitchen ideas` → `Kitchen` → Save → shown immediately and after reload.
- Start editing, change text, **Cancel** → original value, nothing stored.
- Collections list order: edit an older collection → it moves to the top.

### S4 — Save rules (US3, FR-014/015/015a/016)
- Open the save popover on an image already in `Coast trip` → `Coast trip` shows "Saved" and is
  not clickable.
- Save the same image to another collection → succeeds as a separate entry.
- From the popover, type a new name and **Create** → collection created, image saved, still on the
  same results and scroll position.
- Double-click Save/Create → exactly one item/collection created.
- API check: `POST /api/collections/<id>/items` twice with the same `sourceId` → second is
  `409 ITEM_ALREADY_SAVED` with the standard error shape.

### S5 — Remove & delete (US6, FR-012/020)
- Image saved in A and B → remove from A → still in B with its own title and note.
- Delete a collection → confirmation dialog → **Cancel** keeps it; **Delete** removes it and it no
  longer appears after reload.

### S6 — Detail view (US7, FR-022)
- Open a saved image → larger image, title, note, tags, credit, "View on Pixabay" opens in a new
  tab; close → back at the same grid position. `?item=` in URL; browser Back closes it.

### S7 — Persistence and hotlink-safe images (FR-023, SC-003, research R1)
- Stop and restart the server → all collections, items, titles, notes unchanged.
- In DevTools, saved-item images load from `localhost:4000/api/images/...`, not `pixabay.com`.

### S8 — Layout, feedback, accessibility (FR-024/027/028, SC-004/005)
- DevTools device toolbar at 375 px → search, collections, collection, detail (as sheet) usable,
  no horizontal scroll; buttons ≥ 44 px tall.
- Every save/edit/remove shows a toast, spinner, or disabled state within 1 s.
- Tab through search → result Save → popover → collection rows: all reachable, visible cyan focus
  ring. All images have alt text (the title).
- Throttle to "Slow 4G" → grid images appear as they scroll into view; skeletons shown while
  loading.

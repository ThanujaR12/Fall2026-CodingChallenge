---
description: "Task list for Feature 3 — Palette Boards & Standout Extras"
---

# Tasks: Palette Boards & Standout Extras

**Input**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md), [quickstart.md](./quickstart.md)

**Tests**: Server tests for every new endpoint and rule. Every UI task verified in headless Chrome
against a throwaway in-memory copy of the app (screenshots and scripted checks).

## Rules that apply to every task

- One-line purpose comment on every new file; `AppError` + central `errorHandler` only.
- Every added or changed endpoint documented in `server/API.md` in the same commit.
- Lint and format pass before each commit; one feature per commit, pushed as it lands.

---

## Phase 1: Foundations for the new experience (US9)

- [X] T001 Logo: board mark + wordmark component, favicon, app icons (`b4a4e63`)
- [X] T002 Home feed: `GET /api/feed` (topics, 24 h cache), masonry grid, topic chips, infinite scroll, Pinterest-style photo cards (`ad1684c`)
- [X] T003 Auto-hiding sidebar and phone bottom bar; header logo swaps with the sidebar icon (`8883594`)

## Phase 2: Palette Boards (US1–US4) — P1

- [X] T004 [US1] `ImageAsset.colors` extracted with node-vibrant on save; lazy backfill; merged `palette` on every collection summary; tests (`978d797`)
- [X] T005 [US3] Colour filter on `GET /feed` and `GET /search/images`; tests; API.md (`978d797`)
- [X] T006 [US1][US3][US4] Palettes page: board palette cards (copy swatch, Copy all, Download, Find more), Browse by colour with optional keyword; rainbow sidebar icon (`978d797`)
- [X] T007 [US2] Board and share-link pages themed from the palette with AA-checked accent; palette strip on board cards; "Find more like this palette" (`ffd0996`)
- [X] T008 [US3] Grayscale returns only black-and-white photos (adds "black and white" to the query); measured 0/80 colour photos (`64e665c`)
- [X] T009 [US3][US4][US1] Search page colour swatches; Copy all / Download on board pages; grey placeholder palette for empty boards (`42d85a7`)

## Phase 3: Bonus B1 — Public boards and Explore (US5)

- [X] T010 [US5] `Collection.visibility`, owner-only `changeVisibility` permission; `GET /explore`, `GET /explore/:id`; tests; API.md (`1162841`)
- [X] T011 [US5] Explore page (signed-out friendly, colour filter), public read-only board view, "Public on Explore" switch in Share (`1162841`)
- [X] T012 [US5] Create a board as public from the start (`d621ca5`)

## Phase 4: Bonus B3 — Notifications (US7)

- [X] T013 [US7] `Notification` model; notify other members on item add/edit/remove and invitees on invite; list / read / read-all endpoints; tests; API.md (`67f147c`)
- [X] T014 [US7] Bell with unread badge; Pinterest-style panel beside the sidebar (Activity + Updates); phone page; optimistic mark-read (`67f147c`)

## Phase 5: Bonus B2 — Fast-feeling UI (US6)

- [X] T015 [US6] Lazy images with placeholders and automatic "load more" on scroll (`ad1684c`)
- [X] T016 [US6] Optimistic save and edit with rollback (remove was already optimistic) (`49a3b4a`)

## Phase 6: Experience additions (US9)

- [X] T017 [US9] Voice search in the search bar (`943f9a4`)
- [X] T018 [US9] Real Create page with live preview; remove the unfinished Chat item and placeholder page (`49a3b4a`)

## Phase 7: Bonus B4 — Board activity history (US8) — P3

- [ ] T019 [US8] `GET /api/collections/:id/activity` (anyone who can view the board; one entry per change); tests; API.md
- [ ] T020 [US8] "Recent activity" list on the board page

## Phase 8: Polish

- [ ] T021 README.txt: features tour, setup, live link
- [ ] T022 Deploy publicly (API and client) so reviewers can use one link

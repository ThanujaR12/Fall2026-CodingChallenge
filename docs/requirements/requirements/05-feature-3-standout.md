# Feature 3 — Palette Boards & Standout Extras

> Input for `/speckit.specify`. Builds on Features 1 and 2. Describes WHAT and WHY only.
>
> **Signature concept used here: "Palette Boards."** If you pick a different creative twist, replace the "Signature feature" section before running `/speckit.specify`, and keep the "Bonus features" section.

## Why

Many applicants will build a Pinterest-style grid. This app stands out by treating every collection as a **mood board with its own color identity**: color is how people remember visual things, so the app lets users find, organize, and share by color. The bonus items target the rubric's creativity examples directly.

## Signature feature — Palette Boards

### US1 — Each collection has a color palette (P1)
- Every collection shows a palette of up to 5 dominant colors drawn from its saved images.
- The palette updates automatically when images are added or removed.
- Hovering or tapping a color swatch shows its hex code, and I can copy it.
- An empty collection shows a neutral placeholder palette.

### US2 — The collection page takes on its palette (P1)
- Opening a collection subtly themes the page (accent color, header gradient) using its palette, while keeping text readable.
- The shared-link view (Feature 2) uses the same theme, so shared boards feel personal.

### US3 — Search by color (P1)
- On the search page I can pick a color filter (e.g., red, blue, green, black and white) alongside my keyword.
- From any collection, I can click "Find more like this palette" to run a search filtered to that board's main color.

### US4 — Palette export (P2)
- I can download or copy a collection's palette (hex codes list), useful for design projects.

## Bonus features (creativity rubric)

Build in this order; stop when time runs out.

### B1 — Public/private collections (P1)
- As an owner, I can mark a collection public or private.
- Public collections appear on an "Explore" page that anyone can browse.
- Private collections are visible only to the owner and invited members (and link visitors when the link is on).

### B2 — Fast-feeling UI (P1)
- Images lazy-load as they scroll into view, with a placeholder while loading.
- Search results load more automatically as I scroll.
- Adding, editing, and removing items update the screen instantly; if the server rejects the change, the screen rolls back and shows an error.
- Repeated identical searches return faster than the first one.

### B3 — Activity notifications for shared collections (P2)
- When a member adds, edits, or removes an item in a shared collection, other members see a notification (bell icon with unread count).
- Each notification says who did what, in which collection, and when.
- I can mark notifications as read.

### B4 — Collection activity history (P3)
- A collection shows a recent activity feed (who added/removed what and when).

## Non-functional requirements

- Palette colors are computed once per saved image and stored, not recomputed on every page view.
- Themed pages meet readable contrast for text.
- Features degrade gracefully: if a palette can't be computed for an image, the collection still works.

## Success criteria

- A grader opens a shared board and immediately sees a distinct, color-themed collection with a copyable palette, clicks "Find more like this palette," and saves a matching image — all with smooth, instant-feeling interactions.

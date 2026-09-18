# API Contract: Palette Boards & Standout Extras

The full, authoritative reference (request/response shapes, errors, curl examples) is
[`server/API.md`](../../../server/API.md). This file lists what Feature 3 adds or changes.

| Method & path | Auth | Purpose |
|---------------|------|---------|
| `GET /feed?topic=&color=&page=` | none | Home feed: popular photos per topic, optional colour |
| `GET /search/images?q=&color=&page=` | none | Adds the optional `color` filter |
| `GET /explore?color=&page=` | none | Public, non-empty boards; optional colour filter |
| `GET /explore/:id` | none | Read-only public board (`404 BOARD_NOT_PUBLIC` if private) |
| `POST /collections` | token | Adds optional `visibility` (default `private`) |
| `PATCH /collections/:id` | token | Adds `visibility` (owner only, else `403 FORBIDDEN`) |
| `GET /collections/:id/activity` | token | Recent activity on a board (anyone who can view it) |
| `GET /collections/:id/recommendations?page=` | token | "More ideas": photos like the board's, plus `basedOn` |
| `GET /notifications` | token | Newest 50 + `unreadCount` |
| `POST /notifications/:id/read` | token | Mark one read (`404 NOTIFICATION_NOT_FOUND` if not yours) |
| `POST /notifications/read-all` | token | Mark all read |

Every `CollectionSummary` now includes `palette: string[]` and `visibility`.

Colour names: `red`, `orange`, `yellow`, `green`, `turquoise`, `blue`, `lilac`, `pink`, `brown`,
`black`, `gray`, `white`, `grayscale`.

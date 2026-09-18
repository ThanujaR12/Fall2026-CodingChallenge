# Implementation Plan: Palette Boards & Standout Extras

**Branch**: `main` (feature dir `003-palette-boards`) | **Date**: 2026-09-18 | **Spec**: [spec.md](./spec.md)

**Input**: `docs/requirements/requirements/05-feature-3-standout.md`, tech stack from
`06-tech-stack-plan-input.md`, design `design/screens/07-explore*.png`, and the author's reference
screenshots (Pinterest home and notifications panel).

## Summary

Give every board a color identity (palette extracted server-side, merged per board, shown and
exported everywhere, and used to theme board pages), add color filters to search, and add the bonus
features in rubric order: public boards and Explore, optimistic saves/edits/removes, activity
notifications, and a board activity history. Alongside, reshape navigation into a Pinterest-style
home feed with an auto-hiding sidebar, and add a Create page and voice search.

## Technical Context

**Language/Version**: TypeScript 5 on Node.js 22 (server) and browser (client), unchanged

**Primary Dependencies**: adds `node-vibrant` 4 (server, palette extraction). No new client packages;
voice search uses the browser's Web Speech API.

**Storage**: MongoDB Atlas via Mongoose. `ImageAsset` gains `colors`, `Collection` gains
`visibility`, new `Notification` collection.

**Testing**: Vitest + Supertest + mongodb-memory-server. New suites: feed, palettes, explore,
notifications, plus colour-filter cases in search and the Pixabay service. Every UI change verified
in headless Chrome against a throwaway in-memory copy of the app.

**Constraints**: no hotlinking (images served from our stored copies); palette work must never block
a save; AA contrast on themed pages; deadline 2026-09-18 23:59 CT.

## Constitution Check

| Principle | How this feature complies |
|-----------|---------------------------|
| One-line purpose comment per file | Every new file starts with one |
| Lint and format before commit | `npm run lint` / `format` run before each commit |
| Endpoints documented in `server/API.md` in the same commit | Feed, Explore, Notifications, colour filters, visibility, palette field |
| Server-side permissions | `changeVisibility` added to the single `PERMISSIONS` table (owner only) |
| One error shape via `errorHandler` | New codes `BOARD_NOT_PUBLIC`, `NOTIFICATION_NOT_FOUND` |
| Tests for critical paths | 180 server tests; new suites listed above |

## Design decisions

See [research.md](./research.md) for the reasoning behind each.

1. **Palette extraction on save** (node-vibrant on the stored copy), backfilled lazily for older
   images; merged per board by grouping similar shades and weighting each image's leading colors.
2. **Theme from palette**: header wash with alpha scaled down for dark colours, accent darkened until
   4.5:1 against the washed background.
3. **Colour search via Pixabay's `colors` filter**; grayscale always adds "black and white" to the
   query after measuring that the filter alone lets colour photos through.
4. **Explore** filters in the API over public, non-empty boards; the public view reuses the share-link
   page.
5. **Optimistic UI** with TanStack Query `onMutate` / rollback `onError` for save, edit, remove, and
   notification read state.
6. **Notifications** are written by the item and member services after the change succeeds, isolated
   so a failure is only logged; the client polls every 30 s.
7. **Masonry** is absolutely positioned so DOM order stays feed order (keyboard and screen readers)
   and appended pages never move existing tiles.

## Project Structure (added or changed)

```text
server/src/
  config/ colors.ts feedTopics.ts
  models/ ImageAsset.ts (colors) Collection.ts (visibility) Notification.ts
  services/ paletteService.ts exploreService.ts notificationService.ts pixabayService.ts itemService.ts
  controllers/ feedController.ts exploreController.ts notificationController.ts
  routes/ feedRoutes.ts exploreRoutes.ts notificationRoutes.ts
client/src/
  components/ MasonryGrid.tsx PaletteStrip.tsx Logo.tsx
  features/ feed/ palettes/ notifications/ navigation/ search/useVoiceSearch.ts
  pages/ HomePage PalettesPage ExplorePage CreatePage NotificationsPage
  lib/ colors.ts boardTheme.ts palette.ts clipboard.ts
```

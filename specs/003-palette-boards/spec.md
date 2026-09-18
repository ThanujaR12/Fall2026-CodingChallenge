# Feature Specification: Palette Boards & Standout Extras

**Feature Branch**: `003-palette-boards`

**Created**: 2026-09-18

**Status**: Implemented

**Input**: User description: "Use docs/requirements/requirements/05-feature-3-standout.md as the feature
description", plus the author's requests on 2026-09-17/18 for a Pinterest-style home, a sidebar,
voice search, and a Create page.

> **How this feature was built.** Features 1 and 2 went through the full Spec Kit loop before any
> code. Feature 3 was built directly on the deadline day, one requirement at a time, each pushed as
> its own commit and verified in a real browser. This spec, the plan, and the task list were written
> alongside the work and record what was built and why; every task below maps to a commit.

## Clarifications

### Session 2026-09-18

- Q: Where do people meet the palette feature? → A: A dedicated **Palettes** item in the sidebar,
  drawn in a rainbow ring so it stands out, plus each board's own page and card.
- Q: How are a board's colors chosen? → A: Up to five dominant colors, read once from each saved
  image and merged across the board (similar shades grouped; each image's leading colors count most).
- Q: What does "Find more like this palette" search for? → A: Photos in the named color closest to
  the board's leading color (for example a dark olive board finds "brown").
- Q: Must "Black and white" results contain no color? → A: Yes. Photos must be truly black and
  white (the author found Pixabay's own grayscale filter lets color photos through).
- Q: Can signed-out visitors browse Explore? → A: Yes. Explore and public boards need no account.
- Q: Who is notified about changes on a shared board? → A: The owner and every member except the
  person who made the change. Invitees are notified when they are added.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Each board has a color palette (Priority: P1)

As a collector, I see each board's palette so I remember boards by color.

**Independent Test**: Save three photos to a board; its page, card, and the Palettes page show up to
five swatches; remove a photo and the palette changes; an empty board shows a grey placeholder.

**Acceptance Scenarios**:

1. **Given** a board with photos, **When** I view it anywhere, **Then** I see up to five of its
   dominant colors, most prominent first.
2. **Given** I add or remove a photo, **When** the board is shown again, **Then** its palette
   reflects the change.
3. **Given** a swatch, **When** I hover, focus, or tap it, **Then** its hex code shows, and clicking
   copies it with a confirmation.
4. **Given** an empty board, **When** it is shown, **Then** a neutral grey placeholder palette
   appears with "Save photos to see this board's colors."

### User Story 2 - A board's page takes on its palette (Priority: P1)

**Independent Test**: Open an orange board and a blue board; each header is washed in its own
colors, with a palette stripe, and all text still meets AA contrast.

**Acceptance Scenarios**:

1. **Given** a board with colors, **When** I open it (as a member or by share link or from Explore),
   **Then** the header shows a soft wash of its colors, a stripe of its palette, and an accent label.
2. **Given** a very dark or very light palette, **When** the page is themed, **Then** body text,
   muted text, and the accent label all keep at least 4.5:1 contrast.

### User Story 3 - Search by color (Priority: P1)

**Independent Test**: On Search, type "flowers" and pick Pink: only pink photos. From a board, click
"Find more like this palette": photos in the board's main color, ready to save.

**Acceptance Scenarios**:

1. **Given** the Search page, **When** I pick a color beside my keyword, **Then** results are
   filtered to that color and the choice is kept in the page address.
2. **Given** the Palettes page, **When** I pick a color (optionally with a keyword), **Then** I get a
   scrolling board of photos in that color, each with Save.
3. **Given** "Black and white", **When** results load, **Then** they contain no color photos.
4. **Given** any board with colors, **When** I click "Find more like this palette", **Then** I see
   photos in its nearest named color.

### User Story 4 - Export a palette (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a board with colors, **When** I click Copy all, **Then** its hex codes are copied.
2. **When** I click Download, **Then** I get a text file named after the board listing its colors.

### User Story 5 - Public boards and Explore (Bonus B1, Priority: P1)

**Acceptance Scenarios**:

1. **Given** I own a board, **When** I turn on "Public on Explore" (in Share, or when creating it),
   **Then** it appears on Explore once it has photos; editors and viewers cannot change this.
2. **Given** anyone, signed in or not, **When** they open Explore, **Then** they see public boards as
   palette cards (cover, colors, name, owner, count), newest activity first, filterable by color.
3. **Given** a public board, **When** anyone opens it, **Then** they see it read-only and themed.
   Private boards never appear and their public address says the board isn't public.

### User Story 6 - Fast-feeling UI (Bonus B2, Priority: P1)

**Acceptance Scenarios**:

1. Images load as they scroll into view, with a placeholder while loading.
2. The home feed, search results, and color results load more automatically as I scroll.
3. Saving, editing, and removing photos update the screen instantly; if the server refuses, the
   screen rolls back and explains why (a refused edit reopens with what I typed).
4. Repeating an identical search or feed request returns faster than the first time.

### User Story 7 - Activity notifications (Bonus B3, Priority: P2)

**Acceptance Scenarios**:

1. **Given** a shared board, **When** a member adds, edits, or removes a photo, **Then** the other
   members get a notification; the person who acted does not.
2. **Given** I'm invited to a board, **Then** I get a notification naming who invited me and my role.
3. Each notification says who did what, on which board, and when; the bell shows the unread count.
4. I can open a notification (marking it read) or mark all as read.

### User Story 8 - Board activity history (Bonus B4, Priority: P3)

**Acceptance Scenarios**:

1. **Given** I can see a board, **When** I open it, **Then** a "Recent activity" list shows who
   added, edited, or removed which photo and when, newest first (including my own changes).
2. **Given** a board with no activity yet, **Then** the list explains that changes will appear there.

### User Story 9 - Experience additions requested by the author (Priority: P2)

1. **Home feed**: a Pinterest-style masonry board of popular photos with topic chips, open on login.
2. **Sidebar**: an icon rail (Home, Explore, Boards, Palettes, Create, Notifications) that peeks on
   arrival at Home, hides after about 3 seconds, and returns at the left edge or on keyboard focus.
   Phones get the same destinations as a bottom bar. No item leads to a "coming soon" dead end.
3. **Create page**: name, description, public/private, and an optional first search, with a live
   preview of the board card.
4. **Voice search**: a microphone in the search bar (where the browser supports speech recognition).
5. **Logo**: a four-tile "board" mark with the PixBoard wordmark, favicon, and app icons.

### User Story 10 - Boards on Home and "More ideas" (Priority: P2)

As a collector, my boards are one tap away on Home, and the app suggests photos to add to them.

**Acceptance Scenarios**:

1. **Given** I have boards, **When** I open Home, **Then** they appear in the chip row right after
   "All" (cover or colour, then name); picking one shows "Ideas for <board>" with an Open board link.
2. **Given** a board with photos, **When** I view its ideas (on Home or at the bottom of its page),
   **Then** I see photos matching its most common specific tags ("Based on: boat, harbor"), without
   photos it already holds; an empty board's ideas come from its name and description.
3. **Given** I can edit the board, **When** I tap Add on an idea, **Then** it is saved to that board
   at once ("Added"), rolling back if refused; viewers get the regular Save menu instead.

### User Story 11 - Photo page with "More like this" (Priority: P2)

As a browser, I click any photo to see it large, its colours, and photos like it.

**Acceptance Scenarios**:

1. **Given** any photo tile in a feed, **When** I click it, **Then** its page opens at once with the
   large photo, its colours (click to copy), title, credit, tags (each a search), and Save.
2. **Given** the photo page, **When** I look at "More like this", **Then** I see photos with the same
   subject; switching to "Same colours" shows its main subject in its leading colour.
3. **Given** a similar photo, **When** I click it, **Then** its own page opens at the top.
4. A "Mostly <colour>" card links to more photos in that colour on Palettes.

### User Story 12 - Search with a photo (Priority: P2)

As a browser, I take or upload a photo and find photos like it.

**Acceptance Scenarios**:

1. **Given** the search bar, **When** I tap the camera, **Then** I can take a photo (webcam or phone
   camera) or upload / drop one.
2. **Given** a photo, **When** it is analysed (with a scanning animation), **Then** I see what was
   recognised ("golden retriever 39%, Labrador retriever 35%"), its colours, and matching photos.
3. **Given** a wrong guess, **When** I pick another, **Then** the results follow it; "Same colours"
   narrows them to the photo's leading colour.
4. The photo never leaves the device; only the recognised words are searched.

### User Story 13 - Your profile (Priority: P2)

As a collector, clicking my avatar ("My profile" on hover) opens a profile of my saved ideas and
boards that I can personalise.

**Acceptance Scenarios**:

1. The page shows my name, @username, join date, bio, and stats (boards, saved photos,
   collaborators, boards shared with me).
2. My **colour signature** (all my boards' palettes blended) themes the page, rings my avatar, and
   links to photos in my main colour.
3. Tabs show everything I've saved (with the board each is on), my boards (plus Create), and boards
   shared with me; the tab is kept in the address.
4. I can edit my display name, bio (≤ 160), and avatar colour (suggested from my signature); the
   header avatar updates at once.

### User Story 14 - A personal "For you" feed (Priority: P1)

As a collector, Home feels made for me: fresh every visit, and more like what I save the more I save.

**Acceptance Scenarios**:

1. **Given** I haven't saved anything, **When** I open Home, **Then** "For you" shows a shuffled mix
   of popular photos that differs from visit to visit (and on Shuffle).
2. **Given** I've saved photos, **When** I open Home, **Then** the feed is built from my interests
   (recent saves count most; board names help), says what it learned, and labels each photo with
   why it was picked; a few popular discoveries are mixed in; photos I saved never reappear.
3. Tapping an interest searches it; Shuffle deals a fresh feed at once.

### Edge Cases

- An image whose colors can't be read still saves; its board simply has fewer colors.
- Images saved before palettes existed get their colors filled in when a board holding them loads.
- A failed notification never blocks or undoes the change that caused it.
- A board renamed or deleted after a notification still shows the name it had at the time.
- Voice search is hidden where the browser can't do it and explains blocked microphones.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every board MUST expose up to 5 dominant colors merged from its images; [] when empty.
- **FR-002**: Image colors MUST be computed once per stored image and kept, not per page view.
- **FR-003**: Palette swatches MUST reveal their hex code on hover/focus/tap and copy on click.
- **FR-004**: Board pages (member, share link, public) MUST be themed from the palette with AA text.
- **FR-005**: Search and the Palettes page MUST offer 13 color filters; the grayscale filter MUST
  return only black-and-white photos.
- **FR-006**: "Find more like this palette" MUST be available from every board with colors.
- **FR-007**: Boards MUST offer Copy all and Download of their palette.
- **FR-008**: Owners MUST be able to make a board public or private (default private); only owners.
- **FR-009**: Explore and public board views MUST work without an account and never show private or
  empty boards.
- **FR-010**: Save, edit, and remove MUST update the screen before the server answers and roll back
  on refusal.
- **FR-011**: Item changes on a board MUST notify every other member; invites MUST notify invitees.
- **FR-012**: Notifications MUST show actor, action, board, time, and read state; users can mark one
  or all as read; the bell shows the unread count.
- **FR-013**: Board pages MUST show a recent activity history visible to anyone who can see the board.
- **FR-014**: Home MUST list the user's boards (owned, and shared as editor) in the chip row, and
  every board MUST offer recommended photos based on its specific tags (or name), excluding photos
  already on it, with one-tap Add for editors.
- **FR-015**: Every photo tile MUST open a photo page with its colours and "More like this",
  switchable between the same subject and the same colours.
- **FR-016**: The search bar MUST offer search with a photo (camera or upload), recognising the
  photo on the device and never uploading it.

### Key Entities

- **ImageAsset.colors**: up to five hex colors read from the stored image.
- **Collection.visibility**: `private` (default) or `public`.
- **Notification**: recipient, actor, type, board (with its name at the time), photo title and
  thumbnail, role for invites, read time.

## Success Criteria *(mandatory)*

- **SC-001**: A grader opens a shared board and immediately sees a color-themed board with a copyable
  palette, clicks "Find more like this palette", and saves a matching photo.
- **SC-002**: 100% of "Black and white" results contain no color (measured: 0 of 80 color photos).
- **SC-003**: Saves and edits appear on screen in under 150 ms (measured: ~60–120 ms).
- **SC-004**: Themed headers keep text contrast at or above 4.5:1 for any palette.
- **SC-005**: No sidebar or bottom-bar destination leads to a placeholder page.

## Assumptions

- Pixabay's color names (red … grayscale) are the color vocabulary.
- Notifications refresh every 30 seconds rather than in real time; that is enough for small teams.
- Speech recognition is provided by the browser (Chrome, Edge, Safari) and may use the vendor's
  online service.

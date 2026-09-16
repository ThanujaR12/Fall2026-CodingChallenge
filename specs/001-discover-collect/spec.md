# Feature Specification: Discover & Collect (Core)

**Feature Branch**: `001-discover-collect`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Use docs/requirements/requirements/03-feature-1-core.md as the feature description."

## Clarifications

### Session 2026-09-16

- Q: Since this feature has no login, how should saved collections be linked to a user, so they carry over when accounts arrive in Feature 2? → A: Every collection has an owner from the start, set to one built-in stand-in user; Feature 2 hands those collections to the first account that registers.
- Q: When someone edits a saved image's title or note, or a collection's name or description, how should the change be saved? → A: Edit mode with explicit Save and Cancel buttons; nothing is stored until Save is pressed.
- Q: In the save step, where you pick a collection for a search result, should collections that already contain that image be marked? → A: Yes — collections that already contain the image show a "Saved" checkmark and can't be picked again; the duplicate message remains as a fallback.
- Q: How should users get more search results — automatically while scrolling, or on request? → A: A "Load more" button below the grid (keyboard-accessible, predictable), hidden when there are no more results.
- Q: In what order should the collections list be shown? → A: Most recently updated first (a save, removal, or edit counts as an update).

## User Scenarios & Testing *(mandatory)*

People find images online they love, save them somewhere, and lose them. This feature gives one
person a single place to discover images, save them into named collections, add their own notes,
and find them again quickly. It is the minimum complete app: if nothing else ships, this must work.

### User Story 1 - Search for images (Priority: P1)

As a user, I search for images by keyword so I can discover content worth saving.

**Why this priority**: Discovery is the entry point for all saved content; without search there is
nothing to collect.

**Independent Test**: Enter a keyword, see a grid of matching images with credits, load more results
on the same page, and observe the empty and error states by searching nonsense and simulating a
service failure.

**Acceptance Scenarios**:

1. **Given** the search page, **When** I enter "mountain" and submit, **Then** I see a grid of
   matching images, each with a thumbnail, its tags, and the creator's name.
2. **Given** a results grid with more results available, **When** I press "Load more", **Then** the next
   set of results is appended below the current ones without leaving or reloading the page, and my
   scroll position is kept.
3. **Given** a keyword that matches nothing, **When** I submit, **Then** I see a friendly empty state
   that suggests trying a different or broader keyword.
4. **Given** the image search service is unavailable, **When** I submit a search, **Then** I see an
   error message with a Retry action that repeats the same search.
5. **Given** the search box is empty or contains only spaces, **When** I try to submit, **Then** no
   search is sent and the current page stays as it was.
6. **Given** a search is in progress, **When** I wait, **Then** I see a loading indicator in place
   of the results.

---

### User Story 2 - Create a collection (Priority: P1)

As a user, I create a named collection so I can group related images.

**Why this priority**: Collections are the container every save, view, edit, and remove depends on.

**Independent Test**: Create a collection with a name and description, see it appear in the
collections list immediately, then try a duplicate name and an over-long name and see clear
rejections.

**Acceptance Scenarios**:

1. **Given** the collections page, **When** I create a collection named "Kitchen ideas" with a
   description, **Then** it appears in my collections list immediately with 0 items.
2. **Given** a collection named "Kitchen ideas" exists, **When** I create another named
   "kitchen ideas " (different case, trailing space), **Then** it is rejected with a message saying a
   collection with that name already exists.
3. **Given** the create form, **When** the name is empty or longer than 60 characters, or the
   description is longer than 280 characters, **Then** the collection is not created and the form
   explains which field is invalid and why.

---

### User Story 3 - Save an image to a collection (Priority: P1)

As a user, I save an image from search results into one of my collections.

**Why this priority**: Saving is the core value of the product — it is what turns discovery into
something the user keeps.

**Independent Test**: From a search result, pick a collection and save; see confirmation; open that
collection and find the image. Repeat the save and see the duplicate message. Create a new
collection from inside the save step and confirm the search results are still there afterward.

**Acceptance Scenarios**:

1. **Given** search results and at least one collection, **When** I choose Save on a result and pick
   a collection, **Then** the image is saved to that collection and I see a confirmation naming the
   collection.
2. **Given** the save step is open, **When** I create a new collection from within it, **Then** the
   new collection is created, the image is saved to it, and I remain on the same search results at
   the same scroll position.
3. **Given** an image is already in a collection, **When** I open the save step for it, **Then**
   that collection is marked "Saved" and cannot be picked; if a duplicate save is still attempted
   (e.g., from a stale page), it is prevented and I see a message that it is already saved there.
4. **Given** an image is in collection A, **When** I save it to collection B, **Then** it is saved to
   B as a separate entry.
5. **Given** I have no collections yet, **When** I choose Save on a result, **Then** the save step
   prompts me to create my first collection.

---

### User Story 4 - View my collections (Priority: P1)

As a user, I browse my collections and their contents.

**Why this priority**: Finding saved images again is the reason the product exists.

**Independent Test**: With several collections (one empty), open the collections list and check
name, cover, and count for each; open a collection and verify newest-first order; open the empty
one and follow its link to search.

**Acceptance Scenarios**:

1. **Given** I have collections, **When** I open my collections, **Then** I see every collection with
   its name, a cover preview, and its item count, most recently updated first.
2. **Given** a collection with saved images, **When** I open it, **Then** I see all of its saved
   images in a grid ordered newest saved first, along with its name and description.
3. **Given** an empty collection, **When** I open it, **Then** I see an inviting empty state with a
   link that takes me to search.
4. **Given** I have no collections at all, **When** I open my collections, **Then** I see an empty
   state that invites me to create my first collection.

---

### User Story 5 - Edit saved content (Priority: P1)

As a user, I personalize saved images and collections so I remember why I saved them.

**Why this priority**: Notes and titles are what make a saved image findable and meaningful later;
editing is an explicit challenge requirement.

**Independent Test**: Edit an image's title and note, rename a collection and change its
description, reload the page, and confirm all changes are still there.

**Acceptance Scenarios**:

1. **Given** a saved image, **When** I change its display title and write a note, **Then** the
   changes are shown immediately and are still there after a page reload.
2. **Given** a collection, **When** I rename it and edit its description, **Then** the new values are
   shown immediately and are still there after a page reload.
3. **Given** I edit a note, **When** it exceeds 500 characters, **Then** it is not saved and I am told
   the limit.
4. **Given** I rename a collection, **When** the new name is empty, over 60 characters, or matches
   another of my collections, **Then** the rename is rejected with the same rules and messages as
   creation.
5. **Given** an edit fails to save, **When** the failure occurs, **Then** I see an error and the
   displayed value returns to the last saved value.
6. **Given** I am editing a title, note, name, or description, **When** I press Cancel, **Then** my
   unsaved changes are discarded and nothing is stored.

---

### User Story 6 - Remove content (Priority: P1)

As a user, I remove things I no longer need.

**Why this priority**: Removal is an explicit challenge requirement and keeps collections useful.

**Independent Test**: Save the same image to two collections, remove it from one, and confirm the
other still has it; delete a collection after confirming, and confirm cancelling leaves it intact.

**Acceptance Scenarios**:

1. **Given** a saved image in a collection, **When** I remove it, **Then** it disappears from that
   collection and the collection's item count decreases by one.
2. **Given** the same image saved in collections A and B, **When** I remove it from A, **Then** it
   remains in B unchanged, including its title and note.
3. **Given** a collection, **When** I choose to delete it, **Then** I am asked to confirm, and only
   after confirming is the collection and everything saved in it removed.
4. **Given** the delete confirmation is shown, **When** I cancel, **Then** nothing is deleted.

---

### User Story 7 - View an image in detail (Priority: P2)

As a user, I open a saved image to see it larger with everything I know about it.

**Why this priority**: Improves recall and credits the source properly, but the core flow works
without it.

**Independent Test**: Open a saved image from a collection and check the larger image, title, note,
tags, credit, and a working link to the original page.

**Acceptance Scenarios**:

1. **Given** a collection with saved images, **When** I click an image, **Then** a larger view opens
   showing its title, note, tags, creator credit, and a link to the original source page.
2. **Given** the detail view is open, **When** I follow the source link, **Then** the original page
   opens without closing the app.
3. **Given** the detail view is open, **When** I close it, **Then** I return to the collection at the
   same position.

---

### Edge Cases

- The search box accepts at most 100 characters (the search service's limit); longer input cannot be
  entered, so it is never sent.
- Special characters or non-English keywords are searched as typed.
- After the last page of results, the "Load more" button is hidden and an "end of results" note is
  shown, so no further request can be made. The image source caps a single search at about 500
  results; that cap is treated as the last page.
- A search image or saved image fails to load: a neutral placeholder is shown and the rest of the
  grid still works.
- The source removes an image after it was saved: the saved entry still shows its title, note, tags,
  and credit.
- A user deletes a collection while the save step for that collection is open elsewhere: saving
  fails with a "collection no longer exists" message.
- Double-clicking Save or Create does not create duplicate entries or collections.
- Leaving a page or closing the detail view while in edit mode discards the unsaved edit.
- Collection names and titles containing only whitespace are treated as empty.
- An edit to a title is cleared: the title falls back to a default derived from the image's tags.
- The server restarts between actions: all collections, items, titles, and notes are still there.

## Requirements *(mandatory)*

### Functional Requirements

**Search**

- **FR-001**: Users MUST be able to search for images by keyword.
- **FR-002**: System MUST NOT send a search whose keyword is empty or whitespace-only.
- **FR-003**: Each search result MUST show a thumbnail, its tags, and the creator's name.
- **FR-004**: Users MUST be able to load additional results for the same search without leaving the
  page, in pages of a consistent size (default 20), by pressing a keyboard-accessible "Load more"
  button below the grid. The button MUST be hidden and an "end of results" note shown when no
  more results exist, and MUST show progress while loading.
- **FR-005**: System MUST show distinct loading, empty (no matches, with a suggestion), and error
  (with retry) states for search.
- **FR-006**: System MUST show only safe-for-work results.

**Collections**

- **FR-007**: Users MUST be able to create a collection with a required name (1–60 characters after
  trimming) and an optional description (up to 280 characters).
- **FR-008**: System MUST reject a collection name that matches an existing collection name,
  compared case-insensitively after trimming, with a clear message.
- **FR-009**: Users MUST be able to see all their collections, each with name, cover preview, and
  item count, ordered most recently updated first. Creating, renaming, or editing a collection, or
  saving, editing, or removing one of its items, counts as an update.
- **FR-010**: A collection's cover preview MUST be its most recently saved image; an empty
  collection MUST show a placeholder cover.
- **FR-011**: Users MUST be able to rename a collection and edit its description under the same rules
  as creation.
- **FR-012**: Users MUST be able to delete a collection only after explicitly confirming; deleting it
  removes all items saved in it.

**Saving and items**

- **FR-013**: Users MUST be able to save any search result into a chosen collection.
- **FR-014**: Users MUST be able to create a new collection from within the save step, and the image
  MUST then be saved to it without losing the current search results or scroll position.
- **FR-015**: System MUST prevent saving the same image to the same collection more than once and
  show a clear message; the same image MAY be saved to different collections as independent entries.
- **FR-015a**: The save step MUST mark every collection that already contains the image with a
  "Saved" indicator and MUST NOT allow picking it; the server-side duplicate check (FR-015) remains
  the fallback.
- **FR-016**: System MUST confirm each successful save, naming the target collection.
- **FR-017**: A saved item MUST keep its own copy of the image's display information (image links,
  tags, creator name, source page link) so it can be shown without re-searching.
- **FR-018**: A saved item's display title MUST default to a readable title derived from its tags.
- **FR-019**: Users MUST be able to edit a saved item's display title (up to 100 characters) and
  personal note (up to 500 characters).
- **FR-019a**: All edits (item title and note; collection name and description) MUST use an edit
  mode with explicit Save and Cancel actions. Nothing is stored until Save is pressed; Cancel
  discards unsaved changes; Save is disabled while a save is in progress to prevent duplicates.
- **FR-020**: Users MUST be able to remove a saved item from a collection; removal MUST NOT affect
  entries in other collections.
- **FR-021**: Opening a collection MUST show its saved items in a grid ordered newest saved first,
  with an empty state linking to search when it has none.
- **FR-022**: Users MUST be able to open a saved item in a larger detail view showing title, note,
  tags, creator credit, and a link to the original source page.

**Cross-cutting**

- **FR-023**: All collections, items, titles, and notes MUST be stored on the server and MUST
  survive page reloads and server restarts; browser-only storage is not sufficient.
- **FR-024**: Every create, edit, save, and remove action MUST give immediate visible feedback, and
  on failure MUST show an error and leave the display matching the stored data.
- **FR-025**: Every displayed image (search result, saved item, detail view) MUST credit its creator
  and source as the image source's terms require.
- **FR-026**: Invalid input MUST be rejected with a message identifying the field and the rule
  broken.
- **FR-027**: All screens in this feature MUST be usable at phone width (~375px) and desktop width.
- **FR-028**: Images in grids MUST load progressively as they come into view rather than all at once.
- **FR-029**: Every collection MUST record an owner from the moment it is created. In this feature
  the owner is always a single built-in stand-in user; name uniqueness (FR-008) is scoped to the
  owner. The stored data MUST allow Feature 2 to transfer all stand-in-owned collections (and their
  items) to the first account that registers, without re-creating them.

### Key Entities *(include if feature involves data)*

- **User (stand-in)**: The single built-in user who owns every collection in this feature. It has no
  login or password; Feature 2 replaces it with real accounts and transfers its collections to the
  first account that registers.
- **Collection**: A named group of saved images. Attributes: owner (a User; the stand-in user in
  this feature), name (unique per owner, case-insensitive), optional description, cover (derived
  from its newest item), item count (derived), created and updated times.
- **Saved Item**: One image saved into one collection. Attributes: reference to the source image
  (source and source identifier), copied display information (image links at several sizes, tags,
  creator name, original page link), editable display title, editable personal note, saved time,
  updated time. An image appears at most once per collection.
- **Search Result** (not stored): An image returned by the image source for a keyword, with the
  display information needed to show and save it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user, without instructions, can search, create a collection, save three
  images, edit a note, remove one image, and reload the page to see everything persisted in under
  2 minutes.
- **SC-002**: Under normal conditions, search results appear within about 2 seconds of submitting.
- **SC-003**: 100% of collections, items, titles, and notes present before a server restart are
  present and unchanged after it.
- **SC-004**: Every save, edit, and remove action shows visible feedback within 1 second of the
  user's action.
- **SC-005**: Every screen in this feature is fully usable at 375px width with no horizontal
  scrolling.
- **SC-006**: 100% of displayed images show a creator credit, and every detail view links to the
  original source page.

## Assumptions

- There are no accounts in this feature: all collections are owned by one built-in stand-in user.
  Accounts, login, sharing, and collaboration arrive in Feature 2, which transfers the stand-in
  user's collections to the first account that registers.
- Signature creative features and bonus items (palettes, color filtering, explore, notifications,
  public/private toggle) are out of scope and belong to Feature 3.
- The image source is Pixabay (per the challenge suggestion); its 100-character query limit,
  safe-search option, attribution rules, and caching/hotlinking rules apply.
- Search results load 20 at a time.
- Collection descriptions and item notes are plain text; no rich formatting.
- A collection's cover is its newest saved image, and its display updates when items are added or
  removed.
- Deleting a collection is permanent in this feature (no undo or trash).
- Users have a working internet connection; offline use is out of scope.
- Visual styling follows the existing designs in `design/`.

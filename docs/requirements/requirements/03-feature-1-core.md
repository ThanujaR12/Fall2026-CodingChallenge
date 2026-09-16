# Feature 1 — Discover & Collect (Core)

> Input for `/speckit.specify`. Describes WHAT and WHY only. Tech stack lives in `06-tech-stack-plan-input.md`.

## Why

People find images online they love, save them somewhere, and lose them. This app gives them one place to discover images, save them into named collections, add their own notes, and find them again quickly.

This feature is the minimum complete app. If nothing else ships, this must work.

## Users

- **Visitor/user:** someone looking for images and wanting to keep them organized.
(Accounts arrive in Feature 2. For Feature 1, a single user's collections are enough, but the data must be stored persistently on the server, not only in the browser.)

## User stories and acceptance criteria

### US1 — Search for images (P1)
As a user, I want to search for images by keyword so I can discover content to save.
- Given I enter a keyword and submit, I see a grid of matching images.
- Results show a thumbnail and enough info to recognize the image (e.g., tags, creator name).
- I can load more results without leaving the page.
- If nothing matches, I see a friendly empty state with a suggestion.
- If the search service fails, I see an error message and can retry.
- An empty search is not sent.

### US2 — Create a collection (P1)
As a user, I want to create a named collection so I can group related images.
- I can create a collection with a name (required, 1–60 characters) and an optional description (up to 280 characters).
- Duplicate names for the same user are rejected with a clear message.
- The new collection appears in my collections list immediately.

### US3 — Save an image to a collection (P1)
As a user, I want to save an image from search results into one of my collections.
- From any search result, I can choose a collection and save the image to it.
- I can create a new collection during this step without losing my place.
- Saving the same image twice to the same collection is prevented with a clear message.
- I get confirmation that the image was saved.

### US4 — View my collections (P1)
As a user, I want to browse my collections and their contents.
- I see all my collections, each with a name, cover preview, and item count.
- Opening a collection shows all saved images in a grid, newest first.
- An empty collection shows an inviting empty state that links to search.

### US5 — Edit saved content (P1)
As a user, I want to personalize saved images so I can remember why I saved them.
- I can edit a saved image's display title and a personal note (up to 500 characters).
- I can rename a collection and edit its description.
- Changes persist after a page reload.

### US6 — Remove content (P1)
As a user, I want to remove things I no longer need.
- I can remove an image from a collection.
- I can delete an entire collection after confirming.
- Removing an image from one collection does not affect other collections.

### US7 — View an image in detail (P2)
- Clicking a saved image opens a larger view with its title, note, tags, source credit, and a link to the original page.

## Non-functional requirements

- Data persists on a server-side store and survives server restarts.
- Layout works on phone and desktop widths.
- Search results appear within about 2 seconds under normal conditions.
- Image sources are credited as the source's terms require.

## Out of scope for this feature

- User accounts, login, sharing, collaboration (Feature 2)
- Signature creative features and bonus items (Feature 3)

## Success criteria

- A new user can search, create a collection, save three images, edit a note, remove one image, and reload the page to see everything persisted — in under 2 minutes, without instructions.

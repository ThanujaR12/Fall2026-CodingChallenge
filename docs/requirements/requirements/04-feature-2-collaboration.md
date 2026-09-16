# Feature 2 — Accounts, Sharing & Collaboration

> Input for `/speckit.specify`. Builds on Feature 1. Describes WHAT and WHY only.

## Why

Collections are more valuable when they can be shared with friends, classmates, or teammates, and built together. This is also the top tier of the "core features" rubric: user accounts plus sharing with accounts to collaborate on and edit a collection.

## Roles

- **Owner:** created the collection. Full control, including deleting it and managing members.
- **Editor:** invited by the owner. Can add, edit, and remove items and edit the collection's description.
- **Viewer:** invited by the owner. Can view only.
- **Link visitor:** anyone with a share link (no account required). Can view only.

## User stories and acceptance criteria

### US1 — Sign up (P1)
- I can create an account with a unique username, an email, and a password (minimum 8 characters).
- Duplicate usernames or emails are rejected with a clear message.
- After signing up I am logged in.

### US2 — Log in and out (P1)
- I can log in with my username or email and password.
- A wrong password shows a generic "invalid credentials" message.
- I stay logged in across page reloads until I log out or my session expires.
- Logging out returns me to the login screen.
- All of my collections from Feature 1 now belong to my account; other users cannot see them unless shared.

### US3 — Share a collection by link (P1)
- As an owner, I can turn on a share link for a collection and copy it.
- Anyone who opens the link can view the collection (read-only) without an account.
- As an owner, I can turn the link off; the old link then stops working.
- The shared view looks polished and clearly shows who created the collection.

### US4 — Invite collaborators (P1)
- As an owner, I can invite an existing user by username or email as an editor or viewer.
- Inviting a non-existent user shows a clear message.
- I can change a member's role or remove them.
- Invited users see the collection in a "Shared with me" section.

### US5 — Collaborate on a collection (P1)
- As an editor, I can add images from search, edit titles and notes, and remove items.
- As a viewer, I cannot see any editing controls, and the server rejects edit attempts.
- Each saved item shows which member added it.
- Only the owner can delete the collection, rename it, or manage members.
- If two people edit the same item, the latest save wins and nothing crashes.

### US6 — Leave a shared collection (P2)
- As an editor or viewer, I can remove myself from a collection.

## Non-functional requirements

- Permissions are enforced on the server for every action, not just hidden in the UI.
- Passwords are never stored or displayed in plain text.
- Share links are long, random, and not guessable.
- Unauthorized requests get a clear error and the UI redirects to login when the session has expired.

## Out of scope

- Password reset by email
- Real-time live cursors or simultaneous editing indicators
- Notifications (Feature 3)

## Success criteria

- User A creates a collection, invites User B as editor and User C as viewer, and shares a link with a logged-out visitor. B adds an image, C can only view, the visitor sees the same collection read-only, and A revokes the link so it stops working.

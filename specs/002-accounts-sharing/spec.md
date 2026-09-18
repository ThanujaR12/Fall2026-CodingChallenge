# Feature Specification: Accounts, Sharing & Collaboration

**Feature Branch**: `002-accounts-sharing`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Use docs/requirements/requirements/04-feature-2-collaboration.md as the feature description."

## Clarifications

### Session 2026-09-17

- Q: Can editors and viewers see who else is a member of a shared collection? → A: Yes — every member sees the member list (usernames and roles) read-only; only the owner can change it.
- Q: When someone who is signed in but not a member opens a share link, what can they do? → A: The same read-only view as any link visitor; they cannot save or edit, and the board does not appear in their "Shared with me".
- Q: Who can see and copy an active share link? → A: Only the owner sees the share controls and the link; editors and viewers do not.

## User Scenarios & Testing *(mandatory)*

Collections are more valuable when they can be shared with friends, classmates, or teammates and
built together. This feature adds personal accounts, read-only share links, and invited
collaborators with roles, on top of the Feature 1 app (search, collections, saved items).

**Roles**

- **Owner**: created the collection. Full control, including renaming, deleting, sharing, and
  managing members.
- **Editor**: invited by the owner. Can add, edit, and remove items and edit the collection's
  description.
- **Viewer**: invited by the owner. Can view only.
- **Link visitor**: anyone with an active share link, signed in or not. Can view only.

### User Story 1 - Sign up (Priority: P1)

As a new user, I create an account so my collections are mine and I can collaborate with others.

**Why this priority**: Every other story depends on knowing who the user is.

**Independent Test**: Sign up with a new username, email, and password; land in the app signed in;
try the same username or email again and see a clear rejection.

**Acceptance Scenarios**:

1. **Given** the sign-up form, **When** I enter a unique username, a valid email, and a password of
   at least 8 characters, **Then** my account is created and I am signed in and taken to my
   collections.
2. **Given** an account already uses that username or email (compared ignoring capitalization),
   **When** I sign up with it, **Then** sign-up is rejected with a message naming which field is
   taken.
3. **Given** the sign-up form, **When** the username, email, or password breaks a rule, **Then**
   nothing is created and each invalid field shows its rule.

---

### User Story 2 - Log in and out (Priority: P1)

As a returning user, I sign in to reach my collections and sign out when I'm done.

**Why this priority**: Without signing in, accounts cannot protect or reach anyone's collections.

**Independent Test**: Sign in with username, then with email; reload the page and stay signed in;
sign out and land on the sign-in screen; enter a wrong password and see a generic message.

**Acceptance Scenarios**:

1. **Given** an account, **When** I sign in with my username or my email plus the correct password,
   **Then** I am signed in and see my collections.
2. **Given** a wrong password or unknown username/email, **When** I sign in, **Then** I see the same
   generic "Invalid username/email or password." message in both cases.
3. **Given** I am signed in, **When** I reload the page or come back within 7 days, **Then** I am
   still signed in.
4. **Given** I am signed in, **When** I sign out, **Then** I am returned to the sign-in screen and
   protected pages require signing in again.
5. **Given** collections were created before accounts existed (Feature 1), **When** the first
   account is created, **Then** all of those collections and their items belong to that account,
   and no other user can see them unless shared.
6. **Given** my session has expired, **When** I perform any action, **Then** I am sent to the
   sign-in screen with a message, and after signing in I return to where I was.

---

### User Story 3 - Share a collection by link (Priority: P1)

As an owner, I share a collection with anyone through a link, and I can turn the link off.

**Why this priority**: Sharing by unique URL is an explicit challenge requirement.

**Independent Test**: Turn on the link for a collection, copy it, open it in a signed-out browser
and see the read-only board with its creator; turn the link off and see the old link stop working.

**Acceptance Scenarios**:

1. **Given** I own a collection, **When** I turn on its share link, **Then** a link is created and
   I can copy it with one click, with confirmation that it was copied.
2. **Given** an active share link, **When** anyone opens it (signed in or not), **Then** they see
   the collection's name, description, creator's username, and saved images with credits, with no
   editing controls.
3. **Given** an active share link, **When** I turn it off, **Then** the old link shows a friendly
   "This link is no longer active" page.
4. **Given** I turned a link off, **When** I turn sharing on again, **Then** a new link is created
   and the old one stays inactive.
5. **Given** I am an editor or viewer, **When** I view the collection, **Then** I cannot turn the
   share link on or off.

---

### User Story 4 - Invite collaborators (Priority: P1)

As an owner, I invite other users to view or edit my collection and manage who has access.

**Why this priority**: Collaborating with accounts is the top tier of the core-features rubric.

**Independent Test**: Invite an existing user as editor by username and another as viewer by email;
see both in the member list; change a role; remove a member; try inviting an unknown user; sign in
as the invitee and see the collection under "Shared with me".

**Acceptance Scenarios**:

1. **Given** I own a collection, **When** I invite an existing user by username or email as editor
   or viewer, **Then** they are added immediately and appear in the member list with their role.
2. **Given** no account matches, **When** I invite that username or email, **Then** I see "No user
   found with that username or email." and nothing changes.
3. **Given** a user is already a member, or is me, **When** I invite them, **Then** I see a clear
   message and nothing changes.
4. **Given** a member, **When** I change their role or remove them, **Then** the change applies
   immediately to what they can do.
5. **Given** I was invited to a collection, **When** I open My collections, **Then** it appears in a
   "Shared with me" section showing the owner's username and my role.

---

### User Story 5 - Collaborate on a collection (Priority: P1)

As an editor, I help build a shared collection; as a viewer, I can only look.

**Why this priority**: Shared editing is what makes collaboration real.

**Independent Test**: As an editor, save an image from search into the shared collection, edit a
note, remove an item; as a viewer, see no editing controls and have any direct change attempt
rejected; see "added by" on each item.

**Acceptance Scenarios**:

1. **Given** I am an editor, **When** I save from search, **Then** the shared collection is offered
   in the save picker and the image is saved there.
2. **Given** I am an editor, **When** I edit an item's title or note, edit the description, or
   remove an item, **Then** the change is saved and visible to all members.
3. **Given** I am a viewer, **When** I open the collection, **Then** I see no edit, remove, save, or
   member-management controls, and any direct change attempt is rejected by the system with a
   "You don't have permission" message.
4. **Given** any member or link visitor views items, **Then** each item shows which member added it
   ("added by you" for my own).
5. **Given** I am an editor, **Then** I cannot rename or delete the collection, turn sharing on or
   off, or manage members.
6. **Given** two members edit the same item at nearly the same time, **Then** the later save wins,
   both see the saved result after refreshing, and nothing errors.

---

### User Story 6 - Leave a shared collection (Priority: P2)

As an editor or viewer, I remove myself from a collection I no longer need.

**Why this priority**: Useful housekeeping; the core collaboration works without it.

**Independent Test**: As a member, choose Leave, confirm, and see the collection disappear from
"Shared with me"; the owner sees me gone from the member list.

**Acceptance Scenarios**:

1. **Given** I am an editor or viewer, **When** I choose Leave and confirm, **Then** I lose access
   and the collection leaves my "Shared with me" list.
2. **Given** I am the owner, **Then** no Leave option is shown (I can delete instead).

---

### Edge Cases

- Usernames and emails are unique ignoring capitalization; signing in accepts any capitalization.
- A removed member who still has the collection open gets "You no longer have access" on their next
  action and is returned to My collections.
- An owner deleting a collection removes it for all members and makes any share link inactive.
- A link visitor who is also a member sees the normal member view when signed in.
- A signed-in non-member who opens a share link gets the read-only view only; the board is not added
  to their "Shared with me" and they cannot save or edit.
- An editor who saved items keeps "added by" credit on those items after being removed.
- Share links contain a long random part that cannot be guessed or enumerated.
- Collection names stay unique per owner; two different owners may use the same name.
- Signing up is not possible with a username of only spaces, or an invalid email.
- Opening a private collection URL without access shows "Collection not found" (it does not reveal
  that it exists).

## Requirements *(mandatory)*

### Functional Requirements

**Accounts**

- **FR-001**: Users MUST be able to create an account with a username (3–30 characters: letters,
  numbers, underscores), an email address, and a password of at least 8 characters.
- **FR-002**: Usernames and emails MUST be unique, compared ignoring capitalization; a duplicate is
  rejected with a message naming the field.
- **FR-003**: Users MUST be signed in immediately after creating an account.
- **FR-004**: Users MUST be able to sign in with either username or email plus password; any failure
  shows one generic message that does not reveal which part was wrong.
- **FR-005**: A signed-in session MUST survive page reloads and last up to 7 days, until the user
  signs out.
- **FR-006**: Users MUST be able to sign out, which ends the session in that browser.
- **FR-007**: Passwords MUST never be stored, logged, or shown in readable form.
- **FR-008**: All pages except sign-in, sign-up, and shared-link pages MUST require signing in; when
  a session is missing or expired, the user MUST be sent to sign-in and returned afterwards.
- **FR-009**: When the first account is created, all collections and items created before accounts
  existed MUST be transferred to that account.

**Sharing by link**

- **FR-010**: Owners MUST be able to turn a collection's share link on and off and copy the link.
- **FR-011**: Each time sharing is turned on, a new long, random, unguessable link MUST be created;
  turning it off MUST make the current link inactive immediately.
- **FR-012**: Anyone with an active link MUST see a read-only view of the collection (name,
  description, creator's username, items with titles, notes, credits, and "added by") without
  signing in.
- **FR-013**: An inactive or unknown link MUST show a friendly "no longer active" page.

**Members and roles**

- **FR-014**: Owners MUST be able to invite an existing user, by username or email, as editor or
  viewer; the member gains access immediately.
- **FR-015**: Inviting an unknown user, the owner, or an existing member MUST be rejected with a
  specific message.
- **FR-016**: Owners MUST be able to change a member's role and remove members.
- **FR-017**: Editors and viewers MUST be able to leave a collection.
- **FR-018**: My collections MUST show "Shared with me" collections separately, each with the
  owner's username and my role.
- **FR-018a**: Every member MUST be able to see the member list (owner, then members with roles);
  only the owner sees controls to change it.
- **FR-018b**: Only the owner MUST see the share-link controls and the link itself.

**Permissions** (enforced by the system for every action, not only hidden in the interface)

| Action | Owner | Editor | Viewer | Link visitor |
|--------|:-----:|:------:|:------:|:------------:|
| View collection and items | ✓ | ✓ | ✓ | ✓ (active link) |
| Save, edit, remove items | ✓ | ✓ | – | – |
| Edit description | ✓ | ✓ | – | – |
| Rename collection | ✓ | – | – | – |
| Delete collection | ✓ | – | – | – |
| Share link on/off | ✓ | – | – | – |
| Invite, change role, remove members | ✓ | – | – | – |
| Leave collection | – | ✓ | ✓ | – |

- **FR-019**: The system MUST enforce the permission table above on every request; disallowed
  actions MUST be rejected with a clear "You don't have permission" error.
- **FR-020**: Collections a user cannot access MUST appear as "not found" to that user.
- **FR-021**: The interface MUST hide controls a user's role does not allow.
- **FR-022**: Each saved item MUST show which member added it.
- **FR-023**: The save picker MUST list collections the user owns or can edit.
- **FR-024**: When two members edit the same item, the most recent save MUST win without errors.

### Key Entities *(include if feature involves data)*

- **User (account)**: username (unique, case-insensitive), email (unique, case-insensitive),
  protected password, creation time. Replaces the Feature 1 stand-in user.
- **Collection** (extended): owner, members (each a user plus role editor or viewer), share link
  state (active or not) and its random token.
- **Membership**: a user's role on a collection (editor or viewer); the owner is not a member entry.
- **Saved Item** (unchanged fields): "added by" now identifies a real user shown by username.
- **Session**: proof that a browser is signed in as a user, valid up to 7 days.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User A creates a collection, invites User B as editor and User C as viewer, and shares
  a link with a signed-out visitor. B adds an image, C can only view, the visitor sees the same
  collection read-only, and after A turns the link off it stops working — all in under 5 minutes.
- **SC-002**: A new user can sign up and reach their collections in under 1 minute.
- **SC-003**: 100% of disallowed actions (by role, by signed-out users, or by non-members) are
  rejected by the system, verified by automated tests covering every row of the permission table.
- **SC-004**: No password appears in readable form anywhere in stored data, logs, or responses.
- **SC-005**: A turned-off share link stops working immediately (within 1 second of turning it off).

## Assumptions

- Sign-in uses username/email and password only; no password reset, email verification, or social
  sign-in (out of scope per the feature description).
- Invitations take effect immediately; there is no accept/decline step and no email is sent.
- Only existing accounts can be invited; inviting by email does not create accounts.
- Sessions last 7 days; there is no "remember me" option.
- The first account to sign up receives all Feature 1 (stand-in) data; later accounts start empty.
- Editors may edit the description but not the name, per the feature description.
- Notifications, real-time presence, and live cursors are out of scope (Feature 3 / out of scope).
- The shared-link page follows the existing design (`design/screens/06-public-shared-view.png`,
  `05-share-dialog.png`), without Feature 3 palette theming.

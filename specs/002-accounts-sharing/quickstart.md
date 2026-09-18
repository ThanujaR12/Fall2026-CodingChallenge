# Quickstart & Validation: Accounts, Sharing & Collaboration

**Feature**: [spec.md](./spec.md) | **API**: [contracts/api.md](./contracts/api.md)

## Setup changes

Add to `server/.env` (any long random string; example command generates one):

```text
JWT_SECRET=<at least 16 random characters>
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run steps are otherwise the same as [Feature 1](../001-discover-collect/quickstart.md).

## Automated checks

`server/`: `npm test`, `npm run lint`, `npm run format:check`.
`client/`: `npm run lint`, `npm run format:check`, `npm run build`.

## Scenarios

### A1 — Sign up and data transfer (US1, US2/AC5, FR-009)
- Sign up as `alice` (first account) → lands on My collections showing all Feature 1 collections.
- Sign up `alice` again or with the same email in different case → field-specific error.
- Password of 7 characters → rule shown, nothing created.

### A2 — Log in / out (US2)
- Log out → sign-in screen. Log in with email; then with username. Wrong password and unknown user
  both show "Invalid username/email or password."
- Reload while signed in → still signed in. Delete the token in DevTools and act → sent to sign-in,
  returned to the same page after signing in.

### A3 — Share link (US3, SC-005)
- As alice, Share → turn link on → Copy → open in a private window: read-only board, "A board by
  alice", no edit controls. Turn link off → private window reload shows "no longer active". Turn on
  again → new link; old one still inactive.

### A4 — Invite & roles (US4, US5, SC-001)
- Sign up `bob` and `cara` in other windows. Alice invites `bob` (editor, by username) and cara's
  email (viewer). Unknown name → "No user found…"; inviting alice or bob again → message.
- Bob: collection in "Shared with me" (by alice · Editor); saves an image from search into it; edits
  a note; removes an item; edits description; no Rename/Delete/Share controls.
- Cara: sees items and "added by bob"; no edit controls; a direct `PATCH` with her token → 403.
- Alice changes cara to editor → cara can edit after refresh; alice removes cara → cara's next action
  shows "no longer have access".

### A5 — Leave (US6)
- Bob opens Members → Leave → confirm → collection gone from his "Shared with me".

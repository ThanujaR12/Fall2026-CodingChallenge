# Data Model: Palette Boards & Standout Extras

Changes to the Feature 1–2 model. All collections live in MongoDB Atlas via Mongoose.

## ImageAsset (changed)

| Field | Type | Notes |
|-------|------|-------|
| colors | string[] (optional) | Up to 5 `#RRGGBB`, most common first. Absent on copies stored before palettes (filled in lazily); `[]` if unreadable. |

## Collection (changed)

| Field | Type | Notes |
|-------|------|-------|
| visibility | `private` \| `public` | Default `private`; indexed. Only the owner may change it. |

A collection's **palette** is derived, not stored: the merged colours of its items' images.

## Notification (new)

| Field | Type | Notes |
|-------|------|-------|
| recipient | ObjectId → User | Indexed with `createdAt` |
| actor | ObjectId → User | Who did it |
| type | `item_added` \| `item_edited` \| `item_removed` \| `member_invited` | |
| collectionId | ObjectId → Collection | |
| collectionName | string | Name at the time, so renames/deletes still read well |
| itemTitle | string | Empty for invites |
| asset | ObjectId → ImageAsset \| null | Thumbnail; null for removals |
| role | `editor` \| `viewer` \| null | For invites |
| readAt | Date \| null | Unread while null |
| createdAt | Date | |

**Activity history** (US8) reads the same records for one board, de-duplicated to one entry per
change (each change creates one notification per recipient).

# Palette Boards — design notes

Theme settings for the plan step. Design system: **Broadsheet** — newsprint set for the web. Near-black serif on paper white; the app chrome stays neutral so each collection's own palette supplies the color.

## Principle

The UI has exactly one interactive ink (cyan). Every other color on screen belongs to a collection's palette, computed from its images. A themed page swaps only its accent, its 5-stop palette band and a pale header gradient — never the body text color, never the ground.

## Color

| Role | Hex | Use |
| --- | --- | --- |
| Background (paper) | `#F3F2F2` | page ground, everywhere |
| Surface | `#EAE9E9` | cards, inputs, the login side panel |
| Text (ink) | `#201E1D` | all body and heading copy |
| Accent (cyan) | `#0088B0` | links, primary buttons, selected state, focus ring |
| Accent pressed | `#1186AC` | button hover/pressed |
| Accent deep | `#006786` | accent-colored text at paragraph size, avatars |
| Accent tint | `#E9F8FF` | unread notification rows, subtle info fills |
| Accent-2 (magenta) | `#D6006C` | rare second spot: unread badge, destructive text |
| Accent-2 tint / deep | `#FFF1F4` / `#AA0B56` | error message fill / error text |
| Divider | `rgba(32,30,29,0.16)` | hairlines only — not section structure |

Neutral ramp (skeletons, muted meta, avatar fallbacks): `#F8F4F4` `#EAE7E7` `#D7D3D3` `#BAB6B6` `#9B9797` `#7D7979` `#605D5D` `#444141` `#2D2B2B`.

Muted text is the ink at reduced opacity, not a gray token: 0.75 for supporting copy, 0.6 for meta, 0.55 for label caps.

### Per-collection palettes (5 stops, light → dark)

Stored per collection; step 4 (the dark one) is the board's theme accent, step 1 seeds the header gradient.

- Terracotta Rooms — `#F3E3D3` `#DDA47B` `#C1663C` `#8A3B24` `#3F1D14`
- Salt Flats — `#E8E2D9` `#C9C2B6` `#8E9AA3` `#5C6B73` `#2E3A40`
- Chroma Jungle — `#E3EFD6` `#A8D5A2` `#4FA96B` `#1F6B4A` `#0F2E22`
- Neon Transit — `#101223` `#2B2E6B` `#6C4AB6` `#E23E8C` `#FFC857`
- Paper Studies — `#FBF7F0` `#E3D9C6` `#B9A88B` `#7A6A52` `#3A3228`
- Coastal Fog — `#DDE4E9` `#A9B8C2` `#7C93A8` `#48627D` `#22323F`

Color search filter swatches: any `linear-gradient(135deg,#8E9AA3,#DDA47B)`, red `#B4342A`, blue `#2F5F8E`, green `#3F6B4A`, yellow `#E0B13C`, neutral `#B3ACA2`, black & white `linear-gradient(90deg,#201E1D 50%,#F3F2F2 50%)`. Selected swatch takes a `0 0 0 2px #0088B0` ring; unselected an `inset 0 0 0 1px rgba(32,30,29,0.18)` hairline.

### Theming rules

- Palette band: a 7px full-bleed strip (6px on phone) of the five stops in equal fifths, directly under the nav.
- Header: `linear-gradient(180deg, <stop-1 lightened to ~#F6E8DA> 0%, #F3F2F2 100%)`. Nothing else tints.
- Board-primary button: the palette's step-4 hex as fill with white text (`#8A3B24` on Terracotta Rooms). If step 4 is lighter than ~55% luminance, fall back to `#201E1D` text or to the cyan accent — text contrast wins over theme fidelity.
- Body copy never takes a palette color.

## Type

Source Serif 4 throughout — headings 600, body 400, true italic 400 for emphasis and placeholder captions. No sans anywhere; the serif is the chrome.

Google Fonts: `Source+Serif+4:ital,wght@0,400;0,600;1,400`.

| Token | Size / line-height | Where |
| --- | --- | --- |
| Display | 50–56px / 1.12 | public shared view title, doc title |
| H1 | 42–44px / 1.12 | collection title |
| H2 | 32px | page titles ("My collections") |
| H3 | 25px | dialog titles, section heads |
| H4 | 20px | sub-sections ("Shared with me") |
| Body | 15px / 1.55 | default |
| Body S | 14px | inputs, buttons, member rows, notes |
| Meta | 12–13px | credits, counts, timestamps |
| Micro | 10–11px | hex labels, tags, "added by" |
| Label caps | 11px, `letter-spacing: 0.12em`, uppercase | section labels, kickers |

Headings use `letter-spacing: -0.015em`. Phone titles drop to 29px; nothing below 10px, and no interface text below 11px.

## Spacing

1.25× scale: `5 / 10 / 15 / 20 / 30 / 40px` (`space-1,2,3,4,6,8`).

- Desktop page gutter 40px; hero sections 56px on the public view; phone gutter 16px.
- Vertical rhythm between page sections: 40px. Between a heading and its content: 20px.
- Grid gaps: search results 20px, collection cards 30px, item grid 20px, phone grid 12px.
- Sections are separated by whitespace only — no rules, no boxes, no dividers between sections. The one hairline use is inside lists (member rows, notification rows, picker rows).

## Corner radius

`1px` small, `2px` default, `4px` large. Effectively square: inputs, buttons, cards, dialogs, palette swatches all take 2px. Avatars and the share toggle are the only true rounds (`50%` / `9999px`). Do not soften these — the flat corner is the system.

## Buttons

Height 36px minimum on desktop, **44px on phone**. Padding `0 14px` (`0 22px` for the search submit), 14px serif at weight 600, `white-space: nowrap`, icon + label with a 6–8px gap.

- **Primary** — solid `#0088B0`, white text. Hover `#1186AC`. On a themed board page, the palette's step-4 hex replaces the fill.
- **Secondary** — `#EAE9E9` fill, `1px solid rgba(32,30,29,0.16)`, ink text. Hover: accent-tinted fill.
- **Ghost** — transparent, ink text, hover accent tint. Destructive ghost takes `#AA0B56` text.
- **Icon** — square ghost, 36px.
- Focus is always `outline: 2px solid #0088B0; outline-offset: 2px` — never the browser default.

Inputs: 36px min height (42px for the main search field), `#EAE9E9` fill, hairline border, 2px radius, caret in the accent. Focus swaps the border to the accent. Textareas min 124px.

## Cards

Two kinds, deliberately different:

1. **Boxed card** (`.card`) — search results only, because a result is a discrete listing: `#EAE9E9` fill, 2px radius, image block flush to the top edge, 15px padding below it, then title (16px/600) → credit (12px at 0.6) → tag row → action row. No border.
2. **Unboxed board card** — collections, explore, saved items: image block, then the palette strip flush beneath it (9px tall on a grid card, 8px on a list thumb), then text on the page ground with no container. This is the app's signature card; keep it boxless.

Tags: 11px, 3px/10px padding, 1.5px radius. `tag-neutral` for image tags, `tag-accent` for public/editor, `tag-outline` for viewer.

Elevation only for things that float — popovers and dialogs take `0 12px 32px rgba(45,43,43,0.22)`; cards take none.

Image placeholders in these mockups are a diagonal stripe pattern tinted to a palette stop (`repeating-linear-gradient(135deg, rgba(32,30,29,0.10) 0 6px, transparent 6px 13px)`) — in the real app, photographs get the newsprint dot screen (`filter: grayscale(0.35) contrast(1.15)`) and always carry a visible creator credit.

## Icons

Phosphor, duotone weight, at the text size (≈1.1em), inheriting `currentColor`.

## Screens captured

`01-login` · `02-search` (color filter + save-to-collection popover) · `02b-search-states` (loading / empty / error) · `03-my-collections` (palette strips + Shared with me) · `04-collection` (themed, item detail, note editing) · `05-share-dialog` (link toggle + roles) · `06-public-shared-view` (read-only) · `07-explore` (panel closed) · `07-explore-notifications` (bell open) · `08-phone-search-and-collection` (375px).

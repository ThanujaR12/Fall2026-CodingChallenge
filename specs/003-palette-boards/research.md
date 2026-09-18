# Research & Decisions: Palette Boards & Standout Extras

## R1: Where to extract colours

- **Decision**: On the server with `node-vibrant`, from the image copy we already store on save.
- **Why**: No browser canvas/CORS issues; done once per image (FR-002); works for every viewer.
- **Rejected**: Client-side canvas (CORS on Pixabay's CDN, repeated on every view).
- **Note**: `npm audit` reports moderate issues in the image decoder `node-vibrant` uses. The server
  only decodes images it downloaded from Pixabay's own hosts, so exposure is low.

## R2: Merging a board's palette

- **Decision**: Group colours into coarse RGB buckets (3 bits per channel); each image's first colour
  weighs 5, the fifth weighs 1; the five heaviest buckets, averaged, form the palette.
- **Why**: Stable as photos are added, favours colours that recur across images, cheap to compute.

## R3: Readable themed pages

- **Decision**: Header wash alpha = base × (0.4 + 0.6·√luminance) so dark colours wash lightly; the
  accent label is the most saturated palette colour darkened until 4.5:1 against the washed background;
  muted header text raised from 65% to 75% ink.
- **Evidence**: Checked with black, navy, yellow/white, olive, and magenta palettes; all ≥ 4.5:1.

## R4: Truly black-and-white results

- **Finding**: Pixabay's `colors=grayscale` alone returned colour photos (9 of 20 for "flowers",
  4 of 20 for "city", measured by pixel chroma). Adding the words "black and white" to the query gave
  0 of 20 in every test.
- **Decision**: The grayscale filter always adds "black and white" to the query. Re-measured through
  the app afterwards: 0 colour photos of 80.

## R5: Explore colour filter

- **Decision**: A board matches a colour when one of its three leading palette colours maps to that
  colour name (the same hue rules as the client's "Find more like this palette"). Grayscale requires
  all three to be black, gray, or white.

## R6: Optimistic UI

- **Decision**: TanStack Query `onMutate` updates every affected cache (board detail, all collection
  lists, the "already saved" marks), `onError` restores the snapshot, `onSettled` refetches.
- **Evidence**: Save shows "Saved" ~120 ms after the click; edits ~60 ms; a forced network failure
  rolls back and reopens the edit form with the typed text.

## R7: Notifications delivery

- **Decision**: Poll every 30 s and on window focus. **Rejected**: WebSockets/SSE (more moving parts
  and hosting constraints for little gain at this scale).

## R8: Masonry layout

- **Decision**: Absolutely positioned tiles placed in the shortest column, using the known image
  ratio. **Rejected**: CSS columns (reading order runs down columns and appending reshuffles tiles).

## R9: Voice search

- **Decision**: Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`), hidden when
  unsupported. No audio reaches PixBoard's server.

## R10: Search with a photo

- **Decision**: Recognise photos in the browser with TensorFlow.js MobileNet v2 (ImageNet labels),
  loaded only when the camera is first opened; read colours from a 64×64 canvas; search Pixabay for
  the chosen label (optionally in the photo's leading colour).
- **Why**: The photo never leaves the device, there is no API key or cost, and nothing extra for
  reviewers to configure. Model weights (~14 MB) come from TF Hub / Kaggle storage, which allows
  cross-origin loading, and are cached by the browser after the first use.
- **Rejected**: Sending photos to a hosted vision model (better scene understanding, but a paid key
  on the server and users' photos leaving their device).
- **Evidence**: A golden retriever puppy photo → "golden retriever 39%, Labrador retriever 35%" in
  about 2 s (model cached); 40 matching photos, the first being the same photo.

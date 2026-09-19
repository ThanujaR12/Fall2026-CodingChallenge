================================================================================
  PALETTEBOARD
  Find photos you love, save them into colourful boards, and share them.
  Change++ Fall 2026 Coding Challenge - Image Saving/Sharing App
================================================================================

Name:              Thanuja Rameshbaabu
Vanderbilt email:  thanuja.rameshbaabu@vanderbilt.edu

LIVE APP:   https://paletteboard.vercel.app
API:        https://palatteboard.onrender.com/api/health   (shows {"status":"ok"})
CODE:       https://github.com/ThanujaR12/PaletteBoard
            (renamed from "PixBoard" during Feature 3; the old address redirects here)


--------------------------------------------------------------------------------
1. TRY IT IN 2 MINUTES (for reviewers)
--------------------------------------------------------------------------------
  1. Open https://paletteboard.vercel.app on a computer or phone.
     The server is on a free plan that sleeps when nobody is using it. On the first
     visit a small card says "Waking up the PaletteBoard server..." - this can take
     up to a minute, once. After that everything is fast.
  2. Click "Sign up" and pick any username, email, and password (8+ characters).
     "Sign in with Google" also works.
  3. Things to try:
       - Home shows "Picked for you". Tap Save on a few photos, then Shuffle:
         the feed starts learning from what you saved.
       - Open a board: its page takes on the colours of its photos.
       - Search by typing, by voice (microphone), or with a photo (camera icon).
       - Palettes (the rainbow icon): browse photos by colour.
       - Share a board: send a read-only link, or invite a second account as an
         editor or viewer (use a private window to sign up a second account).
       - Explore: public boards from everyone, filtered by colour.
  Nothing to install. Works in Chrome, Edge, Safari, and Firefox, on desktop,
  iPhone, and Android.


--------------------------------------------------------------------------------
2. WHAT MAKES IT DIFFERENT: EVERY BOARD HAS A COLOUR PALETTE
--------------------------------------------------------------------------------
  When you save a photo, the server reads its main colours. Each board blends the
  colours of its photos into a palette, and the whole app is built around that:
    - A board's page is tinted with its own palette (text stays readable: every
      accent colour is checked for contrast against the tint).
    - Copy a palette's hex codes, copy one swatch, or download the palette as a
      text file - handy for design projects.
    - "Find more like this palette" searches for photos in the board's main colour.
    - Search and browse by 13 colours (red, orange, yellow, green, turquoise, blue,
      lilac, pink, brown, black, gray, white, and black-and-white).
      Black-and-white is strict: Pixabay's own filter let many colour photos
      through, so the app combines it with a keyword so results are truly
      black and white.
    - Explore lets you browse everyone's public boards by colour.
    - Your profile shows your "colour signature": all your boards' palettes blended
      into one, around your avatar.


--------------------------------------------------------------------------------
3. FULL FEATURE TOUR
--------------------------------------------------------------------------------
REQUIRED FEATURES (all done)
  - Create boards/collections      name (up to 60 characters, unique per person,
                                   ignoring capitals), optional description (280),
                                   public or private, with a live preview
  - Search for images              Pixabay search, safe-search on, 20 per page,
                                   infinite scroll, optional colour filter
  - Save content                   save any photo into any board, or create a new
                                   board right from the Save menu
  - Edit content                   give a saved photo your own title (100) and
                                   note (500); rename boards, edit descriptions
  - Remove content                 remove photos, delete boards (asks first)
  - View your collections          board cards with cover photo, count, palette
  - Look good                      see section 5

DISCOVER
  - Home "For you" feed: a new shuffled mix on every visit. Once you save photos,
    it learns your interests from their tags (recent saves count most) and your
    board names, never repeats photos you already saved, and tells you why each
    photo was picked ("Because you save boat photos"). Shuffle deals a fresh mix.
  - Topic chips on Home: Popular, Nature, Travel, Food, Fashion, Interiors, Cozy,
    Flowers, Animals, Architecture, City nights, and Art, plus a chip for each of
    your own boards.
  - Photo page: click any photo to see it large, with its colours, tags, credit,
    and "More like this" - matched by subject OR by colour (you choose).
  - Search is always in the header on every page. Recent searches are remembered;
    press "/" to jump to the search box, Esc to leave it.
  - Voice search: tap the microphone and say what you want to see (uses the
    browser's built-in speech recognition; the button hides where unsupported).
  - Search with a photo: take or upload a picture. On your own device (nothing is
    uploaded) the app reads words and brand names in it (Tesseract OCR), recognises
    what is in it (MobileNet), and extracts its colours - then shows photos that
    match by subject or by colour. You can pick which detected words to search.

ORGANISE
  - Each board page has three parts: the palette header, the photos, and
    "More ideas for this board" (photos similar to what the board already holds,
    found from its most common tags).
  - Board activity history: who added, edited, or removed which photo, and who
    was invited, newest first.
  - Every saved photo keeps its photographer credit and a link to Pixabay.

ACCOUNTS AND PROFILE
  - Sign up / log in with username or email and password (passwords are hashed
    with bcrypt; sessions last 7 days). "Sign in with Google" also works.
  - New visitors see "Welcome to PaletteBoard."; returning ones "Welcome back."
  - Profile page: display name, bio (160), avatar colour (suggested from your own
    colours), stats, colour signature, and tabs for Saved photos (each labelled
    with its board), Boards, and Shared with you.

SHARING AND COLLABORATION
  - Share link: turn on a read-only link anyone can open without an account;
    turn it off and the old link stops working immediately.
  - Public boards: make a board public and it appears in Explore for everyone.
  - Invite people by username or email as an Editor (add, edit, remove photos,
    edit the description) or Viewer (look only). The owner can change roles or
    remove people; members can leave.
  - Every permission is checked by the server on every request (one permission
    table in server/src/services/permissionService.ts), not just hidden in the UI.
  - Notifications: when someone adds, edits, or removes a photo on a shared board,
    or invites you, you get a notification (unread badge, mark one or all as read;
    a side panel on desktop, a full page on phones; refreshed every 30 seconds).

SPEED AND RELIABILITY
  - Optimistic updates: saving, editing, and removing photos, and reading
    notifications, update the screen instantly; if the server says no, the change
    is rolled back and a message explains why.
  - Lazy loading: images load as you scroll; the heavy photo-recognition code is
    only downloaded the first time you use "Search with a photo".
  - Skeleton placeholders while loading, friendly empty and error states with a
    Retry button, and a "waking up" card when the free server is starting.
  - Pixabay answers are cached for 24 hours on the server (as Pixabay requires),
    so repeated searches are instant and the free API limit is protected.
  - Saved images are copied into the database. Pixabay's image links expire after
    24 hours and hotlinking is not allowed, so boards never break later.
  - If a collaborator's role changes while you are on a page, the app reloads the
    data so it never offers buttons you can no longer use.


--------------------------------------------------------------------------------
4. HOW THIS MAPS TO THE SCORING RUBRIC
--------------------------------------------------------------------------------
  Frontend framework   React 19 + TypeScript + shadcn/ui (Radix) components with
                       Tailwind CSS
  Frontend style       small single-purpose components grouped by feature
                       (client/src/features/*), a one-line purpose comment at the
                       top of every file, ESLint + Prettier, descriptive commits
  Backend framework    Node.js + Express 5 (TypeScript)
  Backend style        routes -> controllers -> services -> models; validation
                       middleware (zod); one error format for every failure:
                       { "error": { "code", "message", "fields"? } };
                       every endpoint documented in server/API.md
  Core features        user accounts, share links, and collaborators with
                       editor/viewer roles who can edit a board together
  Data handling        MongoDB Atlas via Mongoose (users, boards, saved items,
                       stored images, activity, notifications)
  Aesthetics           consistent design system, responsive from 375px phones to
                       wide desktops, feels like a real app (see section 5)
  Bonus features       public/private boards + Explore, notifications on edits,
                       optimistic UI with rollback, lazy loading, board activity
                       history, colour palettes, "For you" feed, photo page with
                       "More like this", voice search, search with a photo,
                       profile, Google sign-in, installable on phones
  README               this file


--------------------------------------------------------------------------------
5. DESIGN, MOBILE, AND ACCESSIBILITY
--------------------------------------------------------------------------------
  - Own logo and name: a board of four colour swatches (blue, green, orange,
    magenta) on deep teal, used for the app icon, favicon, and a gradient accent.
  - Clean, rounded, modern look: Plus Jakarta Sans, soft shadows, frosted-glass
    header, gradient hairline in the logo colours, masonry photo grid.
  - Desktop: a slim sidebar (Home, Explore, Boards, Palettes, Create,
    Notifications) that shows for a few seconds on Home, then tucks away and
    returns when the pointer reaches the left edge.
  - Phones: bottom navigation bar, two-column photo grid, Save always visible
    (no hover on touch screens), 44px tap targets, 16px text fields (so iPhone
    Safari does not zoom in), room for the iPhone home bar.
  - Installable: "Add to Home Screen" on iPhone or Android opens PaletteBoard
    full-screen with its own icon.
  - Accessibility: keyboard focus rings everywhere, labels for every icon button,
    body text and buttons checked for WCAG AA contrast, animations turned off for
    people who ask their device for reduced motion.


--------------------------------------------------------------------------------
6. HOW IT IS BUILT
--------------------------------------------------------------------------------
  client/   Web app (separate from the server)
            React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui (Radix),
            React Router 7, TanStack Query 5 (caching, infinite scroll,
            optimistic updates), Phosphor icons, sonner toasts,
            Tesseract.js + TensorFlow.js MobileNet (on-device photo search)
  server/   REST API
            Node.js 22+, Express 5, TypeScript, MongoDB Atlas via Mongoose 8,
            zod validation, JWT sessions, bcrypt, helmet, CORS,
            node-vibrant (colour extraction), google-auth-library
            Tests: Vitest + Supertest with an in-memory MongoDB
            (208 tests across 23 test files; Pixabay is mocked, no keys needed)
  specs/    Planning documents for each of the three features: specification,
            plan, research notes, data model, API contract, checklists, and a
            task list (001-discover-collect, 002-accounts-sharing,
            003-palette-boards)
  design/   Design notes, screen mockups, prototype, and the logo
  docs/     The challenge requirements, split into parts

  API documentation: server/API.md lists every endpoint with its auth, inputs,
  example responses, and errors. Main groups:
    /auth          register, login, Google sign-in, current user
    /search        Pixabay search (with colour filter)
    /feed          Home topics and the "For you" feed
    /photos        a photo's details and "More like this"
    /collections   boards, saved items, sharing, members, activity, ideas
    /shared        open a board by its share link
    /explore       public boards
    /profile       your profile and saved photos
    /notifications list, mark read
    /images        stored copies of saved images

  Free by design: every service used has a free plan (MongoDB Atlas M0, Pixabay,
  Render, Vercel, Google sign-in). Photo recognition runs in your browser, so no
  paid AI service is needed.

  Security: secrets (database password, Pixabay key, JWT secret) live only in
  server/.env (never committed) and in the hosting settings. The Pixabay key is
  only used by the server and never reaches the browser.


--------------------------------------------------------------------------------
7. RUN IT ON YOUR OWN COMPUTER
--------------------------------------------------------------------------------
PREREQUISITES
  1. Node.js 22 or newer and npm.  Check with:  node -v   and   npm -v
  2. A free MongoDB Atlas database:
       - Create a free cluster at https://www.mongodb.com/atlas
       - Database Access: add a database user with a password
       - Network Access: add your current IP address
       - Connect -> Drivers: copy the connection string (mongodb+srv://...)
         and put your database user's password into it
  3. A free Pixabay API key: sign in at https://pixabay.com and open
     https://pixabay.com/api/docs/ - your key is shown under "Parameters".

1) SERVER (terminal 1)
     cd server
     npm install
     cp .env.example .env          (Windows cmd/PowerShell: copy .env.example .env)

   Open server/.env and fill in:
     MONGODB_URI       your Atlas connection string
     PIXABAY_API_KEY   your Pixabay key
     JWT_SECRET        any random text, at least 16 characters. Generate one with:
                       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   Leave the rest as they are:
     PORT=4000, CLIENT_ORIGIN=http://localhost:5173,
     GOOGLE_CLIENT_ID (public; leave empty to hide Google sign-in)

     npm run dev

   You should see "Connected to MongoDB". If a setting is missing, the server stops
   and names it. Check: http://localhost:4000/api/health shows {"status":"ok"}

2) CLIENT (terminal 2)
     cd client
     npm install
     cp .env.example .env          (Windows cmd/PowerShell: copy .env.example .env)
     npm run dev

   Open http://localhost:5173 and click "Sign up".
   (client/.env holds VITE_API_URL, the server address, and the public
   VITE_GOOGLE_CLIENT_ID. The defaults work as they are.)

TESTS AND CODE CHECKS
  In server/:   npm test            (208 tests; uses an in-memory database -
                                     the first run downloads it once)
                npm run lint
                npm run format:check
  In client/:   npm run lint
                npm run format:check
                npm run build       (type-checks, then builds)

HOW IT IS DEPLOYED (all free plans)
  - API on Render: root directory "server", build "npm ci --include=dev &&
    npm run build", start "npm start", with the same variables as server/.env
    and CLIENT_ORIGIN set to the website's address.
  - Website on Vercel: root directory "client", VITE_API_URL set to the Render
    address + /api. client/vercel.json sends every path to the app so shared
    links and page refreshes work.
  - Database on MongoDB Atlas (free M0 cluster).


--------------------------------------------------------------------------------
8. HOW I WORKED
--------------------------------------------------------------------------------
  - Built with Claude Code (AI pair programmer) using a Spec Kit workflow: I wrote
    the requirements, made the product and design decisions, and reviewed and
    tested every step; Claude helped write the code and planning documents.
  - Planned before coding: each of the three features has a written spec, plan,
    data model, API contract, and task list in specs/.
  - Built in three stages: (1) search, boards, and saving; (2) accounts, sharing,
    and collaboration; (3) palettes, Explore, notifications, and the rest.
  - Tested the important paths automatically (208 server tests) and checked every
    screen in a real browser on desktop and phone sizes.
  - Committed and pushed after each working step, with messages that explain what
    changed and why.


--------------------------------------------------------------------------------
9. REFLECTION (under 100 words)
--------------------------------------------------------------------------------
Reading Pixabay's API terms changed my whole design: search image links expire
after 24 hours and permanent hotlinking isn't allowed, so my server keeps its own
copy of every saved image. Because I wrote a spec, plan, and task list before
coding, that pivot was cheap instead of painful. Some lessons came the hard way:
Mongoose reserves the field name "collection," Express 5 makes req.query
read-only, and MongoDB has no Windows-on-ARM build. Measuring contrast ratios
made me darken my own mockup's cyan - accessibility won over my design.


--------------------------------------------------------------------------------
10. FEEDBACK
--------------------------------------------------------------------------------
The open-ended prompt paired with a concrete rubric was a great combination: I knew
exactly what "good" looked like but still had room to make it my own. One
suggestion: the README could mention that Pixabay forbids permanent hotlinking and
that its image URLs expire after 24 hours. Saving the returned URL is the obvious
approach, so many submissions may have collections that quietly break a day later.
A one-line heads-up would make a nice extra-credit hook ("how did you handle image
storage?").

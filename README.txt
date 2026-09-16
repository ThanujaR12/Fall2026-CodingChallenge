PIXBOARD (displayed in the app as "Palette Boards")
Change++ Fall 2026 Coding Challenge — image saving/sharing app

Name:              TODO: your full name
Vanderbilt email:  TODO: your @vanderbilt.edu email


WHAT IT DOES
------------
Search free photos from Pixabay, save the ones you love into named collections,
give them your own titles and notes, and find them again later.

  - Search by keyword, 20 results at a time, with "Load more"
  - Create collections (names are unique, ignoring capitalization)
  - Save any search result into a collection, or create a new collection while saving
  - See your collections with cover photos, image counts, and photo credits
  - Open a saved image to see it larger, edit its title and note, or remove it
  - Rename or delete collections (deleting asks for confirmation)
  - Works on phones (375px wide) through desktop

The display name "Palette Boards" comes from the design mockups; change APP_NAME in
client/src/lib/constants.ts to rename it.


HOW IT IS BUILT
---------------
  client/   Web app: React + TypeScript (Vite), shadcn/ui components with Tailwind CSS,
            React Router, TanStack Query
  server/   REST API (a separate server): Node.js + Express + TypeScript, MongoDB Atlas
            via Mongoose, zod validation, Vitest + Supertest tests
  specs/    Planning documents (spec, plan, data model, API contract, tasks)
  design/   Design screenshots and notes the UI follows

API documentation: server/API.md

Saved images are copied into the database when you save them, because Pixabay does not
allow apps to permanently link to its image URLs. The Pixabay API key is only ever used by
the server; it never reaches the browser.


PREREQUISITES
-------------
  1. Node.js 22 (LTS) and npm 10.  Check with:  node -v   and   npm -v
  2. A free MongoDB Atlas database:
       - Create a free cluster at https://www.mongodb.com/atlas
       - Database Access: add a database user with a password
       - Network Access: add your current IP address
       - Connect -> Drivers: copy the connection string (mongodb+srv://...)
         and put your database user's password into it
  3. A free Pixabay API key:
       - Sign up at https://pixabay.com and open https://pixabay.com/api/docs/
       - Your key is shown in the "Parameters" section while logged in


INSTALL AND RUN
---------------
Commands are one per line so they work in bash, zsh, cmd, and Windows PowerShell.

1) Server (terminal 1)

   cd server
   npm install
   cp .env.example .env
       (on Windows cmd or PowerShell use:  copy .env.example .env)

   Open server/.env and fill in:
       MONGODB_URI=<your Atlas connection string>
       PIXABAY_API_KEY=<your Pixabay key>
   Leave PORT=4000 and CLIENT_ORIGIN=http://localhost:5173 as they are.

   npm run dev

   You should see "Connected to MongoDB" and "API listening on http://localhost:4000".
   If a variable is missing, the server stops and names it.

2) Client (terminal 2)

   cd client
   npm install
   cp .env.example .env
       (on Windows cmd or PowerShell use:  copy .env.example .env)
   npm run dev

   Open http://localhost:5173 in your browser.

Quick check that the API is up:  http://localhost:4000/api/health  shows {"status":"ok"}


TESTS AND CODE CHECKS
---------------------
In server/:
   npm test               (65 tests; no API keys needed, uses an in-memory database)
   npm run lint
   npm run format:check

The first "npm test" downloads a MongoDB binary for the in-memory database (one time).

In client/:
   npm run lint
   npm run format:check
   npm run build


REFLECTION (under 100 words)
----------------------------
TODO: write your reflection here — what you learned, what was reinforced, and any
issues you ran into.


FEEDBACK
--------
TODO: your feedback on the challenge, workshops, or office hours.

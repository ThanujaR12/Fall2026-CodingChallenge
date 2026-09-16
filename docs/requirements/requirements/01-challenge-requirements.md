# Challenge Requirements (summary)

Source: https://github.com/ChangePlusPlusVandy/Fall2026-CodingChallenge
Always re-check the source README for the final word. This file is a working summary.

- **Due:** Friday, September 18, 2026, 11:59 PM Central Time
- **Submit:** the completion form linked in the source README (required, or the application is incomplete)
- **Setup:** fork the challenge repo; your fork is what you submit

## The product

An **image saving/sharing app** (Pinterest-like, or your own interpretation) where users discover, save, organize, and share content.

### Required user capabilities

1. Create individual boards/collections
2. Search for images or other content (suggested source: Pixabay API)
3. Save content into collections and edit saved content
4. Remove content from collections
5. View their own collections
6. The app must look good

## Required deliverables

### Frontend
- Any reasonable technology; a web app is expected for full points.

### Backend
- A RESTful API, running as a **separate server** from the frontend.
- Endpoints to: save an image to a collection, delete an image from a collection, share a collection.
- Collections stored in a data structure; a real database earns more points.

### README.txt (must be `.txt`, not `.md`)
- Full name and Vanderbilt email
- Instructions to install and run the program
- A short reflection (under 100 words): what you learned, what was reinforced, issues you hit
- Feedback on the challenge, workshops, or office hours

## What graders look for

1. **Functionality** — it works, and ideally goes beyond the bare spec
2. **Style and readability** — intentional comments, consistent formatting, meaningful commit messages
3. **Organization and extensibility** — easy to understand and build on
4. **Creativity** — stand out from many other applicants

## Scoring rubric and our target

| Category | Top tier in rubric | Our target |
|----------|--------------------|------------|
| Frontend framework (5) | React/Vue/Angular **with TypeScript AND a component library** | React + TypeScript + component library |
| Frontend coding style (3) | Clean modular components, meaningful commits, consistent style | Small components, comments, small commits |
| Backend framework (3) | Node.js (Express) or Next.js | Express |
| Backend coding style (3) | Routes + middleware + DB schema structure, documented endpoints, clear error handling | Same |
| Core features (listed tiers go up to 5) | User accounts + sharing with accounts to collaborate and edit | Accounts + share link + collaborators |
| Data handling (listed tiers go up to 3) | Real database (MongoDB/PostgreSQL/etc.) | Hosted database |
| Aesthetics (3) | Polished, consistent, responsive, feels like a real app | Designed in Claude Design first |
| Creativity / bonus (8) | Examples: public/private toggle, notifications on edits to shared collections, low latency + reliability, lazy/optimistic loading | Signature feature + several examples |
| README (1) | Well-written README.txt | Yes |

Note: the rubric headings and the listed tiers don't match exactly for "Core features" and "Data handling". Aim for the highest listed tier in both.

## Allowed help

- Google and LLMs are explicitly allowed ("simulate real-world development").
- You must still understand your code — graders read it.
- Don't use C++.

# Liege-Tracker

Full-stack todo tracker.

## Structure
- client: Vite + React (JavaScript)
- server: Node.js + Express + MongoDB (Mongoose)

## Setup

### Server
1. Copy env file and set values:
   - `cp server/.env.example server/.env`
   - Required auth vars: `JWT_SECRET`, `APP_BASE_URL`
   - Required reset-email vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`
   - Optional email auth vars (depends on provider): `SMTP_USER`, `SMTP_PASS`
   - Add `OPENAI_API_KEY` (required for AI roadmap generation)
2. Install deps and run:
   - `cd server`
   - `npm install`
   - `npm run dev`

### Client
1. Install deps and run:
   - `cd client`
   - `npm install`
   - `npm run dev`
2. Optional API base override:
   - `VITE_API_BASE_URL=http://localhost:4000/api`

The client uses `/api` by default and Vite proxies it to `http://localhost:4000` in dev.

## AI Roadmaps
- Endpoint: `POST /api/roadmaps/generate`
- Body: `{ "goal": "Your goal text" }`
- Behavior:
  - Uses OpenAI server-side to generate a roadmap with milestones.
  - Saves the roadmap in MongoDB.
  - Automatically creates todos from roadmap steps with `dueDate`, `tags`, and `priority`.

## Guest Mode
- Continue as guest from the auth screen.
- Guest todos are stored locally on the device (`localStorage`), not in MongoDB.
- AI roadmap generation is disabled in guest mode.

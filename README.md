# Liege-Tracker

Full-stack todo tracker.

## Structure
- client: Vite + React + TypeScript
- server: Node.js + Express + MongoDB (Mongoose)

## Setup

### Server
1. Copy env file and set MongoDB connection:
   - `cp server/.env.example server/.env`
   - Add a `JWT_SECRET` value
2. Install deps and run:
   - `cd server`
   - `npm install`
   - `npm run dev`

### Client
1. Install deps and run:
   - `cd client`
   - `npm install`
   - `npm run dev`

The client proxies `/api` to `http://localhost:5000`.

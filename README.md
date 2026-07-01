# Judgment — Real-Time Multiplayer Card Game

A browser-based, real-time multiplayer implementation of the Judgment (Oh Hell) trick-taking card game, built with WebSockets for live state sync.

> Based on assumed standard rules — confirm against your reference app and adjust as needed.

## Features
- Create/join game rooms via shareable code or link
- Real-time bidding and trick-play synced across all players via WebSockets
- Server-authoritative rule enforcement (legal bids, follow-suit, turn order)
- Automatic scoring and live scoreboard
- Reconnect support if a player drops mid-game
- In-room text chat
- Responsive UI (desktop + mobile)

## Tech Stack (suggested)
- **Frontend:** React (or Vue), WebSocket client, Tailwind/CSS
- **Backend:** Node.js + `ws` or Socket.IO, Express (for health/static routes)
- **State:** In-memory room state (MVP); Redis pub/sub for multi-instance scaling
- **Deployment:** Any Node-compatible host (Render, Railway, Fly.io, AWS, etc.) with WSS support

## Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn

### Installation
```bash
git clone <repo-url>
cd judgment-game
npm install
```

### Environment Variables
Create a `.env` file in `/server`:
```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Running Locally
```bash
# Terminal 1 — start the WebSocket/game server
cd server
npm run dev

# Terminal 2 — start the client
cd client
npm run dev
```
Client runs at `http://localhost:5173`, server WebSocket at `ws://localhost:4000`.

### Running Tests
```bash
cd server
npm test
```

## How to Play
1. Click **Create Room** to start a new game and get a room code/link.
2. Share the link with 2–7 friends (3–8 players total).
3. Host sets round count and starts the game once everyone has joined.
4. Each round: review your hand → place your bid ("judgment") → play tricks in turn.
5. Scores update automatically after each round; final standings shown after the last round.

## Project Documents
- [`BRD.md`](./BRD.md) — Business Requirements Document
- [`SRS.md`](./SRS.md) — Software Requirements Specification
- [`folder-structure.md`](./folder-structure.md) — Codebase layout reference

## Contributing
1. Fork the repo and create a feature branch.
2. Keep game-rule logic server-side and unit-tested.
3. Open a PR with a clear description of the change.

## License
[Specify license, e.g., MIT]

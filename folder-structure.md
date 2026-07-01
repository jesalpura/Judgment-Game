# Folder Structure — Judgment Card Game

Suggested monorepo layout with separate `client` (React) and `server` (Node.js WebSocket game server) packages.

```
judgment-game/
├── README.md
├── BRD.md
├── SRS.md
├── folder-structure.md
├── package.json                 # root scripts (optional workspace config)
│
├── client/                      # Frontend (React + WebSocket client)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── assets/
│       │   └── cards/           # card face/back images
│       ├── components/
│       │   ├── Lobby/
│       │   │   ├── RoomCreate.jsx
│       │   │   ├── RoomJoin.jsx
│       │   │   └── PlayerList.jsx
│       │   ├── Game/
│       │   │   ├── Hand.jsx
│       │   │   ├── BiddingPanel.jsx
│       │   │   ├── TrickArea.jsx
│       │   │   ├── Scoreboard.jsx
│       │   │   └── TurnIndicator.jsx
│       │   └── Chat/
│       │       └── ChatPanel.jsx
│       ├── hooks/
│       │   ├── useWebSocket.js
│       │   └── useGameState.js
│       ├── context/
│       │   └── GameContext.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Room.jsx
│       │   └── NotFound.jsx
│       ├── utils/
│       │   ├── cardSort.js
│       │   └── validators.js
│       └── styles/
│           └── globals.css
│
├── server/                      # Backend (Node.js WebSocket game server)
│   ├── package.json
│   ├── tsconfig.json            # if using TypeScript
│   ├── src/
│   │   ├── index.js             # entry point, HTTP + WS server bootstrap
│   │   ├── config/
│   │   │   └── env.js
│   │   ├── ws/
│   │   │   ├── socketServer.js  # WS connection handling
│   │   │   ├── eventRouter.js   # maps incoming events to handlers
│   │   │   └── handlers/
│   │   │       ├── roomHandlers.js
│   │   │       ├── bidHandlers.js
│   │   │       ├── playHandlers.js
│   │   │       └── chatHandlers.js
│   │   ├── game/
│   │   │   ├── Room.js
│   │   │   ├── Player.js
│   │   │   ├── Round.js
│   │   │   ├── Deck.js
│   │   │   ├── rules/
│   │   │   │   ├── bidding.js
│   │   │   │   ├── trickResolution.js
│   │   │   │   └── scoring.js
│   │   │   └── RoomManager.js   # in-memory registry of active rooms
│   │   ├── persistence/
│   │   │   └── redisClient.js   # optional, for multi-instance pub/sub
│   │   ├── routes/
│   │   │   └── health.js        # REST health check endpoint
│   │   └── utils/
│   │       ├── logger.js
│   │       └── idGenerator.js
│   └── tests/
│       ├── bidding.test.js
│       ├── trickResolution.test.js
│       ├── scoring.test.js
│       └── room.test.js
│
└── docs/
    └── api/
        └── websocket-events.md  # detailed event schema reference
```

## Notes
- `game/` on the server contains all authoritative rule logic — this is the only place hand/bid/trick validation should live.
- `ws/handlers/` should stay thin: parse → call into `game/` → broadcast result. Avoid putting game logic directly in handlers.
- `client/src/hooks/useWebSocket.js` centralizes connection, reconnect-with-backoff, and event dispatch so components don't manage sockets directly.
- Add `docs/api/websocket-events.md` to formally document each event's payload shape as it's implemented (keeps SRS section 3 FR-6 table in sync with actual code).

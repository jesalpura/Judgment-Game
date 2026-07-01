# Software Requirements Specification (SRS)
## Project: Judgment — Real-Time Multiplayer Card Game

**Version:** 1.0
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for a real-time, WebSocket-driven web application implementing the Judgment trick-taking card game.

### 1.2 Scope
A browser-based client connects to a WebSocket game server that owns all authoritative game state (deck, hands, bids, tricks, scores) for each room. Clients render UI and send player actions; the server validates, mutates state, and broadcasts updates to all clients in the room.

### 1.3 Definitions
| Term | Definition |
|---|---|
| Room | An isolated game session identified by a unique code |
| Round | One full deal-bid-play-score cycle (hand size varies by round) |
| Trick | One sub-round where each player plays one card; highest card (per trump/suit rules) wins |
| Bid / Judgment | A player's declared prediction of tricks they will win in the round |
| Trump | The suit that outranks all others for that round |

---

## 2. Overall Description

### 2.1 System Context
```
[Browser Client] <--WebSocket (JSON events)--> [Game Server] <--> [In-memory Room State / optional Redis]
```

### 2.2 User Classes
- **Host**: creates a room, configures settings, starts the game.
- **Player**: joins a room, participates in bidding and play.
- **(Optional) Spectator**: future scope.

### 2.3 Operating Environment
- Client: modern browsers (Chrome, Firefox, Safari, Edge), desktop and mobile, via HTTPS.
- Server: Node.js (or equivalent) WebSocket server, deployed behind a load balancer with sticky sessions or a shared pub/sub layer for horizontal scaling.

---

## 3. Functional Requirements

### FR-1 Room Management
- FR-1.1: User can create a room and receive a unique room code/URL.
- FR-1.2: User can join a room via code/URL and enter a display name.
- FR-1.3: Host can set: number of rounds, starting hand size, max players.
- FR-1.4: Room shows live list of joined players and ready state.
- FR-1.5: Host can start the game once minimum players (3) have joined.

### FR-2 Game Setup (per round)
- FR-2.1: Server shuffles and deals cards server-side; each client receives only its own hand.
- FR-2.2: Server determines and broadcasts the trump suit for the round.
- FR-2.3: Server tracks dealer position and rotates it each round.

### FR-3 Bidding Phase
- FR-3.1: Players bid in turn order; bid = integer between 0 and hand size.
- FR-3.2: Server enforces the "hook rule" (last bidder cannot make total bids equal hand size), if enabled.
- FR-3.3: All players see bids as they are made.
- FR-3.4: Server rejects out-of-turn or invalid bids with an error event back to that client only.

### FR-4 Trick-Play Phase
- FR-4.1: Players play one card per trick in turn order.
- FR-4.2: Server enforces follow-suit rule; if player has no cards of led suit, any card (including trump) is legal.
- FR-4.3: Server rejects illegal plays with an error event back to that client only.
- FR-4.4: Server determines trick winner and broadcasts result; winner leads next trick.

### FR-5 Scoring
- FR-5.1: At round end, server computes each player's score based on bid accuracy (e.g., exact bid = 10 + tricks won; miss = 0, per configured scoring rule).
- FR-5.2: Server broadcasts updated cumulative scoreboard after each round.
- FR-5.3: After the final configured round, server broadcasts final standings and ends the game.

### FR-6 Real-Time Sync (WebSocket Events)
Minimum event set (illustrative — exact payload schema TBD):

| Event (client→server) | Event (server→client) |
|---|---|
| `room:create` | `room:created` |
| `room:join` | `room:state` (full state) |
| `player:ready` | `player:joined` / `player:left` |
| `game:start` | `round:dealt` (private hand per player) |
| `bid:submit` | `bid:placed`, `bid:phase_complete` |
| `card:play` | `trick:card_played`, `trick:resolved` |
| — | `round:scored` |
| — | `game:ended` |
| — | `error` |

### FR-7 Reconnection
- FR-7.1: On disconnect, server retains player's seat/state for a grace period (e.g., 2 minutes).
- FR-7.2: Client can reconnect with a session token and receive a full state snapshot.
- FR-7.3: If grace period expires, server may allow host to mark player as inactive (auto-pass) or end the game.

### FR-8 Chat (optional, Should-have)
- FR-8.1: Players can send text messages visible to all in the room.
- FR-8.2: Basic profanity/length limits applied server-side.

---

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | State updates propagate to all clients in < 300ms under normal network conditions |
| NFR-2 | Server is fully authoritative; hidden information (other players' hands, remaining deck) never sent to unauthorized clients |
| NFR-3 | System supports at least 100 concurrent rooms / 500 concurrent connections on a single instance (baseline; scalable horizontally) |
| NFR-4 | WebSocket connection uses WSS (TLS) in production |
| NFR-5 | UI is responsive down to 360px width (mobile) |
| NFR-6 | Reconnection logic recovers session within 5 seconds of network restore |
| NFR-7 | Graceful degradation/error messaging if WebSocket connection fails (e.g., fallback retry with backoff) |
| NFR-8 | Game logic covered by automated unit tests (bid validation, follow-suit logic, scoring) |

---

## 5. Data Model (high level)

```
Room {
  id, code, hostId, status (lobby|in_progress|ended),
  settings { maxPlayers, totalRounds, scoringRule },
  players: [Player],
  currentRound: Round
}

Player {
  id, sessionToken, displayName, seatIndex,
  connected: bool, score: int, hand: [Card] (server-only visibility)
}

Round {
  number, dealerSeat, trumpSuit, handSize,
  bids: { playerId: int },
  tricks: [Trick],
  scores: { playerId: int }
}

Trick {
  leaderSeat, plays: [{ playerId, card }], winnerId
}

Card { suit, rank }
```

---

## 6. External Interfaces
- **WebSocket API**: primary real-time channel (see FR-6 event table).
- **REST (optional)**: health check endpoint, room existence lookup, static asset serving.

## 7. Constraints
- Server must be the single source of truth; client never resolves game rules locally for anything affecting other players.
- No use of client-side timers as authoritative turn timeouts — server enforces.

## 8. Future Considerations
- Persistent accounts and game history
- Spectator mode
- AI/bot players to fill empty seats
- Tournament/ranked mode

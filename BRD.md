# Business Requirements Document (BRD)
## Project: Judgment — Real-Time Multiplayer Card Game

**Version:** 1.0
**Status:** Draft (based on assumed feature set — see note below)
**Owner:** [Product Owner Name]

> **Note:** The reference URL (`judgmentgame-ydu2l34.public.builtwithrocket.new`) could not be crawled due to robots.txt restrictions. This document assumes the standard rules of "Judgment" (a.k.a. Oh Hell / Diminishing Returns / Up-and-Down-the-River), a trick-taking card game where players bid ("judge") how many tricks they will win each round. Adjust scope after reviewing the live app.

---

## 1. Purpose
Build a web-based, real-time multiplayer implementation of the Judgment card game, allowing players to create/join game rooms, play live hands with synchronized state via WebSockets, and track scores across rounds — playable entirely in the browser with no app install.

## 2. Background & Problem Statement
Card games like Judgment are traditionally played in person with physical cards and manual scorekeeping. Friends/families dispersed geographically have no easy way to play together with low latency, synchronized turn state, and automatic scoring. Existing generic video-call + manual scoring solutions are clunky and error-prone.

## 3. Business Objectives
- O1: Enable 3–8 players to play a full game of Judgment together remotely in real time.
- O2: Provide sub-second turn/state synchronization using WebSockets (no polling/refresh).
- O3: Automate bidding, trick resolution, and scoring to eliminate manual errors.
- O4: Deliver a frictionless onboarding flow (no signup required to play a casual game).
- O5: Support reconnection so a dropped player can rejoin an in-progress game.

## 4. Scope

### 4.1 In Scope
- Room/lobby creation and joining via shareable room code/link
- Real-time card dealing, bidding ("judgment") phase, trick-play phase
- Turn enforcement and rule validation (follow-suit, trump, legal bids)
- Automatic scoring per standard Judgment rules across a full round sequence
- Live player list, turn indicators, and basic in-room chat
- Reconnect/resume support on network drop or page refresh
- Responsive web UI (desktop + mobile browser)

### 4.2 Out of Scope (v1)
- Native mobile apps
- Persistent user accounts/authentication beyond display names (unless confirmed needed)
- Real-money wagering
- Spectator mode, tournaments, ranked matchmaking
- Voice/video chat

## 5. Stakeholders
| Role | Interest |
|---|---|
| Product Owner | Defines scope, prioritizes features |
| Players (end users) | Smooth, fair, real-time gameplay |
| Developers | Build & maintain WebSocket game server + client |
| QA | Validate game-rule correctness and sync reliability |

## 6. Key Business Requirements
| ID | Requirement | Priority |
|---|---|---|
| BR-1 | Players can create a room and invite others via a code/link | Must |
| BR-2 | Players can join a room and see a live lobby before the game starts | Must |
| BR-3 | The host can configure round count / deck rules before starting | Should |
| BR-4 | All players see synchronized game state (cards dealt, bids, turns, played cards, scores) in real time | Must |
| BR-5 | Game enforces legal moves (follow suit, valid bid range, turn order) | Must |
| BR-6 | Scores are calculated and displayed automatically after each round | Must |
| BR-7 | A disconnected player can rejoin the same room and resume their seat | Must |
| BR-8 | In-room text chat for players | Could |
| BR-9 | Game works on both desktop and mobile browsers | Must |

## 7. Assumptions
- Standard Judgment rules: bids that sum to exactly the round's trick count are disallowed for the last bidder ("hook rule" / dealer restriction) — to be confirmed.
- 3–8 players supported; deck/hand size scales with player count.
- No persistent backend database required for MVP beyond in-memory room state (can add persistence later for stats/history).

## 8. Success Metrics
- Game state latency < 300ms between action and all-clients sync (P95)
- < 1% of games end in a desynced/invalid state
- Players can go from "open site" to "in a game" in under 60 seconds

## 9. Risks
| Risk | Impact | Mitigation |
|---|---|---|
| WebSocket server scaling under concurrent rooms | High | Use room-scoped channels; horizontal scaling with sticky sessions or pub/sub (Redis) |
| Players exploiting client to see other hands | High | Server is authoritative; clients never receive other players' hidden cards |
| Network drop mid-game breaks game state | Medium | Reconnect-with-token + server-side state snapshot |

## 10. Open Questions
1. Should there be persistent accounts, or are rooms purely anonymous/ephemeral?
2. What is the exact bidding/scoring variant (standard Oh Hell scoring vs. custom)?
3. Is chat/voice required, or text chat only?
4. Any monetization (ads, premium rooms) planned?

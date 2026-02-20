# Draft Room WebSocket Integration Spec

## Goal
Replace the current local-simulation draft room with one wired to the real WebSocket draft server (`SBS-Football-Drafts`).

## WebSocket Connection
- URL: `wss://{NEXT_PUBLIC_DRAFT_SERVER_URL}/ws?address={walletAddress}&draftName={draftId}`
- Already built: `lib/api/websocket.ts` — `DraftWebSocketClient` class with reconnect + backoff
- Event format: `{ type: string, payload: object }`

## Server Events (incoming)
| Event | Payload | Action |
|-------|---------|--------|
| `countdown_update` | `{ timeRemaining, currentDrafter }` | Update pre-draft countdown, set current drafter |
| `timer_update` | `{ endOfTurnTimestamp, startOfTurnTimestamp, currentDrafter }` | Update pick timer, set current drafter |
| `new_pick` | `{ playerId, displayName, team, position, ownerAddress, pickNum, round }` | Add pick to board, remove from available, update pick number |
| `draft_info_update` | `{ pickNumber, roundNum }` | Update current pick/round |
| `draft_complete` | `{}` | Draft finished, show completion screen |
| `final_card` | `{ _imageUrl }` | Show generated card image |
| `invalid_pick` | `{ message }` | Show error |
| `new_queue` | queue data | Update queue |
| `new_message` | chat message | Show in chat |

## Client Events (outgoing)
| Event | Payload |
|-------|---------|
| `pick_received` | `{ playerId, displayName, team, position, ownerAddress, pickNum, round }` |
| `queue_update` | queue data |
| `send_message` | chat message |

## REST API Calls (on load)
- `GET /draft/{draftId}/state/info` → draft info (pickNumber, roundNum, draftStartTime, pickLength)
- `GET /draft/{draftId}/state/summary` → draft summary (all picks with positions)
- `GET /draft/{draftId}/state/rosters` → all rosters by owner
- `GET /draft/{draftId}/playerState/{walletAddress}` → player rankings with availability
- `GET /owner/{walletAddress}/drafts/{draftId}/state/queue` → user's queue

## UI Structure (match old sbs-draft-web)
1. **Top bar** (fixed): Horizontal scroll of player cards showing draft order/summary
2. **Status bar**: "Your turn to draft!" / "X turns until your pick!" / timer
3. **Nav tabs**: Draft | Queue | Board | Roster
4. **Draft tab**: Available players list (filterable by position, sortable by ADP/rank)
5. **Queue tab**: User's queued picks (drag to reorder)
6. **Board tab**: Full draft board grid (rounds × teams)
7. **Roster tab**: User's roster positions filled so far
8. **Completion screen**: Show final card image when draft ends

## Color scheme by league level
- Pro: black background, white text
- Hall of Fame: gold/primary background, black text  
- Jackpot: red background, black text

## Key behaviors
- Audio "your turn" notification when it's user's turn
- Auto-pick after 2 idle turns (pick from queue first, then best ADP)
- Mute/unmute toggle
- Reconnect on tab visibility change
- Freeze canDraft when timer hits 0

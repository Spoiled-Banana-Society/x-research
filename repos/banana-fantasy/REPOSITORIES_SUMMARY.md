# SBS Repositories Summary

This document provides a high-level overview of all SBS repositories and their purposes.

## Repository Structure

```
/Users/borisvagner/
├── banana-fantasy/                    # NEW Next.js 14 Frontend (this project)
├── sbs-draft-web-main/               # Old Next.js Frontend (reference)
├── sbs-drafts-api-main/              # Go API - Draft Management
├── SBS-Football-Drafts-main/         # Go WebSocket Server - Real-time Drafts
└── SBS-Backend-main/                 # Firebase Functions & Admin Scripts
```

---

## 1. banana-fantasy (Current Frontend)

**Location:** `/Users/borisvagner/banana-fantasy`

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS

**Status:** In development, uses mock data

**Key Features:**
- Pack opening animation for draft reveal
- Unified draft room (filling → reveal → drafting)
- Slot machine animation for draft type reveal
- Onboarding tutorial
- Exposure tracking
- VRF verification UI (mocked)
- Draft room chat
- Banana Wheel promo system

**Next Steps:**
- Replace mock data with real API calls
- Implement Web3Auth wallet authentication
- Add WebSocket for real-time drafts
- Integrate smart contract for minting

---

## 2. sbs-draft-web-main (Old Frontend - Reference)

**Location:** `/Users/borisvagner/sbs-draft-web-main`

**Tech Stack:** Next.js, Redux, Axios, Web3Auth, ThirdWeb

**Purpose:** Reference implementation showing how to connect to APIs

**Key Learnings:**
- How API endpoints are called
- WebSocket integration pattern
- Web3Auth authentication flow
- Redux state management for drafts
- Firebase Realtime DB integration
- OpenSea API for NFT profile pictures
- Smart contract interaction for minting

**Important Files:**
- `/utils/api.ts` - Axios API client
- `/constants/api.tsx` - API URLs
- `/redux/middleware/wsMiddleware.ts` - WebSocket middleware
- `/utils/auth/web3Auth.ts` - Web3Auth setup
- `/environment.ts` - Environment variables

---

## 3. sbs-drafts-api-main (Draft Management API)

**Location:** `/Users/borisvagner/sbs-drafts-api-main`

**Tech Stack:** Go, Firestore, Google Cloud Run

**Purpose:** REST API for draft and league management

**Environment:** Production

**Base URL:** `https://sbs-drafts-api-w5wydprnbq-uc.a.run.app`

**Key Endpoints:**
- `/owner/{walletAddress}` - Owner profile & draft passes
- `/league/{draftType}/owner/{walletAddress}` - Join drafts
- `/draft/{draftId}/state/info` - Draft state
- `/draft/{draftId}/state/rosters` - Player rosters

**Database:** Firestore
- Collections: owners, draftTokens, drafts, promoCodes, playerStats2025

**Authentication:** Wallet address-based (no API keys)

**Scripts:** One-off maintenance scripts in `/scripts` folder

---

## 4. SBS-Football-Drafts-main (Real-time Draft Server)

**Location:** `/Users/borisvagner/SBS-Football-Drafts-main`

**Tech Stack:** Go, WebSocket, Redis Pub/Sub, Firestore

**Purpose:** Real-time draft communication and timer management

**WebSocket URL:** `wss://sbs-drafts-server-w5wydprnbq-uc.a.run.app/ws`

**Key Features:**
- WebSocket connections for live drafts
- Timer management (30 sec fast, 8 hour slow)
- Auto-pick logic (queue → custom rankings → ADP)
- Multi-instance coordination via Redis
- NFT card generation on completion
- Push notifications for draft events

**Events:**
- `new_pick` - Player selected
- `timer_update` - Turn timer
- `draft_info_update` - State changed
- `countdown_update` - Pre-draft countdown
- `final_card` - Draft complete
- `draft_complete` - All done

**Database:** Firestore (drafts, rosters, queues, rankings)

---

## 5. SBS-Backend-main (Admin & Firebase Functions)

**Location:** `/Users/borisvagner/SBS-Backend-main`

**Tech Stack:** Node.js, Firebase Cloud Functions, Python (for image generation)

**Purpose:** Admin operations, scoring, and one-off scripts

**Key Functions:**
- Weekly scoring updates
- Card image generation (Python/PIL)
- NFT metadata APIs
- Playoff management
- Prize distribution
- Withdrawal handling
- W9 tax form processing

**Firebase Functions:**
- 150+ cloud functions for various triggers
- Express API server (`exports.api`)
- Scheduled cron jobs (scoring, ranking updates)
- Event triggers (card creation, ownership changes)

**Python Services:**
- Draft metadata API
- Draft image generator
- Playoff image generator
- Peel-mash image creator

**Scripts:** 150+ one-off scripts in `/functions/scripts`
- `/weeklyScripts` - Weekly operations
- `/yearlyScripts` - Season setup
- `/deployment` - League & prize management
- `/fix` - Data fixes
- `/playoffCardScripts` - Playoff management

---

## Data Flow Overview

```
User (banana-fantasy frontend)
    ↓
Web3Auth → Wallet Connection
    ↓
sbs-drafts-api-main
    ↓
Firestore (owner data, draft passes)
    ↓
Join Draft → Create League
    ↓
SBS-Football-Drafts-main (WebSocket)
    ↓
Real-time draft with Redis coordination
    ↓
Draft Complete → SBS-Backend-main
    ↓
Generate card image (Python)
    ↓
Create NFT metadata
    ↓
Mint on blockchain (via ThirdWeb)
    ↓
User receives NFT draft card
```

---

## Environment Comparison

| Feature | Test | Production |
|---------|------|------------|
| Drafts API | `https://sbs-drafts-api-ajuy5qy3wa-uc.a.run.app` | `https://sbs-drafts-api-w5wydprnbq-uc.a.run.app` |
| WebSocket | `wss://sbs-drafts-server-1026708014901.us-central1.run.app` | `wss://sbs-drafts-server-w5wydprnbq-uc.a.run.app` |
| Firebase DB | `https://sbs-test-env-default-rtdb.firebaseio.com` | `https://sbs-prod-env-default-rtdb.firebaseio.com` |
| Smart Contract | Sepolia testnet | Mainnet (`0x2BfF6f4284774836d867CEd2e9B96c27aAee55B7`) |
| Mint Price | 0.0001 ETH | 0.02 ETH |

---

## Quick Reference

**To work on frontend:** `cd banana-fantasy && npm run dev`

**To explore old frontend:** `cd sbs-draft-web-main`

**To check API scripts:** `cd sbs-drafts-api-main/scripts`

**To check backend scripts:** `cd SBS-Backend-main/functions/scripts`

**API Documentation:** See `/banana-fantasy/API_INTEGRATION.md`

**Environment Setup:** Copy `/banana-fantasy/.env.example` to `.env.local` and fill in credentials

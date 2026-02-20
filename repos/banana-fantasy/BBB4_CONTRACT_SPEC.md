# BBB4 Draft Pass Smart Contract Spec

## Overview
New ERC-721 contract for BBB4 (Season 4) draft passes, deployed on **Base** chain.

## Key Decisions
- **Chain**: Base (L2)
- **Price**: $25 USD fixed (paid in USDC, not native ETH)
- **Contract does NOT handle payments** — payments processed off-chain (USDC transfer to Safe wallet or card via on-ramp)
- **Contract mints draft pass NFT** to buyer's wallet after payment confirmed
- **Must support**: ownership verification, transfer, burn, free/promo mints

## Contract: SBSDraftTokenBBB4

### Based on Season 2 contract patterns:
- ERC-721 (OpenZeppelin)
- Ownable, Pausable, ReentrancyGuard
- Sequential token IDs (0, 1, 2, ...)
- Provenance hash for metadata integrity

### Functions

#### Minting
- `adminMint(address to, uint256 quantity)` — Owner-only, mints `quantity` tokens to `to`. Used for:
  - Promo/free passes (wheel wins, giveaways)
  - Purchased passes (after off-chain payment confirmed)
  - Batch minting
- `adminMintBatch(address[] to, uint256[] quantities)` — Batch mint to multiple addresses

#### No public mint function
Since payments happen off-chain, there's no payable mint. All minting goes through `adminMint`.

#### Ownership & Verification
- Standard ERC-721 `ownerOf(tokenId)` — verify who owns a pass
- `balanceOf(address)` — how many passes an address owns
- `tokensOfOwner(address)` — enumerate all token IDs owned (for UI display)

#### Burns
- `burn(uint256 tokenId)` — Owner of token can burn it (used after draft completion)
- Draft pass gets "consumed" when entering a draft

#### Admin Controls
- `flipPaused()` — pause/unpause all transfers
- `setBaseURI(string)` — update metadata URI
- `setProvenanceHash(string)` — set provenance
- `reserveTokens(uint256 count)` — reserve tokens for team
- `withdraw()` — withdraw any accidental ETH sent to contract

### State Variables
```solidity
uint256 public numTokensMinted;
uint256 public numTokensBurned;
string public baseURI;
string public PROVENANCE;
```

### Events
```solidity
event DraftPassMinted(address indexed to, uint256 indexed tokenId);
event DraftPassBurned(uint256 indexed tokenId);
```

### Integration with Backend
The Go backend (`sbs-drafts-api`) already has `MintDraftTokenInDb()` which:
1. Verifies contract ownership via `GetOwnerOfToken()`
2. Creates Firestore document in `draftTokens` collection
3. Creates metadata document
4. Adds to `owners/{id}/validDraftTokens`

**Flow for BBB4:**
1. User pays $25 (USDC on Base or card)
2. Backend confirms payment
3. Backend calls `adminMint(userAddress, 1)` on contract
4. Backend calls `MintDraftTokenInDb(tokenId, ownerAddress)` to sync Firestore
5. User sees pass in their wallet + on the site

**Flow for promo/wheel wins:**
1. User wins free pass from wheel/promo
2. Backend calls `adminMint(userAddress, 1)`
3. Backend syncs Firestore
4. User gets NFT automatically in their Privy embedded wallet

### Deployment Notes
- Deploy to Base mainnet
- Richard deploys via Hardhat/Foundry
- Contract address stored in env var: `NEXT_PUBLIC_BBB4_CONTRACT_ADDRESS`
- ABI stored in `api/SBSDraftTokenBBB4.go` (for Go backend)
- Need to update `utils.Contract` in Go backend to point to new contract on Base

### Dependencies
- OpenZeppelin Contracts v5.x (for Base compatibility)
- Solidity ^0.8.20
- No Chainlink/VRF needed (RNG handled server-side)

### Differences from Season 1/2
| Feature | Season 1/2 | BBB4 |
|---------|-----------|------|
| Chain | Ethereum mainnet | Base |
| Price | ETH (payable mint) | USDC off-chain |
| Public mint | Yes | No (admin only) |
| Batch mint | No | Yes |
| Token enumeration | No | Yes (tokensOfOwner) |
| Payment in contract | Yes | No |

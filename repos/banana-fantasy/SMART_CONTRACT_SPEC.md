# BBB4 Smart Contract Spec — SBSDraftPassBBB4.sol

## Overview
ERC-721 draft pass NFT on **Base** chain. Price: **$25 USDC** per pass. Based on existing SBSDraftTokenSeasonTwo.sol pattern but modernized for Base + USDC.

## Requirements

### Core
- ERC-721 (OpenZeppelin 5.x compatible, Solidity ^0.8.20)
- Payment in USDC (ERC-20), NOT native ETH
- Fixed price: 25 USDC (25 * 10^6 since USDC has 6 decimals)
- No max supply cap (unlimited mints while active)
- Max 20 per transaction
- Sequential token IDs starting at 0
- Pausable, Ownable, ReentrancyGuard

### Mint Types
1. **Public mint** — anyone can mint for 25 USDC each
2. **Presale mint** — allowlisted wallets only, same price
3. **Free mint** — owner can airdrop/grant free passes to specific wallets (promo winners, wheel prizes, etc.)
4. **Reserve** — owner can mint reserved tokens (for team/promos)

### Owner Functions
- `flipMintState()` / `flipPresaleState()` / `flipFreeWalletState()`
- `initPresaleWalletList(address[])` / `initFreeWalletList(address[])`
- `withdrawUSDC()` — withdraw collected USDC to owner
- `setBaseURI(string)` — metadata URI
- `setPaused(bool)`
- `setUSDCAddress(address)` — in case USDC contract changes

### Key Differences from Season 2
- USDC payment instead of ETH (uses `IERC20.transferFrom`)
- User must `approve()` USDC spending before minting
- Base chain deployment (not mainnet)
- OpenZeppelin 5.x patterns (constructor args for Ownable)
- No `_isApprovedOrOwner` (removed in OZ5, use `_requireOwned`)

### Base USDC Address
- Base Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia (testnet): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## File Location
Create at: `contracts/SBSDraftPassBBB4.sol` in sbs-frontend-v2 (we'll move to a dedicated repo later)

## Also Create
- `contracts/README.md` — deployment instructions for Base using Hardhat or Foundry
- Keep it clean, well-commented, production-ready

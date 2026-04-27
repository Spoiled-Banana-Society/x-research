# BBB4 Draft Pass Contracts

This folder contains the BBB4 ERC-721 draft pass smart contract for deployment on Base, plus the provably-fair batch proof anchor.

## Contracts

### `SBSDraftPassBBB4.sol`
- ERC-721 with USDC payments (6 decimals)
- Fixed price: 25 USDC
- Max 20 per transaction
- Sequential token IDs starting at 0
- Pausable, Ownable, ReentrancyGuard

### `BBB4BatchProof.sol` — provably-fair batch commit/reveal
On-chain anchor for SBS's "every 100 drafts: 94 Pro / 5 HOF / 1 Jackpot" guarantee. Without it, fairness is "trust the SBS database." With it, fairness is verifiable math against Base mainnet.

**How the system works:**
1. **Batch start** (`FilledLeaguesCount % 100 == 0`): Go API generates 32-byte `serverSeed`, computes `seedHash = keccak256(serverSeed)`, calls `commit(batchNumber, seedHash)`. Derives slot positions deterministically from the seed and calls `publishSlots(batchNumber, jackpotSlot, hofSlots)`. Persists everything in Firestore `batch_proofs/{batchNumber}` (seed kept private until reveal).
2. **During the batch**: each draft fills using the published slots (no on-chain calls).
3. **Batch end** (last draft fills): Go API calls `reveal(batchNumber, serverSeed)`. Contract enforces `keccak256(serverSeed) == seedHash`.
4. **Anyone**: fetches commit + reveal from Base, runs `deriveBatchSlots` (canonical impl: `lib/batchProof.ts`), confirms.

**Slot derivation algorithm** (deterministic — JS, Go, and any verifier must produce byte-identical output):
```
for i in 0..6:
    tag = "slot:" + batchNumber + ":" + i
    mac = HMAC_SHA256(serverSeed, tag)        // 32 bytes
    raw = uint64( first 8 bytes of mac, big-endian )
    position = raw mod 100
    while position is already taken:
        position = (position + 1) mod 100
    take position with role:
        i == 0:        Jackpot
        i in 1..5:     HOF
```

Modulo bias over uint64 → 100 is ~6×10⁻¹⁹. Negligible.

**Deploy:**
```bash
forge create contracts/BBB4BatchProof.sol:BBB4BatchProof \
    --rpc-url https://mainnet.base.org \
    --private-key $BBB4_OWNER_PRIVATE_KEY \
    --constructor-args $ADMIN_ADDRESS \
    --etherscan-api-key $BASESCAN_API_KEY \
    --verify
```
`ADMIN_ADDRESS` = `0xccdF79A51D292CF6De8807Abc1bB58D07D26441D` (the existing admin wallet). Cost: ~$1-3.

After deploy:
- Vercel env: `NEXT_PUBLIC_BBB4_BATCH_PROOF_ADDRESS` = contract address
- Go API env: `BBB4_BATCH_PROOF_ADDRESS` = same. (Private key already there.)

**What this contract does NOT do:**
- Doesn't randomize slots on-chain — that happens off-chain (deterministic from the committed seed). On-chain randomization adds no security since the seed itself is the secret, and costs more gas.
- Doesn't prevent "lucky seed retry." Mitigation: same admin wallet that already runs `BBB4.reserveTokens` calls commit immediately after generating the seed; repeated commit/reveal cycles in the same block range would be auditable.
- Doesn't store funds. Pure read/event ledger.

**Verifying yourself, for any `BBB #N`:**
1. `batchNumber = floor((N - 1) / 100) + 1`
2. `positionInBatch = (N - 1) mod 100`
3. Read `getCommit(batchNumber)` from the contract.
4. If `revealedAt > 0`: run `deriveBatchSlots(serverSeed, batchNumber)` and confirm slots match.
5. Position in `jackpotSlot` → Jackpot. In `hofSlots` → HOF. Else Pro.

## USDC Addresses (Base)
- Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Deployment (Hardhat)
1. Install deps (example):
```
# from repo root
npm install --save-dev hardhat @openzeppelin/contracts
```
2. Create a Hardhat config with Base RPC and Etherscan API key.
3. Example deploy script (`scripts/deploy-bbb4.js`):
```
const hre = require("hardhat");

async function main() {
  const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet
  const Contract = await hre.ethers.getContractFactory("SBSDraftPassBBB4");
  const contract = await Contract.deploy(usdc);
  await contract.waitForDeployment();
  console.log("Deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```
4. Deploy:
```
# set PRIVATE_KEY and BASE_RPC_URL in your env
npx hardhat run scripts/deploy-bbb4.js --network base
```

## Deployment (Foundry)
1. Install deps and configure `foundry.toml` with Base RPC.
2. Example:
```
forge create \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/SBSDraftPassBBB4.sol:SBSDraftPassBBB4 \
  --constructor-args 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## Minting Notes
- Users must `approve()` USDC to the contract before calling `mint` or `mintPresaleWalletList`.
- Owner can airdrop via `reserveTokens` or grant free mints with the free wallet list.

# BBB4 Draft Pass Contracts

This folder contains the BBB4 ERC-721 draft pass smart contract for deployment on Base.

## Contract
- `SBSDraftPassBBB4.sol`
  - ERC-721 with USDC payments (6 decimals)
  - Fixed price: 25 USDC
  - Max 20 per transaction
  - Sequential token IDs starting at 0
  - Pausable, Ownable, ReentrancyGuard

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

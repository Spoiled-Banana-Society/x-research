import { type Abi, type Address, createPublicClient, defineChain, http } from 'viem';

export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = 'https://mainnet.base.org';

export const BASE = defineChain({
  id: BASE_CHAIN_ID,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [BASE_RPC_URL],
    },
    public: {
      http: [BASE_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  },
  testnet: false,
});

// Keep old exports as aliases for any remaining references
export const BASE_SEPOLIA_CHAIN_ID = BASE_CHAIN_ID;
export const BASE_SEPOLIA_RPC_URL = BASE_RPC_URL;
export const BASE_SEPOLIA = BASE;

export const DEFAULT_BBB4_CONTRACT_ADDRESS = '0x14065412b3A431a660e6E576A14b104F1b3E463b' as Address;

export const BBB4_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_BBB4_CONTRACT as Address | undefined) ?? DEFAULT_BBB4_CONTRACT_ADDRESS;

export const BASE_SEPOLIA_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address; // Real USDC on Base mainnet

export const BBB4_ABI = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'TOKEN_PRICE_USDC',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'mintIsActive',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'totalMinted',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'MAX_TOKENS_PER_TX',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'usdc',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'mint',
    inputs: [{ name: 'numberOfTokens', type: 'uint256' }],
    outputs: [],
  },
] as const satisfies Abi;

export const USDC_ABI = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const satisfies Abi;

export async function getUsdcBalance(address: Address): Promise<bigint> {
  const client = createPublicClient({
    chain: BASE,
    transport: http(BASE_RPC_URL),
  });
  return client.readContract({
    address: BASE_SEPOLIA_USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
  });
}

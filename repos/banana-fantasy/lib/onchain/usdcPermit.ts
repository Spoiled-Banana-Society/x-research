import type { Address, Hex } from 'viem';
import { BASE_CHAIN_ID, BASE_SEPOLIA_USDC_ADDRESS } from '@/lib/contracts/bbb4';

// USDC on Base is Circle's FiatTokenV2_2. The EIP-712 name is "USD Coin"
// and version is "2" — these are the values the on-chain domain separator
// is built from, so the client signature must use them verbatim.
const USDC_EIP712_NAME = 'USD Coin';
const USDC_EIP712_VERSION = '2';

export interface UsdcPermitParams {
  owner: Address;
  spender: Address;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
}

/**
 * Build the EIP-712 typed data for a USDC Permit signature on Base.
 * Client passes this to `eth_signTypedData_v4`. Works with Privy embedded,
 * MetaMask, Coinbase Wallet, and any wallet implementing EIP-712.
 */
export function buildUsdcPermitTypedData(params: UsdcPermitParams) {
  return {
    domain: {
      name: USDC_EIP712_NAME,
      version: USDC_EIP712_VERSION,
      chainId: BASE_CHAIN_ID,
      verifyingContract: BASE_SEPOLIA_USDC_ADDRESS,
    },
    primaryType: 'Permit' as const,
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    message: {
      owner: params.owner,
      spender: params.spender,
      value: params.value.toString(),
      nonce: params.nonce.toString(),
      deadline: params.deadline.toString(),
    },
  };
}

/**
 * Split a 65-byte 0x-prefixed signature into r, s, v for the USDC permit ABI.
 */
export function parsePermitSignature(signature: Hex): {
  v: number;
  r: Hex;
  s: Hex;
} {
  const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
  if (sig.length !== 130) {
    throw new Error(`Invalid signature length: expected 130 hex chars, got ${sig.length}`);
  }
  const r = `0x${sig.slice(0, 64)}` as Hex;
  const s = `0x${sig.slice(64, 128)}` as Hex;
  let v = parseInt(sig.slice(128, 130), 16);
  // Some wallets return v as 0/1 instead of 27/28. Normalize.
  if (v < 27) v += 27;
  return { v, r, s };
}

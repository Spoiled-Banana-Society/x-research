/**
 * Buy/fulfill a BBB4 listing via opensea-js SDK.
 *
 * Client-side only — uses the Privy embedded wallet (or external wallet)
 * as the ethers signer.
 */
import { OpenSeaSDK, Chain } from 'opensea-js';
import { ethers } from 'ethers';
import { BBB4_CONTRACT, USDC_BASE } from '@/lib/opensea';

/**
 * Create an OpenSeaSDK instance with a signer from the user's wallet.
 * The SDK needs an ethers v6 provider/signer.
 */
function createSdk(provider: ethers.BrowserProvider): OpenSeaSDK {
  return new OpenSeaSDK(provider, {
    chain: Chain.Base,
    // API key is optional on client side for read operations;
    // fulfillment goes through on-chain Seaport directly
  });
}

export interface FulfillResult {
  transactionHash: string;
}

/**
 * Fulfill (buy) an existing OpenSea listing.
 *
 * @param orderHash - The OpenSea order hash to fulfill
 * @param buyerAddress - The buyer's wallet address
 * @param provider - ethers BrowserProvider from Privy's wallet
 */
export async function fulfillListing(
  orderHash: string,
  buyerAddress: string,
  provider: ethers.BrowserProvider,
): Promise<FulfillResult> {
  const sdk = createSdk(provider);

  // Fetch the order from OpenSea
  const order = await sdk.api.getOrder({
    orderHash,
    side: 'ask',
  });

  // Fulfill (buy) the order — handles USDC approval + Seaport call
  const tx = await sdk.fulfillOrder({
    order,
    accountAddress: buyerAddress,
  });

  return { transactionHash: tx };
}

/**
 * Check if the buyer has sufficient USDC balance for a purchase.
 * Uses a raw eth_call to avoid needing a full contract ABI.
 */
export async function checkUsdcBalance(
  buyerAddress: string,
  requiredAmount: number,
): Promise<{ sufficient: boolean; balance: number }> {
  const balanceOfSig = '0x70a08231';
  const paddedAddr = buyerAddress.slice(2).toLowerCase().padStart(64, '0');

  const res = await fetch('https://mainnet.base.org', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: USDC_BASE, data: balanceOfSig + paddedAddr }, 'latest'],
    }),
  });

  const result = await res.json();
  const rawBalance = parseInt(result?.result || '0x0', 16);
  const balance = rawBalance / 1e6; // USDC has 6 decimals

  return {
    sufficient: balance >= requiredAmount,
    balance,
  };
}

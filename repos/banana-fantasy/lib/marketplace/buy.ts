/**
 * Buy/fulfill a BBB4 listing via our server-side fulfillment API route.
 *
 * Instead of using opensea-js SDK directly (which sends tx through ethers,
 * making the user pay gas), we get the encoded Seaport calldata from our
 * API route and return it for Privy's gas-sponsored sendTransaction.
 */
import { USDC_BASE } from '@/lib/opensea';

export interface FulfillmentTx {
  to: string;
  value: string;
  data: string;
}

/**
 * Get the encoded Seaport transaction for fulfilling (buying) a listing.
 * Returns { to, value, data } ready for Privy's sendTransaction.
 *
 * @param orderHash - The OpenSea order hash to fulfill
 * @param buyerAddress - The buyer's wallet address
 * @param protocolAddress - The Seaport protocol address from the listing
 */
export async function getFulfillmentTx(
  orderHash: string,
  buyerAddress: string,
  protocolAddress: string,
): Promise<FulfillmentTx> {
  const res = await fetch('/api/marketplace/fulfill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderHash, buyerAddress, protocolAddress }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Fulfillment failed: ${res.status}`);
  }

  return res.json();
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

  const res = await fetch(process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC_URL || 'https://mainnet.base.org', {
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

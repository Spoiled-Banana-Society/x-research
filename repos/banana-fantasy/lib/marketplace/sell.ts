/**
 * Sell/list a BBB4 NFT on OpenSea via opensea-js SDK.
 *
 * Client-side only — uses the Privy embedded wallet (or external wallet)
 * as the ethers signer.
 */
import { OpenSeaSDK, Chain } from 'opensea-js';
import { ethers } from 'ethers';
import { BBB4_CONTRACT, USDC_BASE } from '@/lib/opensea';

/**
 * Create an OpenSeaSDK instance with a signer from the user's wallet.
 */
function createSdk(provider: ethers.BrowserProvider): OpenSeaSDK {
  return new OpenSeaSDK(provider, {
    chain: Chain.Base,
  });
}

export interface ListingResult {
  orderHash: string;
}

/**
 * Create a new listing (sell order) on OpenSea.
 *
 * @param tokenId - The BBB4 token ID to list
 * @param priceUsd - Price in USD (USDC, integer or decimal)
 * @param sellerAddress - The seller's wallet address
 * @param provider - ethers BrowserProvider from Privy's wallet
 * @param expirationDays - How many days until listing expires (default: 30)
 */
export async function createListing(
  tokenId: string,
  priceUsd: number,
  sellerAddress: string,
  provider: ethers.BrowserProvider,
  expirationDays: number = 30,
): Promise<ListingResult> {
  const sdk = createSdk(provider);

  const expirationTime = Math.floor(Date.now() / 1000) + expirationDays * 24 * 60 * 60;

  const response = await sdk.createListing({
    asset: {
      tokenAddress: BBB4_CONTRACT,
      tokenId,
    },
    accountAddress: sellerAddress,
    startAmount: priceUsd,
    paymentTokenAddress: USDC_BASE,
    expirationTime,
  });

  return { orderHash: response.orderHash };
}

/**
 * Cancel an existing listing on OpenSea.
 *
 * @param orderHash - The order hash to cancel
 * @param sellerAddress - The seller's wallet address
 * @param provider - ethers BrowserProvider from Privy's wallet
 */
export async function cancelListing(
  orderHash: string,
  sellerAddress: string,
  provider: ethers.BrowserProvider,
): Promise<void> {
  const sdk = createSdk(provider);

  const order = await sdk.api.getOrder({
    orderHash,
    side: 'ask',
  });

  await sdk.cancelOrder({
    order: order.protocolData,
    accountAddress: sellerAddress,
  });
}

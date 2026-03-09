/**
 * OpenSea types, constants, and mapping helpers for the BBB4 marketplace.
 */

// ── Constants ───────────────────────────────────────────────────────
// TODO: Swap back to BBB4 on Base before prod launch
// export const BBB4_CONTRACT = '0x14065412b3A431a660e6E576A14b104F1b3E463b';
// export const COLLECTION_SLUG = 'banana-best-ball-4';
// export const OPENSEA_CHAIN = 'base';
export const BBB4_CONTRACT = '0x2bff6f4284774836d867ced2e9b96c27aaee55b7'; // BBB3 for testing
export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const OPENSEA_API_BASE = 'https://api.opensea.io';
export const COLLECTION_SLUG = 'banana-best-ball-3'; // BBB3 for testing
export const OPENSEA_CHAIN = 'ethereum'; // BBB3 is on mainnet — swap to 'base' for BBB4

// ── OpenSea API Response Types ──────────────────────────────────────

export interface OpenSeaNft {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  display_image_url: string | null;
  metadata_url: string | null;
  traits?: Array<{ trait_type: string; value: string | number }>;
}

export interface OpenSeaListingPrice {
  current: {
    currency: string;
    decimals: number;
    value: string;
  };
}

export interface OpenSeaListing {
  order_hash: string;
  chain: string;
  protocol_address: string;
  protocol_data: {
    parameters: {
      offerer: string;
      offer: Array<{
        itemType: number;
        token: string;
        identifierOrCriteria: string;
        startAmount: string;
        endAmount: string;
      }>;
      consideration: Array<{
        itemType: number;
        token: string;
        identifierOrCriteria: string;
        startAmount: string;
        endAmount: string;
        recipient: string;
      }>;
      [k: string]: unknown;
    };
    signature: string;
  };
  price: OpenSeaListingPrice;
  remaining_quantity?: number;
}

export interface OpenSeaCollectionStats {
  total: {
    volume: number;
    sales: number;
    num_owners: number;
    market_cap: number;
    floor_price: number;
    floor_price_symbol: string;
    average_price: number;
  };
  intervals: Array<{
    interval: string;
    volume: number;
    volume_diff: number;
    volume_change: number;
    sales: number;
    sales_diff: number;
    average_price: number;
  }>;
}

// ── Unified Marketplace Types ───────────────────────────────────────

export type DraftType = 'jackpot' | 'hof' | 'pro';

export interface MarketplaceTeam {
  id: string;
  tokenId: string;
  name: string;
  draftType: DraftType;
  isHof: boolean;
  isJackpot: boolean;
  rank: number;
  points: number;
  weeklyAvg: number;
  playoffOdds: number;
  price: number | null;
  owner: string;
  roster: string[];
  color: string;
  imageUrl: string | null;
  orderHash: string | null;
}

export interface CollectionStats {
  floorPrice: number;
  floorPriceSymbol: string;
  totalVolume: number;
  numOwners: number;
  totalSales: number;
  averagePrice: number;
  weeklyVolumeChange: number | null;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Convert USDC amount (6 decimals) from raw string to USD number. */
export function priceFromUsdcWei(raw: string): number {
  return Number(raw) / 1e6;
}

/** Shorten an Ethereum address for display. */
function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Get color gradient based on draft type. */
function colorForDraftType(dt: DraftType): string {
  switch (dt) {
    case 'jackpot': return 'from-error to-red-700';
    case 'hof': return 'from-hof to-pink-600';
    case 'pro': return 'from-pro to-blue-600';
  }
}

/** Extract token ID from an OpenSea listing's offer array. */
function tokenIdFromListing(listing: OpenSeaListing): string {
  const nftOffer = listing.protocol_data.parameters.offer.find(o => o.itemType === 2 || o.itemType === 3);
  return nftOffer?.identifierOrCriteria ?? '0';
}

/** Determine if listing price is in USDC (ERC-20, itemType 1). */
function listingPriceUsd(listing: OpenSeaListing): number {
  const value = listing.price?.current?.value;
  const decimals = listing.price?.current?.decimals ?? 18;
  if (!value) return 0;
  return Number(value) / Math.pow(10, decimals);
}

/**
 * Map an OpenSea listing → MarketplaceTeam.
 * Stats (rank, points, etc.) are set to defaults; enriched later if possible.
 */
export function mapOpenSeaListingToTeam(listing: OpenSeaListing, nft?: OpenSeaNft | null): MarketplaceTeam {
  const tokenId = nft?.identifier ?? tokenIdFromListing(listing);
  const price = listingPriceUsd(listing);
  const maker = listing.protocol_data.parameters.offerer;

  return {
    id: tokenId,
    tokenId,
    name: nft?.name || `BBB #${tokenId}`,
    draftType: 'pro',
    isHof: false,
    isJackpot: false,
    rank: 0,
    points: 0,
    weeklyAvg: 0,
    playoffOdds: 0,
    price,
    owner: shortenAddress(maker),
    roster: [],
    color: colorForDraftType('pro'),
    imageUrl: nft?.display_image_url ?? nft?.image_url ?? null,
    orderHash: listing.order_hash,
  };
}

/**
 * Map an owned OpenSea NFT → MarketplaceTeam (for sell tab).
 * Stats are defaults; enriched by SBS backend data in the hook.
 */
export function mapOpenSeaNftToTeam(nft: OpenSeaNft, ownerAddress: string): MarketplaceTeam {
  return {
    id: nft.identifier,
    tokenId: nft.identifier,
    name: nft.name || `BBB #${nft.identifier}`,
    draftType: 'pro',
    isHof: false,
    isJackpot: false,
    rank: 0,
    points: 0,
    weeklyAvg: 0,
    playoffOdds: 0,
    price: null,
    owner: shortenAddress(ownerAddress),
    roster: [],
    color: colorForDraftType('pro'),
    imageUrl: nft.display_image_url ?? nft.image_url ?? null,
    orderHash: null,
  };
}

/**
 * Map OpenSea collection stats → our CollectionStats shape.
 */
export function mapCollectionStats(raw: OpenSeaCollectionStats): CollectionStats {
  return {
    floorPrice: raw.total.floor_price,
    floorPriceSymbol: raw.total.floor_price_symbol,
    totalVolume: raw.total.volume,
    numOwners: raw.total.num_owners,
    totalSales: raw.total.sales,
    averagePrice: raw.total.average_price,
  };
}

import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { json, jsonError, getSearchParam } from '@/lib/api/routeUtils';
import { ApiError } from '@/lib/api/errors';
import {
  OPENSEA_API_BASE,
  OPENSEA_CHAIN,
  BBB4_CONTRACT,
  COLLECTION_SLUG,
  mapOpenSeaNftToTeam,
  type OpenSeaNft,
} from '@/lib/opensea';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';

/**
 * GET /api/marketplace/nfts?owner=0x...
 *
 * Returns BBB4 NFTs owned by a specific wallet address.
 */
export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    if (!OPENSEA_API_KEY) {
      return jsonError('OpenSea API key not configured', 503);
    }

    const owner = getSearchParam(req, 'owner');
    if (!owner) return jsonError('Missing owner address', 400);

    const params = new URLSearchParams({
      collection: COLLECTION_SLUG,
      limit: '200',
    });

    const res = await fetch(
      `${OPENSEA_API_BASE}/api/v2/chain/${OPENSEA_CHAIN}/account/${owner}/nfts?${params}`,
      {
        headers: {
          accept: 'application/json',
          'x-api-key': OPENSEA_API_KEY,
        },
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[marketplace/nfts] OpenSea error:', res.status, text);
      return jsonError('Failed to fetch owned NFTs', res.status >= 500 ? 502 : res.status);
    }

    const data = await res.json();
    const rawNfts: OpenSeaNft[] = data.nfts ?? [];

    // Filter to only BBB4 contract NFTs (safety check)
    const bbb4Nfts = rawNfts.filter(
      nft => nft.contract?.toLowerCase() === BBB4_CONTRACT.toLowerCase(),
    );

    const nfts = bbb4Nfts.map(nft => {
      const { ownerAddress, ...rest } = mapOpenSeaNftToTeam(nft, owner);
      return rest;
    });

    return json({ nfts });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[marketplace/nfts] GET failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}

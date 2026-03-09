import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { json, jsonError } from '@/lib/api/routeUtils';
import { ApiError } from '@/lib/api/errors';
import { OPENSEA_API_BASE, OPENSEA_CHAIN, BBB4_CONTRACT, COLLECTION_SLUG } from '@/lib/opensea';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';

/**
 * GET /api/marketplace/nft/[tokenId]
 *
 * Returns full NFT metadata (name, image, traits) for a single BBB4 token.
 */
export async function GET(
  req: Request,
  { params }: { params: { tokenId: string } },
) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    if (!OPENSEA_API_KEY) {
      return jsonError('OpenSea API key not configured', 503);
    }

    const { tokenId } = params;
    if (!tokenId) return jsonError('Missing tokenId', 400);

    const res = await fetch(
      `${OPENSEA_API_BASE}/api/v2/chain/${OPENSEA_CHAIN}/contract/${BBB4_CONTRACT}/nfts/${tokenId}`,
      {
        headers: {
          accept: 'application/json',
          'x-api-key': OPENSEA_API_KEY,
        },
        next: { revalidate: 60 },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[marketplace/nft] OpenSea error:', res.status, text);
      return jsonError('Failed to fetch NFT', res.status >= 500 ? 502 : res.status);
    }

    const data = await res.json();
    const nft = data.nft ?? data;

    // Also fetch active listing for this token (if any)
    let listing = null;
    try {
      const listingsRes = await fetch(
        `${OPENSEA_API_BASE}/api/v2/listings/collection/${COLLECTION_SLUG}/all?limit=50`,
        {
          headers: {
            accept: 'application/json',
            'x-api-key': OPENSEA_API_KEY,
          },
          cache: 'no-store',
        },
      );
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        // Find the listing matching this tokenId
        listing = (listingsData.listings ?? []).find((l: { protocol_data: { parameters: { offer: Array<{ itemType: number; identifierOrCriteria: string }> } } }) => {
          const nftOffer = l.protocol_data.parameters.offer.find(
            (o: { itemType: number }) => o.itemType === 2 || o.itemType === 3,
          );
          return nftOffer?.identifierOrCriteria === tokenId;
        }) ?? null;
      }
    } catch {
      // Silent — listing data is optional
    }

    return json({ ...nft, listing });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[marketplace/nft] GET failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}

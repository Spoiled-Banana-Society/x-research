import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { json, jsonError } from '@/lib/api/routeUtils';
import { ApiError } from '@/lib/api/errors';
import { OPENSEA_API_BASE, COLLECTION_SLUG } from '@/lib/opensea';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';

/**
 * GET /api/marketplace/collection
 *
 * Returns collection stats (floor price, volume, owners, sales) from OpenSea.
 */
export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    if (!OPENSEA_API_KEY) {
      return jsonError('OpenSea API key not configured', 503);
    }

    const res = await fetch(
      `${OPENSEA_API_BASE}/api/v2/collections/${COLLECTION_SLUG}/stats`,
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
      console.error('[marketplace/collection] OpenSea error:', res.status, text);
      return jsonError('Failed to fetch collection stats', res.status >= 500 ? 502 : res.status);
    }

    const data = await res.json();
    const total = data.total ?? {};
    const intervals = data.intervals ?? [];

    // Find the weekly interval for change stats
    const weekInterval = intervals.find((i: { interval: string }) => i.interval === 'one_week');

    return json({
      floorPrice: total.floor_price ?? 0,
      floorPriceSymbol: total.floor_price_symbol ?? 'ETH',
      totalVolume: total.volume ?? 0,
      numOwners: total.num_owners ?? 0,
      totalSales: total.sales ?? 0,
      averagePrice: total.average_price ?? 0,
      marketCap: total.market_cap ?? 0,
      weeklyVolumeChange: weekInterval?.volume_change ?? null,
    });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[marketplace/collection] GET failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}

import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { logger } from '@/lib/logger';

// GET /api/spectate/draft-state?draftId=X
//
// Public route. Polled every ~2s by /spectate/[draftId] to render the
// live spectator view. Composes the Go API's per-draft state endpoints
// (info + summary + rosters) into a single snapshot so the client only
// makes one request per tick.
//
// We intentionally don't use lib/draftApi's getDraftInfo() here —
// that helper resolves the API base URL via getDraftsApiUrl() which
// only works client-side (gates on `typeof window`). Server-side it
// falls through to a fallback that can point at PROD. Inline the same
// URL chain that lib/db-firestore.ts uses so we're guaranteed to hit
// the right Cloud Run service from the API route.

interface DraftOrderEntry {
  ownerId: string;
  tokenId: string;
}
interface PlayerStateInfo {
  playerId: string;
  displayName: string;
  team: string;
  position: string;
  ownerAddress: string;
  pickNum: number;
  round: number;
}
interface DraftInfoResponse {
  draftId: string;
  displayName: string;
  draftStartTime: number;
  pickLength: number;
  currentDrafter: string;
  pickNumber: number;
  roundNum: number;
  pickInRound: number;
  currentPickEndTime?: number;
  draftOrder: DraftOrderEntry[];
}
interface DraftSummaryItem {
  playerInfo: PlayerStateInfo;
  pfpInfo?: { imageUrl?: string; displayName?: string };
}
type RosterState = Record<
  string,
  { QB: string[]; RB: string[]; WR: string[]; TE: string[]; DST: string[] }
>;

function getServerDraftsApiUrl(): string {
  return (
    process.env.STAGING_DRAFTS_API_URL ||
    process.env.NEXT_PUBLIC_DRAFTS_API_URL ||
    'https://sbs-drafts-api-staging-652484219017.us-central1.run.app'
  ).replace(/\/$/, '');
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const url = new URL(req.url);
    const draftId = url.searchParams.get('draftId');
    if (!draftId) throw new ApiError(400, 'draftId required');

    const base = getServerDraftsApiUrl();
    const [info, summaryRaw, rosters] = await Promise.all([
      fetchJson<DraftInfoResponse>(`${base}/draft/${encodeURIComponent(draftId)}/state/info`),
      fetchJson<DraftSummaryItem[] | { summary: DraftSummaryItem[] }>(
        `${base}/draft/${encodeURIComponent(draftId)}/state/summary`,
      ),
      fetchJson<RosterState>(`${base}/draft/${encodeURIComponent(draftId)}/state/rosters`),
    ]);

    if (!info) {
      throw new ApiError(404, 'draft not found');
    }

    const summary: DraftSummaryItem[] = Array.isArray(summaryRaw)
      ? summaryRaw
      : Array.isArray((summaryRaw as { summary?: DraftSummaryItem[] } | null)?.summary)
        ? (summaryRaw as { summary: DraftSummaryItem[] }).summary
        : [];

    return json({ draftId, info, summary, rosters: rosters ?? {} }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    logger.error('spectate.draft_state.failed', { err });
    return jsonError('Internal Server Error', 500);
  }
}

import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { logger } from '@/lib/logger';
import {
  getDraftInfo,
  getDraftRosters,
  getDraftSummary,
  type DraftInfoResponse,
  type DraftSummary,
  type RosterState,
} from '@/lib/draftApi';

// GET /api/spectate/draft-state?draftId=X
//
// Public route. Polled every ~2s by /spectate/[draftId] to render the
// live spectator view. Composes the Go API's per-draft state endpoints
// (info + summary + rosters) into a single snapshot so the client only
// makes one request per tick.
//
// Read-only — never mutates anything. No auth required because draft
// state is already exposed publicly via the Go API; this just bundles.

export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const url = new URL(req.url);
    const draftId = url.searchParams.get('draftId');
    if (!draftId) throw new ApiError(400, 'draftId required');

    let info: DraftInfoResponse | null = null;
    let summary: DraftSummary = [];
    let rosters: RosterState = {};

    const [infoR, summaryR, rostersR] = await Promise.allSettled([
      getDraftInfo(draftId),
      getDraftSummary(draftId),
      getDraftRosters(draftId),
    ]);
    if (infoR.status === 'fulfilled') info = infoR.value;
    if (summaryR.status === 'fulfilled') summary = summaryR.value;
    if (rostersR.status === 'fulfilled') rosters = rostersR.value;

    if (!info) {
      // Info is the only required piece — without it we can't render
      // even a header. The other two can be empty during fill phase.
      throw new ApiError(404, 'draft not found');
    }

    return json({ draftId, info, summary, rosters }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    logger.error('spectate.draft_state.failed', { err });
    return jsonError('Internal Server Error', 500);
  }
}

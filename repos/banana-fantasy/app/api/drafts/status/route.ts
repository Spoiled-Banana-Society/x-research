import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = "force-dynamic";
import { json, jsonError, getSearchParam } from '@/lib/api/routeUtils';
import { getDraftInfo } from '@/lib/api/drafts';

/**
 * GET /api/drafts/status?id={draftId}
 *
 * Returns current draft status for lobby polling.
 * Used by the waiting room to detect when a draft fills and starts.
 */
export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  const draftId = getSearchParam(req, 'id');
  if (!draftId) {
    return jsonError('Missing draft id', 400);
  }

  try {
    const info = await getDraftInfo(draftId);
    const infoObj = info as Record<string, unknown>;

    // Determine phase from backend data
    const draftStartTime = info.draftStartTime ? Number(info.draftStartTime) : null;
    const now = Date.now();
    const currentUsers = Number(infoObj.currentUsers ?? infoObj.numPlayers ?? infoObj.players ?? 0);
    const maxUsers = Number(infoObj.maxUsers ?? infoObj.maxPlayers ?? infoObj.maxDrafters ?? 10);

    let phase: 'waiting' | 'filling' | 'countdown' | 'drafting' | 'completed' = 'waiting';
    if (infoObj.status === 'completed' || infoObj.draftComplete) {
      phase = 'completed';
    } else if (draftStartTime && now >= draftStartTime) {
      phase = 'drafting';
    } else if (draftStartTime && now < draftStartTime) {
      phase = 'countdown';
    } else if (currentUsers >= maxUsers) {
      phase = 'countdown';
    } else if (currentUsers > 0) {
      phase = 'filling';
    }

    return json({
      draftId: info.draftId,
      phase,
      currentUsers,
      maxUsers,
      draftStartTime,
      countdownSeconds: draftStartTime ? Math.max(0, Math.floor((draftStartTime - now) / 1000)) : null,
      currentDrafter: info.currentDrafter ?? null,
      draftOrder: info.draftOrder ?? [],
      level: infoObj.draftLevel ?? infoObj.level ?? infoObj._level ?? 'Pro',
    });
  } catch {
    // Draft may not exist yet (still being created by matchmaker)
    return json({
      draftId,
      phase: 'waiting',
      currentUsers: 0,
      maxUsers: 10,
      draftStartTime: null,
      countdownSeconds: null,
      currentDrafter: null,
      draftOrder: [],
      level: 'Pro',
    });
  }
}

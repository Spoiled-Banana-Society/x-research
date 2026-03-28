export const dynamic = 'force-dynamic';
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString, requireNumber } from '@/lib/api/routeUtils';
import { updateQueueRoundDraftId, fillQueueRoundWithBots } from '@/lib/db';

const STAGING_API_URL = 'https://sbs-drafts-api-staging-652484219017.us-central1.run.app';

/**
 * POST /api/queues/create-draft
 *
 * Creates a Go API draft for a special draft queue round.
 * Uses JoinLeagues (which mints + joins properly) instead of create-special-draft.
 * Then fills with bots and updates the queue.
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId');
    const queueType = requireString(body.queueType, 'queueType') as 'jackpot' | 'hof';
    const roundId = requireNumber(body.roundId, 'roundId');

    if (queueType !== 'jackpot' && queueType !== 'hof') {
      return jsonError('Invalid queue type', 400);
    }

    // 1. Mint a token (may already exist — ignore errors)
    const mintId = 100000 + Math.floor(Math.random() * 50000);
    await fetch(`${STAGING_API_URL}/owner/${userId}/draftToken/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minId: mintId, maxId: mintId }),
    }).catch(() => {});

    // 2. Join a slow league via JoinLeagues — this properly creates token + adds to league
    const joinRes = await fetch(`${STAGING_API_URL}/league/slow/owner/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numLeaguesToJoin: 1 }),
    });

    if (!joinRes.ok) {
      const errText = await joinRes.text().catch(() => '');
      throw new ApiError(500, `Failed to join league: ${errText}`);
    }

    const joinData = await joinRes.json().catch(() => []);
    const draftId = Array.isArray(joinData) && joinData.length > 0
      ? joinData[0]._leagueId || joinData[0].leagueId || ''
      : '';

    if (!draftId) {
      throw new ApiError(500, 'No draftId returned from JoinLeagues');
    }

    // 3. Update the queue round in Firestore with the draftId
    await updateQueueRoundDraftId(queueType, roundId, String(draftId));

    // 4. Fill with 9 bots on Go API
    await fetch(`${STAGING_API_URL}/staging/fill-bots/slow?count=9&leagueId=${draftId}`, {
      method: 'POST',
    }).catch(() => {});

    // 5. Sync Firestore queue: add bot members + set status to 'drafting'
    await fillQueueRoundWithBots(queueType, roundId, 9).catch(() => {});

    // 6. Return the draftId to the client
    return json({ draftId: String(draftId) }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(msg, 500);
  }
}

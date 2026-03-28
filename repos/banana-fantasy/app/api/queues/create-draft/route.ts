export const dynamic = 'force-dynamic';
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString, requireNumber } from '@/lib/api/routeUtils';
import { updateQueueRoundDraftId } from '@/lib/db';

const STAGING_API_URL = 'https://sbs-drafts-api-staging-652484219017.us-central1.run.app';

/**
 * POST /api/queues/create-draft
 *
 * Creates a Go API draft for a special draft queue round that doesn't have one yet.
 * Steps:
 * 1. Mint a token for the user (idempotent)
 * 2. Call /staging/create-special-draft on the Go API
 * 3. Update the Firestore queue round with the returned draftId
 * 4. Return { draftId } to the client
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

    // 1. Mint a token for the wallet (may already exist — ignore errors)
    const mintId = 40000 + Math.floor(Math.random() * 10000);
    await fetch(`${STAGING_API_URL}/owner/${userId}/draftToken/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minId: mintId, maxId: mintId }),
    }).catch(() => {});

    // 2. Create the special draft via Go API
    const typeForApi = queueType === 'hof' ? 'hof' : 'jackpot';
    const createRes = await fetch(`${STAGING_API_URL}/staging/create-special-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: typeForApi, wallets: [userId] }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => '');
      throw new ApiError(500, `Failed to create special draft: ${errText}`);
    }

    const createData = await createRes.json().catch(() => ({}));
    const draftId = createData.draftId || createData.leagueId || '';

    if (!draftId) {
      throw new ApiError(500, 'No draftId returned from create-special-draft');
    }

    // 3. Update the queue round in Firestore with the draftId
    await updateQueueRoundDraftId(queueType, roundId, String(draftId));

    // 4. Return the draftId to the client
    return json({ draftId: String(draftId) }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(msg, 500);
  }
}

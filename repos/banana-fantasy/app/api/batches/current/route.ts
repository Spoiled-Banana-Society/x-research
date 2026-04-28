import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { json, jsonError } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

/**
 * GET /api/batches/current
 *
 * Returns the current batch position so the drafting page can render the
 * BatchProofBanner without each client computing it. Reads from
 * `drafts/draftTracker.FilledLeaguesCount` (the same counter the Go API
 * increments on every league fill).
 *
 *   currentDraftNumber  = filled + 1            (BBB # of the draft about to fill)
 *   currentBatchNumber  = ((filled) / 100) + 1  (the batch this draft falls into)
 *   positionInBatch     = filled % 100          (0..99)
 *   nextBatchNumber     = currentBatchNumber + 1
 *
 * If FilledLeaguesCount = 200, the next BBB is #201, batch 3, position 0.
 */
const BATCH_SIZE = 100;

export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    if (!isFirestoreConfigured()) {
      return json({
        currentDraftNumber: 1,
        currentBatchNumber: 1,
        positionInBatch: 0,
        nextBatchNumber: 2,
        firestoreConfigured: false,
      });
    }

    const db = getAdminFirestore();
    const snap = await db.collection('drafts').doc('draftTracker').get();
    if (!snap.exists) {
      return json({
        currentDraftNumber: 1,
        currentBatchNumber: 1,
        positionInBatch: 0,
        nextBatchNumber: 2,
      });
    }
    const data = snap.data() as
      | { FilledLeaguesCount?: number; JackpotLeagueIds?: number[]; HofLeagueIds?: number[] }
      | undefined;
    const filled = Number.isFinite(data?.FilledLeaguesCount) ? Number(data?.FilledLeaguesCount) : 0;

    const currentDraftNumber = filled + 1;
    const currentBatchNumber = Math.floor(filled / BATCH_SIZE) + 1;
    const positionInBatch = filled % BATCH_SIZE;
    const nextBatchNumber = currentBatchNumber + 1;

    // Forward-look at the upcoming special-draft slots in this batch so
    // testers (and the admin UI) can see "JP rolls at fill #N". The Go API
    // pre-allocates these into JackpotLeagueIds / HofLeagueIds (PascalCase
    // — Go struct field names, no firestore tags so they're persisted as-is)
    // and checks them on every fill.
    const jackpotIds = Array.isArray(data?.JackpotLeagueIds) ? data!.JackpotLeagueIds! : [];
    const hofIds = Array.isArray(data?.HofLeagueIds) ? data!.HofLeagueIds! : [];
    const nextJackpotAt = jackpotIds.find((n) => n > filled) ?? null;
    const nextHofAt = hofIds.find((n) => n > filled) ?? null;

    return json({
      filledLeaguesCount: filled,
      currentDraftNumber,
      currentBatchNumber,
      positionInBatch,
      nextBatchNumber,
      nextJackpotAt,
      nextHofAt,
    });
  } catch (err) {
    logger.error('batches.current.failed', { err });
    return jsonError('Internal Server Error', 500);
  }
}

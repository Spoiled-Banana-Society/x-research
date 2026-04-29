import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { getDraftInfo } from '@/lib/draftApi';
import { logger } from '@/lib/logger';

// GET /api/spectate/active-drafts
//
// Admin-gated. Returns the most recent in-progress drafts so the
// /admin Spectate tab can list them. Strategy:
// 1. Read drafts/draftTracker.FilledLeaguesCount to get the highest draft #.
// 2. Probe the latest 30 draft IDs (both fast + slow) by hitting the Go
//    API getDraftInfo for each in parallel.
// 3. Keep only drafts where 1 <= pickNumber <= 150 (drafting) OR the
//    Firestore doc exists but no info yet (filling).
// 4. Sort by draft # desc and trim to top 50.
//
// 30 lookups per side is acceptable for an admin tool that loads on
// demand. Could be replaced with a Firestore composite query later.

const PROBE_DEPTH = 30;
const SPEEDS = ['fast', 'slow'] as const;

interface ActiveDraft {
  draftId: string;
  displayName: string;
  speed: 'fast' | 'slow';
  level: string | null;
  pickNumber: number;
  currentDrafter: string;
  filling: boolean;
}

export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  try {
    await requireAdmin(req);
    if (!isFirestoreConfigured()) throw new ApiError(503, 'Firestore not configured');

    const db = getAdminFirestore();
    const trackerSnap = await db.collection('drafts').doc('draftTracker').get();
    const filled = Number((trackerSnap.data() as { FilledLeaguesCount?: number } | undefined)?.FilledLeaguesCount ?? 0);
    if (filled <= 0) return json({ drafts: [] }, 200);

    // Year prefix matches what Go API mints (lib/draftApi callsites use
    // bare draftIds, the prefix lives in the Firestore doc IDs). Read
    // any one recent doc ID via collection list to derive the prefix.
    const recent = await db.collection('drafts').orderBy('__name__', 'desc').limit(50).get();
    const sampleId = recent.docs.map(d => d.id).find(id => id.includes('-draft-'));
    const yearPrefix = sampleId ? sampleId.split('-')[0] : new Date().getFullYear().toString();

    const candidates: { id: string; speed: 'fast' | 'slow'; num: number }[] = [];
    for (const speed of SPEEDS) {
      for (let i = 0; i < PROBE_DEPTH; i++) {
        const num = filled - i;
        if (num <= 0) break;
        candidates.push({ id: `${yearPrefix}-${speed}-draft-${num}`, speed, num });
      }
    }

    // Read Firestore docs in parallel to grab Level + filter to existing
    const docSnaps = await Promise.all(
      candidates.map(c => db.collection('drafts').doc(c.id).get().catch(() => null)),
    );
    const present = candidates
      .map((c, i) => {
        const snap = docSnaps[i];
        if (!snap || !snap.exists) return null;
        const data = snap.data() as { Level?: string; DisplayName?: string } | undefined;
        return {
          ...c,
          level: data?.Level ?? null,
          displayName: data?.DisplayName ?? c.id,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Probe the Go API for each present draft to get pickNumber + currentDrafter.
    // getDraftInfo throws 404 for drafts that haven't reached info init yet
    // (filling phase) — treat those as filling=true.
    const infoResults = await Promise.allSettled(present.map(c => getDraftInfo(c.id)));

    const drafts: ActiveDraft[] = present.map((c, i) => {
      const r = infoResults[i];
      if (r.status === 'fulfilled') {
        return {
          draftId: c.id,
          displayName: c.displayName,
          speed: c.speed,
          level: c.level,
          pickNumber: r.value.pickNumber ?? 0,
          currentDrafter: r.value.currentDrafter ?? '',
          filling: false,
        };
      }
      return {
        draftId: c.id,
        displayName: c.displayName,
        speed: c.speed,
        level: c.level,
        pickNumber: 0,
        currentDrafter: '',
        filling: true,
      };
    });

    // Active = currently drafting (1 <= pickNumber <= 150) OR filling.
    const active = drafts
      .filter(d => d.filling || (d.pickNumber > 0 && d.pickNumber <= 150))
      .sort((a, b) => b.draftId.localeCompare(a.draftId));

    return json({ drafts: active }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    logger.error('spectate.active_drafts.failed', { err });
    return jsonError('Internal Server Error', 500);
  }
}

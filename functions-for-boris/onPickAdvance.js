/**
 * onPickAdvance — Firebase RTDB trigger that fires a OneSignal push when
 * a slow-draft's currentDrafter changes to a new wallet, so users with
 * the tab closed still get notified in time to make their pick.
 *
 * Deploy target: sbs-staging-env (later: sbs-prod-env)
 * Expected location: ~/sbs-staging-functions/functions/src/ (or index)
 * Deploy: firebase deploy --only functions:onPickAdvance
 *
 * Paired with the /api/notifications/pick-up route on the Vercel frontend,
 * which does the actual OneSignal REST API call + atomic Firestore dedup
 * so duplicate fires from multiple triggers are safe.
 *
 * Config:
 *   functions.config().pickup.endpoint → Vercel /api/notifications/pick-up URL
 *     (or env PICK_UP_ENDPOINT)
 *   functions.config().pickup.secret   → shared secret; must match the
 *     NOTIFICATIONS_INTERNAL_SECRET env var on the Vercel deploy so the
 *     endpoint accepts this caller as "internal" without a user session.
 *     (or env NOTIFICATIONS_INTERNAL_SECRET)
 *
 * Node 20 / CommonJS. Uses node-fetch@2.
 */

const functions = require('firebase-functions');
const fetch = require('node-fetch');

function getConfig() {
  let cfg = {};
  try { cfg = functions.config().pickup || {}; } catch { /* not configured via CLI */ }
  return {
    endpoint: cfg.endpoint || process.env.PICK_UP_ENDPOINT || 'https://banana-fantasy-sbs.vercel.app/api/notifications/pick-up',
    secret: cfg.secret || process.env.NOTIFICATIONS_INTERNAL_SECRET || '',
  };
}

const SLOW_PICK_THRESHOLD_SECONDS = 3600; // pickLength > 60 min = slow

exports.onPickAdvance = functions
  .region('us-central1')
  .database.ref('drafts/{draftId}/realTimeDraftInfo')
  .onUpdate(async (change, ctx) => {
    const before = change.before.val();
    const after = change.after.val();
    const { draftId } = ctx.params;

    if (!after) return null;
    if (after.isDraftComplete || after.isDraftClosed) return null;

    // Only fire on a REAL currentDrafter transition. Ignore timer-only
    // updates and initial snapshots where `before` is absent.
    if (!before || before.currentDrafter === after.currentDrafter) return null;

    // Slow drafts only — fast drafts have everyone on-page already.
    const pickLength = Number(after.pickLength ?? 0);
    if (!pickLength || pickLength <= SLOW_PICK_THRESHOLD_SECONDS) return null;

    const walletAddress = String(after.currentDrafter || '').toLowerCase();
    if (!walletAddress || walletAddress.startsWith('bot-')) return null;

    const { endpoint, secret } = getConfig();
    if (!secret) {
      console.warn('[onPickAdvance] NOTIFICATIONS_INTERNAL_SECRET not configured — skipping push');
      return null;
    }

    const body = {
      walletAddress,
      draftId,
      pickNumber: after.currentPickNumber,
      pickLengthSeconds: pickLength,
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': secret,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('[onPickAdvance] pick-up endpoint', res.status, text);
      }
    } catch (err) {
      console.error('[onPickAdvance] fetch failed', err);
    }

    return null;
  });

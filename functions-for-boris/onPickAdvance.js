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
 * which does the actual OneSignal REST API call + Firestore-backed dedup
 * so duplicate fires from multiple triggers are safe.
 *
 * Node 20 / CommonJS. Uses node-fetch@2.
 */

const functions = require('firebase-functions');
const fetch = require('node-fetch');

// Vercel endpoint that wraps OneSignal. Swap host per env if needed.
const PICK_UP_ENDPOINT =
  process.env.PICK_UP_ENDPOINT ||
  'https://banana-fantasy-sbs.vercel.app/api/notifications/pick-up';

// Only fire for slow drafts — fast drafts have everyone on-page already.
const SLOW_PICK_THRESHOLD_SECONDS = 3600; // pickLength > 60 min = slow

exports.onPickAdvance = functions
  .region('us-central1')
  .database.ref('drafts/{draftId}/realTimeDraftInfo')
  .onUpdate(async (change, ctx) => {
    const before = change.before.val();
    const after = change.after.val();
    const { draftId } = ctx.params;

    if (!after) return null;

    // Draft is over — nothing to notify.
    if (after.isDraftComplete || after.isDraftClosed) return null;

    // currentDrafter hasn't actually changed — ignore timer-only updates.
    if (before && before.currentDrafter === after.currentDrafter) return null;

    // Only slow drafts need push. Fast draft users are sitting on the page.
    const pickLength = Number(after.pickLength ?? 0);
    if (!pickLength || pickLength <= SLOW_PICK_THRESHOLD_SECONDS) return null;

    const walletAddress = String(after.currentDrafter || '').toLowerCase();
    if (!walletAddress || walletAddress.startsWith('bot-')) return null;

    const body = {
      walletAddress,
      draftId,
      draftName: after.displayName,
      pickNumber: after.currentPickNumber,
      pickLengthSeconds: pickLength,
    };

    try {
      const res = await fetch(PICK_UP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.warn('[onPickAdvance] pick-up endpoint', res.status, await res.text());
      }
    } catch (err) {
      console.error('[onPickAdvance] fetch failed', err);
    }

    return null;
  });

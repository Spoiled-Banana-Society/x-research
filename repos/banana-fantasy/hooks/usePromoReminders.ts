'use client';

import { useEffect, useRef } from 'react';
import type { Promo } from '@/types';
import { pushNotification } from '@/components/NotificationCenter';

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function wasRemindedRecently(key: string): boolean {
  try {
    const ts = localStorage.getItem(key);
    if (!ts) return false;
    return Date.now() - Number(ts) < REMINDER_COOLDOWN_MS;
  } catch { return false; }
}

function markReminded(key: string) {
  try { localStorage.setItem(key, String(Date.now())); } catch {}
}

/**
 * Checks promos on load and pushes reminders for:
 * 1. New promos the user hasn't seen
 * 2. Partially complete promos (progress > 0 but not done)
 * 3. Promos ready to claim
 *
 * Each reminder has a 24h cooldown to prevent spam.
 */
export function usePromoReminders(promos: Promo[]) {
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!promos || promos.length === 0 || checkedRef.current) return;
    checkedRef.current = true;

    for (const promo of promos) {
      // New promo the user hasn't seen
      if (promo.isNew) {
        const key = `sbs-promo-new-seen-${promo.id}`;
        if (!wasRemindedRecently(key)) {
          pushNotification({
            type: 'promo',
            title: 'New Promo Available!',
            message: promo.title,
            link: promo.ctaLink || '/promos',
          });
          markReminded(key);
        }
        continue;
      }

      // Ready to claim
      if (promo.claimable && (promo.claimCount ?? 0) > 0) {
        const key = `sbs-promo-claim-${promo.id}`;
        if (!wasRemindedRecently(key)) {
          pushNotification({
            type: 'promo',
            title: 'Ready to Claim!',
            message: `${promo.title} — your reward is waiting.`,
            link: promo.ctaLink || '/promos',
          });
          markReminded(key);
        }
        continue;
      }

      // Partially complete — nudge to finish
      const current = promo.progressCurrent ?? 0;
      const max = promo.progressMax ?? 0;
      if (current > 0 && max > 0 && current < max && !promo.claimable) {
        const key = `sbs-promo-reminded-${promo.id}`;
        if (!wasRemindedRecently(key)) {
          pushNotification({
            type: 'promo',
            title: 'Almost There!',
            message: `${promo.title} — ${current}/${max} complete.`,
            link: promo.ctaLink || '/promos',
          });
          markReminded(key);
        }
      }
    }
  }, [promos]);
}

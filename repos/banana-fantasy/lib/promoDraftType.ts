export type PromoDraftType = 'jackpot' | 'hof';

type Entitlements = Record<PromoDraftType, number>;

const KEY = 'banana-promo-draft-entitlements';

function readEntitlements(): Entitlements {
  if (typeof window === 'undefined') return { jackpot: 0, hof: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { jackpot: 0, hof: 0 };
    const parsed = JSON.parse(raw) as Partial<Entitlements>;
    return {
      jackpot: Math.max(0, Number(parsed?.jackpot || 0)),
      hof: Math.max(0, Number(parsed?.hof || 0)),
    };
  } catch {
    return { jackpot: 0, hof: 0 };
  }
}

function writeEntitlements(next: Entitlements) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function reservePromoDraftType(type: PromoDraftType, count = 1) {
  const entitlements = readEntitlements();
  const qty = Math.max(1, Number(count || 1));
  entitlements[type] = (entitlements[type] || 0) + qty;
  writeEntitlements(entitlements);
}

export function peekPromoDraftType(): PromoDraftType | null {
  const entitlements = readEntitlements();
  if ((entitlements.jackpot || 0) > 0) return 'jackpot';
  if ((entitlements.hof || 0) > 0) return 'hof';
  return null;
}

export function consumePromoDraftType(type: PromoDraftType) {
  const entitlements = readEntitlements();
  const current = entitlements[type] || 0;
  entitlements[type] = Math.max(0, current - 1);
  writeEntitlements(entitlements);
}

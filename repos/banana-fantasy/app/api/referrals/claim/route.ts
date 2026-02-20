import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/referrals/claim — Claim referral bonus
 * Body: { userId, type: 'referrer' | 'referred', code }
 *
 * Rewards:
 * - Referrer: 1 free draft pass per successful referral
 * - Referred: 50% off first draft pass (uses same promo system)
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(req, RATE_LIMITS.general);
  if (rl) return rl;

  try {
    const body = await req.json();
    const { userId, type, code } = body;

    if (!userId || !type || !code) {
      return NextResponse.json({ error: 'Missing userId, type, or code' }, { status: 400 });
    }

    if (!['referrer', 'referred'].includes(type)) {
      return NextResponse.json({ error: 'Invalid claim type' }, { status: 400 });
    }

    // In production: verify referral in Firestore, credit bonus, mark as claimed
    const bonus = type === 'referrer'
      ? { reward: 'free_draft_pass', amount: 1, description: '1 free draft pass for successful referral' }
      : { reward: 'first_draft_discount', amount: 50, description: '50% off your first draft pass' };

    return NextResponse.json({
      success: true,
      userId,
      type,
      code,
      bonus,
      claimedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

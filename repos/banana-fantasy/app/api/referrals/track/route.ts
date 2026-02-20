import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/referrals/track — Track a referral click or signup
 * Body: { code, event: 'click' | 'signup', referredUserId?, referredUsername? }
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(req, RATE_LIMITS.general);
  if (rl) return rl;

  try {
    const body = await req.json();
    const { code, event, referredUserId, referredUsername } = body;

    if (!code || !event) {
      return NextResponse.json({ error: 'Missing code or event' }, { status: 400 });
    }

    if (!['click', 'signup'].includes(event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // In production: look up referral code in Firestore, update counters
    // For now, return success
    return NextResponse.json({
      success: true,
      code,
      event,
      referredUserId: referredUserId || null,
      referredUsername: referredUsername || null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

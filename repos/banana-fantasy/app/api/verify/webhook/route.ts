export const dynamic = 'force-dynamic';
import crypto from 'node:crypto';
import { json, jsonError } from '@/lib/api/routeUtils';
import { savePersonaVerification } from '@/lib/db-firestore';

const VERIFF_SECRET = process.env.VERIFF_SECRET || '';

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !VERIFF_SECRET) return false;
  const expected = crypto.createHmac('sha256', VERIFF_SECRET).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hmac-signature');

    // Verify webhook signature (skip if secret not set for development)
    if (VERIFF_SECRET && !verifySignature(rawBody, signature)) {
      console.error('[Veriff Webhook] Invalid signature');
      return jsonError('Invalid signature', 401);
    }

    const event = JSON.parse(rawBody);
    const verification = event?.verification || event;
    const status = verification?.status;
    const vendorData = verification?.vendorData; // userId we passed
    const sessionId = verification?.id;
    const person = verification?.person;

    console.log('[Veriff Webhook] Status:', status, 'User:', vendorData, 'Session:', sessionId);

    if (!vendorData) {
      console.warn('[Veriff Webhook] No vendorData (userId) in event');
      return json({ received: true }, 200);
    }

    if (status === 'approved') {
      const now = new Date().toISOString();
      await savePersonaVerification(vendorData, {
        tier1: {
          verified: true,
          inquiryId: sessionId,
          verifiedAt: now,
          geoState: person?.addresses?.[0]?.parsedAddress?.state || '',
        },
      });
      console.log('[Veriff Webhook] Verified user:', vendorData);
    } else if (status === 'declined' || status === 'resubmission_requested' || status === 'expired') {
      console.log('[Veriff Webhook] Verification', status, 'for user:', vendorData);
    }

    return json({ received: true }, 200);
  } catch (err) {
    console.error('[Veriff Webhook] Error:', err);
    return jsonError('Webhook processing error', 500);
  }
}

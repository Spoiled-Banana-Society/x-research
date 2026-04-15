export const dynamic = 'force-dynamic';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { getPrivyUser } from '@/lib/auth';

const VERIFF_API_KEY = process.env.VERIFF_API_KEY || '';
const VERIFF_BASE_URL = 'https://stationapi.veriff.com';

export async function POST(req: Request) {
  try {
    const privyUser = await getPrivyUser(req);
    const body = await parseBody(req);

    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const dateOfBirth = typeof body.dateOfBirth === 'string' ? body.dateOfBirth.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';

    const payload = JSON.stringify({
      verification: {
        callback: `${process.env.NEXT_PUBLIC_APP_URL || 'https://banana-fantasy-sbs.vercel.app'}/api/verify/webhook`,
        person: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          dateOfBirth: dateOfBirth || undefined,
        },
        address: address ? { fullAddress: address } : undefined,
        vendorData: privyUser.userId,
      },
    });

    // Create Veriff session
    const res = await fetch(`${VERIFF_BASE_URL}/v1/sessions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-CLIENT': VERIFF_API_KEY,
      },
      body: payload,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Veriff] Session creation failed:', res.status, errorText);
      return jsonError('Failed to create verification session', 500);
    }

    const data = await res.json();
    const sessionUrl = data?.verification?.url;
    const sessionId = data?.verification?.id;

    if (!sessionUrl) {
      return jsonError('Invalid Veriff response', 500);
    }

    return json({ sessionUrl, sessionId }, 200);
  } catch (err) {
    console.error('[Veriff] Error:', err);
    return jsonError(err instanceof Error ? err.message : 'Failed to create session', 500);
  }
}

export const dynamic = 'force-dynamic';
import { getPrivyUser } from '@/lib/auth';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { privyApiFetch, BRIDGE_PROVIDER } from '@/lib/privy-api';

export async function POST(req: Request) {
  try {
    const { userId } = await getPrivyUser(req);
    const body = await parseBody(req);
    const redirectUri = requireString(body.redirectUri, 'redirectUri');

    const result = await privyApiFetch<{ url: string }>(`/users/${userId}/fiat/tos`, {
      method: 'POST',
      body: JSON.stringify({ provider: BRIDGE_PROVIDER, redirect_uri: redirectUri }),
    });

    return json(result, 200);
  } catch (err) {
    console.error('[Bridge ToS] Error:', err);
    return jsonError(err instanceof Error ? err.message : 'Failed to get ToS URL', 500);
  }
}

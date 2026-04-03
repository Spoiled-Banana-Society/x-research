export const dynamic = 'force-dynamic';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { getPrivyUser } from '@/lib/auth';
import { privyApiFetch, BRIDGE_PROVIDER } from '@/lib/privy-api';

// Check KYC status
export async function GET(req: Request) {
  try {
    const { userId } = await getPrivyUser(req);

    const result = await privyApiFetch<{ status: string; user_id: string }>(
      `/users/${userId}/fiat/kyc?provider=${BRIDGE_PROVIDER}`,
    );

    return json(result, 200);
  } catch (err) {
    console.error('[Bridge KYC GET] Error:', err);
    return jsonError(err instanceof Error ? err.message : 'Failed to check KYC status', 500);
  }
}

// Submit KYC data
export async function POST(req: Request) {
  try {
    const { userId } = await getPrivyUser(req);
    const body = await parseBody(req);

    const result = await privyApiFetch<{ status: string; user_id: string }>(
      `/users/${userId}/fiat/kyc`,
      {
        method: 'POST',
        body: JSON.stringify({
          provider: BRIDGE_PROVIDER,
          data: body.data,
        }),
      },
    );

    return json(result, 200);
  } catch (err) {
    console.error('[Bridge KYC POST] Error:', err);
    return jsonError(err instanceof Error ? err.message : 'Failed to submit KYC', 500);
  }
}

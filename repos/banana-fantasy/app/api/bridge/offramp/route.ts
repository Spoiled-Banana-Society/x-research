export const dynamic = 'force-dynamic';
import { json, jsonError, parseBody, requireString, requireNumber } from '@/lib/api/routeUtils';
import { getPrivyUser } from '@/lib/auth';
import { privyApiFetch, BRIDGE_PROVIDER } from '@/lib/privy-api';

export async function POST(req: Request) {
  try {
    const { userId } = await getPrivyUser(req);
    const body = await parseBody(req);
    const amount = requireNumber(body.amount, 'amount');
    const fromAddress = requireString(body.fromAddress, 'fromAddress');
    const externalAccountId = requireString(body.externalAccountId, 'externalAccountId');

    const result = await privyApiFetch<{ id: string; status: string }>(
      `/users/${userId}/fiat/offramp`,
      {
        method: 'POST',
        body: JSON.stringify({
          provider: BRIDGE_PROVIDER,
          amount: amount.toFixed(2),
          source: {
            currency: 'usdc',
            chain: 'base',
            from_address: fromAddress,
          },
          destination: {
            currency: 'usd',
            payment_rail: 'ach_push',
            external_account_id: externalAccountId,
          },
        }),
      },
    );

    return json(result, 200);
  } catch (err) {
    console.error('[Bridge Offramp] Error:', err);
    return jsonError(err instanceof Error ? err.message : 'Failed to process offramp', 500);
  }
}

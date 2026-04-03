export const dynamic = 'force-dynamic';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { getPrivyUser } from '@/lib/auth';
import { privyApiFetch, BRIDGE_PROVIDER } from '@/lib/privy-api';

// Get registered fiat accounts
export async function GET(req: Request) {
  try {
    const { userId } = await getPrivyUser(req);

    const result = await privyApiFetch<{ accounts: unknown[] }>(
      `/users/${userId}/fiat/accounts?provider=${BRIDGE_PROVIDER}`,
    );

    return json(result, 200);
  } catch (err) {
    console.error('[Bridge Accounts GET] Error:', err);
    return jsonError(err instanceof Error ? err.message : 'Failed to get accounts', 500);
  }
}

// Register a bank account
export async function POST(req: Request) {
  try {
    const { userId } = await getPrivyUser(req);
    const body = await parseBody(req);

    const result = await privyApiFetch<{ id: string }>(
      `/users/${userId}/fiat/accounts`,
      {
        method: 'POST',
        body: JSON.stringify({
          provider: BRIDGE_PROVIDER,
          account_owner_name: body.accountOwnerName,
          currency: 'usd',
          bank_name: body.bankName,
          account: {
            account_number: body.accountNumber,
            routing_number: body.routingNumber,
            checking_or_savings: body.accountType || 'checking',
          },
          address: body.address,
          first_name: body.firstName,
          last_name: body.lastName,
        }),
      },
    );

    return json(result, 200);
  } catch (err) {
    console.error('[Bridge Accounts POST] Error:', err);
    return jsonError(err instanceof Error ? err.message : 'Failed to register account', 500);
  }
}

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || '';
const PRIVY_API_BASE = 'https://api.privy.io/v1';
const BRIDGE_PROVIDER = process.env.NODE_ENV === 'production' ? 'bridge' : 'bridge-sandbox';

/**
 * Extract the Privy user ID (DID) from a JWT token without full verification.
 * Used for Bridge routes where Privy's server-side API handles actual auth.
 */
export function extractPrivyUserId(req: Request): string {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) throw new Error('Missing authorization token');

  // Decode JWT payload (base64url)
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const payload = JSON.parse(
    Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/') + '==', 'base64').toString('utf8')
  );

  const userId = payload.sub || payload.user_id || payload.userId;
  if (!userId) throw new Error('No user ID in token');

  return userId;
}

function getAuthHeader(): string {
  const encoded = Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64');
  return `Basic ${encoded}`;
}

export async function privyApiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${PRIVY_API_BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Authorization': getAuthHeader(),
      'privy-app-id': PRIVY_APP_ID,
      'Content-Type': 'application/json',
      ...(opts?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorBody: string;
    try {
      errorBody = await res.text();
    } catch {
      errorBody = `HTTP ${res.status}`;
    }
    throw new Error(`Privy API error (${res.status}): ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

export { BRIDGE_PROVIDER };

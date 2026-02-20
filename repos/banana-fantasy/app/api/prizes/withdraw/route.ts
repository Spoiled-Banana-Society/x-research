import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = "force-dynamic";
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireNumber, requireString } from '@/lib/api/routeUtils';
import { createWithdrawal } from '@/lib/db';
import type { PrizeWithdrawal, WithdrawalStatus } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_SBS_API_URL || '';

async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as Record<string, unknown>;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  } catch {
    // ignore JSON parsing errors
  }
  try {
    const text = await res.text();
    return text ? text : null;
  } catch {
    return null;
  }
}

function normalizeWithdrawalStatus(value: unknown): WithdrawalStatus {
  if (value === 'pending' || value === 'processing' || value === 'completed' || value === 'failed') return value;
  return 'processing';
}

export async function POST(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.prizes);
  if (rateLimited) return rateLimited;
  try {
    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId');
    const draftId = requireString(body.draftId, 'draftId');
    const amount = requireNumber(body.amount, 'amount');
    const methodRaw = body.method;

    if (!userId.trim()) {
      return jsonError('User id is required', 400);
    }
    if (amount <= 0) {
      return jsonError('Amount must be greater than 0', 400);
    }
    if (methodRaw !== 'usdc' && methodRaw !== 'bank') {
      return jsonError('Invalid withdrawal method', 400);
    }
    const method: PrizeWithdrawal['method'] = methodRaw;

    let backendStatus: WithdrawalStatus | undefined;
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/owner/${userId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, draftId, amount, method }),
      });

      if (!res.ok) {
        const message = await readErrorMessage(res);
        console.error(`Withdraw API error: ${res.status}`, message);
        return jsonError(message || 'Withdraw service error', res.status);
      }

      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        // Backend may return no body; ignore.
      }

      backendStatus = normalizeWithdrawalStatus((payload as Record<string, unknown> | null)?.status);
    }

    const withdrawal = await createWithdrawal(userId, draftId, amount, method, backendStatus ?? 'pending');
    return json({ status: withdrawal.status, withdrawal }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('Withdrawal request failed:', err);
    return jsonError('Failed to process withdrawal', 500);
  }
}

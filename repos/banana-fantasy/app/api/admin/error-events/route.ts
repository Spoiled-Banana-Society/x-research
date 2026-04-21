import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { fetchRecentErrors } from '@/lib/errorEvents';
import { getRequestId } from '@/lib/requestId';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const start = Date.now();
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 100), 1), 500);
    const errors = await fetchRecentErrors(limit);

    logger.info('admin.errors.ok', { requestId, count: errors.length, durationMs: Date.now() - start });
    return json({ errors, requestId });
  } catch (err) {
    logger.error('admin.errors.failed', { requestId, err, durationMs: Date.now() - start });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError('Internal Server Error', 500, { requestId });
  }
}

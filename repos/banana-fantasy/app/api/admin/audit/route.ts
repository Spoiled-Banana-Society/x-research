import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { fetchRecentAdminActions } from '@/lib/adminAudit';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const limitParam = Number.parseInt(url.searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100;
    const actionFilter = (url.searchParams.get('action') ?? '').trim();

    const all = await fetchRecentAdminActions(limit);
    const records = actionFilter ? all.filter((r) => r.action === actionFilter) : all;

    return json({ records, requestId });
  } catch (err) {
    logger.error('admin.audit.list_failed', { requestId, err });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError('Internal Server Error', 500, { requestId });
  }
}

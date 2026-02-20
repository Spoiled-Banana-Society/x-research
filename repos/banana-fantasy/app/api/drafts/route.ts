import { json } from '@/lib/api/routeUtils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drafts
 *
 * Returns available draft rooms. Currently returns empty array
 * as draft rooms are created on-demand by the matchmaker.
 */
export async function GET() {
  // Draft rooms are created dynamically when players join.
  // This endpoint exists to prevent 404s from useDraftRooms hook.
  return json([]);
}

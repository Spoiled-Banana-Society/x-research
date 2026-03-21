import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { getQueueStatus, joinQueue, leaveQueue, voteQueueSpeed } from '@/lib/db';

export async function GET() {
  try {
    const status = await getQueueStatus();
    return json(status, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error(err);
    return jsonError('Internal Server Error', 500);
  }
}

export async function POST(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;
  try {
    const body = await parseBody(req);
    const action = requireString(body.action, 'action');
    const userId = requireString(body.userId, 'userId');
    const queueType = requireString(body.queueType, 'queueType') as 'jackpot' | 'hof';

    if (queueType !== 'jackpot' && queueType !== 'hof') {
      return jsonError('Invalid queue type', 400);
    }

    let result;
    switch (action) {
      case 'join':
        result = await joinQueue(userId, queueType);
        break;
      case 'leave':
        result = await leaveQueue(userId, queueType);
        break;
      case 'vote': {
        const speed = requireString(body.speed, 'speed') as 'fast' | 'slow';
        if (speed !== 'fast' && speed !== 'slow') return jsonError('Invalid speed', 400);
        result = await voteQueueSpeed(userId, queueType, speed);
        break;
      }
      default:
        return jsonError('Invalid action', 400);
    }

    return json({ queue: result }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error(err);
    return jsonError('Internal Server Error', 500);
  }
}

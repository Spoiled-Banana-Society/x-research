import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { getQueueStatus, joinQueue } from '@/lib/db';
import { notifyQueueJoined, notifyQueueFilled } from '@/lib/queueNotifications';

export async function GET() {
  try {
    const status = await getQueueStatus();
    return json(status, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    console.error('[Queue API]', msg);
    return jsonError(msg, 500);
  }
}

export async function POST(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;
  try {
    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId');
    const queueType = requireString(body.queueType, 'queueType') as 'jackpot' | 'hof';
    const speed = requireString(body.speed, 'speed') as 'fast' | 'slow' | 'any';

    if (queueType !== 'jackpot' && queueType !== 'hof') {
      return jsonError('Invalid queue type', 400);
    }
    if (speed !== 'fast' && speed !== 'slow' && speed !== 'any') {
      return jsonError('Invalid speed', 400);
    }

    const result = await joinQueue(userId, queueType, speed);

    // Send notifications (fire-and-forget, don't block response)
    const speeds = speed === 'any' ? ['fast', 'slow'] : [speed] as Array<'fast' | 'slow'>;
    let userDraftCount = 0;
    for (const s of speeds) {
      const q = result[`${queueType}-${s}`];
      if (!q?.rounds) continue;
      userDraftCount = Math.max(userDraftCount,
        q.rounds.filter(r => r.status === 'filling' && r.members.some(m => m.wallet === userId)).length
      );
      // Notify all members of any rounds that just filled
      for (const r of q.rounds) {
        if (r.status === 'scheduled' && r.members.length >= 10 && r.scheduledTime) {
          notifyQueueFilled(
            r.members.map(m => m.wallet),
            queueType, s as 'fast' | 'slow',
            r.scheduledTime,
          ).catch(() => {});
        }
      }
    }
    if (userDraftCount > 0) {
      notifyQueueJoined(userId, queueType, speed, userDraftCount).catch(() => {});
    }

    return json({ queues: result }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    console.error('[Queue API]', msg);
    return jsonError(msg, 500);
  }
}

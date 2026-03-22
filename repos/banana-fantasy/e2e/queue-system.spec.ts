import { test, expect } from '@playwright/test';

const API = 'https://banana-fantasy-sbs.vercel.app';

async function api(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function setEntries(userId: string, jp: number, hof: number) {
  await api('/api/admin/set-entries', { userId, jackpotEntries: jp, hofEntries: hof });
}

async function resetQueues() {
  // Reset all 4 queues by setting them to empty
  for (const t of ['jackpot', 'hof']) {
    for (const s of ['fast', 'slow']) {
      // Use admin endpoint or just accept stale data from previous tests
    }
  }
}

function countUserRounds(queues: Record<string, any>, queueKey: string, userId: string): number {
  const q = queues[queueKey];
  if (!q?.rounds) return 0;
  return q.rounds.filter((r: any) => r.status === 'filling' && r.members.some((m: any) => m.wallet === userId)).length;
}

test.describe('Queue System', () => {
  const USER = `test-queue-${Date.now()}`;

  test('fast: 5 JP entries → 5 fast rounds, 0 slow', async () => {
    await setEntries(USER, 5, 0);
    const res = await api('/api/queues', { userId: USER, queueType: 'jackpot', speed: 'fast' });
    expect(res.error).toBeUndefined();
    const fast = countUserRounds(res.queues || res, 'jackpot-fast', USER);
    const slow = countUserRounds(res.queues || res, 'jackpot-slow', USER);
    console.log(`fast: JP fast=${fast} slow=${slow}`);
    expect(fast).toBe(5);
    expect(slow).toBe(0);
  });

  test('switch to slow: same 5 entries move to slow', async () => {
    const res = await api('/api/queues', { userId: USER, queueType: 'jackpot', speed: 'slow' });
    expect(res.error).toBeUndefined();
    const fast = countUserRounds(res.queues || res, 'jackpot-fast', USER);
    const slow = countUserRounds(res.queues || res, 'jackpot-slow', USER);
    console.log(`switch to slow: JP fast=${fast} slow=${slow}`);
    expect(fast).toBe(0);
    expect(slow).toBe(5);
  });

  test('switch to any: 5 fast AND 5 slow (equal)', async () => {
    const res = await api('/api/queues', { userId: USER, queueType: 'jackpot', speed: 'any' });
    expect(res.error).toBeUndefined();
    const fast = countUserRounds(res.queues || res, 'jackpot-fast', USER);
    const slow = countUserRounds(res.queues || res, 'jackpot-slow', USER);
    console.log(`any: JP fast=${fast} slow=${slow}`);
    expect(fast).toBe(5);
    expect(slow).toBe(5);
  });

  test('switch back to fast: clears slow, 5 fast only', async () => {
    const res = await api('/api/queues', { userId: USER, queueType: 'jackpot', speed: 'fast' });
    expect(res.error).toBeUndefined();
    const fast = countUserRounds(res.queues || res, 'jackpot-fast', USER);
    const slow = countUserRounds(res.queues || res, 'jackpot-slow', USER);
    console.log(`back to fast: JP fast=${fast} slow=${slow}`);
    expect(fast).toBe(5);
    expect(slow).toBe(0);
  });

  test('HOF works identically: 3 entries any → 3 fast + 3 slow', async () => {
    const USER2 = `${USER}-hof`;
    await setEntries(USER2, 0, 3);
    const res = await api('/api/queues', { userId: USER2, queueType: 'hof', speed: 'any' });
    expect(res.error).toBeUndefined();
    const fast = countUserRounds(res.queues || res, 'hof-fast', USER2);
    const slow = countUserRounds(res.queues || res, 'hof-slow', USER2);
    console.log(`HOF any: fast=${fast} slow=${slow}`);
    expect(fast).toBe(3);
    expect(slow).toBe(3);
  });

  test('clicking same speed again doesn\'t duplicate', async () => {
    const res1 = await api('/api/queues', { userId: USER, queueType: 'jackpot', speed: 'fast' });
    const fast1 = countUserRounds(res1.queues || res1, 'jackpot-fast', USER);
    // Click again
    const res2 = await api('/api/queues', { userId: USER, queueType: 'jackpot', speed: 'fast' });
    const fast2 = countUserRounds(res2.queues || res2, 'jackpot-fast', USER);
    console.log(`double click: first=${fast1} second=${fast2}`);
    expect(fast2).toBe(fast1); // Should not increase
  });
});

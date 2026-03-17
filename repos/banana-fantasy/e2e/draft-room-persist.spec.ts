import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const DRAFT_ROOM_URL = `${BASE}/draft-room?id=persist-test-1&name=BBB+%23Test&speed=fast&players=3`;

test.describe('Draft Room Persistence (filling phase)', () => {
  test('airplane mode persists after leaving and re-entering', async ({ page }) => {
    // 1. Go to draft room (filling phase — only 3/10 players)
    await page.goto(DRAFT_ROOM_URL);
    await page.waitForTimeout(2000);

    // 2. Airplane button should be visible and OFF (greyscale)
    const airplaneBtn = page.locator('button[title*="Auto-pick"]');
    await expect(airplaneBtn).toBeVisible();

    // 3. Check localStorage — should NOT have airplane key yet (or '0')
    const beforeClick = await page.evaluate(() => localStorage.getItem('airplane:persist-test-1'));
    console.log('Before click:', beforeClick);

    // 4. Click airplane to enable it
    await airplaneBtn.click();
    await page.waitForTimeout(500);

    // 5. Verify localStorage was written as '1'
    const afterClick = await page.evaluate(() => localStorage.getItem('airplane:persist-test-1'));
    console.log('After click:', afterClick);
    expect(afterClick).toBe('1');

    // 6. Navigate away
    await page.goto(`${BASE}/drafting`);
    await page.waitForTimeout(1000);

    // 7. Navigate back to draft room
    await page.goto(DRAFT_ROOM_URL);
    await page.waitForTimeout(2000);

    // 8. Check localStorage still has '1'
    const afterReEntry = await page.evaluate(() => localStorage.getItem('airplane:persist-test-1'));
    console.log('After re-entry:', afterReEntry);
    expect(afterReEntry).toBe('1');

    // 9. Airplane button should be active (title says "ON")
    const title = await airplaneBtn.getAttribute('title');
    console.log('Button title after re-entry:', title);
    expect(title).toContain('Auto-pick ON');
  });

  test('mute persists after leaving and re-entering', async ({ page }) => {
    // 1. Go to draft room
    await page.goto(DRAFT_ROOM_URL);
    await page.waitForTimeout(2000);

    // 2. Find and click mute button
    const muteBtn = page.locator('button', { hasText: 'MUTE' });
    await expect(muteBtn).toBeVisible();
    await muteBtn.click();
    await page.waitForTimeout(500);

    // 3. Verify localStorage
    const afterMute = await page.evaluate(() => localStorage.getItem('mute:persist-test-1'));
    console.log('After mute:', afterMute);
    expect(afterMute).toBe('1');

    // 4. Navigate away and back
    await page.goto(`${BASE}/drafting`);
    await page.waitForTimeout(1000);
    await page.goto(DRAFT_ROOM_URL);
    await page.waitForTimeout(2000);

    // 5. Should say UNMUTE (meaning mute is still active)
    const unmuteBtn = page.locator('button', { hasText: 'UNMUTE' });
    await expect(unmuteBtn).toBeVisible();
  });

  test('queue persists after leaving and re-entering', async ({ page }) => {
    // 1. Go to draft room
    await page.goto(DRAFT_ROOM_URL);
    await page.waitForTimeout(3000); // Wait for players to load

    // 2. Expand a player row and add to queue
    const playerRow = page.locator('text=SF-RB1').first();
    if (await playerRow.isVisible()) {
      await playerRow.click();
      await page.waitForTimeout(500);

      // Look for queue/banana button
      const queueBtn = page.locator('button', { hasText: /queue|🍌/i }).first();
      if (await queueBtn.isVisible()) {
        await queueBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 3. Check localStorage for queue
    const queueData = await page.evaluate(() => localStorage.getItem('queue:persist-test-1'));
    console.log('Queue data:', queueData?.substring(0, 100));

    // 4. Navigate away and back
    await page.goto(`${BASE}/drafting`);
    await page.waitForTimeout(1000);
    await page.goto(DRAFT_ROOM_URL);
    await page.waitForTimeout(3000);

    // 5. Queue should still have data
    const queueAfter = await page.evaluate(() => localStorage.getItem('queue:persist-test-1'));
    console.log('Queue after re-entry:', queueAfter?.substring(0, 100));
    if (queueData) {
      expect(queueAfter).toBe(queueData);
    }
  });
});

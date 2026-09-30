import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#status')).toContainText('matches');
});

test('real .NET captures, highlighting, replacement, split, errors and sharing', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.locator('#status')).toContainText('2 matches');
  await expect(page.locator('mark')).toHaveText(['apples, pears, oranges', 'coffee, tea']);
  await page.locator('summary').first().click();
  const rows = page.locator('tbody').first().locator('tr');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(1)).toContainText('apples');
  await expect(rows.nth(2)).toContainText('pears');
  await expect(rows.nth(3)).toContainText('oranges');
  await page.getByRole('tab', { name: 'Replace', exact: true }).click();
  await page.locator('#replacement').fill('<${item}>');
  await expect(page.locator('.text-result')).toHaveText('<oranges>\n<tea>');
  await page.locator('#pattern').fill(',\\s*');
  await page.locator('#input').fill('one, two, three');
  await page.getByRole('tab', { name: 'Split', exact: true }).click();
  await expect(page.locator('.text-result')).toHaveText(['one', 'two', 'three']);
  await page.locator('#pattern').fill('[');
  await expect(page.locator('#error')).toContainText('Invalid pattern at position');
  await page.locator('#pattern').fill('(?<word>\\w+)');
  await page.getByRole('tab', { name: 'Match', exact: true }).click();
  await expect(page.locator('mark')).toHaveText(['one', 'two', 'three']);
  await page.getByRole('button', { name: 'Copy share link' }).click();
  await expect(page).toHaveURL(/#regex=/);
  const url = page.url(); await page.goto(url);
  await expect(page.locator('#pattern')).toHaveValue('(?<word>\\w+)');
  await expect(page.locator('mark')).toHaveText(['one', 'two', 'three']);
});

test('Unicode, right-to-left, zero-width, caps and start position', async ({ page }) => {
  await page.locator('#pattern').fill('\\w+');
  await page.locator('#input').fill('café 東京 🦀');
  await expect(page.locator('mark')).toHaveText(['café', '東京']);
  await page.getByLabel('Right to left').check();
  await expect(page.locator('summary').first()).toContainText('東京');
  await page.getByLabel('Right to left').uncheck();
  await page.locator('#start').fill('5');
  await expect(page.locator('mark')).toHaveText(['東京']);
  await page.locator('#start').fill('');
  await page.locator('#pattern').fill('(?=.)');
  await page.locator('#input').fill('abc');
  await expect(page.locator('.zero-match')).toHaveCount(3);
  await page.locator('#limit').fill('2');
  await expect(page.locator('#status')).toContainText('2+ matches');
  await expect(page.locator('.zero-match')).toHaveCount(2);
});

test('timeout leaves the interface responsive and can recover', async ({ page }) => {
  await page.locator('#pattern').fill('^(a+)+$');
  await page.locator('#input').fill('a'.repeat(10000) + '!');
  await expect(page.locator('#error')).toContainText(/timeout|limit/, { timeout: 15000 });
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.locator('#status')).toContainText('2 matches');
  await expect(page.locator('#error')).toBeHidden();
});

test('an unresponsive worker is stopped and the next request gets a fresh worker', async ({ page }) => {
  await page.route('**/worker.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: "self.postMessage({type:'ready'});self.onmessage=()=>{while(true){}};",
  }));
  await page.reload();
  await expect(page.locator('#error')).toContainText('5 second limit', { timeout: 10000 });
  await page.unroute('**/worker.js');
  await page.getByRole('button', { name: 'Test regex' }).click();
  await expect(page.locator('#status')).toContainText('13 matches');
  await expect(page.locator('#error')).toBeHidden();
});

test('options and narrow layouts stay usable in light and dark themes', async ({ page }) => {
  await page.locator('#pattern').fill('^hello$'); await page.locator('#input').fill('HELLO\nhello');
  await page.getByLabel('Ignore case').check(); await page.getByLabel('Multiline').check();
  await expect(page.locator('mark')).toHaveCount(2);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    for (const width of [375, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const selector of ['#run', '#share']) {
        const rect = await page.locator(selector).boundingBox();
        expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.x + rect.width).toBeLessThanOrEqual(width);
      }
    }
  }
});

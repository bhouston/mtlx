import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { PORT } from './globalSetup';
let browser: Browser;
let page: Page;
beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(`http://localhost:${PORT}/editor`);
});
afterAll(() => browser.close());
const state = () => page.locator('[data-preview-state]').getAttribute('data-preview-state');

test('an edit recompiles the material into the running viewer instead of rebuilding it', async () => {
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(2);
  await expect.poll(state, { timeout: 45000 }).toBe('ready');
  await page.evaluate(() => document.querySelector('canvas')!.setAttribute('data-first', ''));
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await page.getByLabel('surface specular_roughness value', { exact: true }).fill('0.75');
  await expect.poll(state).toBe('loading');
  await expect.poll(state, { timeout: 45000 }).toBe('ready');
  // Same canvas, same renderer: only the material was replaced.
  expect(await page.locator('canvas').count()).toBe(1);
  expect(await page.locator('canvas[data-first]').count()).toBe(1);
});

import { resolve } from 'node:path';
import { type Browser, type Page, chromium } from 'playwright';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { PORT } from './globalSetup';

let browser: Browser;
let page: Page;
let pageErrors: string[];

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(() => browser.close());

beforeEach(async () => {
  pageErrors = [];
  page = await browser.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
});
afterEach(() => page.close());

test('home page server-renders and hydrates', async () => {
  const response = await page.goto(`http://localhost:${PORT}/`);
  expect(response?.status()).toBe(200);
  await expect.poll(() => page.locator('h1').textContent()).toBe('mtlx');
  expect(pageErrors).toEqual([]);
});

test('viewer renders a dropped .mtlx and validates it', async () => {
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.setInputFiles('input[type=file]', resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx'));
  // Headless Chromium has no WebGPU; three falls back to WebGL2 and still mounts a canvas.
  await expect.poll(() => page.locator('canvas').count(), { timeout: 30_000 }).toBe(1);
  await expect.poll(() => page.locator('main').innerText()).toContain('Valid');
  expect(pageErrors).toEqual([]);
});

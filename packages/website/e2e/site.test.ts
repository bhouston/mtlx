import { resolve } from 'node:path';
import { type Browser, type Page, chromium } from 'playwright';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { PORT } from './globalSetup';

let browser: Browser;
let page: Page;
let pageErrors: string[];

beforeAll(async () => {
  browser = await chromium.launch({
    channel: process.env.MTLX_WEBGPU ? 'chromium' : undefined,
    args: process.env.MTLX_WEBGPU ? ['--enable-unsafe-webgpu'] : [],
  });
});
afterAll(() => browser.close());

beforeEach(async () => {
  pageErrors = [];
  page = await browser.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
});
afterEach(() => page.close());

test('home page server-renders and hydrates', async () => {
  const response = await page.goto(`http://localhost:${PORT}/`);
  expect(response?.status()).toBe(200);
  await expect.poll(() => page.locator('h1').textContent()).toBe('mtlx');
  expect(pageErrors).toEqual([]);
});

const materialPath = resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx');

async function expectReady() {
  await expect
    .poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 30_000 })
    .toBe('ready');
  expect(await page.locator('canvas').count()).toBe(1);
  expect(await page.locator('main').innerText()).toContain('Document checks passed');
  expect(await page.locator('main').innerText()).not.toContain('3D preview error:');
  expect(pageErrors).toEqual([]);
}

test('viewer renders a dropped .mtlx through the first completed frame and validates it', async () => {
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.setInputFiles('input[type=file]', materialPath);
  // Wait for a completed render, including shader compilation in the WebGL2 fallback.
  await expectReady();
  if (process.env.MTLX_SCREENSHOT) await page.screenshot({ path: process.env.MTLX_SCREENSHOT, fullPage: true });
});

test('a failed replacement clears old details and repeated loads resize the canvas correctly', async () => {
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.setInputFiles('input[type=file]', materialPath);
  await expectReady();
  await page.setInputFiles('input[type=file]', {
    name: 'broken.mtlx',
    mimeType: 'application/xml',
    buffer: Buffer.from('<broken>'),
  });
  await expect.poll(() => page.locator('dl').count()).toBe(0);
  await expect.poll(() => page.locator('canvas').count()).toBe(0);
  expect(await page.locator('main').innerText()).toContain('Load a material to see its details here.');
  for (const width of [900, 1100]) {
    await page.setInputFiles('input[type=file]', materialPath);
    await expectReady();
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page
          .locator('canvas')
          .evaluate((canvas) => Math.abs(canvas.getBoundingClientRect().width - canvas.parentElement!.clientWidth)),
      )
      .toBeLessThanOrEqual(1);
  }
  expect(pageErrors).toEqual([]);
});

test('inspection controls work with a keyboard, reduced motion and narrow screens', async () => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.setInputFiles('input[type=file]', materialPath);
  await expectReady();
  const rotation = page.getByRole('button', { name: 'Resume rotation' });
  expect(await rotation.getAttribute('aria-pressed')).toBe('true');
  await rotation.focus();
  await page.keyboard.press('Enter');
  expect(await page.getByRole('button', { name: 'Pause rotation' }).count()).toBe(1);
  await page.getByRole('combobox', { name: 'Geometry', exact: true }).selectOption('sphere');
  expect(await page.getByRole('combobox', { name: 'IBL environment' }).inputValue()).toBe('bridge');
  expect(await page.getByRole('combobox', { name: 'IBL environment' }).locator('option').allTextContents()).toEqual([
    'studio',
    'bridge',
  ]);
  const canvas = await page.locator('canvas').elementHandle();
  await page.getByRole('combobox', { name: 'IBL environment' }).selectOption('bridge');
  await expect
    .poll(() => page.locator('main').innerText(), { timeout: 30_000 })
    .toContain('Environment ready: bridge.');
  expect(await canvas!.evaluate((element) => element.isConnected)).toBe(true);
  expect(await page.getByRole('combobox', { name: 'Geometry', exact: true }).inputValue()).toBe('sphere');
  await page.getByRole('combobox', { name: 'IBL environment' }).selectOption('studio');
  await expect
    .poll(async () => (await page.locator('main').innerText()).split('Environment ready: studio.').length, {
      timeout: 30_000,
    })
    .toBe(2);
  await page.getByRole('button', { name: 'Reset' }).focus();
  await page.keyboard.press('Enter');
  expect(await page.getByRole('combobox', { name: 'Material', exact: true }).count()).toBe(1);
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.getByRole('button', { name: 'Exit fullscreen' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download diagnostics' }).click();
  expect((await download).suggestedFilename()).toBe('mtlx-diagnostics.json');
  await page.setViewportSize({ width: 375, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole('button', { name: 'Hide details' }).click();
  expect(await page.locator('#material-details').isVisible()).toBe(false);
  expect(pageErrors).toEqual([]);
});

test('sample selection and URL input share one query parameter through navigation', async () => {
  const copper =
    'https://raw.githubusercontent.com/bhouston/material-samples/main/materials/showcase/standard_surface/copper/copper.mtlx';
  await page.route('https://raw.githubusercontent.com/**', (route) =>
    route.fulfill({ path: materialPath, contentType: 'application/xml' }),
  );
  await page.goto(`http://localhost:${PORT}/viewer?materialUrl=${encodeURIComponent(copper)}`);
  await expect.poll(() => page.getByLabel('Material URL', { exact: true }).inputValue()).toBe(copper);
  expect(await page.getByRole('combobox', { name: 'Sample material' }).innerText()).toContain('copper');
  await page.getByRole('combobox', { name: 'Sample material' }).click();
  await page.getByRole('option', { name: 'chrome', exact: true }).click();
  await expect
    .poll(() => page.getByLabel('Material URL', { exact: true }).inputValue())
    .toContain('/chrome/chrome.mtlx');
  expect(new URL(page.url()).searchParams.has('material')).toBe(false);
  await page.goBack();
  await expect.poll(() => page.getByLabel('Material URL', { exact: true }).inputValue()).toBe(copper);
  await page.getByLabel('Material URL', { exact: true }).fill('https://raw.githubusercontent.com/custom/material.mtlx');
  await page.getByRole('button', { name: 'Load URL' }).click();
  await expect
    .poll(() => page.getByRole('combobox', { name: 'Sample material' }).innerText())
    .toBe('Load a sample material…');
  await page.getByLabel('Material URL', { exact: true }).fill(copper);
  await page.getByRole('button', { name: 'Load URL' }).click();
  await expect.poll(() => page.getByRole('combobox', { name: 'Sample material' }).innerText()).toContain('copper');
});

test('locally hosted CLI compound sample validates, switches materials, and survives shared-link reload', async () => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const textures = new Set<string>();
  page.on('response', (response) => {
    if (response.ok() && response.url().includes('/materials/compound/textures/')) textures.add(response.url());
  });
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.getByRole('combobox', { name: 'Sample material' }).click();
  await page.getByRole('option', { name: 'compound', exact: true }).click();
  await expectReady();
  const url = `http://localhost:${PORT}/materials/compound/compound.mtlx`;
  expect(new URL(page.url()).searchParams.get('materialUrl')).toBe(url);
  expect(await page.getByRole('textbox', { name: 'Material URL' }).inputValue()).toBe(url);
  const material = page.getByRole('combobox', { name: 'Material', exact: true });
  expect(await material.locator('option').allTextContents()).toEqual(['Copper', 'Tiled_Wood']);
  await expect.poll(() => textures.size).toBe(2);
  await material.selectOption('Tiled_Wood');
  const wood = await page.locator('canvas').screenshot();
  await material.selectOption('Copper');
  await expect.poll(async () => (await page.locator('canvas').screenshot()).equals(wood)).toBe(false);
  await material.selectOption('Tiled_Wood');
  await expectReady();
  await page.reload();
  await expectReady();
  expect(await page.getByRole('combobox', { name: 'Sample material' }).innerText()).toBe('compound');
  expect(await material.locator('option').count()).toBe(2);
  await page.goto(`http://localhost:${PORT}/viewer?materialUrl=/materials/compound/compound.mtlx`);
  await expectReady();
  expect(await page.getByRole('combobox', { name: 'Sample material' }).innerText()).toBe('compound');
  expect(await page.getByRole('textbox', { name: 'Material URL' }).inputValue()).toBe(url);
});

test('rendering effects default on and toggle without replacing the scene', async () => {
  // Keep software WebGL2 rendering affordable while exercising the full-resolution pipeline.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const shaderErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') shaderErrors.push(message.text());
  });
  await page.goto(`http://localhost:${PORT}/viewer?materialUrl=/materials/compound/compound.mtlx`);
  await expectReady();
  if (process.env.MTLX_WEBGPU) expect(await page.locator('main').innerText()).toContain('backend: WebGPU');
  const canvas = await page.locator('canvas').elementHandle();
  const toneMapping = page.getByRole('combobox', { name: 'Tone mapping' });
  const bloom = page.getByRole('checkbox', { name: 'Bloom', exact: true });
  const ao = page.getByRole('checkbox', { name: 'Ambient occlusion' });
  expect(await toneMapping.inputValue()).toBe('neutral');
  expect(await bloom.isChecked()).toBe(true);
  expect(await ao.isChecked()).toBe(true);
  await bloom.uncheck();
  const occluded = await page.locator('canvas').screenshot();
  await ao.uncheck();
  await expect.poll(async () => (await page.locator('canvas').screenshot()).equals(occluded)).toBe(false);
  const neutral = await page.locator('canvas').screenshot();
  await toneMapping.selectOption('agx');
  await expect.poll(async () => (await page.locator('canvas').screenshot()).equals(neutral)).toBe(false);
  await ao.check();
  const withoutBloom = await page.locator('canvas').screenshot();
  await bloom.check();
  await expect.poll(async () => (await page.locator('canvas').screenshot()).equals(withoutBloom)).toBe(false);
  for (const value of ['aces', 'reinhard', 'cineon', 'linear', 'none', 'neutral']) {
    await toneMapping.selectOption(value);
    await page.locator('canvas').screenshot();
  }
  expect(await canvas!.evaluate((element) => element.isConnected)).toBe(true);
  await page.setViewportSize({ width: 375, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await expectReady();
  expect(shaderErrors).toEqual([]);
});

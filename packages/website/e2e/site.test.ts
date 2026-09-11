import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
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
  await expect
    .poll(() => page.locator('[data-validity-state]').getAttribute('data-validity-state'), { timeout: 30_000 })
    .toBe('passed');
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
  await expect.poll(() => page.locator('[data-check=XML]').getAttribute('data-check-state')).toBe('failed');
  expect(await page.locator('[data-validity-state]').evaluate((element) => (element as HTMLDetailsElement).open)).toBe(
    true,
  );
  await expect.poll(() => page.locator('canvas').count()).toBe(0);
  expect(await page.locator('[data-check=Structure]').getAttribute('data-check-state')).toBe('unchecked');
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
  expect(await page.getByLabel('Rotate', { exact: true }).isVisible()).toBe(false);
  await page.getByText('Viewer settings', { exact: true }).click();
  const rotation = page.getByRole('checkbox', { name: 'Rotate' });
  expect(await rotation.isChecked()).toBe(false);
  await rotation.focus();
  await page.keyboard.press('Space');
  expect(await rotation.isChecked()).toBe(true);
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
  expect(await page.getByRole('combobox', { name: 'Material', exact: true }).count()).toBe(1);
  await page.setViewportSize({ width: 375, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(await page.getByRole('button', { name: 'Hide details' }).count()).toBe(0);
  expect(await page.locator('#material-details').isVisible()).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('sample menu and URL dialog preserve rendering settings through navigation', async () => {
  const copper =
    'https://raw.githubusercontent.com/bhouston/material-samples/main/materials/showcase/standard_surface/copper/copper.mtlx';
  await page.route('https://raw.githubusercontent.com/**', (route) =>
    route.fulfill({ path: materialPath, contentType: 'application/xml' }),
  );
  await page.goto(
    `http://localhost:${PORT}/viewer?materialUrl=${encodeURIComponent(copper)}&bloom=false&geometry=sphere`,
  );
  expect(await page.getByLabel('Material URL', { exact: true }).count()).toBe(0);
  await page.getByRole('button', { name: 'Sample materials' }).click();
  await page.getByRole('menuitem', { name: 'chrome', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('materialUrl')).toContain('/chrome/chrome.mtlx');
  expect(new URL(page.url()).searchParams.get('bloom')).toBe('false');
  await page.goBack();
  await expect.poll(() => new URL(page.url()).searchParams.get('materialUrl')).toBe(copper);
  await page.getByRole('button', { name: 'Load URL', exact: true }).click();
  await expect.poll(() => page.getByLabel('Material URL', { exact: true }).inputValue()).toBe(copper);
  await page.getByLabel('Material URL', { exact: true }).fill('https://raw.githubusercontent.com/custom/material.mtlx');
  await page.getByRole('button', { name: 'Load material', exact: true }).click();
  await expect.poll(() => page.getByRole('dialog').count()).toBe(0);
  expect(new URL(page.url()).searchParams.get('geometry')).toBe('sphere');
  await page.getByRole('button', { name: 'Load URL', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect
    .poll(() =>
      page
        .getByRole('button', { name: 'Load URL', exact: true })
        .evaluate((element) => element === document.activeElement),
    )
    .toBe(true);
});

test('locally hosted CLI compound sample validates, switches materials, and survives shared-link reload', async () => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const textures = new Set<string>();
  page.on('response', (response) => {
    if (response.ok() && response.url().includes('/materials/compound/textures/')) textures.add(response.url());
  });
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.getByRole('button', { name: 'Sample materials' }).click();
  await page.getByRole('menuitem', { name: 'compound', exact: true }).click();
  await expectReady();
  const materialsSection = page
    .locator('#material-details details')
    .filter({ has: page.locator('summary', { hasText: 'Materials (2)' }) });
  expect(await materialsSection.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(true);
  const url = `http://localhost:${PORT}/materials/compound/compound.mtlx`;
  expect(new URL(page.url()).searchParams.get('materialUrl')).toBe(url);
  expect(await page.getByRole('textbox', { name: 'Material URL' }).count()).toBe(0);
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
  expect(await page.getByRole('button', { name: 'Sample materials' }).count()).toBe(1);
  expect(await material.locator('option').count()).toBe(2);
  await page.goto(`http://localhost:${PORT}/viewer?materialUrl=/materials/compound/compound.mtlx`);
  await expectReady();
  expect(await page.getByRole('button', { name: 'Sample materials' }).count()).toBe(1);
  expect(await page.getByRole('textbox', { name: 'Material URL' }).count()).toBe(0);
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
  await page.getByText('Viewer settings', { exact: true }).click();
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

test('CLI ZIP sample renders both materials from bundled textures and restores its sample selection', async () => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const externalTextures: string[] = [];
  await page.route('**/materials/**/*.jpg', (route) => {
    externalTextures.push(route.request().url());
    return route.abort();
  });
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.getByRole('button', { name: 'Sample materials' }).click();
  await page.getByRole('menuitem', { name: 'compound zip', exact: true }).click();
  await expectReady();
  const url = `http://localhost:${PORT}/materials/compound_zip/compound_zip.mtlx.zip`;
  expect(new URL(page.url()).searchParams.get('materialUrl')).toBe(url);
  expect(await page.getByRole('textbox', { name: 'Material URL' }).count()).toBe(0);
  await expect
    .poll(() => page.locator('[data-check=Dependencies]').getAttribute('data-check-state'), { timeout: 30_000 })
    .toBe('passed');
  const material = page.getByRole('combobox', { name: 'Material', exact: true });
  expect(await material.locator('option').allTextContents()).toEqual(['Copper', 'Tiled_Wood']);
  await material.selectOption('Tiled_Wood');
  const wood = await page.locator('canvas').screenshot();
  await material.selectOption('Copper');
  await expect.poll(async () => (await page.locator('canvas').screenshot()).equals(wood)).toBe(false);
  await page.reload();
  await expectReady();
  expect(await page.getByRole('button', { name: 'Sample materials' }).count()).toBe(1);
  expect(externalTextures).toEqual([]);
});

test('material loading overlays a streamed progress bar and clears it on success or failure', async () => {
  const bytes = await readFile(materialPath);
  const midpoint = Math.floor(bytes.length / 2);
  let finishDownload: (() => void) | undefined;
  const server = createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    if (request.url !== '/slow.mtlx') {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'application/xml', 'Content-Length': bytes.length });
    response.write(bytes.subarray(0, midpoint));
    finishDownload = () => {
      if (!response.writableEnded) response.end(bytes.subarray(midpoint));
    };
  });
  await new Promise<void>((listening) => server.listen(0, '127.0.0.1', listening));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`http://localhost:${PORT}/viewer?materialUrl=${encodeURIComponent(`${origin}/slow.mtlx`)}`);
    const progress = page.getByRole('progressbar', { name: 'Loading material' });
    await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(30);
    expect(Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(40);
    expect(
      await page.getByText('Drag & drop a .mtlx or .mtlx.zip file anywhere here, or pick a sample above').count(),
    ).toBe(0);
    expect(await progress.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
    expect(await page.locator('[data-preview-state]').getAttribute('aria-busy')).toBe('true');
    if (process.env.MTLX_PROGRESS_SCREENSHOT)
      await page.screenshot({ path: process.env.MTLX_PROGRESS_SCREENSHOT, fullPage: true });
    finishDownload?.();
    await expectReady();
    await expect.poll(() => progress.count()).toBe(0);
    await page.getByRole('button', { name: 'Load URL', exact: true }).click();
    await page.getByRole('textbox', { name: 'Material URL' }).fill(`${origin}/missing.mtlx`);
    await page.getByRole('button', { name: 'Load material', exact: true }).click();
    await expect.poll(() => page.locator('main').innerText()).toContain('HTTP 404');
    await expect.poll(() => progress.count()).toBe(0);
    expect(await page.locator('[data-preview-state]').getAttribute('aria-busy')).toBe('false');
  } finally {
    finishDownload?.();
    server.closeAllConnections();
    await new Promise<void>((closed) => server.close(() => closed()));
  }
});

test('validity checks collapse successes, expand failures, and remain keyboard accessible', async () => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.setInputFiles('input[type=file]', materialPath);
  await expectReady();
  const sections = page.locator('#material-details > div > details');
  expect(await sections.locator(':scope > summary').allTextContents()).toEqual([
    'File details',
    'Materials (1)',
    'References (0)',
    'Internal Nodes (1)',
    'Validity Checks ✓Passed',
  ]);
  expect(
    await sections.evaluateAll((elements) => elements.map((element) => (element as HTMLDetailsElement).open)),
  ).toEqual([true, false, false, false, false]);
  const checks = page.locator('[data-validity-state]');
  const summary = checks.locator('summary');
  if (process.env.MTLX_VALIDITY_SCREENSHOT)
    await page.screenshot({ path: `${process.env.MTLX_VALIDITY_SCREENSHOT}-passed.png`, fullPage: true });
  expect(await checks.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(false);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => checks.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(true);
  expect(await checks.locator('[data-check="XML"]').innerText()).toContain('XML');
  await page.setInputFiles('input[type=file]', {
    name: 'broken.mtlx',
    mimeType: 'application/xml',
    buffer: Buffer.from('<broken>'),
  });
  await expect.poll(() => checks.getAttribute('data-validity-state')).toBe('failed');
  expect(await checks.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(true);
  expect(await checks.locator('[data-check="XML"]').getAttribute('data-check-state')).toBe('failed');
  if (process.env.MTLX_VALIDITY_SCREENSHOT)
    await page.screenshot({ path: `${process.env.MTLX_VALIDITY_SCREENSHOT}-failed.png`, fullPage: true });
  await summary.click();
  await expect.poll(() => checks.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(false);
  await page.setInputFiles('input[type=file]', materialPath);
  await expectReady();
  expect(await checks.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(false);
});

test('shared embed restores rendering state and controls update without rebuilding the canvas', async () => {
  await page.setViewportSize({ width: 375, height: 900 });
  const params = new URLSearchParams({
    materialUrl: '/materials/compound/compound.mtlx',
    ibl: 'studio',
    bloom: 'false',
    ao: 'false',
    intensity: '0.7',
    toneMapping: 'agx',
    exposure: '-0.5',
    rotate: 'false',
    geometry: 'sphere',
    materialName: 'Copper',
  });
  await page.goto(`http://localhost:${PORT}/embed?${params}`);
  await expect
    .poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 30_000 })
    .toBe('ready');
  expect(await page.getByLabel('Rotate', { exact: true }).isVisible()).toBe(false);
  await page.getByText('Viewer settings', { exact: true }).click();
  expect(await page.getByLabel('IBL environment').inputValue()).toBe('studio');
  expect(await page.getByLabel('Bloom', { exact: true }).isChecked()).toBe(false);
  expect(await page.getByLabel('Ambient occlusion').isChecked()).toBe(false);
  expect(await page.getByLabel('Environment intensity').inputValue()).toBe('0.7');
  expect(await page.getByLabel('Exposure', { exact: true }).inputValue()).toBe('-0.5');
  expect(await page.getByLabel('Tone mapping').inputValue()).toBe('agx');
  expect(await page.getByLabel('Geometry', { exact: true }).inputValue()).toBe('sphere');
  expect(await page.getByLabel('Material', { exact: true }).inputValue()).toBe('Copper');
  const canvas = await page.locator('canvas').elementHandle();
  await page.getByLabel('Bloom', { exact: true }).check();
  await expect.poll(() => new URL(page.url()).searchParams.get('bloom')).toBe('true');
  expect(await canvas!.evaluate((element) => element.isConnected)).toBe(true);
  await page.reload();
  await expect
    .poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 30_000 })
    .toBe('ready');
  expect(await page.getByLabel('Bloom', { exact: true }).isChecked()).toBe(true);
  expect(await page.getByLabel('Geometry', { exact: true }).inputValue()).toBe('sphere');
  expect(pageErrors).toEqual([]);
});

test('Share copies matching viewer, embed, and iframe state', async () => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(
    `http://localhost:${PORT}/viewer?materialUrl=/materials/compound/compound.mtlx&ibl=studio&geometry=plane&bloom=false&exposure=1&materialName=Copper`,
  );
  const copy = async (name: string) => {
    await page.getByRole('button', { name: 'Share', exact: true }).click();
    await page.getByRole('menuitem', { name, exact: true }).click();
    await expect.poll(() => page.getByText('Copied to clipboard.', { exact: true }).count()).toBe(1);
    return page.evaluate(() => navigator.clipboard.readText());
  };
  const viewer = new URL(await copy('Copy viewer link'));
  const embed = new URL(await copy('Copy embed link'));
  expect(viewer.pathname).toBe('/viewer');
  expect(embed.pathname).toBe('/embed');
  expect(embed.search).toBe(viewer.search);
  expect(embed.searchParams.get('ibl')).toBe('studio');
  expect(embed.searchParams.get('geometry')).toBe('plane');
  expect(embed.searchParams.get('bloom')).toBe('false');
  expect(embed.searchParams.get('materialName')).toBe('Copper');
  const code = await copy('Copy embed code');
  expect(code).toContain(`src="${embed.href.replaceAll('&', '&amp;')}"`);
});

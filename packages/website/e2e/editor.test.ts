import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { PORT } from './globalSetup';
let browser: Browser;
let page: Page;
let errors: string[];
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(() => browser.close());
beforeEach(async () => {
  page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${PORT}/editor`);
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(2);
});
afterEach(() => page.close());
async function expandColor(label: string) {
  const swatch = page.getByRole('button', { name: `${label} color picker`, exact: true });
  if ((await swatch.getAttribute('aria-expanded')) === 'false') await swatch.click();
}
async function fillColor(label: string, values: string) {
  await expandColor(label);
  for (const [index, value] of values.split(',').entries())
    await page.getByLabel(`${label} ${['R', 'G', 'B'][index]}`, { exact: true }).fill(value.trim());
}
async function ready() {
  await expect
    .poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 45000 })
    .toBe('ready');
}
async function downloadText() {
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .mtlx.zip' }).click();
  const download = await waiting;
  expect(download.suggestedFilename()).toMatch(/\.mtlx\.zip$/);
  const { importMaterial } = await import('mtlx-editor/model');
  const { serializeMaterialX } = await import('mtlx-core');
  return serializeMaterialX(
    importMaterial(new Uint8Array(await readFile((await download.path())!)), download.suggestedFilename()).document,
  );
}
test('node library opens variant columns and resets later columns when the category changes', async () => {
  const library = page.getByRole('region', { name: 'MaterialX node library' });
  await page
    .getByRole('navigation', { name: 'Node categories' })
    .getByRole('button', { name: 'procedural', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'procedural nodes' })
    .getByRole('button', { name: 'constant', exact: true })
    .click();
  expect(await library.getByRole('navigation').count()).toBe(3);
  const leaf = page.getByRole('navigation', { name: 'constant nodes' }).locator('[data-nodedef="ND_constant_float"]');
  expect(await leaf.getAttribute('draggable')).toBe('true');
  await leaf.click();
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(3);
  await page
    .getByRole('navigation', { name: 'Node categories' })
    .getByRole('button', { name: 'shader', exact: true })
    .click();
  expect(await library.getByRole('navigation').count()).toBe(2);
  expect(await page.getByRole('navigation', { name: 'constant nodes' }).count()).toBe(0);
  await page.getByLabel('Search nodes').fill('ND_constant_float');
  expect(await library.getByRole('navigation').count()).toBe(0);
  expect(await library.locator('[data-nodedef="ND_constant_float"]').isVisible()).toBe(true);
  expect(errors).toEqual([]);
});
test('context menu adds categorized nodes, clones and deletes the clicked node', async () => {
  const pane = page.locator('.react-flow__pane');
  await pane.click({ button: 'right', position: { x: 30, y: 30 } });
  expect(await page.getByRole('menuitem', { name: 'Clone', exact: true }).count()).toBe(0);
  await page.getByRole('menuitem', { name: 'Add node', exact: true }).hover();
  await page.getByRole('menuitem', { name: 'procedural', exact: true }).hover();
  await page.getByRole('menuitem', { name: 'constant', exact: true }).hover();
  await page.getByRole('menuitem', { name: 'constant (float)', exact: true }).click();
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(3);
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await page.locator('.react-flow__node[data-id="constant"]').click({ button: 'right' });
  expect(await page.getByRole('menuitem', { name: 'Add node', exact: true }).count()).toBe(0);
  await page.getByRole('menuitem', { name: 'Clone', exact: true }).click();
  await expect.poll(() => page.locator('.react-flow__node[data-id="constant_copy"]').count()).toBe(1);
  await page.locator('.react-flow__node[data-id="constant_copy"]').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(3);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(4);
  await pane.click({ button: 'right', position: { x: 30, y: 30 } });
  expect(await page.getByRole('menuitem', { name: 'Add node', exact: true }).isVisible()).toBe(true);
  expect(await page.getByRole('menuitem', { name: 'Clone', exact: true }).count()).toBe(0);
  await page.keyboard.press('Escape');
  expect(await page.getByRole('menu').count()).toBe(0);
  expect(errors).toEqual([]);
});
test('search, insert, connect, edit, undo and ZIP download', async () => {
  await ready();
  await page.locator('.react-flow__node[data-id="surface"]').focus();
  await page.keyboard.press('Enter');
  expect(
    await page.getByRole('button', { name: 'surface base_color value color picker', exact: true }).isVisible(),
  ).toBe(true);
  await page.keyboard.press('ArrowRight');
  expect(await downloadText()).toContain('xpos="5"');
  await page.getByLabel('Search nodes').fill('ND_constant_color3');
  expect(await page.getByRole('navigation', { name: 'Node categories' }).count()).toBe(0);
  await page.locator('[data-nodedef="ND_constant_color3"]').click();
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(3);
  await page.locator('.react-flow__node[data-id="constant"]').click();
  await fillColor('constant value value', '0.1, 0.8, 0.2');
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await page
    .locator('.react-flow__node[data-id="constant"] .react-flow__handle.source[data-handleid="out"]')
    .dragTo(
      page.locator('.react-flow__node[data-id="surface"] .react-flow__handle.target[data-handleid="base_color"]'),
    );
  await expect.poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state')).toBe('loading');
  await ready();
  expect(await page.locator('canvas').count()).toBe(1);
  expect(await downloadText()).toContain('nodename="constant"');
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect
    .poll(() => page.getByRole('button', { name: 'surface base_color value color picker', exact: true }).isVisible())
    .toBe(true);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  expect(await page.getByLabel('base_color connected to', { exact: true }).textContent()).toBe('constant.out');
  expect(await page.locator('[data-nodedef="ND_constant_color3"]').isDisabled()).toBe(false);
  expect(await page.getByRole('button', { name: 'Disconnect base_color', exact: true }).isEnabled()).toBe(true);
  expect(await page.getByRole('button', { name: 'Delete node', exact: true }).count()).toBe(1);
  expect(errors).toEqual([]);
});
test('node drag and drop, delete and failed file import preserve the current document', async () => {
  await page.getByLabel('Search nodes').fill('ND_constant_float');
  // Native drag payload, as supplied by the reusable node library.
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  await page.locator('[data-nodedef="ND_constant_float"]').dispatchEvent('dragstart', { dataTransfer: transfer });
  await page.locator('.mtlx-canvas').dispatchEvent('drop', { dataTransfer: transfer, clientX: 350, clientY: 650 });
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(3);
  await page.locator('.react-flow__node[data-id="constant"]').click();
  await page.getByRole('button', { name: 'Delete node', exact: true }).click();
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(2);
  await page
    .getByLabel('Open material', { exact: true })
    .setInputFiles({ name: 'broken.mtlx', mimeType: 'application/xml', buffer: Buffer.from('<broken>') });
  await expect
    .poll(() => page.getByRole('alert').allTextContents())
    .toContainEqual(expect.stringContaining('Invalid MaterialX XML'));
  expect(await page.locator('.react-flow__node').count()).toBe(2);
  expect(errors).toEqual([]);
});
test('imports a ZIP, edits a nested graph, and downloads resources intact', async () => {
  const path = resolve(import.meta.dirname, '../../../assets/wood_grain.mtlx.zip');
  const transfer = await page.evaluateHandle(
    (bytes) => {
      const data = new DataTransfer();
      data.items.add(new File([new Uint8Array(bytes)], 'wood_grain.mtlx.zip', { type: 'application/zip' }));
      return data;
    },
    [...(await readFile(path))],
  );
  await page.locator('main').dispatchEvent('drop', { dataTransfer: transfer });
  await expect.poll(() => page.getByRole('button', { name: /^Expand / }).count()).toBeGreaterThan(0);
  await page
    .getByRole('button', { name: /^Expand / })
    .first()
    .click();
  const scope = await page
    .getByRole('navigation', { name: 'Graph breadcrumb' })
    .locator('[aria-current="page"]')
    .textContent();
  await expect.poll(() => page.locator('.react-flow__node').count()).toBeGreaterThan(0);
  await page.getByLabel('Search nodes').fill('ND_constant_float');
  await page.locator('[data-nodedef="ND_constant_float"]').click();
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .mtlx.zip' }).click();
  const download = await waiting;
  expect(download.suggestedFilename()).toMatch(/\.mtlx\.zip$/);
  const { importMaterial } = await import('mtlx-editor/model');
  const original = importMaterial(new Uint8Array(await readFile(path)), 'wood.mtlx.zip');
  const edited = importMaterial(new Uint8Array(await readFile((await download.path())!)), 'wood.mtlx.zip');
  expect(edited.resources.map((r) => [r.archivePath, r.data])).toEqual(
    original.resources.map((r) => [r.archivePath, r.data]),
  );
  expect(edited.document.nodeGraphs.find((g) => g.name === scope)?.nodes.some((n) => n.name === 'constant')).toBe(true);
  await page
    .getByLabel('Open material', { exact: true })
    .setInputFiles(resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx'));
  await ready();
  expect(errors).toEqual([]);
});

test('rapid edits cancel superseded previews and the latest material renders', async () => {
  await ready();
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await fillColor('surface base_color value', '1, 0, 0');
  await expect.poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state')).toBe('loading');
  await fillColor('surface base_color value', '0, 0, 1');
  await page.getByLabel('surface specular_roughness value', { exact: true }).fill('0.75');
  await ready();
  await expect.poll(() => page.locator('canvas').count()).toBe(1);
  const xml = await downloadText();
  expect(xml).toContain('value="0, 0, 1"');
  expect(xml).toContain('value="0.75"');
  expect(errors).toEqual([]);
  if (process.env.MTLX_EDITOR_SCREENSHOT)
    await page.screenshot({ path: process.env.MTLX_EDITOR_SCREENSHOT, fullPage: true });
});

async function copyEditorLink() {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Copy editor link', exact: true }).click();
  await expect.poll(() => page.getByText('Copied editor link to clipboard.', { exact: true }).count()).toBe(1);
  return page.evaluate(() => navigator.clipboard.readText());
}

test('query URLs, URL dialog, sample selection and reference share links use the viewer conventions', async () => {
  let reads = 0;
  const materialPath = resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx');
  await page.route('https://raw.githubusercontent.com/**', (route) => {
    reads++;
    return route.fulfill({ path: materialPath, contentType: 'application/xml' });
  });
  await page.goto(
    `http://localhost:${PORT}/editor?material=standard_surface/copper&geometry=sphere&bloom=false&mode=view`,
  );
  await expect.poll(() => page.locator('main').innerText()).toContain('copper.mtlx');
  await ready();
  expect(await page.getByLabel('Editor mode').count()).toBe(0);
  await page.getByLabel('Search nodes').fill('ND_constant_float');
  expect(await page.locator('[data-nodedef="ND_constant_float"]').isEnabled()).toBe(true);
  const shared = new URL(await copyEditorLink());
  expect(shared.pathname).toBe('/editor');
  expect(shared.hash).toBe('');
  expect(shared.searchParams.get('materialUrl')).toContain('/standard_surface/copper/copper.mtlx');
  expect(shared.searchParams.get('geometry')).toBe('sphere');
  expect(shared.searchParams.get('bloom')).toBe('false');
  expect(shared.searchParams.has('mode')).toBe(false);
  await page.goto(shared.href);
  await expect.poll(() => page.locator('main').innerText()).toContain('copper.mtlx');
  await ready();
  const loaded = reads;
  await page.getByText('Viewer settings', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Geometry', exact: true }).selectOption('plane');
  expect(reads).toBe(loaded);
  await page.getByRole('button', { name: 'Sample materials' }).click();
  await page.getByRole('menuitem', { name: 'chrome', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('materialUrl')).toContain('/chrome/chrome.mtlx');
  await expect.poll(() => page.locator('main').innerText()).toContain('chrome.mtlx');
  expect(new URL(page.url()).searchParams.get('geometry')).toBe('plane');
  await page.getByRole('button', { name: 'Load URL', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Material URL' })
    .fill(`http://localhost:${PORT}/materials/compound_zip/compound_zip.mtlx.zip`);
  await page.getByRole('button', { name: 'Load material', exact: true }).click();
  await expect.poll(() => page.getByRole('button', { name: /^Expand / }).count()).toBeGreaterThan(0);
  await page.getByLabel('Open material', { exact: true }).setInputFiles(materialPath);
  await expect.poll(() => new URL(page.url()).searchParams.has('materialUrl')).toBe(false);
  await expect.poll(() => page.locator('main').innerText()).toContain('copper.mtlx');
  expect(errors).toEqual([]);
});

test('share captures edits and layout, and changing settings preserves a restored snapshot', async () => {
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await fillColor('surface base_color value', '0.2, 0.6, 0.1');
  const shared = new URL(await copyEditorLink());
  expect(shared.hash).toMatch(/^#material=/);
  expect(shared.searchParams.has('materialUrl')).toBe(false);
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' }),
  );
  await page.goto(shared.href);
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(2);
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await expandColor('surface base_color value');
  await expect
    .poll(async () =>
      (
        await Promise.all(
          ['R', 'G', 'B'].map((channel) =>
            page.getByLabel(`surface base_color value ${channel}`, { exact: true }).inputValue(),
          ),
        )
      ).join(', '),
    )
    .toBe('0.2, 0.6, 0.1');
  expect(new URL(page.url()).hash).toBe(shared.hash);
  expect(await downloadText()).toContain('value="0.2, 0.6, 0.1"');
  await ready();
  await page.getByText('Viewer settings', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Geometry', exact: true }).selectOption('sphere');
  expect(new URL(page.url()).hash).toBe(shared.hash);
  expect(await downloadText()).toContain('value="0.2, 0.6, 0.1"');
  const analytics = await page.evaluate(() => JSON.stringify((window as Window & { dataLayer?: unknown[] }).dataLayer));
  expect(analytics).toContain('material=[redacted]');
  expect(analytics).not.toContain(shared.hash.slice(1));
  expect(errors).toEqual([]);
});

test('URL texture dependencies are included in ZIP downloads and failed replacement preserves the document', async () => {
  const materialPath = resolve(import.meta.dirname, '../../../assets/wood_grain/wood_grain.mtlx');
  const base = 'https://materials.test/wood/';
  await page.route(base + '**', async (route) => {
    const name = new URL(route.request().url()).pathname.replace('/wood/', '');
    const path = resolve(import.meta.dirname, '../../../assets/wood_grain', name);
    await route.fulfill({ path });
  });
  await page.goto(`http://localhost:${PORT}/editor?materialUrl=${encodeURIComponent(base + 'wood_grain.mtlx')}`);
  await expect.poll(() => page.getByRole('button', { name: /^Expand / }).count()).toBeGreaterThan(0);
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .mtlx.zip' }).click();
  const download = await wait;
  const { importMaterial } = await import('mtlx-editor/model');
  const pkg = importMaterial(new Uint8Array(await readFile((await download.path())!)), download.suggestedFilename());
  expect(pkg.resources).toHaveLength(2);
  for (const resource of pkg.resources)
    expect(resource.data).toEqual(new Uint8Array(await readFile(resolve(materialPath, '..', resource.archivePath))));
  const nodeCount = await page.locator('.react-flow__node').count();
  await page.route('https://materials.test/missing.mtlx', (route) => route.fulfill({ status: 404, body: 'missing' }));
  await page.getByRole('button', { name: 'Load URL', exact: true }).click();
  await page.getByRole('textbox', { name: 'Material URL' }).fill('https://materials.test/missing.mtlx');
  await page.getByRole('button', { name: 'Load material', exact: true }).click();
  await expect
    .poll(() => page.getByRole('alert').allTextContents())
    .toContainEqual(expect.stringContaining('HTTP 404'));
  expect(await page.locator('.react-flow__node').count()).toBe(nodeCount);
  expect(errors).toEqual([]);
});

test('compound nodes expand with breadcrumbs, scoped edits, and editable navigation', async () => {
  await page.getByLabel('Open material', { exact: true }).setInputFiles({
    name: 'compound.mtlx',
    mimeType: 'application/xml',
    buffer: Buffer.from(`<materialx version="1.39">
      <nodegraph name="outer"><nodegraph name="inner">
        <constant name="value" type="float"><input name="value" type="float" value="1"/></constant>
        <output name="out" type="float" nodename="value"/>
      </nodegraph><output name="out" type="float" nodegraph="inner" output="out"/></nodegraph>
    </materialx>`),
  });
  expect(await page.getByLabel('Graph scope').count()).toBe(0);
  const breadcrumb = page.getByRole('navigation', { name: 'Graph breadcrumb' });
  await page.getByRole('button', { name: 'Expand outer', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('scope') ?? '').toBe('outer');
  expect(await breadcrumb.locator('[aria-current="page"]').textContent()).toBe('outer');
  await page.getByRole('button', { name: 'Expand inner', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('scope') ?? '').toBe('outer/inner');
  await page.locator('.react-flow__node[data-id="value"]').click();
  await page.getByLabel('value value value', { exact: true }).fill('2');
  expect(await downloadText()).toContain('value="2"');
  await breadcrumb.getByRole('button', { name: 'outer', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('scope') ?? '').toBe('outer');
  await breadcrumb.getByRole('button', { name: 'compound.mtlx', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('scope') ?? '').toBe('');
  await page.getByRole('button', { name: 'Expand outer', exact: true }).click();
  await page.getByRole('button', { name: 'Expand inner', exact: true }).click();
  await page.locator('.react-flow__node[data-id="value"]').click();
  expect(await page.getByLabel('value value value', { exact: true }).isDisabled()).toBe(false);
  expect(await page.getByRole('button', { name: /^Expand / }).count()).toBe(0);
  await breadcrumb.getByRole('button', { name: 'compound.mtlx', exact: true }).click();
  await page.getByRole('button', { name: 'Expand outer', exact: true }).click();
  await page.getByRole('button', { name: 'Expand inner', exact: true }).click();
  await expect.poll(() => breadcrumb.locator('[aria-current="page"]').textContent()).toBe('inner');
  await breadcrumb.getByRole('button', { name: 'outer', exact: true }).click();
  expect(await breadcrumb.locator('[aria-current="page"]').textContent()).toBe('outer');
  expect(errors).toEqual([]);
});

test('Onyx compound opens above the canvas with a parent breadcrumb', async () => {
  await page
    .getByLabel('Open material', { exact: true })
    .setInputFiles(resolve(import.meta.dirname, '../../editor/src/fixtures/onyx_hextiled.mtlx'));
  await page.getByRole('button', { name: 'Expand NG_OnyxHextiled', exact: true }).click();
  expect(await page.getByLabel('Graph scope').count()).toBe(0);
  const breadcrumb = page.getByRole('navigation', { name: 'Graph breadcrumb' });
  await expect.poll(() => breadcrumb.locator('[aria-current="page"]').textContent()).toBe('NG_OnyxHextiled');
  await expect.poll(() => page.locator('.react-flow__node[data-id="image_color"]').count()).toBe(1);
  const bounds = await breadcrumb.boundingBox();
  const canvas = await page.locator('.mtlx-canvas').boundingBox();
  expect(bounds!.x).toBe(canvas!.x);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(canvas!.y + 1);
  expect(canvas!.height).toBeGreaterThan(300);
  if (process.env.MTLX_COMPOUND_SCREENSHOT)
    await page.locator('.mtlx-graph').screenshot({ path: process.env.MTLX_COMPOUND_SCREENSHOT });
  await breadcrumb.getByRole('button', { name: 'onyx_hextiled.mtlx', exact: true }).click();
  await expect.poll(() => page.getByRole('button', { name: 'Expand NG_OnyxHextiled', exact: true }).count()).toBe(1);
  expect(errors).toEqual([]);
});

test('live validation outlines errors while preserving wire colors and offers selectable error text', async () => {
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await expandColor('surface base_color value');
  const value = page.getByLabel('surface base_color value R', { exact: true });
  await value.fill('invalid');
  expect(await value.getAttribute('aria-invalid')).toBe('true');
  const log = page.getByRole('region', { name: 'Graph errors' });
  expect(await log.count()).toBe(0);
  await fillColor('surface base_color value', '0.2, 0.3, 0.4');
  expect(await value.getAttribute('aria-invalid')).toBe('false');
  await page.getByLabel('Open material', { exact: true }).setInputFiles({
    name: 'invalid-connection.mtlx',
    mimeType: 'application/xml',
    buffer: Buffer.from(
      '<materialx version="1.39"><constant name="c" type="color3"/><add name="a" type="float"><input name="in1" type="float" nodename="c"/></add></materialx>',
    ),
  });
  await expect.poll(() => page.locator('.mtlx-edge-error').count()).toBe(1);
  expect(await page.locator('.mtlx-node-error').count()).toBe(2);
  const edge = page.locator('.mtlx-edge-error');
  const typeStroke = await edge
    .locator('.react-flow__edge-path')
    .evaluate((element) => getComputedStyle(element).stroke);
  expect(typeStroke).not.toBe('rgb(220, 38, 38)');
  expect(await edge.locator('.mtlx-error-outline').getAttribute('stroke-width')).toBe('8');
  const bounds = await log.boundingBox();
  const canvas = await page.locator('.mtlx-canvas').boundingBox();
  expect(bounds!.y).toBeGreaterThan(canvas!.y);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(canvas!.y + canvas!.height);
  await page.locator('.react-flow__node[data-id="a"]').click();
  await page.getByRole('button', { name: 'Disconnect in1', exact: true }).click();
  await expect.poll(() => log.count()).toBe(0);
  expect(await page.locator('.mtlx-edge-error').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('color picker, compact reset and connected input controls', async () => {
  await page.locator('.react-flow__node[data-id="surface"]').click();
  const red = page.getByLabel('surface base_color value R', { exact: true });
  const swatch = page.getByRole('button', { name: 'surface base_color value color picker', exact: true });
  expect(await red.count()).toBe(0);
  expect(await page.getByRole('combobox', { name: /connection/ }).count()).toBe(0);
  const field = page.locator('.mtlx-field').filter({ has: swatch });
  expect(await field.locator('.mtlx-parameter-label small').count()).toBe(0);
  await swatch.click();
  const saturation = field.getByRole('slider', { name: 'Color', exact: true });
  await saturation.focus();
  await page.keyboard.press('ArrowRight');
  expect(await field.locator('.react-colorful').isVisible()).toBe(true);
  await red.fill('2');
  expect(await red.inputValue()).toBe('2');
  const reset = page.getByRole('button', { name: 'Reset base_color', exact: true });
  expect(await reset.textContent()).toBe('');
  await reset.click();
  expect(await red.inputValue()).not.toBe('2');
  const hex = page.getByLabel('surface base_color value hex', { exact: true });
  await hex.fill('#00ff80');
  await hex.press('Enter');
  expect(await red.inputValue()).toBe('0');
  expect(await page.getByLabel('surface base_color value G', { exact: true }).inputValue()).toBe('1');
  expect(await hex.inputValue()).toBe('#00ff80');
  await swatch.click();
  expect(await red.count()).toBe(0);
  await swatch.click();
  expect(await hex.inputValue()).toBe('#00ff80');
  expect(errors).toEqual([]);
});

test('error samples load from the sample picker and display their intended graph errors', async () => {
  for (const [name, message, wires] of [
    ['error_invalid_values', 'Invalid color3', 0],
    ['error_connection_type', 'expected "float"', 1],
    ['error_missing_source', 'Cannot resolve connection source', 0],
    ['error_cycle', 'forms a cycle', 2],
    ['error_missing_output', 'Cannot resolve output', 1],
  ] as const) {
    await page.getByRole('button', { name: 'Sample materials' }).click();
    await page.getByRole('menuitem', { name: name.replaceAll('_', ' '), exact: true }).click();
    await expect.poll(() => page.getByRole('region', { name: 'Graph errors' }).textContent()).toContain(message);
    await expect.poll(() => page.locator('.mtlx-edge-error').count()).toBe(wires);
    expect(new URL(page.url()).searchParams.get('materialUrl')).toContain(`/materials/${name}/${name}.mtlx`);
  }
});

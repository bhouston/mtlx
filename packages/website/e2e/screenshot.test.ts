import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { expect, test } from 'vitest';
import type { MaterialViewerElement } from 'mtlx-viewer/element';
import { PORT } from './globalSetup';

// Gray catches gamma errors, red/blue distinguish top/bottom, and the uncovered corners test alpha.
const pattern = `<?xml version="1.0"?><materialx version="1.39">
<texcoord name="uv" type="vector2"/>
<extract name="v" type="float"><input name="in" type="vector2" nodename="uv"/><input name="index" type="integer" value="1"/></extract>
<ifgreater name="bottom" type="color3"><input name="value1" type="float" nodename="v"/><input name="value2" type="float" value="0.35"/><input name="in1" type="color3" value="0.18,0.18,0.18"/><input name="in2" type="color3" value="0,0,1"/></ifgreater>
<ifgreater name="pattern" type="color3"><input name="value1" type="float" nodename="v"/><input name="value2" type="float" value="0.65"/><input name="in1" type="color3" value="1,0,0"/><input name="in2" type="color3" nodename="bottom"/></ifgreater>
<standard_surface name="surface" type="surfaceshader"><input name="base" type="float" value="0"/><input name="emission" type="float" value="1"/><input name="emission_color" type="color3" nodename="pattern"/></standard_surface>
<surfacematerial name="Pattern" type="material"><input name="surfaceshader" type="surfaceshader" nodename="surface"/></surfacematerial>
</materialx>`;

const launch = () =>
  chromium.launch(process.env.MTLX_HARDWARE_CHROME ? { channel: 'chrome', args: ['--use-angle=metal'] } : {});

test.each([false, true])('exports completed, correctly oriented pixels and backdrops (WebGL2=%s)', async (webgl) => {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    if (webgl) await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined }));
    await page.route('**/__screenshot-test__/index.html', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<style>body{margin:0}material-viewer{display:block;width:512px;height:512px}</style><material-viewer geometry="plane" rotate="false" bloom="true" ao="true"></material-viewer><script type="module" src="viewer.js"></script>',
      }),
    );
    await page.route('**/__screenshot-test__/viewer.js', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        path: resolve(import.meta.dirname, '../../viewer/dist/material-viewer.js'),
      }),
    );
    await page.route('**/__screenshot-test__/pattern.mtlx', (route) => route.fulfill({ body: pattern }));
    await page.route('https://mtlx-static.ben3d.ca/viewer/**', (route) =>
      route.fulfill({
        path: resolve(
          import.meta.dirname,
          '../../static-assets/public/viewer/',
          route.request().url().split('/').at(-1)!,
        ),
      }),
    );
    await page.goto(`http://localhost:${PORT}/__screenshot-test__/index.html`);
    await page.waitForFunction(() => customElements.get('material-viewer'));
    const hardware = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const extension = gl?.getExtension('WEBGL_debug_renderer_info');
      return extension ? String(gl!.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '';
    });
    expect(hardware).toBeTruthy();
    expect(hardware).not.toMatch(/swiftshader|llvmpipe|lavapipe|software/i);
    await page.locator('material-viewer').evaluate((element) => element.setAttribute('src', 'pattern.mtlx'));
    await expect
      .poll(() => page.locator('material-viewer').getAttribute('aria-busy'), { timeout: 30_000 })
      .toBe('false');
    const screen = [...(await page.locator('canvas').screenshot())];
    const result = await page.evaluate(async (screenBytes) => {
      const element = document.querySelector<MaterialViewerElement>('material-viewer')!;
      const original = element.shadowRoot!.querySelector('canvas')!;
      const before = [original.width, original.height, original.style.backgroundColor];
      const inspect = async (blob: Blob) => {
        const image = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        image.close();
        const sample = (x: number, y: number) => [...context.getImageData(x, y, 1, 1).data];
        return {
          width: canvas.width,
          height: canvas.height,
          top: sample(canvas.width / 2, Math.floor(canvas.height * 0.35)),
          gray: sample(canvas.width / 2, canvas.height / 2),
          bottom: sample(canvas.width / 2, Math.floor(canvas.height * 0.65)),
          corner: sample(0, 0),
        };
      };
      const reference = await inspect(new Blob([new Uint8Array(screenBytes)], { type: 'image/png' }));
      // First capture changes both aspect/size and backdrop: no cached on-screen pass can satisfy it.
      const environment = await inspect(await element.toBlob({ width: 384, height: 256, background: 'environment' }));
      const [transparentBlob, whiteBlob] = await Promise.all([
        element.toBlob({ width: 384, height: 256, background: 'none' }),
        element.toBlob({ width: 384, height: 256, background: 'white' }),
      ]);
      const transparent = await inspect(transparentBlob);
      const white = await inspect(whiteBlob);
      const webp = await element.toBlob({ width: 128, mimeType: 'image/webp', quality: 0.8 });
      const jpeg = await inspect(await element.toBlob({ width: 128, mimeType: 'image/jpeg', background: 'none' }));
      return {
        before,
        after: [original.width, original.height, original.style.backgroundColor],
        reference,
        environment,
        transparent,
        white,
        webpType: webp.type,
        jpeg,
      };
    }, screen);
    expect(result.before).toEqual(result.after);
    expect(result.environment.width).toBe(384);
    expect(result.environment.height).toBe(256);
    expect(result.environment.corner[3]).toBe(255);
    expect(result.transparent.corner).toEqual([0, 0, 0, 0]);
    expect(result.white.corner).toEqual([255, 255, 255, 255]);
    expect(result.jpeg.corner).toEqual([255, 255, 255, 255]);
    expect(result.webpType).toBe('image/webp');
    for (const image of [result.environment, result.transparent, result.white]) {
      for (const key of ['top', 'gray', 'bottom'] as const) {
        image[key].forEach((value, channel) =>
          expect(Math.abs(value - result.reference[key][channel]!)).toBeLessThanOrEqual(3),
        );
      }
    }
    expect(result.reference.gray[0]).toBeGreaterThan(90);
    expect(result.reference.gray[0]).toBeLessThan(130);
    expect(result.white.top[0]).toBeGreaterThan(result.white.top[2]! + 100);
    expect(result.white.bottom[2]).toBeGreaterThan(result.white.bottom[0]! + 100);
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});

test('website offers a PNG download of the current preview', async () => {
  const browser = await launch();
  const page = await browser.newPage();
  try {
    await page.goto(`http://localhost:${PORT}/viewer`);
    await page.setInputFiles('input[type=file]', resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx'));
    const button = page.getByRole('button', { name: 'Download screenshot', exact: true });
    await expect.poll(() => button.isEnabled(), { timeout: 30_000 }).toBe(true);
    const pending = page.waitForEvent('download', { timeout: 10_000 }).catch(async (error) => {
      console.error('Screenshot page:', await page.locator('body').innerText());
      throw error;
    });
    await button.click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('copper.png');
    const bytes = await readFile((await download.path()));
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(bytes.readUInt32BE(16)).toBeGreaterThan(100);
    expect(bytes.readUInt32BE(20)).toBeGreaterThan(100);
  } finally {
    await browser.close();
  }
});

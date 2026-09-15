import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium, type Browser } from 'playwright-core';
import { defineCommand } from 'yargs-file-commands';
import { startViewServer } from '../view/server.js';

export const GEOMETRIES = ['totem', 'sphere', 'cube', 'plane'] as const;

/** Prefers a browser the user already has (Chrome, then Edge) over Playwright's own download, so
 * installing mtlx-cli never pulls a Chromium build. `MTLX_BROWSER` or `--browser` pins a binary. */
export async function launchBrowser(executablePath?: string): Promise<Browser> {
  const attempts: (() => Promise<Browser>)[] = executablePath
    ? [() => chromium.launch({ executablePath })]
    : [
        () => chromium.launch({ channel: 'chrome' }),
        () => chromium.launch({ channel: 'msedge' }),
        () => chromium.launch(), // Playwright's cached Chromium, if `npx playwright install chromium` ever ran.
      ];
  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message.split('\n')[0]!.replace(/^browserType\.launch: /, ''));
    }
  }
  // Playwright's messages already name the path it checked, which differs per platform (macOS
  // /Applications, Linux /opt, Windows Program Files and LocalAppData).
  throw new Error(
    [
      'mtlx render needs Google Chrome or Microsoft Edge and found neither:',
      ...errors.map((e) => `  - ${e}`),
      'Install Chrome or Edge, or point MTLX_BROWSER (or --browser) at a Chromium-based browser executable.',
    ].join('\n'),
  );
}

export interface RenderOptions {
  input: string;
  geometry?: (typeof GEOMETRIES)[number];
  material?: string;
  background?: 'none' | 'environment';
  size?: number;
  browser?: string;
  /** Seconds to wait for the material to compile. */
  timeout?: number;
}

/** Renders the material to PNG bytes with the `mtlx view` page in a headless browser. Throws with
 * the viewer's own message when the material fails to compile. */
export async function renderMaterial(options: RenderOptions): Promise<Buffer> {
  let browser: Browser | undefined;
  const server = await startViewServer(options.input);
  try {
    browser = await launchBrowser(options.browser ?? process.env.MTLX_BROWSER);
    const size = options.size ?? 800;
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const query = new URLSearchParams({
      geometry: options.geometry ?? 'totem',
      rotate: 'false',
      background: options.background ?? 'none',
    });
    if (options.material) query.set('material', options.material);
    await page.goto(`${server.url}?${query}`);
    const canvas = page.locator('canvas[data-state]');
    await canvas.waitFor({ timeout: (options.timeout ?? 60) * 1000 });
    if ((await canvas.getAttribute('data-state')) === 'error') {
      throw new Error(await page.locator('#error').innerText());
    }
    await page.addStyleTag({ content: '.toolbar { display: none; } html, body { background: transparent; }' });
    return await canvas.screenshot({ omitBackground: true });
  } finally {
    await browser?.close();
    await server.close();
  }
}

export const command = defineCommand({
  command: 'render <input>',
  describe: 'Render a .mtlx or .mtlx.zip file to a PNG image using a local headless browser',
  builder: (yargs) =>
    yargs
      .positional('input', { describe: 'Path to .mtlx or .mtlx.zip file', type: 'string', demandOption: true })
      .option('output', { alias: 'o', describe: 'PNG file to write', type: 'string', demandOption: true })
      .option('geometry', { alias: 'g', describe: 'Preview geometry', choices: GEOMETRIES, default: 'totem' })
      .option('material', {
        alias: 'm',
        describe: 'Material name (default: last material in the document)',
        type: 'string',
      })
      .option('background', {
        alias: 'b',
        describe: 'Backdrop behind the model; none keeps the IBL lighting but leaves the PNG transparent',
        choices: ['none', 'environment'] as const,
        default: 'none',
      })
      .option('size', { alias: 's', describe: 'Image width and height in pixels', type: 'number', default: 800 })
      .option('browser', {
        describe: 'Chromium-based browser executable (default: installed Chrome, Edge, or Playwright Chromium)',
        type: 'string',
        default: process.env.MTLX_BROWSER,
      })
      .option('timeout', { describe: 'Seconds to wait for the material to compile', type: 'number', default: 60 }),
  handler: async (argv) => {
    try {
      const png = await renderMaterial({
        ...argv,
        geometry: argv.geometry as RenderOptions['geometry'],
        background: argv.background as RenderOptions['background'],
      });
      await fs.mkdir(path.dirname(path.resolve(argv.output)), { recursive: true });
      await fs.writeFile(argv.output, png);
      console.log(`Wrote ${argv.output}`);
    } catch (error) {
      console.error(`ERROR ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  },
});

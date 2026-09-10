#!/usr/bin/env node
/**
 * One-off (re-runnable) build step: bakes three.js's procedural RoomEnvironment into the flat
 * equirectangular PNG at ../assets/studio-environment.png, via a headless Chromium (WebGL is
 * needed to render the scene; Node has no GPU context of its own). Only needs re-running if
 * RoomEnvironment's look or the bake resolution changes — the output is committed as a static
 * asset, not regenerated on every build.
 *
 * Uses `esbuild` and `playwright`, both already dev dependencies elsewhere in this monorepo.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const browserEntry = join(__dirname, 'bake-studio-environment.browser.mjs');
const outFile = join(__dirname, '../assets/studio-environment.png');
const WIDTH = 1024;
const HEIGHT = 512;

const bundle = await esbuild.build({
  entryPoints: [browserEntry],
  bundle: true,
  format: 'iife',
  write: false,
});
const bundleCode = bundle.outputFiles[0].text;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ content: bundleCode });
  const dataUrl = await page.evaluate(([w, h]) => window.bakeStudioEnvironment(w, h), [WIDTH, HEIGHT]);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  await writeFile(outFile, Buffer.from(base64, 'base64'));
} finally {
  await browser.close();
}

console.log(`Baked studio-environment.png (${(await readFile(outFile)).length} bytes, ${existsSync(outFile)})`);

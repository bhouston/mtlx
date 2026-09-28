import { promises as fs } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import process from 'node:process';
import type { Browser } from 'playwright-core';
import type sharpType from 'sharp';
import { defineCommand } from 'yargs-file-commands';
import { startViewServer } from '../view/server.js';

// Playwright and sharp load lazily: every `mtlx` command imports this module at startup.
const loadSharp = async (): Promise<typeof sharpType> => (await import('sharp')).default;

export const GEOMETRIES = ['totem', 'sphere', 'cube', 'plane'] as const;

/** Lighting presets for `--ibl`: see scripts/build-viewer.mjs for their sources. */
export const IBLS = ['studio', 'bridge', 'sun', 'overcast', 'neutral', 'strips', 'dusk', 'night'] as const;

/** Prefers a browser the user already has (Chrome, then Edge) over Playwright's own download, so
 * installing mtlx-cli never pulls a Chromium build. `MTLX_BROWSER` or `--browser` pins a binary. */
export async function launchBrowser(executablePath?: string): Promise<Browser> {
  const { chromium } = await import('playwright-core');
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

/** One shot; `window.__mtlxRender` in ../view/viewerEntry.ts takes the same shape. */
export interface RenderView {
  /** Label used for file names and contact-sheet captions. */
  name: string;
  geometry: (typeof GEOMETRIES)[number];
  background: 'none' | 'environment';
  /** Visible width in meters of a head-on plane shot (the frame is square); overrides `zoom`. */
  width?: number;
  zoom?: number;
  /** Degrees above the plane's normal: 0 is head-on, 35 the default framing, ~75 grazing. */
  elevation?: number;
  /** UV point to aim at on the plane. */
  center?: [number, number];
}

/**
 * Named views. Plane views are head-on and sized in meters, assuming 1 UV unit = 1 m, so
 * `plane` frames exactly the 0..1 tile; `plane:0.3` is any other width.
 */
export const VIEW_PRESETS: Record<string, Omit<RenderView, 'name'>> = {
  plane: { geometry: 'plane', background: 'none', width: 1, elevation: 0 },
  closeup: { geometry: 'plane', background: 'none', width: 0.2, elevation: 0 },
  detail: { geometry: 'plane', background: 'none', width: 0.05, elevation: 0 },
  grazing: { geometry: 'plane', background: 'environment', zoom: 2.5, elevation: 72 },
  sphere: { geometry: 'sphere', background: 'environment' },
  totem: { geometry: 'totem', background: 'none' },
  cube: { geometry: 'cube', background: 'none' },
};

/** Parses `closeup`, `plane:0.3` (width in meters), or `totem`. */
export function parseView(spec: string, center?: [number, number]): RenderView {
  const [name = '', width] = spec.split(':');
  const preset = VIEW_PRESETS[name];
  if (!preset)
    throw new Error(`Unknown view "${spec}". Use ${Object.keys(VIEW_PRESETS).join(', ')} or plane:<meters>.`);
  const view: RenderView = { name: spec.replace(':', '-'), ...preset };
  if (width !== undefined) {
    if (!(Number(width) > 0)) throw new Error(`View "${spec}": width must be a positive number of meters.`);
    view.width = Number(width);
  }
  // The plane is exactly 1 m, so centering only makes sense for narrower views; the full `plane`
  // view stays whole in mixed sheets like `--view plane closeup --center u,v`.
  if (center && view.geometry === 'plane' && (view.width ?? 1) < 1) view.center = center;
  return view;
}

export interface RenderOptions {
  input: string;
  /** Named views (see VIEW_PRESETS); when absent, one view from geometry/zoom/elevation/center/background. */
  views?: string[];
  geometry?: (typeof GEOMETRIES)[number];
  material?: string;
  background?: 'none' | 'environment';
  size?: number;
  /** Camera zoom factor for close-ups; 1 is the default framing. */
  zoom?: number;
  /** Camera elevation in degrees (default 35; 0 is head-on to the plane). */
  elevation?: number;
  /** UV point to aim at on the plane. */
  center?: [number, number];
  /** Lighting preset (see IBLS). */
  ibl?: (typeof IBLS)[number];
  /** Exposure in stops, -2..2. */
  exposure?: number;
  /** Render at 2x and downsample, which smooths thin features and derivative-normal artifacts. */
  supersample?: boolean;
  /** Show one node's output unlit instead of the material (see channelDocument). */
  channel?: string;
  /** Value range mapped to black..white for `channel` (default 0..1). */
  range?: [number, number];
  /** Multiply texcoords so plane views show this many meters (see uvScaledDocument). */
  uvScale?: number;
  browser?: string;
  /** Seconds to wait for the material to compile. */
  timeout?: number;
}

export interface RenderedView {
  view: RenderView;
  png: Buffer;
  /** Seconds from page load until the first view's screenshot: dominated by shader compilation. */
  firstViewSeconds: number;
}

const CHANNEL_MATERIAL = '__mtlx_channel';

/**
 * Rewrites a document so a material shows node `nodeName`'s output as unlit color: the value is
 * remapped from `range` to 0..1, clamped, and passed through the upper branch of the inverse sRGB curve,
 * so that with no tone mapping the PNG's 8-bit value is linear in the node's value (exact above 4% of
 * the range, within ~0.011 of the range below). Each node reads its input once: the loader doesn't
 * share nodes between consumers (renderer bug 7), so branching here would duplicate the whole graph (float nodes show grey, vectors map xyz to rgb).
 */
export function channelDocument(xml: string, requested: string, range: [number, number] = [0, 1]): string {
  // Accept a nodegraph output name too (e.g. `roughness_out`): show the node that feeds it.
  const viaOutput = new RegExp(
    `<output\\b[^>]*\\bname="${requested.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*\\bnodename="([^"]+)"`,
  ).exec(xml);
  const nodeName = viaOutput?.[1] ?? requested;
  const escaped = nodeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const graphs = [...xml.matchAll(/<nodegraph\b[^>]*\bname="([^"]+)"[^>]*>([\s\S]*?)<\/nodegraph>/g)];
  for (const graph of graphs) {
    const node =
      new RegExp(`<(?!input\\b|output\\b)(\\w+)\\b[^>]*\\bname="${escaped}"[^>]*\\btype="(\\w+)"`).exec(graph[2]!) ??
      new RegExp(`<(?!input\\b|output\\b)(\\w+)\\b[^>]*\\btype="(\\w+)"[^>]*\\bname="${escaped}"`).exec(graph[2]!);
    if (!node) continue;
    const type = node[2]!;
    const toColor: Record<string, string> = {
      float: `<convert name="__ch_color" type="color3"><input name="in" type="float" nodename="${nodeName}" /></convert>`,
      vector2: `<convert name="__ch_v3" type="vector3"><input name="in" type="vector2" nodename="${nodeName}" /></convert>
    <convert name="__ch_color" type="color3"><input name="in" type="vector3" nodename="__ch_v3" /></convert>`,
      vector3: `<convert name="__ch_color" type="color3"><input name="in" type="vector3" nodename="${nodeName}" /></convert>`,
      color3: `<dot name="__ch_color" type="color3"><input name="in" type="color3" nodename="${nodeName}" /></dot>`,
    };
    if (!toColor[type])
      throw new Error(`--channel supports float, vector2, vector3, and color3 nodes; "${nodeName}" is ${type}.`);
    const [min, max] = range;
    const nodes = `
    ${toColor[type]}
    <subtract name="__ch_shift" type="color3"><input name="in1" type="color3" nodename="__ch_color" /><input name="in2" type="float" value="${min}" /></subtract>
    <divide name="__ch_scale" type="color3"><input name="in1" type="color3" nodename="__ch_shift" /><input name="in2" type="float" value="${max - min}" /></divide>
    <clamp name="__ch_clamp" type="color3"><input name="in" type="color3" nodename="__ch_scale" /></clamp>
    <add name="__ch_a" type="color3"><input name="in1" type="color3" nodename="__ch_clamp" /><input name="in2" type="float" value="0.055" /></add>
    <divide name="__ch_b" type="color3"><input name="in1" type="color3" nodename="__ch_a" /><input name="in2" type="float" value="1.055" /></divide>
    <power name="__ch_linear" type="color3"><input name="in1" type="color3" nodename="__ch_b" /><input name="in2" type="float" value="2.4" /></power>
    <output name="__ch_out" type="color3" nodename="__ch_linear" />
  `;
    const patched = graph[0].replace(/<\/nodegraph>$/, `${nodes}</nodegraph>`);
    const shader = `
  <standard_surface name="${CHANNEL_MATERIAL}_shader" type="surfaceshader">
    <input name="base" type="float" value="0" />
    <input name="specular" type="float" value="0" />
    <input name="emission" type="float" value="1" />
    <input name="emission_color" type="color3" nodegraph="${graph[1]}" output="__ch_out" />
  </standard_surface>
  <surfacematerial name="${CHANNEL_MATERIAL}" type="material">
    <input name="surfaceshader" type="surfaceshader" nodename="${CHANNEL_MATERIAL}_shader" />
  </surfacematerial>
`;
    return xml.replace(graph[0], patched).replace(/<\/materialx>\s*$/, `${shader}</materialx>\n`);
  }
  throw new Error(`--channel: no node named "${nodeName}" inside a nodegraph.`);
}

/**
 * Multiplies every `texcoord` node's output by `scale`, so a 1 m plane view shows scale × scale meters
 * of a material authored with 1 UV unit = 1 m. Each texcoord is renamed and replaced by a multiply
 * under its original name, so every consumer picks up the scaled value.
 */
export function uvScaledDocument(xml: string, scale: number): string {
  let count = 0;
  const out = xml.replace(
    /<texcoord\b([^>]*?)\bname="([^"]+)"([^>]*?)(\/>|>\s*<\/texcoord>)/g,
    (_m, pre, name, post) => {
      count++;
      const type = /type="(\w+)"/.exec(`${pre}${post}`)?.[1] ?? 'vector2';
      return `<texcoord${pre}name="${name}__unscaled"${post}/><multiply name="${name}" type="${type}"><input name="in1" type="${type}" nodename="${name}__unscaled" /><input name="in2" type="float" value="${scale}" /></multiply>`;
    },
  );
  if (!count) throw new Error('--uv-scale: the document has no <texcoord> node to scale.');
  return out;
}

export interface GraphComplexity {
  nodes: number;
  /** Nodes after expanding every reference, which is what the three.js loader compiles (renderer bug 7). */
  expanded: number;
  /** Nodes read more than once, worst first: extra expanded nodes = (reads − 1) × subtree size. */
  rereads: { name: string; reads: number; subtree: number }[];
}

/** Estimates shader size the way the loader builds it: without sharing nodes between consumers. */
export function graphComplexity(xml: string): GraphComplexity {
  const inputs = new Map<string, string[]>();
  // Drop container tags so their children are matched as nodes (graph-local names are assumed unique).
  const flat = xml.replace(/<\/?(nodegraph|materialx)\b[^>]*>/g, '');
  for (const m of flat.matchAll(/<(\w+)\b[^>]*?\bname="([^"]+)"[^>]*?(\/>|>([\s\S]*?)<\/\1>)/g)) {
    if (['input', 'output', 'surfacematerial'].includes(m[1]!)) continue;
    inputs.set(
      m[2]!,
      [...(m[4] ?? '').matchAll(/nodename="([^"]+)"/g)].map((r) => r[1]!),
    );
  }
  const sizes = new Map<string, number>();
  const size = (name: string, depth = 0): number => {
    const known = sizes.get(name);
    if (known !== undefined) return known;
    if (depth > 10000) return 1;
    const total = 1 + (inputs.get(name) ?? []).reduce((sum, i) => sum + (inputs.has(i) ? size(i, depth + 1) : 0), 0);
    sizes.set(name, total);
    return total;
  };
  const outputs = [...xml.matchAll(/<output\b[^>]*\bnodename="([^"]+)"/g)].map((m) => m[1]!);
  const reads = new Map<string, number>();
  for (const list of inputs.values()) for (const i of list) reads.set(i, (reads.get(i) ?? 0) + 1);
  const rereads = [...reads]
    .filter(([name, n]) => n > 1 && inputs.has(name))
    .map(([name, n]) => ({ name, reads: n, subtree: size(name) }))
    .toSorted((a, b) => (b.reads - 1) * b.subtree - (a.reads - 1) * a.subtree)
    .slice(0, 5);
  return { nodes: inputs.size, expanded: outputs.reduce((sum, o) => sum + (inputs.has(o) ? size(o) : 0), 0), rereads };
}

export interface ChannelStats {
  channel: string;
  min: number;
  p5: number;
  mean: number;
  p95: number;
  max: number;
  /** Fraction of pixels at the ends of `range`, where values may be clipped. */
  clippedLow: number;
  clippedHigh: number;
  /** Pixels (x, y from top-left, 0..1 of the frame) where the value is largest and smallest. */
  maxAt: [number, number];
  minAt: [number, number];
}

/** Statistics of the red, green, and blue values of a channel render over opaque pixels, mapped back to `range`. */
export async function channelStats(png: Buffer, range: [number, number] = [0, 1]): Promise<ChannelStats[]> {
  const { data, info } = await (await loadSharp())(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [min, max] = range;
  return ['r', 'g', 'b'].map((channel, c) => {
    const values: number[] = [];
    let maxAt: [number, number] = [0.5, 0.5];
    let minAt: [number, number] = [0.5, 0.5];
    let best = -1;
    let worst = 256;
    for (let i = 0, p = 0; i < data.length; i += info.channels, p++) {
      if (data[i + 3]! <= 250) continue;
      values.push(data[i + c]!);
      const at: [number, number] = [
        ((p % info.width) + 0.5) / info.width,
        (Math.floor(p / info.width) + 0.5) / info.height,
      ];
      if (data[i + c]! > best) [best, maxAt] = [data[i + c]!, at];
      if (data[i + c]! < worst) [worst, minAt] = [data[i + c]!, at];
    }
    values.sort((a, b) => a - b);
    const at = (q: number) => values[Math.min(values.length - 1, Math.floor(q * values.length))] ?? 0;
    const toValue = (byte: number) => min + (byte / 255) * (max - min);
    const count = values.length || 1;
    return {
      channel,
      min: toValue(at(0)),
      p5: toValue(at(0.05)),
      mean: toValue(values.reduce((sum, v) => sum + v, 0) / count),
      p95: toValue(at(0.95)),
      max: toValue(at(1)),
      clippedLow: values.filter((v) => v === 0).length / count,
      clippedHigh: values.filter((v) => v === 255).length / count,
      maxAt,
      minAt,
    };
  });
}

/** WebGPU device loss under load ("Instance dropped in popErrorScope", "device lost") is transient. */
const TRANSIENT_GPU_ERROR = /popErrorScope|Instance dropped|device (was )?lost|GPUDevice/i;

/** Renders every view from one browser session and one material compile, retrying once on a
 * transient GPU failure. Throws with the viewer's own message when the material fails to compile. */
export async function renderViews(options: RenderOptions): Promise<RenderedView[]> {
  try {
    return await renderViewsOnce(options);
  } catch (error) {
    if (!TRANSIENT_GPU_ERROR.test(error instanceof Error ? error.message : String(error))) throw error;
    console.error('Transient GPU error; retrying once.');
    return renderViewsOnce(options);
  }
}

async function renderViewsOnce(options: RenderOptions): Promise<RenderedView[]> {
  const views = options.views?.length
    ? options.views.map((spec) => parseView(spec, options.center))
    : [
        {
          name: options.geometry ?? 'totem',
          geometry: options.geometry ?? 'totem',
          background: options.background ?? 'none',
          zoom: options.zoom,
          elevation: options.elevation,
          center: options.center,
        } satisfies RenderView,
      ];
  let document: string | undefined;
  if (options.channel || options.uvScale) {
    document = await fs.readFile(options.input, 'utf8');
    if (options.uvScale) document = uvScaledDocument(document, options.uvScale);
    if (options.channel) document = channelDocument(document, options.channel, options.range);
  }
  let browser: Browser | undefined;
  const server = await startViewServer(options.input, undefined, undefined, document);
  try {
    browser = await launchBrowser(options.browser ?? process.env.MTLX_BROWSER);
    const size = options.size ?? 800;
    const scale = options.supersample && !options.channel ? 2 : 1;
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: scale });
    const query = new URLSearchParams({ geometry: views[0]!.geometry, rotate: 'false', background: 'none' });
    if (options.ibl) query.set('ibl', options.ibl);
    if (options.exposure) query.set('exposure', String(options.exposure));
    const material = options.channel ? CHANNEL_MATERIAL : options.material;
    if (material) query.set('material', material);
    if (options.channel)
      for (const [key, value] of [
        ['toneMapping', 'none'],
        ['bloom', 'false'],
        ['ao', 'false'],
      ])
        query.set(key!, value!);
    // One budget for compile, view switches, and screenshots: a slow shader otherwise surfaces as
    // Playwright's default 30 s screenshot timeout.
    page.setDefaultTimeout((options.timeout ?? 60) * 1000);
    const loadStart = performance.now();
    await page.goto(`${server.url}?${query}`);
    const canvas = page.locator('canvas[data-state]');
    await canvas.waitFor();
    let firstViewSeconds = 0;
    if ((await canvas.getAttribute('data-state')) === 'error') {
      throw new Error(await page.locator('#error').innerText());
    }
    await page.addStyleTag({ content: '.toolbar { display: none; } html, body { background: transparent; }' });
    const results: RenderedView[] = [];
    for (const view of views) {
      await page.evaluate(
        (v) => (globalThis as unknown as { __mtlxRender: (view: unknown) => Promise<void> }).__mtlxRender(v),
        { ...view, background: options.channel ? 'none' : view.background },
      );
      let png = await canvas.screenshot({ omitBackground: true });
      if (scale !== 1) png = await (await loadSharp())(png).resize(size, size).png().toBuffer();
      firstViewSeconds ||= (performance.now() - loadStart) / 1000;
      results.push({ view, png, firstViewSeconds });
    }
    return results;
  } finally {
    await browser?.close();
    await server.close();
  }
}

/** Renders one view to PNG bytes (the first of `views` when several are given). */
export async function renderMaterial(options: RenderOptions): Promise<Buffer> {
  return (await renderViews(options))[0]!.png;
}

const escapeXml = (text: string) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
const viewLabel = (view: RenderView) =>
  `${view.name}${view.width ? ` (${view.width >= 1 ? `${view.width} m` : `${Math.round(view.width * 1000)} mm`} across)` : ''}`;

export const IMAGE_FORMATS = ['png', 'jpg', 'webp', 'avif'] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

/** The image format a file path asks for by its extension, if any. */
export function imageFormatOf(file: string): ImageFormat | undefined {
  const ext = path.extname(file).toLowerCase().slice(1);
  return ext === 'jpeg' ? 'jpg' : IMAGE_FORMATS.find((format) => format === ext);
}

/**
 * Encodes a rendered PNG at a fixed high quality: high enough for fidelity comparisons, still well
 * compressed. AVIF matches the reference renders in mtlx-fidelity and ss-fidelity.
 */
export async function encodeImage(png: Buffer, format: ImageFormat): Promise<Buffer> {
  if (format === 'png') return png;
  const image = (await loadSharp())(png);
  if (format === 'avif') return image.avif({ quality: 90, chromaSubsampling: '4:4:4' }).toBuffer();
  if (format === 'webp') return image.webp({ quality: 99 }).toBuffer();
  return image.jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
}

/** Lays views out left to right with captions, wrapping every `columns` views. */
export async function contactSheet(shots: RenderedView[], size: number, columns = 3): Promise<Buffer> {
  const caption = 24;
  const cols = Math.min(columns, shots.length);
  const rows = Math.ceil(shots.length / cols);
  return (await loadSharp())({
    create: { width: cols * size, height: rows * (size + caption), channels: 4, background: '#202020' },
  })
    .composite(
      shots.flatMap((shot, i) => {
        const left = (i % cols) * size;
        const top = Math.floor(i / cols) * (size + caption);
        const text = `<svg width="${size}" height="${caption}"><text x="8" y="17" font-family="sans-serif" font-size="14" fill="#ddd">${escapeXml(viewLabel(shot.view))}</text></svg>`;
        return [
          { input: shot.png, left, top: top + caption },
          { input: Buffer.from(text), left, top },
        ];
      }),
    )
    .png()
    .toBuffer();
}

const parsePair = (value: unknown, flag: string): [number, number] | undefined => {
  if (value === undefined) return undefined;
  const parts = String(value).split(',').map(Number);
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n)))
    throw new Error(`${flag} takes two numbers, e.g. 0.25,0.5`);
  return parts as [number, number];
};

/** UV under a frame position for head-on plane views (UV 0..1 spans the plane, V up). */
const frameToUv = (view: RenderView, [x, y]: [number, number]): [number, number] | undefined => {
  if (view.geometry !== 'plane' || !view.width || view.elevation !== 0) return undefined;
  const [cu, cv] = view.center ?? [0.5, 0.5];
  return [cu + (x - 0.5) * view.width, cv - (y - 0.5) * view.width];
};

/** Pixel position of a material UV (meters) in a head-on plane view, accounting for --uv-scale. */
const uvToFrame = (
  view: RenderView,
  [u, v]: [number, number],
  size: number,
  uvScale = 1,
): [number, number] | undefined => {
  if (view.geometry !== 'plane' || !view.width || view.elevation !== 0) return undefined;
  const [cu, cv] = view.center ?? [0.5, 0.5];
  const w = view.width * uvScale;
  return [((u - cu * uvScale) / w + 0.5) * size, (0.5 - (v - cv * uvScale) / w) * size];
};

export interface MirrorDiff {
  axis: 'u' | 'v';
  at: number;
  /** Mean and max absolute difference between mirrored pixel pairs, 0..1 of full scale. */
  mean: number;
  max: number;
  pairs: number;
}

/** Compares a head-on plane shot with its mirror image about a UV line (book-match and kaleidoscope checks). */
export async function mirrorDiff(
  png: Buffer,
  view: RenderView,
  axis: 'u' | 'v',
  at: number,
  uvScale = 1,
): Promise<MirrorDiff> {
  const { data, info } = await (await loadSharp())(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const line = uvToFrame(view, axis === 'u' ? [at, 0] : [0, at], info.width, uvScale);
  if (!line) throw new Error('--mirror needs a head-on plane view (plane, closeup, detail, or plane:<m>).');
  const c = axis === 'u' ? line[0] : line[1];
  let sum = 0;
  let max = 0;
  let pairs = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const [mx, my] = axis === 'u' ? [Math.round(2 * c - x - 1), y] : [x, Math.round(2 * c - y - 1)];
      if ((axis === 'u' ? x >= c : y >= c) || mx < 0 || my < 0 || mx >= info.width || my >= info.height) continue;
      const a = (y * info.width + x) * info.channels;
      const b = (my * info.width + mx) * info.channels;
      if (data[a + 3]! < 250 || data[b + 3]! < 250) continue;
      let d = 0;
      for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(data[a + k]! - data[b + k]!) / 255);
      sum += d;
      max = Math.max(max, d);
      pairs++;
    }
  }
  if (!pairs)
    throw new Error('--mirror: the mirror line leaves no overlapping pixels in this view; aim it with --center.');
  return { axis, at, mean: sum / pairs, max, pairs };
}

const uvLabel = (x: number) => Number(x.toFixed(4)).toString();

/** Draws UV grid lines every `step` meters with labels on head-on plane shots (others are returned as-is). */
export async function gridOverlay(png: Buffer, view: RenderView, step: number, uvScale = 1): Promise<Buffer> {
  const { width = 0, height = 0 } = await (await loadSharp())(png).metadata();
  const corner0 = frameToUv(view, [0, 1]);
  const corner1 = frameToUv(view, [1, 0]);
  if (!corner0 || !corner1) return png;
  const [u0, v0] = corner0.map((x) => x * uvScale);
  const [u1, v1] = corner1.map((x) => x * uvScale);
  const lines: string[] = [];
  for (let u = Math.ceil(u0! / step) * step; u <= u1!; u += step) {
    const x = uvToFrame(view, [u, 0], width, uvScale)![0];
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}"/><text x="${x + 3}" y="12">u ${uvLabel(u)}</text>`);
  }
  for (let v = Math.ceil(v0! / step) * step; v <= v1!; v += step) {
    const y = uvToFrame(view, [0, v], height, uvScale)![1];
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}"/><text x="3" y="${y - 3}">v ${uvLabel(v)}</text>`);
  }
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g stroke="#ff00ff" stroke-opacity="0.7" stroke-width="1" fill="#ff00ff" font-family="sans-serif" font-size="11">${lines.join('')}</g></svg>`;
  return (await loadSharp())(png)
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toBuffer();
}

/** Crops a square of `size` pixels at (x, y) and enlarges it with nearest-neighbour sampling, for pixel-level inspection. */
export async function cropPixels(png: Buffer, [x, y, size]: [number, number, number], out: number): Promise<Buffer> {
  return (await loadSharp())(png)
    .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(size), height: Math.round(size) })
    .resize(out, out, { kernel: 'nearest' })
    .png()
    .toBuffer();
}

/** 4 significant digits, so heights in meters (-0.00015) stay readable. */
const num = (x: number) => (x === 0 ? '0' : Number(x.toPrecision(4)).toString());

const at = (uv?: [number, number]) => (uv ? ` (uv ${uv[0].toFixed(4)},${uv[1].toFixed(4)})` : '');

const formatStats = (stats: ChannelStats[], grey: boolean, view: RenderView) =>
  (grey ? stats.slice(0, 1) : stats)
    .map(
      (s) =>
        `${grey ? 'value' : s.channel}: min ${num(s.min)}${at(frameToUv(view, s.minAt))}  p5 ${num(s.p5)}  mean ${num(s.mean)}  p95 ${num(s.p95)}  max ${num(s.max)}${at(frameToUv(view, s.maxAt))}` +
        (s.clippedLow > 0.01 || s.clippedHigh > 0.01
          ? `  (clipped: ${(s.clippedLow * 100).toFixed(1)}% at min, ${(s.clippedHigh * 100).toFixed(1)}% at max; widen --range)`
          : ''),
    )
    .join('\n');

const shown = (file: string) =>
  path.relative(process.cwd(), file).startsWith('..') ? file : path.relative(process.cwd(), file);

export const command = defineCommand({
  command: 'render <input>',
  describe: 'Render a .mtlx or .mtlx.zip file to an image (png, jpg, webp or avif) using a local headless browser',
  builder: (yargs) =>
    yargs
      .positional('input', { describe: 'Path to .mtlx or .mtlx.zip file', type: 'string', demandOption: true })
      .option('output', {
        alias: 'o',
        describe:
          'Image file to write; .png, .jpg, .webp or .avif picks the format. With several --view, an image path gets a contact sheet; any other path (or an existing directory, or one ending in /) gets <view>.<format> files',
        type: 'string',
        demandOption: true,
      })
      .option('format', {
        describe: 'Format of the <view> files when --output is a directory (an image --output uses its extension)',
        choices: IMAGE_FORMATS,
        default: 'png' as ImageFormat,
      })
      .option('view', {
        describe: `Named views rendered in one browser session: ${Object.keys(VIEW_PRESETS).join(', ')}, or plane:<meters> for a head-on plane of that width (1 UV = 1 m)`,
        type: 'string',
        array: true,
      })
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
      .option('ibl', {
        describe:
          'Lighting: studio (soft, dim room), bridge (outdoor, shows relief, green-yellow cast), sun (hard midday sun, strongest relief), overcast (soft medium daylight, near neutral), neutral (colorless grey studio, for judging albedo), strips (dark room with sharp softbox strips, for judging gloss and roughness breakup), dusk (warm, medium-dark street), night (very dark)',
        choices: IBLS,
        default: 'studio',
      })
      .option('exposure', { alias: 'e', describe: 'Exposure in stops (-2..2)', type: 'number', default: 0 })
      .option('zoom', {
        alias: 'z',
        describe: 'Camera zoom factor for close-ups (1 = default framing)',
        type: 'number',
      })
      .option('elevation', {
        describe: 'Camera elevation in degrees (default 35; 0 = head-on to the plane)',
        type: 'number',
      })
      .option('center', { describe: 'UV point the plane view aims at, e.g. 0.25,0.7', type: 'string', nargs: 1 })
      .option('supersample', {
        describe: 'Render at 2x and downsample (smoother thin features)',
        type: 'boolean',
        default: false,
      })
      .option('channel', {
        describe: 'Show one nodegraph node unlit (floats grey, vectors as rgb) and print its value statistics',
        type: 'string',
      })
      .option('uv-scale', {
        describe: 'Multiply every texcoord by N, so the 1 m plane shows N × N m (layout checks over several meters)',
        type: 'number',
      })
      .option('grid', {
        describe: 'Overlay UV grid lines every N meters (with labels) on head-on plane views, e.g. 0.1',
        type: 'number',
      })
      .option('crop', {
        describe:
          'Crop x,y,size pixels of each view and enlarge it to --size (nearest neighbour) for pixel-level inspection',
        type: 'string',
        nargs: 1,
      })
      .option('mirror', {
        describe:
          'Print how symmetric each head-on plane view is about a UV line, e.g. u=0.15 or v=0.5 (book-match checks)',
        type: 'string',
        nargs: 1,
      })
      .option('range', {
        describe: 'Value range mapped to black..white for --channel, e.g. -0.003,0.002 (default 0,1)',
        type: 'string',
        nargs: 1,
      })
      .option('browser', {
        describe: 'Chromium-based browser executable (default: installed Chrome, Edge, or Playwright Chromium)',
        type: 'string',
        default: process.env.MTLX_BROWSER,
      })
      .option('timeout', {
        describe: 'Seconds to wait for the material to compile and each view to render',
        type: 'number',
        default: 60,
      }),
  handler: async (argv) => {
    try {
      const started = performance.now();
      const range = parsePair(argv.range, '--range');
      const shots = await renderViews({
        ...argv,
        views: argv.view?.map(String),
        center: parsePair(argv.center, '--center'),
        range,
        uvScale: argv.uvScale as number | undefined,
        geometry: argv.geometry as RenderOptions['geometry'],
        background: argv.background as RenderOptions['background'],
        ibl: argv.ibl as RenderOptions['ibl'],
      });
      const uvScale = (argv.uvScale as number | undefined) ?? 1;
      const mirror = argv.mirror ? /^([uv])=(-?[\d.]+)$/.exec(String(argv.mirror)) : undefined;
      if (argv.mirror && !mirror) throw new Error('--mirror takes u=<meters> or v=<meters>, e.g. u=0.15');
      const crop = argv.crop ? String(argv.crop).split(',').map(Number) : undefined;
      if (crop && (crop.length !== 3 || crop.some((n) => !Number.isFinite(n)) || crop[2]! <= 0))
        throw new Error('--crop takes x,y,size in pixels, e.g. 200,300,64');
      // Measurements use the untouched render; overlays and crops only change what is written.
      const reports: string[] = [];
      for (const shot of shots) {
        const tag = shots.length > 1 ? `[${shot.view.name}] ` : '';
        if (argv.channel) {
          const stats = await channelStats(shot.png, range);
          const grey = stats.every((s) => s.mean === stats[0]!.mean && s.max === stats[0]!.max);
          reports.push(`${tag}${argv.channel}:`, formatStats(stats, grey, shot.view));
        }
        if (mirror) {
          const d = await mirrorDiff(shot.png, shot.view, mirror[1] as 'u' | 'v', Number(mirror[2]), uvScale);
          const [lo, hi] = range ?? [0, 1];
          const scale = argv.channel ? hi - lo : 1;
          reports.push(
            `${tag}mirror ${d.axis}=${d.at}: mean |diff| ${num(d.mean * scale)}, max ${num(d.max * scale)}${argv.channel ? '' : ' (0..1 of full scale)'} over ${d.pairs} pixel pairs`,
          );
        }
        if (argv.grid) shot.png = await gridOverlay(shot.png, shot.view, argv.grid, uvScale);
        if (crop) shot.png = await cropPixels(shot.png, crop as [number, number, number], argv.size);
      }
      const output = path.resolve(argv.output);
      const written: string[] = [];
      const isDir = (await fs.stat(output).catch(() => undefined))?.isDirectory() || argv.output.endsWith('/');
      const format = imageFormatOf(output);
      if (!format && (shots.length > 1 || isDir)) {
        await fs.mkdir(output, { recursive: true });
        for (const shot of shots) {
          const file = path.join(output, `${shot.view.name}.${argv.format}`);
          await fs.writeFile(file, await encodeImage(shot.png, argv.format));
          written.push(file);
        }
      } else {
        await fs.mkdir(path.dirname(output), { recursive: true });
        const png = shots.length > 1 ? await contactSheet(shots, argv.size) : shots[0]!.png;
        await fs.writeFile(output, await encodeImage(png, format ?? argv.format));
        written.push(output);
      }
      const complexity = graphComplexity(await fs.readFile(argv.input, 'utf8').catch(() => ''));
      if (complexity.expanded > 300_000) {
        console.log(
          `Graph: ${complexity.nodes} nodes expand to ${(complexity.expanded / 1e6).toFixed(2)}M (renderer bug 7: nodes aren't shared, so compile tracks this; aim < 0.3M). ` +
            `Worst re-reads: ${complexity.rereads.map((r) => `${r.name} ×${r.reads} (${r.subtree} each)`).join(', ')}`,
        );
      }
      const compile = shots[0]!.firstViewSeconds;
      console.log(
        `Wrote ${written.map(shown).join(', ')} in ${((performance.now() - started) / 1000).toFixed(1)}s (first view ${compile.toFixed(1)}s)` +
          (compile > 20
            ? '. Slow compile: see library/AUTHORING.md §6 (re-read nodes, noise2d on deep texcoords).'
            : ''),
      );
      for (const line of reports) console.log(line);
    } catch (error) {
      console.error(`ERROR ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  },
});

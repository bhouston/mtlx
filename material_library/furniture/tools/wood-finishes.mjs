import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = process.env.FURNITURE_CATALOG || path.resolve(root, '../../FURNITURE_MATERIALS.md');
let sections;
try {
  const source = await fs.readFile(catalogPath, 'utf8');
  sections = source.split(/^## /m).slice(1, 7);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  const entries = JSON.parse(await fs.readFile(path.join(root, 'tools/wood-finishes-manifest.json'), 'utf8'));
  sections = [...new Set(entries.map((e) => e.family))].map(
    (family) =>
      family +
      '\n' +
      entries
        .filter((e) => e.family === family)
        .map((e) => '- `' + e.name + '` — ' + e.description)
        .join('\n'),
  );
}
const familyDirs = [
  'natural-wood',
  'wood-grain-cuts-and-decorative-figuring',
  'stained-and-tinted-wood',
  'engineered-wood-fiberboard-paper-and-cork',
  'opaque-paint-lacquer-and-pigmented-finishes',
  'laminate-melamine-foil-and-coated-paper-surfaces',
];
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const val = (v, type) => ({
  value: v,
  type: type || (Array.isArray(v) ? 'vector2' : Number.isInteger(v) ? 'float' : 'float'),
});
class Graph {
  constructor() {
    this.nodes = [];
    this.i = 0;
    this.uv = this.n('texcoord', 'vector2', {}, 'uv');
  }
  n(cat, type, inputs = {}, name = `n${++this.i}`) {
    const ref = { name, type };
    this.nodes.push({ cat, type, inputs, name });
    return ref;
  }
  c(value, type = 'float', name) {
    return this.n('constant', type, { value: val(value, type) }, name);
  }
  op(cat, a, b, type = a.type || 'float') {
    return this.n(cat, type, {
      in1: typeof a === 'object' && !Array.isArray(a) ? a : val(a, type),
      in2: typeof b === 'object' && !Array.isArray(b) ? b : val(b, Array.isArray(b) ? type : 'float'),
    });
  }
  unary(cat, a, type = a.type) {
    return this.n(cat, type, { in: a });
  }
  noise(freq = [4, 4], amp = 1, oct = 2, offset = [3.17, 7.43], uv = this.uv) {
    const p = this.op('add', this.op('multiply', uv, freq, 'vector2'), offset, 'vector2');
    return this.n('fractal2d', 'float', { texcoord: p, amplitude: val(amp), octaves: val(oct, 'integer') });
  }
  smooth(a, lo, hi) {
    return this.n('smoothstep', 'float', { in: a, low: val(lo), high: val(hi) });
  }
  mix(a, b, m, type = 'float') {
    return this.n('mix', type, {
      bg: typeof a === 'object' && !Array.isArray(a) ? a : val(a, type),
      fg: typeof b === 'object' && !Array.isArray(b) ? b : val(b, type),
      mix: m,
    });
  }
  input(k, v, type) {
    return `<input name="${k}" type="${v.type || type}" ${v.name ? `nodename="${v.name}"${v.output ? ` output="${v.output}"` : ''}` : `value="${esc(Array.isArray(v.value) ? v.value.join(', ') : v.value)}"`} />`;
  }
  xml(outputs) {
    const needed = new Set();
    const visit = (r) => {
      if (!r?.name || needed.has(r.name)) return;
      needed.add(r.name);
      const node = this.nodes.find((n) => n.name === r.name);
      for (const v of Object.values(node.inputs)) visit(v);
    };
    Object.values(outputs).forEach(visit);
    return this.nodes
      .filter((n) => needed.has(n.name))
      .map(
        (n) =>
          `    <${n.cat} name="${n.name}" type="${n.type}">${Object.entries(n.inputs)
            .map(([k, v]) => this.input(k, v, n.type))
            .join('')}</${n.cat}>`,
      )
      .join('\n');
  }
}
const species = {
  whiteOak: [0.48, 0.32, 0.16],
  redOak: [0.48, 0.28, 0.19],
  europeanOak: [0.43, 0.26, 0.12],
  americanWalnut: [0.13, 0.065, 0.045],
  europeanWalnut: [0.2, 0.12, 0.075],
  blackCherry: [0.38, 0.15, 0.065],
  hardMaple: [0.62, 0.49, 0.32],
  birdsEyeMaple: [0.58, 0.43, 0.24],
  curlyMaple: [0.55, 0.36, 0.17],
  beech: [0.58, 0.39, 0.28],
  ash: [0.58, 0.43, 0.23],
  elm: [0.31, 0.17, 0.075],
  birch: [0.62, 0.5, 0.34],
  alder: [0.46, 0.25, 0.14],
  poplar: [0.56, 0.51, 0.33],
  sycamore: [0.55, 0.43, 0.25],
  hickory: [0.48, 0.3, 0.15],
  pecan: [0.4, 0.23, 0.11],
  teak: [0.32, 0.17, 0.065],
  iroko: [0.38, 0.23, 0.09],
  sapele: [0.3, 0.095, 0.045],
  mahogany: [0.33, 0.11, 0.055],
  acacia: [0.38, 0.19, 0.06],
  mango: [0.4, 0.29, 0.14],
  rubberwood: [0.57, 0.43, 0.26],
  pine: [0.63, 0.47, 0.24],
  knotFreePine: [0.63, 0.47, 0.24],
  douglasFir: [0.48, 0.25, 0.1],
  spruce: [0.64, 0.53, 0.32],
  cedar: [0.39, 0.17, 0.08],
  larch: [0.48, 0.29, 0.1],
  wenge: [0.065, 0.031, 0.015],
  ebony: [0.018, 0.012, 0.008],
  zebrawood: [0.46, 0.29, 0.12],
  rosewood: [0.16, 0.047, 0.025],
  oliveWood: [0.52, 0.35, 0.13],
  eucalyptus: [0.42, 0.23, 0.12],
  bambooNatural: [0.62, 0.46, 0.22],
  bambooCarbonized: [0.34, 0.16, 0.055],
};
const colors = {
  White: [0.76, 0.76, 0.76],
  Ivory: [0.73, 0.66, 0.51],
  Cream: [0.74, 0.65, 0.4],
  Beige: [0.48, 0.36, 0.23],
  Taupe: [0.24, 0.19, 0.15],
  LightGray: [0.5, 0.5, 0.5],
  MediumGray: [0.22, 0.22, 0.22],
  Gray: [0.26, 0.26, 0.26],
  Charcoal: [0.045, 0.045, 0.045],
  Black: [0.008, 0.008, 0.008],
  Navy: [0.012, 0.025, 0.075],
  PowderBlue: [0.35, 0.52, 0.65],
  Teal: [0.025, 0.25, 0.24],
  Sage: [0.25, 0.33, 0.23],
  Olive: [0.19, 0.21, 0.065],
  ForestGreen: [0.018, 0.085, 0.035],
  Mustard: [0.53, 0.32, 0.035],
  Terracotta: [0.42, 0.12, 0.055],
  Red: [0.52, 0.018, 0.012],
  Burgundy: [0.16, 0.012, 0.025],
  Blush: [0.62, 0.34, 0.32],
  Lavender: [0.43, 0.35, 0.53],
  Orange: [0.75, 0.17, 0.015],
  Emerald: [0.01, 0.3, 0.11],
  Champagne: [0.59, 0.45, 0.28],
  Silver: [0.63, 0.65, 0.67],
  Gold: [0.72, 0.42, 0.09],
  Bronze: [0.3, 0.14, 0.055],
  Brown: [0.15, 0.065, 0.025],
  Natural: [0.46, 0.29, 0.13],
  Caramel: [0.35, 0.16, 0.055],
  Slate: [0.12, 0.14, 0.16],
};
const colorFor = (name) =>
  Object.entries(colors)
    .toSorted((a, b) => b[0].length - a[0].length)
    .find(([key]) => name.endsWith(key))?.[1] || [0.4, 0.28, 0.15];
const mul = (c, k) => c.map((x) => Math.min(0.85, x * k));
const finish = (name, desc) =>
  /Piano|Gloss|glossy|highly polished/i.test(name + ' ' + desc)
    ? 0.1
    : /Oil/.test(name)
      ? 0.48
      : /Satin|satin|low-sheen/i.test(name + ' ' + desc)
        ? 0.36
        : /Unfinished|Raw|uncoated/.test(name + ' ' + desc)
          ? 0.83
          : 0.67;
function wood(g, name, desc, family) {
  const sp =
    Object.keys(species)
      .toSorted((a, b) => b.length - a.length)
      .find((k) => name.toLowerCase().includes(k.toLowerCase())) ||
    (/walnut/i.test(name)
      ? 'americanWalnut'
      : /maple/i.test(name)
        ? 'hardMaple'
        : /cherry/i.test(name)
          ? 'blackCherry'
          : /oak/i.test(name)
            ? 'whiteOak'
            : /softwood/i.test(name)
              ? 'pine'
              : /bamboo/i.test(name)
                ? 'bambooNatural'
                : 'whiteOak');
  let c = [...species[sp]];
  const stains = {
    Whitewash: [0.58, 0.55, 0.48],
    GrayWash: [0.23, 0.25, 0.25],
    Honey: [0.52, 0.27, 0.055],
    Amber: [0.4, 0.15, 0.025],
    Cognac: [0.25, 0.065, 0.02],
    Walnut: [0.13, 0.06, 0.025],
    Espresso: [0.035, 0.015, 0.007],
    Black: [0.012, 0.012, 0.011],
  };
  if (family === 2) {
    const stain = Object.keys(stains).find((k) => name.includes(k));
    if (stain) c = stains[stain].map((v, i) => v * 0.84 + c[i] * 0.16);
  }
  if (/bleach/i.test(name)) c = [0.68, 0.61, 0.47];
  if (/smoke/i.test(name)) c = [0.16, 0.12, 0.085];
  if (/OliveFigure/.test(name)) c = [0.55, 0.4, 0.2];
  if (/lacewood/i.test(name)) c = [0.45, 0.22, 0.1];
  if (/ClearOil/.test(name)) c = mul(c, 0.84);
  const rough = finish(name, desc);
  const end = /EndGrain/.test(name);
  const straight = /QuarterSawn|RiftSawn|bamboo|knotFree|douglasFir|spruce|cedar|larch/i.test(name);
  const sep = g.n('separate2', 'multioutput', { in: g.uv });
  const u = { name: sep.name, type: 'float', output: 'outx' },
    v = { name: sep.name, type: 'float', output: 'outy' };
  const wob = g.noise([2.3, 6.1], 0.015, 2);
  let phase;
  if (end) {
    const rel = g.op('add', g.uv, [-0.14, -0.27], 'vector2');
    phase = g.op('multiply', g.op('add', g.unary('magnitude', rel, 'float'), wob), 180);
  } else if (straight) {
    phase = g.op('multiply', g.op('add', u, g.op('multiply', wob, 0.22)), /Rift/.test(name) ? 90 : 65);
  } else {
    const x = g.op('subtract', u, 0.47),
      y = g.op('add', g.op('multiply', v, 0.075), 0.09);
    const r = g.unary('sqrt', g.op('add', g.op('multiply', x, x), g.op('multiply', y, y)));
    phase = g.op('multiply', g.op('add', r, wob), 55);
  }
  phase = g.op('add', phase, g.noise([18, 4], 0.45, 2, [3.4, 14.6]));
  const ring = g.op('add', g.op('multiply', g.unary('sin', g.op('multiply', phase, 6.283185)), 0.5), 0.5);
  const grain = g.smooth(ring, 0.18, 0.9);
  const fibers = g.op('add', g.noise(end ? [650, 650] : [1200, 180], 0.5, 2, [14.7, 9.3]), 0.5);
  let tone = g.mix(0.87, 1.025, grain);
  tone = g.op('multiply', tone, g.mix(0.96, 1.01, fibers));
  tone = g.op('multiply', tone, g.op('add', g.noise([3, 3], 0.1, 2, [8.1, 3.7]), 1));
  if (/zebra|olive|wenge|rosewood|hickory|acacia/i.test(sp))
    tone = g.op('multiply', tone, g.mix(0.35, 1.0, g.smooth(g.noise([22, 2], 1, 2), -0.25, 0.3)));
  if (/birdsEye|Burl|Pommele/.test(name)) {
    const p = g.op('add', g.op('multiply', g.uv, [35, 35], 'vector2'), [4.3, 7.7], 'vector2');
    const f = g.n('worleynoise2d', 'float', { texcoord: p, jitter: val(1) });
    tone = g.op('multiply', tone, g.mix(0.64, 1.1, g.smooth(f, 0.12, 0.5)));
  }
  if (/curly|ribbon|sapele|mahogany/i.test(name + ' ' + desc)) {
    const shimmer = g.op(
      'add',
      g.op('multiply', g.unary('sin', g.op('add', g.op('multiply', v, 115), g.noise([5, 7], 2, 2))), 0.5),
      0.5,
    );
    tone = g.op('multiply', tone, g.mix(0.82, 1.07, shimmer));
  }
  if ((/QuarterSawn|ray|fleck/.test(name + ' ' + desc) && !/RiftSawn/.test(name)) || /lacewood/.test(name)) {
    const fleck = g.smooth(g.noise([100, 220], 1, 2), 0.36, 0.6);
    tone = g.op('multiply', tone, g.mix(1, 1.1, fleck));
  }
  if (/clean sound knots/.test(desc)) {
    const loc = g.op('subtract', g.uv, [0.42, 0.63], 'vector2');
    const stretch = g.op('multiply', loc, [0.5, 1], 'vector2');
    const radius = g.unary('magnitude', stretch, 'float');
    tone = g.op('multiply', tone, g.mix(0.22, 1, g.smooth(radius, 0.006, 0.022)));
  }
  const base = g.op('multiply', g.c(c, 'color3'), tone, 'color3');
  const open = /open pores|coarse|exposed pore/.test(desc) && !/tight pores|fine pores/.test(desc);
  const pore = g.op('multiply', g.smooth(fibers, 0.57, 0.8), g.mix(0.15, 1, grain));
  const depth =
    (open ? 0.000045 : 0.000012) * (rough < 0.2 ? 0.08 : rough < 0.5 ? 0.45 : 1) * (family === 5 ? 0.25 : 1);
  const height = g.op('add', g.op('multiply', grain, -depth * 0.6), g.op('multiply', pore, -depth));
  const roughNode = g.op('add', g.c(rough), g.op('multiply', pore, rough < 0.2 ? 0.015 : 0.05));
  return {
    base,
    height,
    rough: roughNode,
    coat: rough < 0.2 ? 0.8 : /Clear|Satin/.test(name) ? 0.25 : 0,
    coatRough: rough < 0.2 ? 0.08 : 0.3,
    anisotropy: /curly|sapele|mahogany|Pommele/.test(name) ? 0.3 : 0.07,
  };
}
function other(g, name, desc, family) {
  let c = colorFor(name),
    rough = finish(name, desc),
    f = [180, 180],
    depth = 0.000002,
    contrast = 0.012,
    metal = 0,
    coat = 0;
  if (/FineTexture|fine stipple/.test(name + ' ' + desc)) {
    f = [400, 400];
    depth = 0.000012;
    rough = 0.72;
  }
  if (/Wrinkle/.test(name)) {
    f = [150, 150];
    depth = 0.000045;
    rough = 0.6;
  }
  if (/softTouch|antiFingerprint/.test(name)) {
    f = [550, 550];
    depth = 0.000003;
    rough = 0.87;
  }
  if (family === 3) {
    contrast = 0.14;
    rough = /Sealed/.test(name) ? 0.48 : 0.85;
    depth = 0.000018;
    f = [500, 70];
    if (/DensityFiberboard/.test(name)) c = /highDensity/.test(name) ? [0.25, 0.14, 0.065] : [0.44, 0.28, 0.12];
    if (/hardboard/.test(name)) c = [0.15, 0.06, 0.025];
    if (/particleboard|orientedStrand/.test(name)) {
      c = [0.43, 0.25, 0.095];
      f = /oriented/.test(name) ? [12, 55] : [95, 95];
      depth = 0.00006;
      contrast = 0.4;
    }
    if (/Paper|cardboard/.test(name)) {
      c = /Black/.test(name)
        ? colors.Black
        : /Slate/.test(name)
          ? colors.Slate
          : /Brown/.test(name)
            ? colors.Brown
            : [0.43, 0.27, 0.12];
      f = [700, 120];
      depth = 0.000008;
      contrast = 0.05;
    }
    if (/cork/.test(name)) {
      f = /Coarse/.test(name) ? [90, 90] : /Fine/.test(name) ? [420, 420] : [180, 180];
      depth = 0.000075;
      contrast = 0.35;
    }
  }
  const noise = g.noise(f, 1, 2),
    mask = g.smooth(noise, -0.55, 0.55);
  let tone = g.mix(1 - contrast, 1 + contrast, mask),
    height = g.op('multiply', noise, depth);
  if (/Edge|CrossSection/.test(name) && !/particleboard|Fiberboard/.test(name)) {
    const sep = g.n('separate2', 'multioutput', { in: g.uv });
    const v = { name: sep.name, output: 'outy', type: 'float' };
    const sine = g.op(
      'add',
      g.op('multiply', g.unary('sin', g.op('multiply', v, /CrossSection/.test(name) ? 18000 : 3300)), 0.5),
      0.5,
    );
    tone = g.op('multiply', tone, g.mix(0.55, 1.1, g.smooth(sine, 0.25, 0.75)));
    c = /Black/.test(name) ? colors.Black : /Caramel/.test(name) ? colors.Caramel : [0.52, 0.37, 0.2];
  }
  if (/cork/.test(name)) {
    const coords = g.op('add', g.op('multiply', g.uv, f, 'vector2'), [3.7, 9.1], 'vector2');
    const cells = g.n('worleynoise2d', 'float', { texcoord: coords, jitter: val(0.85), style: val(1, 'integer') });
    tone = g.op('multiply', tone, g.mix(0.65, 1.2, cells));
  }
  if (/ScreenBack|linenPrint/.test(name)) {
    const sep = g.n('separate2', 'multioutput', { in: g.uv });
    const a = g.unary('sin', g.op('multiply', { name: sep.name, type: 'float', output: 'outx' }, 1800));
    const b = g.unary('sin', g.op('multiply', { name: sep.name, type: 'float', output: 'outy' }, 1800));
    const weave = g.op('multiply', a, b);
    tone = g.op('multiply', tone, g.op('add', g.op('multiply', weave, 0.07), 1));
    height = g.op('multiply', weave, /linenPrint/.test(name) ? 0.000001 : 0.000025);
  }
  if (/Marble/.test(name)) {
    c = /White/.test(name) ? colors.White : colors.Black;
    const vein = g.op('subtract', g.c(1), g.smooth(g.unary('absval', g.noise([3, 12], 1, 3)), 0.025, 0.1));
    return {
      base: g.mix(c, /White/.test(name) ? [0.22, 0.23, 0.24] : [0.65, 0.65, 0.65], vein, 'color3'),
      rough: g.c(0.38),
      height: g.c(0),
    };
  }
  if (/ConcreteGray/.test(name)) {
    c = colors.MediumGray;
    tone = g.op('add', g.noise([9, 9], 0.15, 3), 1);
    height = g.c(0);
  }
  if (/Metallic|Pearl/.test(name)) {
    const flakes = g.smooth(noise, 0.3, 0.6);
    tone = g.mix(0.85, 1.2, flakes);
    metal = /Metallic/.test(name) ? g.op('multiply', flakes, 0.75) : 0;
    coat = 0.9;
    rough = 0.21;
    height = g.op('multiply', noise, 0.000001);
  }
  return {
    base: g.op('multiply', g.c(c, 'color3'), tone, 'color3'),
    rough: g.op('add', g.c(rough), g.op('multiply', mask, rough < 0.2 ? 0.008 : 0.025)),
    height,
    metal,
    coat,
    coatRough: 0.08,
    specular: /softTouch|antiFingerprint/.test(name) ? 0.2 : 0.5,
    sheen: /softTouch/.test(name) ? 0.15 : 0,
  };
}
const entries = [];
for (let family = 0; family < sections.length; family++) {
  const section = sections[family];
  for (const match of section.matchAll(/^- `([^`]+)` — (.+)$/gm)) {
    const [, name, desc] = match;
    const g = new Graph();
    const isWood = family < 3 || /PlywoodFace|woodgrainLaminate/.test(name);
    const p = isWood ? wood(g, name, desc, family) : other(g, name, desc, family);
    const height = g.n('add', 'float', { in1: p.height, in2: val(0) }, 'height_m');
    const mm = g.op('multiply', height, 1000);
    const uvmm = g.op('multiply', g.uv, 1000, 'vector2');
    const tangent = g.n('heighttonormal', 'vector3', { in: mm, scale: val(16), texcoord: uvmm });
    const normal = g.n('normalmap', 'vector3', { in: tangent });
    const outputs = {
      base_color: p.base,
      roughness: p.rough,
      metalness: typeof p.metal === 'object' ? p.metal : g.c(p.metal || 0),
      normal,
      height,
    };
    const surface = {
      base: val(1),
      base_color: { graph: true, out: 'base_color', type: 'color3' },
      specular_roughness: { graph: true, out: 'roughness', type: 'float' },
      metalness: { graph: true, out: 'metalness', type: 'float' },
      normal: { graph: true, out: 'normal', type: 'vector3' },
      specular: val(p.specular ?? 0.5),
      specular_IOR: val(1.5),
      coat: val(p.coat || 0),
      coat_roughness: val(p.coatRough || 0.3),
      coat_normal: { graph: true, out: 'normal', type: 'vector3' },
      specular_anisotropy: val(p.anisotropy || 0),
      sheen: val(p.sheen || 0),
    };
    const xml = `<?xml version="1.0"?>\n<materialx version="1.39" colorspace="lin_rec709">\n  <!-- ${esc(desc).replaceAll('--', '—')} -->\n  <!-- UV 0..1 = 1 metre. Height output is in metres. Clean new finish; no wear. -->\n  <!-- Scales: growth bands 11-18 mm; pores 0.83 mm across / 5.6 mm along; end-grain fiber clusters 1.5 mm; rays 10 x 4.5 mm, sparse 10 percent pale modulation. -->\n  <!-- End grain rings 5.6 mm; plywood plies 1.9 mm; cork cells 2.4-11 mm; polymer texture 1.8-5.6 mm. -->\n  <!-- Relief: wood pores 1-45 micrometres by finish; cork 75 micrometres; polymer 1-45 micrometres. -->\n  <nodegraph name="NG_${name}">\n${g.xml(outputs)}\n${Object.entries(
      outputs,
    )
      .map(([key, r]) => `    <output name="${key}" type="${r.type}" nodename="${r.name}" />`)
      .join('\n')}\n  </nodegraph>\n  <standard_surface name="SR_${name}" type="surfaceshader">\n${Object.entries(
      surface,
    )
      .map(([key, v]) =>
        v.graph
          ? `    <input name="${key}" type="${v.type}" nodegraph="NG_${name}" output="${v.out}" />`
          : `    ${g.input(key, v)}`,
      )
      .join(
        '\n',
      )}\n  </standard_surface>\n  <surfacematerial name="M_${name}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_${name}" /></surfacematerial>\n</materialx>\n`;
    const directory = path.join(root, familyDirs[family]);
    await fs.mkdir(directory, { recursive: true });
    const file = path.join(directory, `${name}.mtlx`);
    await fs.writeFile(file, xml);
    entries.push({ name, family: section.split('\n')[0], file: path.relative(root, file), description: desc });
  }
}
await fs.writeFile(path.join(root, 'tools/wood-finishes-manifest.json'), JSON.stringify(entries, null, 2) + '\n');
console.log(`Generated ${entries.length} furniture materials`);

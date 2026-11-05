/** Furniture families 7–12. Metric procedural yarns, hide grain and decorative weave recipes.
 * Run: node material_library/furniture/generators/textiles.mjs
 * Yarn pitch is metric (0.3–1.2 mm for woven cloth); optical sheen models unresolved finer fibers.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const entries = JSON.parse(await readFile(path.join(here, 'textile-catalog.json'), 'utf8'));
const esc = (x) => String(x).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const palettes = {
  Honey: [0.5, 0.3, 0.095],
  Bleached: [0.7, 0.64, 0.49],
  DarkBrown: [0.055, 0.023, 0.012],
  White: [0.76, 0.76, 0.73],
  Ivory: [0.72, 0.66, 0.52],
  Cream: [0.72, 0.62, 0.43],
  Oatmeal: [0.47, 0.4, 0.31],
  Beige: [0.45, 0.33, 0.22],
  Taupe: [0.22, 0.17, 0.14],
  Camel: [0.43, 0.25, 0.105],
  Chocolate: [0.075, 0.031, 0.016],
  Espresso: [0.022, 0.012, 0.009],
  LightGray: [0.47, 0.47, 0.46],
  MediumGray: [0.22, 0.22, 0.22],
  Gray: [0.27, 0.28, 0.29],
  Charcoal: [0.047, 0.05, 0.055],
  Black: [0.009, 0.009, 0.012],
  Navy: [0.012, 0.027, 0.075],
  SlateBlue: [0.105, 0.17, 0.23],
  Slate: [0.105, 0.17, 0.23],
  Blue: [0.035, 0.14, 0.35],
  PowderBlue: [0.36, 0.52, 0.64],
  Teal: [0.025, 0.2, 0.19],
  Sage: [0.23, 0.3, 0.21],
  Olive: [0.19, 0.2, 0.067],
  ForestGreen: [0.025, 0.1, 0.047],
  Forest: [0.025, 0.1, 0.047],
  Green: [0.06, 0.22, 0.09],
  Mustard: [0.48, 0.3, 0.025],
  Terracotta: [0.44, 0.13, 0.065],
  Burgundy: [0.17, 0.018, 0.035],
  Blush: [0.56, 0.32, 0.29],
  Red: [0.5, 0.025, 0.023],
  Brown: [0.16, 0.072, 0.025],
  Cognac: [0.27, 0.085, 0.025],
  Caramel: [0.39, 0.19, 0.05],
  Tan: [0.44, 0.28, 0.13],
  Gold: [0.48, 0.31, 0.075],
  Rust: [0.39, 0.105, 0.029],
  Natural: [0.53, 0.39, 0.23],
  Yellow: [0.65, 0.45, 0.025],
  Orange: [0.65, 0.17, 0.025],
  Pink: [0.56, 0.24, 0.29],
  Purple: [0.17, 0.035, 0.22],
  Lavender: [0.4, 0.31, 0.49],
  Emerald: [0.012, 0.25, 0.1],
};
const words = Object.keys(palettes).sort((a, b) => b.length - a.length);
function colors(name, description) {
  let s = name,
    found = [];
  while (s.length) {
    const w = words.find((w) => s.startsWith(w));
    if (w) {
      found.push(palettes[w]);
      s = s.slice(w.length);
    } else s = s.slice(1);
  }
  if (!found.length) {
    const d = description.toLowerCase();
    const w = words.find((w) => d.includes(w.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()));
    found = [palettes[w] ?? palettes.Natural];
  }
  return found;
}
class Graph {
  constructor() {
    this.nodes = [];
    this.i = 0;
    this.uv = this.node('texcoord', 'vector2', {}, 'uv');
  }
  node(cat, type, inputs = {}, name) {
    name ??= `${cat}_${++this.i}`;
    this.nodes.push({ cat, type, inputs, name });
    return { name, type };
  }
  v(value, type = 'float') {
    return { value, type };
  }
  op(cat, a, b, type = a?.type ?? 'float') {
    return this.node(cat, type, {
      in1: typeof a === 'object' ? a : this.v(a, type),
      in2: typeof b === 'object' ? b : this.v(b, type),
    });
  }
  unary(cat, a) {
    return this.node(cat, a.type, { in: a });
  }
  add(a, b) {
    return this.op('add', a, b);
  }
  mul(a, b) {
    return this.op('multiply', a, b);
  }
  sub(a, b) {
    return this.op('subtract', a, b);
  }
  smooth(a, lo, hi) {
    return this.node('smoothstep', 'float', { in: a, low: this.v(lo), high: this.v(hi) });
  }
  mix(a, b, m, type = 'float') {
    return this.node('mix', type, {
      bg: typeof a === 'object' && !Array.isArray(a) ? a : this.v(a, type),
      fg: typeof b === 'object' && !Array.isArray(b) ? b : this.v(b, type),
      mix: m,
    });
  }
  clamp(a) {
    return this.node('clamp', a.type, { in: a, low: this.v(0), high: this.v(1) });
  }
  coord(fx, fy = fx, offset = [0.137, 0.731]) {
    return this.add(this.mul(this.uv, this.v([fx, fy], 'vector2')), this.v(offset, 'vector2'));
  }
  noise(fx, fy = fx) {
    return this.node('noise2d', 'float', { texcoord: this.coord(fx, fy), amplitude: this.v(0.8), pivot: this.v(0.5) });
  }
  axis(axis) {
    this.sep ??= this.node('separate2', 'multioutput', { in: this.uv }, 'uv_sep');
    return { ...this.sep, type: 'float', output: axis === 'u' ? 'outx' : 'outy' };
  }
  wave(axis, f) {
    return this.add(this.mul(this.unary('sin', this.mul(this.axis(axis), Math.PI * 2 * f)), 0.5), 0.5);
  }
  yarnWave(axis, f) {
    // Irregular yarn spacing preserves mean metric pitch without a coherent lattice across curved UVs.
    const jitter = this.mul(this.sub(this.noise(f * 0.31, f * 0.27), 0.5), 0.65);
    const phase = this.add(this.mul(this.axis(axis), f), jitter);
    return this.add(this.mul(this.unary('sin', this.mul(phase, Math.PI * 2)), 0.5), 0.5);
  }
  worley(fx, fy = fx, jitter = 1) {
    return this.node('worleynoise2d', 'float', { texcoord: this.coord(fx, fy), jitter: this.v(jitter) });
  }
  xml(outputs) {
    const live = new Set();
    const visit = (r) => {
      if (!r?.name || live.has(r.name)) return;
      live.add(r.name);
      const n = this.nodes.find((n) => n.name === r.name);
      Object.values(n.inputs).forEach(visit);
    };
    Object.values(outputs).forEach(visit);
    return this.nodes
      .filter((n) => live.has(n.name))
      .map(
        (n) =>
          `    <${n.cat} name="${n.name}" type="${n.type}">${Object.entries(n.inputs)
            .map(
              ([key, r]) =>
                `<input name="${key}" type="${r.type}" ${r.name ? `nodename="${r.name}"${r.output ? ` output="${r.output}"` : ''}` : `value="${Array.isArray(r.value) ? r.value.join(', ') : esc(r.value)}"`} />`,
            )
            .join('')}</${n.cat}>`,
      )
      .join('\n');
  }
}
function parameters(e) {
  const n = e.name;
  let spacing = 0.00055,
    height = 0.000018,
    rough = 0.78,
    sheen = 0.23,
    spec = 0.2,
    aniso = 0.1,
    kind = 'weave';
  if (/canvas|basket|outdoor|webbing/i.test(n)) {
    spacing = 0.0012;
    height = 0.00004;
  }
  if (/linen|hemp|ramie|jute|sisal|abaca/i.test(n)) {
    spacing = 0.0009;
    height = 0.000025;
    rough = 0.88;
  }
  if (/silk|sateen|satin|viscose|lining/i.test(n)) {
    spacing = 0.0003;
    height = 0.000006;
    rough = 0.37;
    sheen = 0.48;
    spec = 0.32;
    aniso = 0.55;
  }
  if (/flannel|felt|batting|spunbond|microfiber/i.test(n)) {
    kind = 'felt';
    spacing = 0.0004;
    height = 0.000008;
    rough = 0.94;
    sheen = 0.25;
  }
  if (/velvet/i.test(n)) {
    kind = 'velvet';
    spacing = 0.0002;
    height = 0.000006;
    rough = 0.6;
    sheen = 0.8;
    aniso = 0.8;
  }
  if (/boucle|chenille|teddy|shearling|sheepskin/i.test(n)) {
    kind = 'loops';
    spacing = 0.003;
    height = 0.0001;
    rough = 0.9;
    sheen = 0.5;
  }
  if (/fur|horsehair|haironhide/i.test(n)) {
    kind = 'fur';
    height = 0.0001;
    rough = 0.76;
    sheen = 0.65;
    aniso = 0.7;
  }
  if (/jersey|knit|jacquard/i.test(n)) {
    kind = 'knit';
    spacing = 0.0018;
    height = 0.00006;
  }
  if (/corduroy/i.test(n)) {
    kind = 'cord';
    spacing = /wide/i.test(n) ? 0.0045 : 0.0016;
    height = 0.00006;
    sheen = 0.6;
  }
  if (/leather|rawhide/i.test(n)) {
    kind = 'leather';
    rough = 0.47;
    sheen = 0.04;
    spec = 0.5;
    height = 0.000025;
    spacing = 0.001;
  }
  if (/suede|nubuck/i.test(n)) {
    kind = 'felt';
    rough = 0.88;
    sheen = 0.5;
    spec = 0.18;
    height = 0.000025;
  }
  if (/patent/i.test(n)) {
    rough = 0.12;
    height = 0.000003;
  }
  if (/nappa|smooth|silicone/i.test(n) && kind === 'leather') {
    rough = 0.38;
    height = 0.000018;
  }
  if (/pebbled|bonded/i.test(n)) {
    height = 0.00007;
    spacing = 0.0025;
  }
  if (/mesh/i.test(n)) {
    kind = 'mesh';
    spacing = 0.0028;
    height = 0.00008;
    rough = 0.52;
    sheen = 0.12;
    spec = 0.35;
  }
  if (/wicker|rattan|cane|willow|seagrass|hyacinth|paperCord/i.test(n)) {
    kind = 'fiber';
    spacing = 0.0008;
    height = 0.000025;
    rough = 0.61;
    sheen = 0.08;
    spec = 0.4;
  }
  if (/rope|coir|jute|sisal|abaca/i.test(n)) {
    kind = 'rope';
    spacing = 0.005;
    height = 0.00012;
    rough = 0.77;
    sheen = 0.12;
  }
  if (/foam/i.test(n)) {
    kind = 'foam';
    spacing = /melamine/i.test(n) ? 0.0002 : 0.0007;
    height = 0.000012;
    rough = 0.92;
    sheen = 0;
    spec = 0.2;
  }
  return { kind, spacing, height, rough, sheen, spec, aniso };
}
function pattern(g, e, cs) {
  const n = e.name;
  let a = g.axis('u'),
    b = g.axis('v'),
    m,
    other;
  const band = (x, f, width = 0.5) => g.smooth(g.unary('fract', g.mul(x, f)), width - 0.025, width + 0.025);
  if (/Pinstripe/i.test(n)) {
    m = band(a, 40, 0.94);
  } else if (/Stripe/i.test(n)) {
    m = band(a, /Ticking/.test(n) ? 95 : 20);
  } else if (/Gingham/i.test(n)) {
    m = g.mul(g.add(band(a, 45), band(b, 45)), 0.5);
  } else if (/Check/i.test(n)) {
    m = g.op('max', band(a, 28, 0.92), band(b, 28, 0.92));
  } else if (/Plaid/i.test(n)) {
    m = g.mul(g.add(band(a, 16, 0.62), band(b, 16, 0.62)), 0.5);
    other = g.op('max', band(a, 64, 0.93), band(b, 64, 0.93));
  } else if (/Herringbone/i.test(n)) {
    const dir = g.sub(g.mul(band(a, 24), 2), 1);
    m = band(g.add(b, g.mul(a, dir)), 150);
  } else if (/Houndstooth/i.test(n)) {
    const u = g.mul(a, 55),
      v = g.mul(b, 55);
    const check = g.op('modulo', g.add(g.unary('floor', u), g.unary('floor', v)), 2);
    const tooth = band(g.add(a, b), 110, 0.72);
    m = g.clamp(g.mul(g.add(check, tooth), 0.65));
  } else if (/Ikat/i.test(n)) {
    const edge = g.add(
      g.unary('absval', g.sub(g.unary('fract', g.mul(a, 18)), 0.5)),
      g.unary('absval', g.sub(g.unary('fract', g.mul(b, 12)), 0.5)),
    );
    m = g.smooth(g.add(edge, g.mul(g.noise(600, 25), 0.12)), 0.44, 0.58);
  } else if (/Geometric/i.test(n)) {
    m = g.smooth(
      g.add(
        g.unary('absval', g.sub(g.unary('fract', g.mul(a, 20)), 0.5)),
        g.unary('absval', g.sub(g.unary('fract', g.mul(b, 20)), 0.5)),
      ),
      0.42,
      0.48,
    );
  } else if (/Toile/i.test(n)) {
    const u = g.sub(g.unary('fract', g.mul(a, 6)), 0.5),
      v = g.sub(g.unary('fract', g.mul(b, 5)), 0.5);
    const inv = (x, lo, hi) => g.sub(g.v(1), g.smooth(x, lo, hi));
    const box = (x, y, w, h) => g.mul(inv(g.unary('absval', x), w, w + 0.006), inv(g.unary('absval', y), h, h + 0.006));
    const house = box(g.add(u, 0.08), g.add(v, 0.1), 0.13, 0.1);
    const roof = g.mul(
      inv(g.add(g.unary('absval', g.add(u, 0.08)), g.mul(g.sub(v, g.v(0.01)), 0.8)), 0.13, 0.14),
      g.smooth(v, 0.005, 0.012),
    );
    const tree = g.mul(
      inv(
        g.add(
          g.mul(g.mul(g.sub(u, g.v(0.25)), g.sub(u, g.v(0.25))), 2),
          g.mul(g.sub(v, g.v(0.12)), g.sub(v, g.v(0.12))),
        ),
        0.025,
        0.03,
      ),
      g.smooth(v, -0.08, -0.06),
    );
    const trunk = box(g.sub(u, g.v(0.25)), g.add(v, 0.1), 0.012, 0.1);
    const horizon = box(u, g.add(v, g.add(g.mul(g.unary('sin', g.mul(u, 12)), 0.025), 0.23)), 0.48, 0.006);
    m = g.op('max', g.op('max', house, roof), g.op('max', g.op('max', tree, trunk), horizon));
  } else if (/Floral|Botanical|Damask|Paisley/i.test(n)) {
    // Curved petal/leaf medallions, with distinct layout frequencies and satin motif direction.
    const u = g.sub(g.unary('fract', g.mul(a, /Toile/.test(n) ? 7 : 12)), 0.5),
      v = g.sub(g.unary('fract', g.mul(b, /Toile/.test(n) ? 5 : 9)), 0.5);
    const uu = g.mul(u, u),
      vv = g.mul(v, v);
    const radial = g.add(uu, vv);
    const petal = g.add(radial, g.mul(g.mul(g.unary('sin', g.mul(u, 22)), g.unary('sin', g.mul(v, 22))), 0.075));
    m = g.sub(g.v(1), g.smooth(petal, 0.095, 0.115));
    if (/Botanical|Floral/.test(n)) other = g.sub(g.v(1), g.smooth(g.add(g.mul(uu, 5), vv), 0.12, 0.16));
    if (/Paisley/.test(n)) m = g.sub(g.v(1), g.smooth(g.add(g.mul(uu, 2), g.mul(vv, g.add(v, 1))), 0.08, 0.1));
  } else if (/Speckle|Fleck|Tweed|Marled|Heather/i.test(n)) {
    m = g.smooth(g.noise(350), 0.62, 0.75);
  }
  if (!m) return null;
  let c = g.mix(cs[1] ?? cs[0].map((x) => Math.min(0.8, x * 1.14)), cs[0], m, 'color3');
  if (other) c = g.mix(c, cs[2] ?? palettes.Sage, other, 'color3');
  return { color: c, mask: m };
}
const results = [];
for (const e of entries) {
  const g = new Graph(),
    p = parameters(e),
    cs = colors(e.name, e.description),
    c = cs[0],
    f = 1 / p.spacing;
  let micro = g.noise(900),
    drift = g.noise(4),
    relief,
    shade;
  if (['weave', 'basket', 'mesh', 'knit'].includes(p.kind)) {
    const x = g.yarnWave('u', f),
      y = g.yarnWave('v', f),
      cross = g.mul(x, y);
    if (p.kind === 'knit') {
      const slant = g.wave('u', f * 0.5);
      relief = g.mul(g.add(cross, slant), 0.5);
    } else if (/Twill/i.test(e.name)) {
      const diagonal = g.add(g.mul(g.unary('sin', g.mul(g.add(g.axis('u'), g.axis('v')), Math.PI * f)), 0.5), 0.5);
      relief = g.mul(g.add(cross, diagonal), 0.5);
    } else if (/Dupioni|linen|hemp|ramie/i.test(e.name)) relief = g.mix(cross, g.noise(3, 700), g.v(0.22));
    else relief = cross;
    if (p.kind === 'weave' && p.spacing < 0.001) {
      // The sub-mm yarn lattice is predominantly a statistical directional fiber field.
      // Its low-contrast residual weave retains detail without high-amplitude moire on distant curves.
      const fibers = g.mul(g.add(g.noise(f * 0.7, f * 0.07), g.noise(f * 0.07, f * 0.7)), 0.5);
      relief = g.mix(fibers, relief, g.v(0.1));
      p.height = Math.min(p.height, 0.000004);
      shade = g.mix(0.96, 1.01, relief);
    } else shade = g.mix(0.86, 1.03, relief);
    if (p.kind === 'mesh') p.opacity = g.op('max', g.smooth(x, 0.55, 0.75), g.smooth(y, 0.55, 0.75));
  } else if (p.kind === 'leather') {
    if (/Saffiano/i.test(e.name)) {
      const u = g.axis('u'),
        v = g.axis('v');
      const w = (x) => g.add(g.mul(g.unary('sin', g.mul(x, Math.PI * 2 * 350)), 0.5), 0.5);
      relief = g.mul(w(g.add(u, v)), w(g.sub(u, v)));
    } else relief = g.smooth(g.worley(f), 0.1, 0.65);
    shade = g.mix(0.84, 1.04, relief);
  } else if (p.kind === 'loops') {
    const cell = g.worley(f);
    relief = g.unary('absval', g.sub(cell, 0.3));
    shade = g.mix(0.79, 1.04, g.clamp(g.mul(relief, 2)));
  } else if (p.kind === 'foam') {
    relief = g.smooth(g.worley(f), 0.13, 0.48);
    shade = g.mix(0.67, 1.02, relief);
  } else if (p.kind === 'cord') {
    relief = g.wave('u', f);
    shade = g.mix(0.62, 1.04, relief);
  } else if (p.kind === 'rope') {
    relief = g.noise(700, 12);
    shade = g.mix(0.72, 1.03, relief);
  } else if (p.kind === 'fiber') {
    relief = g.noise(1200, 18);
    shade = g.mix(0.8, 1.03, relief);
  } else if (p.kind === 'fur') {
    relief = g.noise(/Long|horsehair/i.test(e.name) ? 350 : 650, 12);
    shade = g.mix(0.65, 1.06, relief);
  } else if (p.kind === 'velvet') {
    relief = g.noise(450, 30);
    shade = g.mix(0.88, 1.02, relief);
  } else {
    relief = g.noise(450);
    shade = g.mix(0.87, 1.03, relief);
  }
  const decorative = pattern(g, e, cs);
  let color = decorative?.color ?? g.v(c, 'color3');
  if (/hairOnHide/i.test(e.name)) {
    color = g.mix(cs.at(-1), cs[0], g.smooth(g.noise(9, 7), 0.4, 0.57), 'color3');
  }
  color = g.mul(color, g.v([1, 1, 1], 'color3')); // Keeps literal and node paths identical.
  const tint = g.mix(0.97, 1.03, drift);
  color = g.node('multiply', 'color3', { in1: color, in2: g.mul(shade, tint) }, 'base_color');
  const roughMask = /jacquard|Damask/i.test(e.name) && decorative ? decorative.mask : relief;
  const rough = g.node(
    'mix',
    'float',
    {
      bg: g.v(Math.max(0.05, p.rough - (/Damask/.test(e.name) ? 0.2 : 0.035))),
      fg: g.v(Math.min(1, p.rough + 0.035)),
      mix: roughMask,
    },
    'roughness',
  );
  const height = g.node('add', 'float', { in1: g.mul(relief, p.height), in2: g.mul(micro, p.height * 0.08) }, 'height');
  const uvmm = g.mul(g.uv, g.v([1000, 1000], 'vector2')),
    hmm = g.mul(height, 1000);
  const nt = g.node('heighttonormal', 'vector3', { in: hmm, scale: g.v(16), texcoord: uvmm }, 'n_tangent');
  const normal = g.node('normalmap', 'vector3', { in: nt }, 'n_world');
  const metal = g.node('constant', 'float', { value: g.v(0) }, 'metalness');
  const spec = g.node('constant', 'float', { value: g.v(p.spec) }, 'specular');
  const out = { base_color: color, specular_roughness: rough, metalness: metal, normal, specular: spec };
  if (p.opacity) out.opacity = g.node('convert', 'color3', { in: p.opacity }, 'opacity');
  const graph = `NG_${e.name}`;
  const extra = {
    sheen: p.sheen,
    sheen_color: c.map((x) => Math.min(0.85, x * 1.15 + 0.025)),
    sheen_roughness: /velvet|fur/i.test(e.name) ? 0.4 : 0.7,
    specular_anisotropy: p.aniso,
    diffuse_roughness: 0.25,
  };
  if (/patent/i.test(e.name)) {
    extra.coat = 0.65;
    extra.coat_roughness = 0.08;
  }
  if (/rawhide/i.test(e.name)) {
    extra.transmission = 0.18;
    extra.transmission_color = c;
    extra.transmission_depth = 0.003;
  }
  const outputs = Object.entries(out)
    .map(([k, r]) => `    <output name="${k}_out" type="${r.type}" nodename="${r.name}" />`)
    .join('\n');
  const inputs = Object.entries(out)
    .map(([k, r]) => `    <input name="${k}" type="${r.type}" nodegraph="${graph}" output="${k}_out" />`)
    .join('\n');
  const xml = `<?xml version="1.0"?>\n<materialx version="1.39" colorspace="lin_rec709">\n  <!-- Clean new furniture sample. UV 0..1 = 1 metre; heights in metres. -->\n  <!-- ${esc(e.description).replaceAll('--', '—')} -->\n  <!-- ${p.kind}: pitch ${p.spacing} m, relief ${p.height} m. Microfiber detail is statistical roughness below resolved yarn scale. -->\n  <nodegraph name="${graph}">\n${g.xml(out)}\n${outputs}\n  </nodegraph>\n  <standard_surface name="SR_${e.name}" type="surfaceshader">\n    <input name="base" type="float" value="1" />\n    <input name="specular_IOR" type="float" value="1.5" />\n${inputs}\n${Object.entries(
    extra,
  )
    .map(
      ([k, v]) =>
        `    <input name="${k}" type="${Array.isArray(v) ? 'color3' : 'float'}" value="${Array.isArray(v) ? v.join(', ') : v}" />`,
    )
    .join(
      '\n',
    )}\n${extra.coat ? '    <input name="coat_normal" type="vector3" nodegraph="' + graph + '" output="normal_out" />\n' : ''}  </standard_surface>\n  <surfacematerial name="M_${e.name}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_${e.name}" /></surfacematerial>\n</materialx>\n`;
  const dir = e.family
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
  await mkdir(path.join(root, dir), { recursive: true });
  const file = path.join(dir, `${e.name}.mtlx`);
  await writeFile(path.join(root, file), xml);
  results.push({ ...e, file, recipe: p.kind, spacingMeters: p.spacing, heightMeters: p.height });
}
await writeFile(path.join(here, 'textile-manifest.json'), JSON.stringify(results, null, 2) + '\n');
console.log(`Generated ${results.length} textile, leather and fiber materials`);

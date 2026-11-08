/** Furniture families 13–23. UV coordinates and heights are metres; all colours are linear Rec.709. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './hard-mcp.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let families;
try {
  const source = await fs.readFile(path.resolve(root, '../../FURNITURE_MATERIALS.md'), 'utf8');
  families = source
    .split(/^## /m)
    .slice(1)
    .map((p, i) => ({
      index: i + 1,
      title: p.split('\n')[0],
      entries: [...p.matchAll(/^- `([^`]+)` — (.+)$/gm)].map((m) => ({ name: m[1], description: m[2] })),
    }));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  const catalog = JSON.parse(await fs.readFile(path.join(root, 'catalog.json'), 'utf8'));
  const groups = new Map();
  for (const entry of catalog.materials) {
    if (!groups.has(entry.family)) groups.set(entry.family, []);
    groups.get(entry.family).push({ name: entry.name, description: entry.description });
  }
  families = [...groups].map(([title, entries], i) => ({ index: i + 1, title, entries }));
}
const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const colors = {
  White: [0.76, 0.76, 0.74],
  PureWhite: [0.8, 0.8, 0.8],
  WarmWhite: [0.79, 0.75, 0.66],
  Ivory: [0.75, 0.69, 0.54],
  Cream: [0.75, 0.64, 0.43],
  Beige: [0.48, 0.35, 0.23],
  Taupe: [0.24, 0.2, 0.17],
  LightGray: [0.47, 0.47, 0.46],
  MediumGray: [0.23, 0.23, 0.23],
  Gray: [0.28, 0.29, 0.29],
  Charcoal: [0.045, 0.049, 0.052],
  Black: [0.008, 0.009, 0.01],
  Navy: [0.009, 0.025, 0.08],
  RoyalBlue: [0.015, 0.09, 0.47],
  PowderBlue: [0.36, 0.53, 0.65],
  Blue: [0.035, 0.15, 0.4],
  Teal: [0.02, 0.24, 0.24],
  Sage: [0.25, 0.33, 0.22],
  Olive: [0.19, 0.21, 0.07],
  ForestGreen: [0.015, 0.075, 0.037],
  Emerald: [0.006, 0.25, 0.1],
  Green: [0.06, 0.22, 0.1],
  Mustard: [0.5, 0.29, 0.035],
  Terracotta: [0.42, 0.12, 0.065],
  Red: [0.48, 0.025, 0.015],
  Burgundy: [0.15, 0.012, 0.03],
  Blush: [0.64, 0.38, 0.36],
  Pink: [0.63, 0.33, 0.36],
  Rose: [0.57, 0.26, 0.27],
  Lavender: [0.4, 0.34, 0.5],
  Purple: [0.23, 0.065, 0.32],
  Orange: [0.73, 0.19, 0.018],
  Yellow: [0.78, 0.57, 0.025],
  Camel: [0.48, 0.27, 0.11],
  Cognac: [0.32, 0.105, 0.035],
  Caramel: [0.4, 0.19, 0.055],
  Chocolate: [0.075, 0.03, 0.015],
  Espresso: [0.025, 0.013, 0.009],
  Brown: [0.16, 0.075, 0.032],
  DarkBrown: [0.065, 0.026, 0.012],
  Amber: [0.65, 0.31, 0.065],
  Honey: [0.65, 0.38, 0.13],
  Gold: [0.82, 0.61, 0.23],
  Champagne: [0.73, 0.61, 0.43],
  DarkBronze: [0.085, 0.045, 0.018],
  Gunmetal: [0.085, 0.1, 0.12],
  Bronze: [0.36, 0.23, 0.115],
  SmokeGray: [0.22, 0.24, 0.25],
  Smoke: [0.24, 0.25, 0.25],
  Silver: [0.7, 0.72, 0.73],
  Natural: [0.55, 0.36, 0.16],
};
function color(n) {
  for (const k of Object.keys(colors).sort((a, b) => b.length - a.length)) if (n.includes(k)) return colors[k];
  return [0.4, 0.32, 0.22];
}
const mul = (c, k) => c.map((v) => Math.max(0.001, Math.min(0.94, v * k)));
class Graph {
  constructor() {
    this.nodes = [];
    this.k = 0;
  }
  n(cat, type, inputs = {}, name) {
    name = name || `${cat}_${++this.k}`;
    this.nodes.push({ cat, type, inputs, name });
    return { ref: name, type };
  }
  c(v, t = Array.isArray(v) ? 'color3' : 'float') {
    return this.n('constant', t, { value: [t, v] });
  }
  op(cat, a, b, t = a?.type || 'float') {
    return this.n(cat, t, { in1: a?.ref ? a : [t, a], in2: b?.ref ? b : [Array.isArray(b) ? t : 'float', b] });
  }
  noise(uv, f, amp = 1, pivot = 0) {
    const p = this.op('multiply', uv, f, 'vector2');
    const q = this.op('add', p, [13.37, 7.91], 'vector2');
    return this.n('noise2d', 'float', { texcoord: q, amplitude: ['float', amp], pivot: ['float', pivot] });
  }
  fbm(uv, f, oct = 3) {
    return this.n('fractal2d', 'float', {
      texcoord: this.op('add', this.op('multiply', uv, f, 'vector2'), [4.7, 17.3], 'vector2'),
      octaves: ['integer', oct],
    });
  }
  ss(a, l, h) {
    return this.n('smoothstep', 'float', { in: a, low: ['float', l], high: ['float', h] });
  }
  mix(a, b, m, t = 'color3') {
    return this.n('mix', t, { bg: a?.ref ? a : [t, a], fg: b?.ref ? b : [t, b], mix: m?.ref ? m : ['float', m] });
  }
  input(name, v) {
    if (v.output) return `<input name="${name}" type="${v.type}" nodename="${v.ref}" output="${v.output}" />`;
    if (v.ref) return `<input name="${name}" type="${v.type}" nodename="${v.ref}" />`;
    return `<input name="${name}" type="${v[0]}" value="${esc(Array.isArray(v[1]) ? v[1].join(', ') : v[1])}" />`;
  }
  xml(outputs) {
    const used = new Set();
    const visit = (r) => {
      if (!r?.ref || used.has(r.ref)) return;
      used.add(r.ref);
      const n = this.nodes.find((n) => n.name === r.ref);
      Object.values(n.inputs).forEach(visit);
    };
    Object.values(outputs).forEach(visit);
    return (
      this.nodes
        .filter((n) => used.has(n.name))
        .map(
          (n) =>
            `    <${n.cat} name="${n.name}" type="${n.type}">${Object.entries(n.inputs)
              .map(([k, v]) => this.input(k, v))
              .join('')}</${n.cat}>`,
        )
        .join('\n') +
      '\n' +
      Object.entries(outputs)
        .map(([k, v]) => `    <output name="${k}" type="${v.type}" nodename="${v.ref}" />`)
        .join('\n')
    );
  }
}
function recipe(entry, family) {
  const { name: n, description: d } = entry;
  const g = new Graph();
  const uv = g.n('texcoord', 'vector2', {}, 'uv');
  let c = color(n),
    r = 0.48,
    metal = 0,
    amp = 0.000012,
    freq = 240,
    pattern = 'microtexture',
    contrast = 0.035;
  let spec = 0.5,
    ior = 1.5,
    aniso = 0,
    trans = 0,
    scatter = 0,
    depth = 0.01,
    coat = 0,
    subsurface = 0,
    film = 0;
  let tint = [0.995, 0.995, 0.995];
  if (/Gloss|Polished|Bright|Gel/.test(n)) r = 0.09;
  if (/Matte|Raw|Unglazed/.test(n)) r = 0.78;
  if (/Satin|Honed/.test(n)) r = 0.4;
  if (/BeadBlasted/.test(n)) r = 0.64;
  let mask = g.noise(uv, freq, 0.6, 0.5),
    height = g.noise(uv, freq, amp),
    base;
  const veined = /marble|quartzite|soapstone|onyx|alabaster|Vein|Marquetry/i.test(n);
  const granules =
    /granite|terrazzo|Aggregate|Speckle|Fleck|Composite|Granular|expandedPolypropylene|magneticFerrite|corkRubber|coffeeGround/i.test(
      n,
    );
  if (family === 13 || /stainlessSteel|brassHammered|copperHammered|bronzeDark|foilAluminum|neodymium/.test(n)) {
    metal = 1;
    contrast = 0.02;
    amp = 0.000001;
    freq = 300;
    c = /copper|roseGold|RoseGold/.test(n)
      ? [0.91, 0.48, 0.31]
      : /brass|gold|Gold/.test(n)
        ? [0.82, 0.59, 0.23]
        : /bronze|Bronze/.test(n)
          ? [0.48, 0.29, 0.13]
          : /titanium|carbonSteel|steelGunmetal/.test(n)
            ? [0.49, 0.52, 0.55]
            : /nickel|Nickel/.test(n)
              ? [0.65, 0.61, 0.54]
              : /chrome/.test(n)
                ? [0.55, 0.57, 0.59]
                : /zinc|galvanized/.test(n)
                  ? [0.66, 0.69, 0.7]
                  : [0.88, 0.89, 0.9];
    if (/stainlessSteel/.test(n)) c = [0.56, 0.58, 0.59];
    if (/Black|BlackOxide|castIron/.test(n)) c = [0.025, 0.03, 0.035];
    if (/AntiqueTone|DarkUniform/.test(n)) c = [0.17, 0.095, 0.035];
    if (/anodized/.test(n)) {
      c = /Natural/.test(n) ? [0.67, 0.69, 0.7] : color(n);
      coat = 0.35;
    }
    if (/pvd/.test(n)) {
      c = color(n);
      coat = 0.25;
    }
    if (/Lacquered|LeafSealed/.test(n)) {
      coat = 0.8;
      r = 0.18;
    }
    if (/Brushed|Hairline/.test(n)) {
      pattern = 'alignedBrush';
      aniso = 0.78;
      r = 0.3;
      mask = g.noise(uv, [4, 500], 0.5, 0.5);
      height = g.noise(uv, [4, 500], 0.000018);
    } else if (/Hammered/.test(n)) {
      pattern = 'hammered';
      mask = g.noise(uv, 75, 0.6, 0.5);
      height = g.noise(uv, 75, 0.00035);
      r = 0.18;
    } else if (/Vibration/.test(n)) {
      pattern = 'multidirectionalBrush';
      mask = g.noise(uv, 330, 0.6, 0.5);
      height = g.op('add', g.noise(uv, [70, 290], 0.000018), g.noise(uv, [320, 90], 0.000018));
      r = 0.36;
      aniso = 0.15;
    } else if (/galvanized/.test(n)) {
      pattern = 'zincSpangle';
      const p = g.op('multiply', uv, /Fine/.test(n) ? 150 : 45, 'vector2');
      mask = g.n('worleynoise2d', 'float', { texcoord: p, style: ['integer', 1] });
      height = g.noise(uv, 350, 0.000003);
      contrast = 0.24;
      r = 0.38;
    } else {
      mask = g.noise(uv, 300, 0.6, 0.5);
      height = g.noise(uv, 300, /Polished|Bright/.test(n) ? 1e-7 : 0.000006);
    }
  }
  if (veined) {
    pattern = 'mineralVeins';
    freq = /quartzite|WhiteMacaubas/.test(n) ? [3, 28] : [5, 11];
    contrast = 0.12;
    amp = 0.000002;
    const stoneColors = {
      Carrara: [0.73, 0.74, 0.73],
      Calacatta: [0.78, 0.75, 0.68],
      Statuario: [0.81, 0.81, 0.79],
      NeroMarquina: [0.012, 0.013, 0.014],
      EmperadorDark: [0.12, 0.055, 0.027],
      EmperadorLight: [0.35, 0.24, 0.15],
      CremaMarfil: [0.67, 0.55, 0.36],
      VerdeAlpi: [0.018, 0.085, 0.04],
      RossoLevanto: [0.2, 0.025, 0.035],
      RosaPortugal: [0.62, 0.38, 0.34],
      PandaWhite: [0.78, 0.77, 0.71],
      Arabescato: [0.69, 0.69, 0.66],
      Portoro: [0.008, 0.009, 0.008],
      TajMahal: [0.68, 0.59, 0.43],
      WhiteMacaubas: [0.77, 0.76, 0.69],
      Fusion: [0.16, 0.24, 0.28],
    };
    for (const [k, v] of Object.entries(stoneColors)) if (n.includes(k)) c = v;
    const warp = g.n('noise2d', 'vector3', {
      texcoord: g.op('multiply', uv, 3, 'vector2'),
      amplitude: ['vector3', [0.025, 0.025, 0]],
    });
    const warped = g.op('add', uv, g.n('convert', 'vector2', { in: warp }), 'vector2');
    // Carrara's diffuse wisps are graded mineral deposits, rather than an ink-outline contour.
    const softWhite = /Carrara|CremaMarfil|RosaPortugal|TajMahal|alabaster/.test(n);
    if (/Carrara/.test(n)) freq = [3, 8];
    const field = g.fbm(warped, freq, softWhite ? 3 : 4);
    const abs = g.n('absval', 'float', { in: field });
    const width = g.noise(uv, [13, 21], softWhite ? 0.045 : 0.035, /Panda|Calacatta/.test(n) ? 0.15 : 0.085);
    const feather = g.n('smoothstep', 'float', { in: abs, low: ['float', 0], high: width });
    const core = g.op('subtract', 1, feather);
    const deposit = g.ss(g.noise(uv, [2.7, 5.3], 0.65, 0.5), 0.15, 0.85);
    mask = g.op('multiply', core, g.op('add', g.op('multiply', deposit, 0.7), 0.3));
    let vein = /Nero|Verde|Rosso|BlackWhite/.test(n)
      ? [0.65, 0.65, 0.59]
      : /Portoro|Gold/.test(n)
        ? [0.58, 0.36, 0.09]
        : /Emperador/.test(n)
          ? [0.64, 0.49, 0.31]
          : softWhite
            ? [0.38, 0.4, 0.41]
            : [0.13, 0.14, 0.13];
    const diffuseHalo = g.op('multiply', g.op('subtract', 1, g.ss(abs, 0.015, 0.32)), deposit);
    const cloud = g.ss(g.noise(uv, [4, 7], 0.65, 0.5), 0.1, 0.9);
    const cloudyBase = g.mix(c, mul(c, softWhite ? 0.78 : 0.88), g.op('multiply', cloud, 0.7));
    const haloBase = g.mix(
      cloudyBase,
      softWhite ? mul(c, 0.72) : mul(c, 0.85),
      g.op('multiply', diffuseHalo, softWhite ? 0.55 : 0.3),
    );
    base = g.mix(haloBase, vein, mask);
    // Fine secondary deposits fade within larger clouds instead of forming a closed network everywhere.
    const secondaryAbs = g.n('absval', 'float', { in: g.fbm(warped, [18, 36], 2) });
    const secondary = g.op(
      'multiply',
      g.op('subtract', 1, g.ss(secondaryAbs, 0, 0.035)),
      g.op('multiply', cloud, softWhite ? 0.13 : 0.24),
    );
    base = g.mix(base, vein, secondary);
    height = g.noise(uv, 230, 0.000001);
  }
  if (granules && !veined) {
    pattern = /terrazzo/i.test(n) ? 'terrazzoChips' : 'mineralGranules';
    freq = /terrazzo/i.test(n) ? 65 : /granite/.test(n) ? 260 : /corkRubber|corkResin/.test(n) ? 180 : 550;
    if (/AbsoluteBlack/.test(n)) c = [0.009, 0.009, 0.01];
    if (/BlackGalaxy/.test(n)) c = [0.01, 0.009, 0.008];
    if (/SaltPepper|WhiteGray/.test(n)) c = [0.53, 0.53, 0.5];
    if (/BluePearl/.test(n)) c = [0.055, 0.09, 0.14];
    const p = g.op('multiply', uv, freq, 'vector2');
    const id = g.n('worleynoise2d', 'float', { texcoord: p, style: ['integer', 1] });
    const edges = g.n('worleynoise2d', 'vector2', { texcoord: p });
    const gap = g.n('dotproduct', 'float', { in1: edges, in2: ['vector2', [-1, 1]] });
    mask = g.ss(gap, 0.055, 0.12);
    let chip = g.mix(mul(c, 0.4), mul(c, 1.45), id);
    if (/Multicolor|Pastel/.test(n)) chip = g.mix(chip, [0.4, 0.15, 0.08], g.ss(id, 0.7, 0.85));
    if (/White|Cream/.test(n) && /terrazzo/i.test(n)) chip = g.mix([0.09, 0.1, 0.11], [0.53, 0.45, 0.32], id);
    if (/BlackWhite/.test(n)) {
      c = [0.013, 0.014, 0.015];
      chip = g.c([0.68, 0.68, 0.63]);
    }
    if (/Galaxy|GoldFleck/.test(n)) chip = g.c([0.55, 0.34, 0.08]);
    base = g.mix(c, chip, mask);
    height = g.noise(uv, freq, /Polished|Honed/.test(n) ? 1e-6 : 0.000035);
    contrast = 0.05;
  }
  if (/travertine|slate|sandstone/.test(n)) {
    pattern = /CrossCut/.test(n) ? 'crossCutMineral' : 'sedimentBands';
    const f = /CrossCut/.test(n) ? [8, 8] : [2, 60];
    mask = g.noise(uv, f, 0.65, 0.5);
    base = g.mix(mul(c, 0.75), mul(c, 1.15), mask);
    height = g.noise(uv, 240, /Unfilled|NaturalCleft/.test(n) ? 0.00012 : 0.000002);
    if (/travertine/.test(n)) {
      const pore = g.n('worleynoise2d', 'float', {
        texcoord: g.op('multiply', uv, [220, 100], 'vector2'),
        jitter: ['float', 0.7],
      });
      const holes = g.op('subtract', 1, g.ss(pore, 0.08, 0.18));
      base = g.mix(base, mul(c, 0.32), g.op('multiply', holes, /Filled/.test(n) ? 0.06 : 0.55));
      if (/Unfilled/.test(n)) height = g.op('subtract', height, g.op('multiply', holes, 0.0001));
    }
  }
  if (/concrete|microcement|plaster|gesso|gypsum|jesmonite|magnesium|mycelium|lavaStone/.test(n)) {
    pattern = 'mineralMottle';
    mask = g.noise(uv, 7, 0.6, 0.5);
    base = g.mix(mul(c, 0.88), mul(c, 1.08), mask);
    height = g.op('add', g.noise(uv, 45, /plaster|gesso/.test(n) ? 0.000018 : 0.00005), g.noise(uv, 450, 0.000012));
    r = 0.79;
    if (/concrete|lavaStone|mycelium/.test(n)) {
      const p = g.n('worleynoise2d', 'float', {
        texcoord: g.op('multiply', uv, 250, 'vector2'),
        jitter: ['float', 0.7],
      });
      const pore = g.op('subtract', 1, g.ss(p, 0.045, 0.13));
      height = g.op('subtract', height, g.op('multiply', pore, 0.000075));
      base = g.mix(base, mul(c, 0.48), pore);
    }
  }
  if (/Crackle/.test(n)) {
    pattern = 'decorativeCrackle';
    const w = g.n('worleynoise2d', 'vector2', { texcoord: g.op('multiply', uv, 85, 'vector2') });
    const edge = g.n('dotproduct', 'float', { in1: w, in2: ['vector2', [-1, 1]] });
    mask = g.ss(edge, 0.012, 0.035);
    base = g.mix(mul(c, 0.3), c, mask);
    height = g.noise(uv, 170, 1e-6);
    r = 0.12;
  }
  if (/carbonFiber|flaxFiberResin|polyurethaneCoatedTextile/.test(n)) {
    pattern = 'wovenComposite';
    const p = g.op('multiply', uv, 500, 'vector2');
    const separate = g.n('separate2', 'multioutput', { in: p });
    const x = { ref: separate.ref, type: 'float', output: 'outx' };
    const y = { ref: separate.ref, type: 'float', output: 'outy' }; // output attribute handled below
    const sx = g.n('sin', 'float', { in: g.op('multiply', x, 6.2831853) }),
      sy = g.n('sin', 'float', { in: g.op('multiply', y, 6.2831853) });
    const ix = g.n('floor', 'float', { in: x }),
      iy = g.n('floor', 'float', { in: y });
    const diagonal = g.op('modulo', g.op('add', ix, iy), 4);
    const over = g.ss(diagonal, 0.5, 1.5);
    mask = g.op('add', g.op('multiply', g.mix(sx, sy, over, 'float'), 0.5), 0.5);
    if (/carbon/.test(n)) c = [0.018, 0.021, 0.025];
    base = g.mix(mul(c, 0.5), mul(c, 1.5), mask);
    height = g.op('multiply', mask, 0.000025);
    aniso = 0.55;
    r = /Matte|Coated/.test(n) ? 0.6 : 0.15;
    if (/Resin|Gloss/.test(n)) coat = 0.7;
  }
  if (/woodFinish|strandWovenBamboo|laminatedDensifiedWood|woodPlastic|strawMarquetry|leatherComposite/.test(n)) {
    pattern = 'longitudinalFiber';
    c = /Ebonized|BlackWhite/.test(n)
      ? [0.015, 0.009, 0.005]
      : /GrayWhite/.test(n)
        ? [0.2, 0.19, 0.17]
        : /Limed/.test(n)
          ? [0.58, 0.42, 0.23]
          : c;
    mask = g.noise(uv, [300, 4], 0.65, 0.5);
    base = g.mix(mul(c, 0.65), mul(c, 1.2), mask);
    height = g.noise(uv, [300, 4], 0.000035);
    r = 0.45;
    if (/Cerused|Limed/.test(n)) base = g.mix(base, [0.69, 0.66, 0.57], g.ss(mask, 0.68, 0.82));
  }
  const transparent =
    (family === 15 && !/Glitter|MotherOfPearl/.test(n)) ||
    (family === 16 && !/mirror|BackPainted/.test(n)) ||
    /Translucent|Transparent|Gel|Adhesive.*Clear|AdhesiveAmber|hotMelt|SealantClear|clearcoat|shellac|antiSlipCoatingClear/.test(
      n,
    );
  if (transparent) {
    trans = 1;
    depth = 0.01;
    ior = /polycarbonate/.test(n) ? 1.586 : /silicone/.test(n) ? 1.41 : /acrylic/.test(n) ? 1.49 : 1.52;
    r = /Frosted|Etched|Sandblasted/.test(n) ? 0.48 : /Matte/.test(n) ? 0.65 : /Satin|Pva|pva/.test(n) ? 0.35 : 0.055;
    tint = /Clear|LowIron|clearcoat/.test(n)
      ? [0.995, 0.997, 0.996]
      : mul(c, 1.5).map((v) => Math.min(0.98, Math.max(0.06, v)));
    if (/glassClear/.test(n)) tint = [0.9, 0.98, 0.94];
    if (/Amber|shellac/.test(n)) tint = [0.94, 0.61, 0.17];
    if (/Bronze/.test(n)) tint = [0.72, 0.48, 0.27];
    if (/Smoke|BlackTint/.test(n)) tint = [0.3, 0.32, 0.33];
    if (/Opal|White|Cream/.test(n)) tint = [0.94, 0.94, 0.88];
    if (/Translucent|Opal|Gel|pva|silicone|capiz/.test(n)) scatter = /Opal|White/.test(n) ? 20 : 3;
    base = g.c([0.95, 0.95, 0.95]);
    height = g.noise(uv, 300, /Frosted|Etched|Sandblasted/.test(n) ? 0.000008 : 0.0000001);
  }
  if (/glassSeeded/.test(n)) {
    pattern = 'seededGlass';
    const dist = g.n('worleynoise2d', 'float', {
      texcoord: g.op('multiply', uv, 130, 'vector2'),
      jitter: ['float', 0.7],
    });
    const bubbles = g.op('subtract', 1, g.ss(dist, 0.045, 0.12));
    height = g.op('multiply', bubbles, 0.000035);
  }
  if (/glassCrackle/.test(n)) {
    pattern = 'internalCrackle';
    const cells = g.n('worleynoise2d', 'vector2', { texcoord: g.op('multiply', uv, 85, 'vector2') });
    const edge = g.n('dotproduct', 'float', { in1: cells, in2: ['vector2', [-1, 1]] });
    const line = g.op('subtract', 1, g.ss(edge, 0.012, 0.035));
    tint = [0.97, 0.99, 0.985];
    height = g.op('multiply', line, 0.000004);
  }
  if (/limestone|basalt|sandstone|boneIvory/.test(n)) {
    pattern = 'fineMineralPores';
    const dist = g.n('worleynoise2d', 'float', {
      texcoord: g.op('multiply', uv, 320, 'vector2'),
      jitter: ['float', 0.7],
    });
    const pores = g.op('subtract', 1, g.ss(dist, 0.04, 0.12));
    base = g.mix(base || g.c(c), mul(c, 0.6), pores);
    height = g.op('subtract', height, g.op('multiply', pores, /Polished/.test(n) ? 0.000001 : 0.000025));
  }
  if (/horn|coconutShell/.test(n)) {
    pattern = 'organicLongitudinalStriation';
    mask = g.noise(uv, [160, 7], 0.7, 0.5);
    base = g.mix(mul(c, 0.5), mul(c, 1.25), mask);
    height = g.noise(uv, [160, 7], 0.000012);
  }
  if (/eggshellComposite/.test(n)) {
    pattern = 'eggshellFragments';
    const cells = g.n('worleynoise2d', 'vector2', { texcoord: g.op('multiply', uv, 250, 'vector2') });
    const edge = g.n('dotproduct', 'float', { in1: cells, in2: ['vector2', [-1, 1]] });
    mask = g.ss(edge, 0.025, 0.065);
    base = g.mix(mul(c, 0.65), c, mask);
    height = g.op('multiply', mask, 0.000008);
  }
  if (/mirror/.test(n)) {
    metal = 1;
    c = /Bronze/.test(n)
      ? [0.65, 0.44, 0.27]
      : /Gold/.test(n)
        ? [0.85, 0.64, 0.25]
        : /Black/.test(n)
          ? [0.08, 0.08, 0.085]
          : /Smoke/.test(n)
            ? [0.32, 0.34, 0.35]
            : [0.96, 0.96, 0.95];
    base = g.c(c);
    r = /Satin/.test(n) ? 0.32 : 0.035;
    coat = 0.6;
    height = g.noise(uv, 300, 1e-8);
  }
  if (/BackPainted/.test(n)) {
    base = g.c(color(n));
    coat = 1;
    r = 0.045;
    height = g.noise(uv, 300, 1e-8);
  }
  if (/MotherOfPearl|motherOfPearl|Iridescent|capizShell/.test(n)) {
    pattern = 'pearlyLamellae';
    mask = g.noise(uv, [10, 220], 0.6, 0.5);
    base = g.mix(mul(c, 0.65), mul(c, 1.2), mask);
    film = 460;
    coat = 0.55;
    r = 0.16;
    height = g.noise(uv, [10, 220], 0.000009);
    if (/capiz/.test(n)) {
      trans = 0.3;
      scatter = 4;
      subsurface = 0.2;
    }
  }
  if (/onyx|alabaster|bone|horn|wax/.test(n)) {
    subsurface = /bone/.test(n) ? 0.15 : 0.4;
    if (/onyx|alabaster|horn/.test(n)) {
      trans = 0.3;
      tint = mul(c, 1.4);
      scatter = 8;
      depth = 0.015;
    }
  }
  if (/flock|baize/.test(n)) {
    pattern = 'shortPile';
    spec = 0.2;
    r = 0.94;
    subsurface = 0.05;
    height = g.noise(uv, 700, 0.000035);
    mask = g.noise(uv, 90, 0.6, 0.5);
    contrast = 0.1;
  }
  if (/powderCoatMetallic|resinGlitter/.test(n)) {
    pattern = 'metallicFlakeBinder';
    const flakes = g.n('worleynoise2d', 'float', {
      texcoord: g.op('multiply', uv, 900, 'vector2'),
      jitter: ['float', 0.7],
    });
    mask = g.op('subtract', 1, g.ss(flakes, 0.04, 0.13));
    metal = g.op('multiply', mask, 0.95);
    base = g.mix(c, /Gold|Bronze/.test(n) ? [0.74, 0.48, 0.16] : [0.77, 0.78, 0.8], mask);
    r = 0.35;
    coat = 0.3;
  }
  if (/rubber|epdm|neoprene|siliconeMatte|tpeMatte/i.test(n)) {
    spec = 0.35;
    r = 0.87;
  }
  if (/furnitureLinoleum/.test(n)) {
    r = 0.72;
    contrast = 0.025;
    pattern = 'fineHomogeneousLinoleum';
    height = g.noise(uv, 480, 0.000009);
  }
  if (/vinylSmooth/.test(n)) {
    r = 0.46;
    contrast = 0.018;
    pattern = 'vinylMicrograin';
    height = g.noise(uv, 650, 0.000012);
  }
  if (!base) base = g.mix(mul(c, 1 - contrast), mul(c, 1 + contrast), mask);
  const rough = g.n('clamp', 'float', {
    in: g.op('add', r, g.op('multiply', g.op('subtract', mask, 0.5), Math.min(0.08, r * 0.15))),
    low: ['float', 0.025],
    high: ['float', 0.98],
  });
  const uvmm = g.op('multiply', uv, 1000, 'vector2');
  const hmm = g.op('multiply', height, 1000);
  const tangent = g.n('heighttonormal', 'vector3', { in: hmm, scale: ['float', 16], texcoord: uvmm });
  const normal = g.n('normalmap', 'vector3', { in: tangent });
  const outputs = {
    base_color: base,
    specular_roughness: rough,
    metalness: metal?.ref ? metal : g.c(metal),
    normal,
    height,
  };
  const inputs = {
    base: ['float', trans === 1 ? 0 : 1],
    specular: ['float', spec],
    specular_IOR: ['float', ior],
    specular_anisotropy: ['float', aniso],
  };
  if (trans) {
    inputs.transmission = ['float', trans];
    inputs.transmission_color = ['color3', tint];
    inputs.transmission_depth = ['float', depth];
    inputs.transmission_scatter = ['color3', [scatter, scatter, scatter]];
    inputs.thin_walled = ['boolean', false];
  }
  if (coat) {
    inputs.coat = ['float', coat];
    inputs.coat_roughness = ['float', Math.max(0.04, r * 0.7)];
  }
  if (subsurface) {
    inputs.subsurface = ['float', subsurface];
    inputs.subsurface_color = ['color3', c];
    inputs.subsurface_scale = ['float', 0.002];
  }
  if (film) {
    inputs.thin_film_thickness = ['float', film];
    inputs.thin_film_IOR = ['float', 1.38];
  }
  if (/flock|baize/.test(n)) {
    inputs.sheen = ['float', 0.65];
    inputs.sheen_color = ['color3', c];
    inputs.sheen_roughness = ['float', 0.85];
  }
  const graph = `NG_${n}`;
  const xml = `<?xml version="1.0"?>\n<materialx version="1.39" colorspace="lin_rec709">\n  <!-- ${esc(d).replaceAll('--', '—')} -->\n  <!-- Clean newly manufactured surface. UV 0..1 = 1 metre; height in metres. Recipe: ${pattern}. -->\n  <nodegraph name="${graph}">\n${g.xml(outputs)}\n  </nodegraph>\n  <standard_surface name="SR_${n}" type="surfaceshader">\n${Object.entries(
    inputs,
  )
    .map(([k, v]) => '    ' + g.input(k, v))
    .join('\n')}\n${Object.entries(outputs)
    .filter(([k]) => k !== 'height')
    .map(([k, v]) => `    <input name="${k}" type="${v.type}" nodegraph="${graph}" output="${k}" />`)
    .join(
      '\n',
    )}${coat ? `\n    <input name="coat_normal" type="vector3" nodegraph="${graph}" output="normal" />` : ''}\n  </standard_surface>\n  <surfacematerial name="M_${n}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_${n}" /></surfacematerial>\n</materialx>\n`;
  return {
    xml,
    pattern,
    roughness: r,
    transmission: trans,
    uvMetersPerUnit: 1,
    heightUnit: 'metre',
    featureFrequencyPerMeter: freq,
    scaleNotes:
      pattern === 'wovenComposite'
        ? '2 mm yarn spacing, two-over-two diagonal twill'
        : pattern === 'alignedBrush'
          ? '250 mm aligned strokes; 2 mm transverse correlation'
          : pattern === 'mineralVeins'
            ? '100–300 mm main mineral variation; 1–5 mm vein edges'
            : pattern === 'terrazzoChips'
              ? '15 mm aggregate cells with smooth 1 mm binder edges'
              : 'Frequency is cycles or cells per metre; noise blob diameter approximately 0.7/frequency.',
  };
}
const manifest = [];
for (const family of families.filter((f) => f.index >= 13)) {
  const dir = `${String(family.index).padStart(2, '0')}-${family.title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '')}`;
  await fs.mkdir(path.join(root, dir), { recursive: true });
  for (const entry of family.entries) {
    const { xml, ...parameters } = recipe(entry, family.index);
    const file = path.join(dir, entry.name + '.mtlx');
    await fs.writeFile(path.join(root, file), xml);
    manifest.push({ ...entry, family: family.title, file, ...parameters });
  }
}
await fs.writeFile(path.join(root, 'hard-surfaces-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Generated ${manifest.length} hard-surface materials`);
if (process.argv.includes('--validate')) {
  const client = await connect();
  let failed = 0;
  try {
    for (const entry of manifest) {
      const result = await client.callTool({
        name: 'check_material',
        arguments: {
          file: path.join(root, entry.file),
          strict: true,
          rules: ['basic', 'structure', 'types', 'unused'],
        },
      });
      const data = JSON.parse(result.content.find((x) => x.type === 'text').text);
      if (result.isError || !data.ok) {
        failed++;
        console.log(entry.name, JSON.stringify(data));
      }
    }
  } finally {
    await client.close();
  }
  console.log(JSON.stringify({ checked: manifest.length, failed }));
  if (failed) process.exitCode = 1;
}

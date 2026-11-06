/** Vehicle families 21–31. Run from any directory: node material_library/vehicle/tools/technical.mjs */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(out, '../..');
const catalog = await readFile(path.join(root, 'VEHICLE_MATERIAL_CATALOG.md'), 'utf8');
let section = 0;
const entries = [];
for (const line of catalog.split('\n')) {
  if (
    line.startsWith('## ') &&
    !['Scope and naming', 'Specification conventions', 'Material index', 'Reference basis'].some(
      (x) => line === `## ${x}`,
    )
  )
    section++;
  const m = line.match(/^- `([^`]+)` — (.*)$/);
  if (m && section >= 21 && section <= 31) entries.push({ name: m[1], description: m[2], section });
}
const palette = {
  Black: [0.008, 0.009, 0.011],
  DarkGray: [0.045, 0.05, 0.055],
  LightGray: [0.48, 0.5, 0.51],
  Gray: [0.22, 0.235, 0.25],
  White: [0.8, 0.8, 0.77],
  Cream: [0.76, 0.67, 0.48],
  Ivory: [0.77, 0.7, 0.53],
  PaleCream: [0.83, 0.77, 0.59],
  Beige: [0.46, 0.35, 0.21],
  PaleBeige: [0.64, 0.54, 0.37],
  Tan: [0.37, 0.23, 0.11],
  Brown: [0.12, 0.047, 0.017],
  DarkBrown: [0.053, 0.022, 0.009],
  Red: [0.54, 0.012, 0.018],
  Orange: [0.85, 0.13, 0.008],
  Yellow: [0.85, 0.65, 0.012],
  YellowGreen: [0.43, 0.8, 0.008],
  Green: [0.012, 0.2, 0.035],
  DarkGreen: [0.008, 0.055, 0.021],
  Blue: [0.012, 0.075, 0.37],
  NavyBlue: [0.008, 0.018, 0.065],
  Violet: [0.18, 0.018, 0.35],
  Purple: [0.14, 0.015, 0.23],
  Pink: [0.73, 0.15, 0.29],
  Burgundy: [0.12, 0.012, 0.033],
  Charcoal: [0.032, 0.034, 0.04],
  Champagne: [0.63, 0.49, 0.3],
  Amber: [0.65, 0.24, 0.025],
  PaleAmber: [0.85, 0.61, 0.22],
  PaleGold: [0.83, 0.68, 0.25],
  PaleStraw: [0.88, 0.81, 0.43],
  Gold: [0.95, 0.68, 0.22],
  Silver: [0.78, 0.8, 0.82],
  Bronze: [0.55, 0.32, 0.13],
  Copper: [0.92, 0.51, 0.33],
  Cyan: [0.008, 0.5, 0.72],
  Smoke: [0.26, 0.28, 0.3],
  PaleGreen: [0.49, 0.7, 0.35],
  Natural: [0.64, 0.59, 0.38],
  MilkyWhite: [0.76, 0.78, 0.73],
};
function color(name) {
  const keys = Object.keys(palette).toSorted((a, b) => b.length - a.length);
  const key = keys.find((k) => name.endsWith(k)) || keys.find((k) => name.includes(k)) || 'Gray';
  return [...palette[key]];
}
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('--', '—');
function input(k, t, v, ref = false, extra = '') {
  return `<input name="${k}" type="${t}" ${ref ? `nodename="${v}"` : `value="${Array.isArray(v) ? v.join(', ') : v}"`}${extra} />`;
}
for (const e of entries) {
  const { name: n, description: d, section: s } = e;
  let c = color(n),
    rough = 0.4,
    metal = 0,
    freq = [850, 850],
    height = 0.000001,
    variation = 0.025,
    coat = 0,
    trans = 0,
    ior = 1.5,
    depth = 0.001,
    scatter = 0,
    sheen = 0,
    aniso = 0,
    subsurface = 0,
    film = 0,
    kind = 'skin';
  const textile =
    (s === 30 && !/Vinyl/.test(n)) ||
    /Sleeving|Braided|Fabric|CarbonDiffusion|paperLabel|FiberGasket|aramidGasket/.test(n);
  const mineral =
    s === 21 || s === 28 || /Mica|mica|Washcoat|cordierite|Electrode|CeramicInk|Filled|ceramicFilled/.test(n);
  const liquid = s === 27 && !n.startsWith('grease');
  const clear =
    /Clear$|AntiReflective$|AntiGlare$|Polyurethane(Gloss|Satin|Matte)$|Acrylic(Gloss|Satin)$|UvCured(Gloss|Matte)$|PolyesterGloss$|EpoxyGloss$|AntiFingerprint(Satin|Gloss)$|ProtectionClear$|Tinted(Smoke|Amber)$|ConductiveOxide$|CombinerCoating$/.test(
      n,
    );
  if (/Gloss|Polished|Glassy/.test(n) || /glossy/.test(d)) rough = 0.16;
  if (/Matte|Washcoat|Separator|Friction|Electrode/.test(n)) rough = 0.78;
  if (/Satin/.test(n)) rough = 0.43;
  if (/Silicone|Sealant|Adhesive|Rubber/.test(n)) {
    rough = 0.48;
    height = 0.000002;
  }
  if (/Extrusion|wireInsulation|pneumatic|hydraulicThermoplastic|heatShrink/.test(n)) {
    freq = [35, 1400];
    height = 0.0000012;
    rough = 0.34;
  }
  if (textile) {
    kind = 'weave';
    freq = [650, 650];
    height = 0.000012;
    variation = 0.12;
    rough = 0.83;
    sheen = 0.24;
  }
  if (/SatinTextile|SilkBlend/.test(n)) {
    freq = [1100, 700];
    height = 0.000004;
    rough = 0.45;
    sheen = 0.7;
    aniso = 0.7;
  }
  if (/Boucle|FauxFur/.test(n)) {
    kind = 'fiber';
    freq = [430, 100];
    height = 0.000065;
    rough = 0.94;
    sheen = 0.45;
  }
  if (/Boucle/.test(n)) {
    kind = 'boucle';
    freq = [420, 420];
    height = 0.00009;
    variation = 0.24;
  }
  if (/Vinyl/.test(n)) {
    freq = [750, 750];
    height = 0.000018;
    variation = 0.04;
    rough = 0.46;
  }
  if (mineral) {
    kind = 'granule';
    freq = [1000, 1000];
    height = 0.000009;
    variation = 0.12;
  }
  if (/Smooth|Gloss|Polished/.test(n)) {
    height = 0.0000005;
    variation = 0.015;
  }
  if (/ThermalBarrier|Washcoat|cordierite/.test(n)) {
    height = 0.000024;
    rough = 0.9;
    subsurface = 0.06;
  }
  if (/Friction|Gasket/.test(n)) {
    height = 0.000023;
    rough = 0.83;
    variation = 0.2;
    freq = [1400, 800];
  }
  if (/corkRubber/.test(n)) {
    freq = [1300, 1300];
    c = [0.25, 0.13, 0.05];
    variation = 0.65;
    height = 0.000025;
  }
  if (
    /sinteredMetal|Bronze$|oilImpregnatedBronze|solderAlloy|PlatedConductor|BraidedFinish|LabelStockSilver|brushedAluminum|batteryPouch|conductiveCeramicInk/.test(
      n,
    )
  ) {
    metal = 1;
    rough = 0.32;
    c = /gold/i.test(n)
      ? palette.Gold
      : /copper/i.test(n)
        ? palette.Copper
        : /bronze/i.test(n)
          ? palette.Bronze
          : palette.Silver;
  }
  if (/Braided/.test(n)) {
    freq = [1100, 1100];
    aniso = 0.55;
    rough = 0.24;
  }
  if (/brushedAluminum/.test(n)) {
    freq = [8, 1800];
    height = 0.000001;
    aniso = 0.7;
  }
  if (/printedInk|decalVinyl/.test(n) && /Silver|Gold/.test(n)) {
    metal = 0.7;
    coat = 0.65;
  }
  if (/PouchLaminate|LabelStockSilver|brushedAluminum|oilImpregnatedBronze/.test(n)) coat = 0.65;
  if (/mica|Mica/.test(n)) {
    freq = [450, 1600];
    aniso = 0.35;
    rough = 0.5;
    trans = 0.12;
  }
  if (/marble/.test(n)) {
    kind = 'vein';
    freq = [6, 6];
    height = 0.0000003;
    variation = 0.65;
    rough = 0.1;
    subsurface = 0.1;
    c = /Black/.test(n) ? [0.008, 0.009, 0.011] : [0.78, 0.77, 0.73];
  }
  if (/granite/.test(n)) {
    freq = [950, 950];
    rough = 0.13;
    variation = 0.65;
    height = 0.0000008;
  }
  if (/motherOfPearl/.test(n)) {
    film = 450;
    rough = 0.13;
    c = [0.8, 0.72, 0.57];
    kind = 'granule';
    variation = 0.08;
  }
  if (/porcelain/.test(n)) {
    coat = 1;
    rough = 0.22;
    subsurface = 0.06;
  }
  if (/photovoltaic|semiconductor|Germanium/.test(n)) {
    c = /Polycrystalline/.test(n) ? [0.018, 0.04, 0.13] : [0.012, 0.016, 0.025];
    ior = /Germanium/.test(n) ? 4 : 3.5;
    rough = 0.14;
    film = /photovoltaic/.test(n) ? 90 : 180;
    variation = /Polycrystalline/.test(n) ? 0.55 : 0.025;
    freq = [90, 90];
    kind = 'crystal';
  }
  if (clear || liquid) {
    trans = 1;
    rough = liquid ? 0.015 : rough;
    variation = 0;
    height = liquid ? 0 : 0.0000003;
    c = [0.96, 0.98, 0.99];
  }
  if (/clearcoat|hardcoat|hydrophobic|ceramicPaintProtection/.test(n)) {
    trans = 1;
    rough = /Matte/.test(n) ? 0.64 : /Satin|AntiGlare/.test(n) ? 0.35 : 0.06;
    coat = 0;
  }
  if (/EpoxyAmber|hotMeltAdhesiveAmber|polyimideFilmAmber/.test(n)) {
    trans = 0.85;
    rough = 0.22;
  }
  if (/Smoke|TintedAmber/.test(n)) trans = 1;
  if (/Translucent|Milky|membrane|Membrane|ptfeFlexibleNatural|pvdfChemicalResistantNatural/.test(n)) {
    trans = 0.45;
    scatter = 0.7;
    depth = 0.003;
    subsurface = 0.15;
  }
  if (/batterySeparator/.test(n)) {
    trans = 0.15;
    scatter = 0.8;
  }
  if (/pvcFlexibleReinforced/.test(n)) {
    kind = 'weave';
    freq = [500, 500];
    height = 0;
    c = [0.86, 0.87, 0.82];
    variation = 0.08;
  }
  if (/LaminateNatural/.test(n)) {
    trans = 0.25;
    scatter = 0.3;
    kind = 'weave';
    freq = [1800, 1800];
    height = 0.000001;
  }
  if (/grease/.test(n)) {
    rough = 0.23;
    coat = 0.25;
    height = 0.000003;
    variation = 0.015;
    trans = /Amber|Synthetic/.test(n) ? 0.25 : 0;
    depth = 0.004;
    scatter = 0.4;
  }
  if (liquid) {
    ior = /water|coolant|washer|ExhaustFluid|Electrolyte/.test(n) ? 1.333 : /brakeFluid/.test(n) ? 1.445 : 1.47;
    depth = /waterClear/.test(n) ? 10 : 0.03;
  }
  if (/opticalSapphire/.test(n)) ior = 1.76;
  if (/Crystal/.test(n)) {
    ior = 1.62;
    rough = 0.02;
  }
  if (/AntiReflective|ConductiveOxide|Combiner/.test(n)) {
    film = 120;
    rough = 0.04;
  }
  if (/AntiGlare/.test(n)) rough = 0.38;
  if (/reflectiveSafety/.test(n)) {
    coat = 1;
    rough = 0.22;
    variation = 0.04;
  }
  if (/fluorescent/.test(n)) {
    rough = 0.5;
    variation = 0.01;
    c = c.map((x) => Math.min(0.95, x * 1.25));
  }
  if (/displayEpaper/.test(n)) {
    rough = 0.95;
    variation = 0.025;
  }
  if (/displayPolarizer/.test(n)) {
    aniso = 0.4;
    c = [0.003, 0.004, 0.005];
    rough = 0.22;
  }
  if (/emissive|ActiveSurface/.test(n)) {
    rough = /Diffuse|Electroluminescent/.test(n) ? 0.65 : 0.12;
    variation = 0;
    height = 0;
  }
  let transmissionColor =
    liquid || trans > 0
      ? /Clear|Colorless|AntiReflective|AntiGlare|Combiner|ConductiveOxide|Gloss|Satin|Matte|Encapsulant/.test(n) &&
        !/Smoke|Amber|Epoxy/.test(n)
        ? [0.995, 0.997, 0.999]
        : color(n).map((x) => 0.1 + 0.87 * Math.sqrt(x))
      : [1, 1, 1];
  if (/clearcoatEpoxyGloss/.test(n)) transmissionColor = [0.995, 0.98, 0.94];
  const nodes = [];
  const surfaces = [];
  const outputs = [];
  function node(cat, id, t, ins) {
    nodes.push(`    <${cat} name="${id}" type="${t}">${ins.join('')}</${cat}>`);
    return id;
  }
  function constant(id, t, v) {
    return node('constant', id, t, [input('value', t, v)]);
  }
  function op(cat, id, t, a, b, at = t, bt = t) {
    return node(cat, id, t, [input('in1', at, a, typeof a === 'string'), input('in2', bt, b, typeof b === 'string')]);
  }
  function unary(cat, id, t, a) {
    return node(cat, id, t, [input('in', t, a, true)]);
  }
  function output(parameter, t, id) {
    const o = parameter + '_out';
    outputs.push(`    <output name="${o}" type="${t}" nodename="${id}" />`);
    surfaces.push(`    <input name="${parameter}" type="${t}" nodegraph="NG_${n}" output="${o}" />`);
  }
  function param(k, t, v) {
    surfaces.push('    ' + input(k, t, v));
  }
  nodes.push(
    `    <!-- UV 0..1 is exactly one metre; all height values below are metres. ${kind}: frequencies ${freq.join(' × ')} cycles/metre; relief amplitude ${height} m. -->`,
  );
  node('texcoord', 'uv', 'vector2', []);
  op('multiply', 'feature_uv', 'vector2', 'uv', freq, 'vector2', 'vector2');
  node('noise2d', 'micro', 'float', [
    input('texcoord', 'vector2', 'feature_uv', true),
    input('amplitude', 'float', 0.45),
    input('pivot', 'float', 0.5),
  ]);
  let mask = 'micro';
  if (kind === 'weave') {
    node('separate2', 'components', 'multioutput', [input('in', 'vector2', 'feature_uv', true)]);
    node('multiply', 'xphase', 'float', [
      input('in1', 'float', 'components', true, ' output="outx"'),
      input('in2', 'float', Math.PI * 2),
    ]);
    node('multiply', 'yphase', 'float', [
      input('in1', 'float', 'components', true, ' output="outy"'),
      input('in2', 'float', Math.PI * 2),
    ]);
    unary('sin', 'warp', 'float', 'xphase');
    unary('sin', 'weft', 'float', 'yphase');
    op('multiply', 'crossing', 'float', 'warp', 'weft');
    op('multiply', 'crossing_half', 'float', 'crossing', 0.35);
    op('add', 'weave', 'float', 'crossing_half', 0.5);
    op('multiply', 'yarn_minor', 'float', 'micro', 0.15);
    op('add', 'yarn_surface', 'float', 'weave', 'yarn_minor');
    mask = 'yarn_surface';
  }
  if (kind === 'vein') {
    nodes.push(
      '    <!-- Natural mineral ribbons: 0.1–0.4 m warped flow, locally varying millimetre vein widths, faint independent subsidiary veins. Relief stays optically polished. -->',
    );
    op('multiply', 'warp_uv', 'vector2', 'uv', [3.1, 2.7], 'vector2', 'vector2');
    node('noise2d', 'warp_x', 'float', [
      input('texcoord', 'vector2', 'warp_uv', true),
      input('amplitude', 'float', 0.16),
    ]);
    op('add', 'warp_uv_offset', 'vector2', 'warp_uv', [43.1, 17.7], 'vector2', 'vector2');
    node('noise2d', 'warp_y', 'float', [
      input('texcoord', 'vector2', 'warp_uv_offset', true),
      input('amplitude', 'float', 0.13),
    ]);
    node('combine2', 'warp_vector', 'vector2', [
      input('in1', 'float', 'warp_x', true),
      input('in2', 'float', 'warp_y', true),
    ]);
    op('add', 'warped_uv', 'vector2', 'uv', 'warp_vector');
    op('multiply', 'flow_uv', 'vector2', 'warped_uv', [2.1, 13], 'vector2', 'vector2');
    node('fractal2d', 'vein_fbm', 'float', [
      input('texcoord', 'vector2', 'flow_uv', true),
      input('octaves', 'integer', 3),
    ]);
    unary('absval', 'vein_distance', 'float', 'vein_fbm');
    node('noise2d', 'vein_width', 'float', [
      input('texcoord', 'vector2', 'warp_uv', true),
      input('amplitude', 'float', 0.065),
      input('pivot', 'float', 0.065),
    ]);
    op('subtract', 'irregular_distance', 'float', 'vein_distance', 'vein_width');
    node('smoothstep', 'main_vein_body', 'float', [
      input('in', 'float', 'irregular_distance', true),
      input('low', 'float', 0),
      input('high', 'float', 0.065),
    ]);
    op('subtract', 'main_vein', 'float', 1, 'main_vein_body');
    op('multiply', 'fine_flow_uv', 'vector2', 'warped_uv', [7, 29], 'vector2', 'vector2');
    node('noise2d', 'subsidiary_field', 'float', [input('texcoord', 'vector2', 'fine_flow_uv', true)]);
    unary('absval', 'subsidiary_distance', 'float', 'subsidiary_field');
    node('smoothstep', 'subsidiary_body', 'float', [
      input('in', 'float', 'subsidiary_distance', true),
      input('low', 'float', 0.012),
      input('high', 'float', 0.075),
    ]);
    op('subtract', 'subsidiary_vein', 'float', 1, 'subsidiary_body');
    op('multiply', 'subsidiary_faint', 'float', 'subsidiary_vein', 0.13);
    op('max', 'combined_vein', 'float', 'main_vein', 'subsidiary_faint');
    op('subtract', 'vein_body', 'float', 1, 'combined_vein');
    mask = 'vein_body';
  }
  if (kind === 'boucle') {
    nodes.push(
      '    <!-- Curled boucle yarn: irregular 1.3–1.8 mm loops at 2.38 mm spacing, rounded ~0.7 mm yarn width, 90 micrometre relief. -->',
    );
    node('worleynoise2d', 'loop_distance', 'float', [
      input('texcoord', 'vector2', 'feature_uv', true),
      input('jitter', 'float', 0.75),
    ]);
    op('multiply', 'loop_radius_jitter', 'float', 'micro', 0.1);
    op('add', 'loop_radius', 'float', 'loop_radius_jitter', 0.26);
    op('subtract', 'loop_centerline', 'float', 'loop_distance', 'loop_radius');
    unary('absval', 'yarn_distance', 'float', 'loop_centerline');
    node('smoothstep', 'loop_gap', 'float', [
      input('in', 'float', 'yarn_distance', true),
      input('low', 'float', 0.025),
      input('high', 'float', 0.2),
    ]);
    op('subtract', 'plush_loop', 'float', 1, 'loop_gap');
    mask = 'plush_loop';
  }
  if (kind === 'crystal') {
    node('cellnoise2d', 'crystal_domains', 'float', [input('texcoord', 'vector2', 'feature_uv', true)]);
    mask = 'crystal_domains';
  }
  if (mask !== 'micro') {
    op('multiply', 'micro_relief', 'float', 'micro', height * 0.15);
    op('multiply', 'structure_relief', 'float', mask, height);
    op('add', 'height', 'float', 'structure_relief', 'micro_relief');
  } else op('multiply', 'height', 'float', 'micro', height);
  node('mix', 'base_color', 'color3', [
    input(
      'bg',
      'color3',
      kind === 'vein' ? (/Black/.test(n) ? [0.75, 0.77, 0.75] : [0.23, 0.25, 0.26]) : c.map((x) => x * (1 - variation)),
    ),
    input('fg', 'color3', kind === 'vein' ? c : c.map((x) => Math.min(0.98, x * (1 + variation)))),
    input('mix', 'float', mask, true),
  ]);
  op('multiply', 'roughness_detail', 'float', mask, Math.min(0.04, rough * 0.08));
  op('add', 'roughness', 'float', 'roughness_detail', Math.max(0.005, rough - 0.02));
  constant('metalness', 'float', metal);
  op('multiply', 'uv_mm', 'vector2', 'uv', 1000, 'vector2', 'float');
  op('multiply', 'height_mm', 'float', 'height', 1000);
  node('heighttonormal', 'normal_tangent', 'vector3', [
    input('in', 'float', 'height_mm', true),
    input('texcoord', 'vector2', 'uv_mm', true),
    input('scale', 'float', 16),
  ]);
  node('normalmap', 'normal_world', 'vector3', [input('in', 'vector3', 'normal_tangent', true)]);
  output('base_color', 'color3', 'base_color');
  output('specular_roughness', 'float', 'roughness');
  output('metalness', 'float', 'metalness');
  output('normal', 'vector3', 'normal_world');
  constant('specular', 'float', textile ? 0.2 : 0.5);
  output('specular', 'float', 'specular');
  param('specular_IOR', 'float', ior);
  if (coat) {
    param('coat', 'float', coat);
    param('coat_roughness', 'float', 0.08);
  }
  if (trans) {
    if (/pvcFlexibleReinforced/.test(n)) {
      node('smoothstep', 'resin_opening', 'float', [
        input('in', 'float', mask, true),
        input('low', 'float', 0.22),
        input('high', 'float', 0.4),
      ]);
      output('transmission', 'float', 'resin_opening');
    } else param('transmission', 'float', trans);
    param('transmission_color', 'color3', transmissionColor);
    param('transmission_depth', 'float', depth);
    param('transmission_scatter', 'color3', [scatter, scatter, scatter]);
    if (/Film|clearcoat|hardcoat|Coating|LabelStockClear|CoverGlass/.test(n)) param('thin_walled', 'boolean', 'true');
  }
  if (sheen) {
    param('sheen', 'float', sheen);
    param(
      'sheen_color',
      'color3',
      c.map((x) => Math.sqrt(x)),
    );
    param('sheen_roughness', 'float', 0.6);
  }
  if (aniso) param('specular_anisotropy', 'float', aniso);
  if (subsurface) {
    param('subsurface', 'float', subsurface);
    param('subsurface_color', 'color3', c);
    param('subsurface_scale', 'float', 0.0005);
  }
  if (film) {
    param('thin_film_thickness', 'float', film);
    param('thin_film_IOR', 'float', 1.38);
  }
  if (/emissive|ActiveSurface|phosphorescent/.test(n)) {
    const active = /phosphorescent/.test(n) ? 0 : 1;
    const intensity = /Led/.test(n) ? 8 : /Electroluminescent/.test(n) ? 0.4 : 2;
    nodes.push(
      '    <!-- Operating state 1 = powered, 0 = off. Emission intensity is scene-linear relative radiance, requiring renderer luminance calibration. Display image_color is the replaceable image signal. Phosphorescence defaults uncharged/off. -->',
    );
    constant('operating_state', 'float', active);
    constant('emission_intensity', 'float', intensity);
    op('multiply', 'emission_strength', 'float', 'operating_state', 'emission_intensity');
    output('emission', 'float', 'emission_strength');
    let emission = c;
    if (/WarmWhite/.test(n)) emission = [1, 0.73, 0.43];
    if (/NeutralWhite/.test(n)) emission = [1, 0.94, 0.83];
    if (/CoolWhite/.test(n)) emission = [0.76, 0.86, 1];
    if (/AmbientRgb/.test(n)) emission = [1, 1, 1];
    if (/ActiveSurface/.test(n)) {
      constant('image_color', 'color3', [0.08, 0.32, 0.65]);
      constant('black_level', 'color3', /Lcd/.test(n) ? [0.004, 0.004, 0.004] : [0, 0, 0]);
      op('add', 'display_signal', 'color3', 'image_color', 'black_level');
      output('emission_color', 'color3', 'display_signal');
    } else {
      constant('emission_color', 'color3', emission);
      output('emission_color', 'color3', 'emission_color');
    }
  }
  const limitations = [];
  if (/reflectiveSafety/.test(n))
    limitations.push(
      'Standard-surface glossy diffuse approximation: true source-directed retroreflection needs a renderer-specific retroreflective BSDF.',
    );
  if (/fluorescent/.test(n))
    limitations.push(
      'RGB saturated pigment approximation; true fluorescence requires wavelength conversion, with no unconditional emission.',
    );
  if (/Germanium/.test(n)) limitations.push('Visible appearance only; infrared transmission requires spectral optics.');
  if (/ActiveSurface/.test(n))
    limitations.push(
      'image_color is a neutral editable test signal; connect the asset image map here. Scene-linear emission requires calibration to cd/m² in the renderer.',
    );
  if (/Combiner/.test(n))
    limitations.push(
      'Thin-film approximation; spectral angle-selective optical combiner requires measured spectral data.',
    );
  const xml = `<?xml version="1.0"?>\n<materialx version="1.39" colorspace="lin_rec709">\n  <!-- ${esc(d)} -->\n  <!-- Factory-new appearance target; colors are linear Rec.709 artistic reflectances, not measured OEM data. ${esc(limitations.join(' '))} -->\n  <nodegraph name="NG_${n}">\n${nodes.join('\n')}\n${outputs.join('\n')}\n  </nodegraph>\n  <standard_surface name="SR_${n}" type="surfaceshader">\n${surfaces.join('\n')}\n  </standard_surface>\n  <surfacematerial name="M_${n}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_${n}" /></surfacematerial>\n</materialx>\n`;
  await mkdir(path.join(out, n), { recursive: true });
  await writeFile(path.join(out, n, n + '.mtlx'), xml);
}
console.log(`Generated ${entries.length} technical presets (sections 21–31)`);

import { swatch, n, uvScale, grey, bands } from './sw.mjs';
const OUT = new URL('../', import.meta.url).pathname; // docs/material-authoring/noise-lab/smooth/
const V2 = (a) => ['vector2', a.join(', ')];
const F = (v) => ['float', v];
const I = (v) => ['integer', v];

// ---------- 1. ranges: 5-level posterize at -0.4 / 0 / 0.4 / 0.8 (black, dark, mid, light, white) ----------
const post = (label, mk) => ({
  label,
  build: (id, uv) => {
    const s = mk(id, uv);
    const b = bands(id, s.out);
    return { xml: [...s.xml, ...b.xml], out: b.out };
  },
});
const f2 =
  (el, extra = {}, f = 8) =>
  (id, uv) => {
    const u = uvScale(id, f, null, uv);
    return { xml: [...u.xml, n(el, `${id}_n`, 'float', { texcoord: ['vector2', u.uv], ...extra })], out: `${id}_n` };
  };
const f3 =
  (el, extra = {}, f = 8) =>
  (id, uv) => {
    const u = uvScale(id, f, null, uv);
    return {
      xml: [
        ...u.xml,
        n('separate2', `${id}_s`, 'multioutput', { in: ['vector2', u.uv] }),
        n('combine3', `${id}_p`, 'vector3', { in1: F(`${id}_s.outx`), in2: F(`${id}_s.outy`), in3: F(0) }),
        n(el, `${id}_n`, 'float', { position: ['vector3', `${id}_p`], ...extra }),
      ],
      out: `${id}_n`,
    };
  };
const uni =
  (extra, post2 = null) =>
  (id, uv) => {
    const xml = [n('unifiednoise2d', `${id}_n`, 'float', { texcoord: ['vector2', uv], freq: V2([8, 8]), ...extra })];
    let out = `${id}_n`;
    if (post2) {
      xml.push(
        n('multiply', `${id}_m`, 'float', { in1: F(out), in2: F(2) }),
        n('subtract', `${id}_r`, 'float', { in1: F(`${id}_m`), in2: F(1) }),
      );
      out = `${id}_r`;
    }
    return { xml, out };
  };
swatch({
  file: OUT + 'ranges.mtlx',
  name: 'ranges',
  cols: 3,
  rows: 2,
  title:
    'Value distribution at default settings, 8 features/m. Each panel is posterized at -0.4 / 0 / 0.4 / 0.8 (black / dark grey / mid grey / light grey / white); white = value > 0.8.',
  panels: [
    post('noise2d float (std 0.32, |n| < 0.97)', f2('noise2d')),
    post('fractal2d float, octaves 3 (std 0.37, |n| < 1.36)', f2('fractal2d')),
    post(
      'fractal2d octaves 6, diminish 0.7 (std 0.44, |n| < 1.8)',
      f2('fractal2d', { octaves: I(6), diminish: F(0.7) }),
    ),
    post('noise3d on combine3(u,v,0) (std 0.25; narrower)', f3('noise3d')),
    post(
      'unifiednoise2d type 3 defaults: signed fractal clamped to 0..1, half the area is exactly 0',
      uni({ type: I(3) }),
    ),
    post('unifiednoise2d type 0, remapped 2x-1: identical to noise2d (panel r1 c1)', uni({ type: I(0) }, true)),
  ],
});

// ---------- 2. frequency: mask noise2d > 0.25 over the lattice grid (thin grey lines every 1/f) ----------
const freqPanel = (f) => ({
  label: `noise2d(uv*${f}) > 0.25, grid every 1/${f} m`,
  build: (id, uv) => {
    const u = uvScale(id, f, null, uv);
    return {
      xml: [
        ...u.xml,
        n('noise2d', `${id}_n`, 'float', { texcoord: ['vector2', u.uv] }),
        n('ifgreater', `${id}_blob`, 'float', { value1: F(`${id}_n`), value2: F(0.25), in1: F(1), in2: F(0.02) }),
        n(
          'modulo',
          `${id}_fr`,
          'vector2',
          { in1: ['vector2', u.uv], in2: F(1) },
          'lattice lines: fract(uv*f) < 0.03 in u or v',
        ),
        n('separate2', `${id}_frs`, 'multioutput', { in: ['vector2', `${id}_fr`] }),
        n('min', `${id}_frm`, 'float', { in1: F(`${id}_frs.outx`), in2: F(`${id}_frs.outy`) }),
        n('ifgreater', `${id}_out`, 'float', {
          value1: F(0.03),
          value2: F(`${id}_frm`),
          in1: F(0.35),
          in2: F(`${id}_blob`),
        }),
      ],
      out: `${id}_out`,
    };
  },
});
swatch({
  file: OUT + 'frequency.mtlx',
  name: 'frequency',
  cols: 2,
  rows: 2,
  title:
    'Feature size vs frequency: noise2d > 0.25 (white) over the noise lattice (grey lines). Blobs are ~0.7 lattice cells across and ~2 cells apart.',
  panels: [4, 8, 16, 32].map(freqPanel),
});

// ---------- 3. octaves / lacunarity / diminish: grey = 0.5 + 0.35*fractal ----------
const fr = (label, extra) => ({
  label,
  build: (id, uv) => {
    const s = f2('fractal2d', extra, 4)(id, uv);
    return { xml: [...s.xml, ...grey(id, s.out, 0.35)], out: `${id}_g` };
  },
});
swatch({
  file: OUT + 'octaves.mtlx',
  name: 'octaves',
  cols: 3,
  rows: 2,
  title: 'fractal2d parameter sweep at 4 features/m; grey = 0.5 + 0.35 * value (clips at |value| > 1.43).',
  panels: [
    fr('octaves 1 (= noise2d)', { octaves: I(1) }),
    fr('octaves 3 (default)', {}),
    fr('octaves 6', { octaves: I(6) }),
    fr('octaves 6, lacunarity 3', { octaves: I(6), lacunarity: F(3) }),
    fr('octaves 6, diminish 0.3', { octaves: I(6), diminish: F(0.3) }),
    fr('octaves 6, diminish 0.8 (std 0.51, |n| up to 2.1, 0.2% clips)', { octaves: I(6), diminish: F(0.8) }),
  ],
});

// ---------- 4. unifiednoise2d types ----------
const u2 = (label, extra) => ({
  label,
  build: (id, uv) => ({
    xml: [n('unifiednoise2d', `${id}_n`, 'float', { texcoord: ['vector2', uv], freq: V2([6, 6]), ...extra })],
    out: `${id}_n`,
  }),
});
swatch({
  file: OUT + 'unified.mtlx',
  name: 'unified',
  cols: 3,
  rows: 2,
  title: 'unifiednoise2d, freq 6, output shown directly as grey.',
  panels: [
    u2('type 0 perlin: 0.5 + 0.5*noise2d', { type: I(0) }),
    u2('type 1 cell noise: one random 0..1 per unit cell', { type: I(1) }),
    u2('type 2 worley F1 distance (jitter, style apply)', { type: I(2) }),
    u2('type 3 fractal, defaults: signed, clamped -> black holes', { type: I(3) }),
    u2('type 3, outmin 0.5 outmax 1 clampoutput false: 0.5 + 0.5*fractal', {
      type: I(3),
      outmin: F(0.5),
      outmax: F(1),
      clampoutput: ['boolean', 'false'],
    }),
    u2('type 0, jitter 1.0001: same noise rotated 9 degrees about texcoord 0', { type: I(0), jitter: F(1.0001) }),
  ],
});

// ---------- 5. domain warp: a 10/m line grid warped by 4/m noise ----------
const gridOf = (id, p) => [
  n('multiply', `${id}_g10`, 'vector2', { in1: ['vector2', p], in2: F(10) }),
  n('modulo', `${id}_gf`, 'vector2', { in1: ['vector2', `${id}_g10`], in2: F(1) }),
  n('separate2', `${id}_gs`, 'multioutput', { in: ['vector2', `${id}_gf`] }),
  n('min', `${id}_gm`, 'float', { in1: F(`${id}_gs.outx`), in2: F(`${id}_gs.outy`) }),
  n('ifgreater', `${id}_line`, 'float', { value1: F(0.08), value2: F(`${id}_gm`), in1: F(1), in2: F(0.05) }),
];
const warp = (label, kind, amp) => ({
  label,
  build: (id, uv) => {
    const xml = [n('multiply', `${id}_wf`, 'vector2', { in1: ['vector2', uv], in2: F(4) })];
    let d;
    if (kind === 'none') return { xml: gridOf(id, uv), out: `${id}_line` };
    if (kind === 'v2') {
      xml.push(
        n(
          'noise2d',
          `${id}_w`,
          'vector2',
          { texcoord: ['vector2', `${id}_wf`], amplitude: V2([amp, amp]) },
          'vector2 noise: BOTH channels are the same value -> displacement only along the (1,1) diagonal',
        ),
      );
      d = `${id}_w`;
    }
    if (kind === 'v3' || kind === 'f3') {
      xml.push(
        n(
          kind === 'v3' ? 'noise2d' : 'fractal2d',
          `${id}_w3`,
          'vector3',
          { texcoord: ['vector2', `${id}_wf`], amplitude: ['vector3', `${amp}, ${amp}, 0`] },
          'vector3 noise has 3 independent channels; convert keeps x,y',
        ),
      );
      xml.push(n('convert', `${id}_w`, 'vector2', { in: ['vector3', `${id}_w3`] }));
      d = `${id}_w`;
    }
    xml.push(n('add', `${id}_p`, 'vector2', { in1: ['vector2', uv], in2: ['vector2', d] }));
    return { xml: [...xml, ...gridOf(id, `${id}_p`)], out: `${id}_line` };
  },
});
swatch({
  file: OUT + 'warp.mtlx',
  name: 'warp',
  cols: 3,
  rows: 2,
  title: 'Domain warping a 10 cm line grid with 4/m noise. Amplitudes in meters; A*f = amplitude x warp frequency.',
  panels: [
    warp('no warp', 'none'),
    warp('noise2d type=vector2, A 0.05 (A*f 0.2): diagonal-only shear', 'v2', 0.05),
    warp('noise2d vector3 -> convert vector2, A 0.05 (A*f 0.2): safe', 'v3', 0.05),
    warp('noise2d vector3, A 0.08 (A*f 0.32): at the fold limit', 'v3', 0.08),
    warp('noise2d vector3, A 0.15 (A*f 0.6): folds', 'v3', 0.15),
    warp('fractal2d vector3 (3 oct), A 0.03 (A*f 0.12): safe', 'f3', 0.03),
  ],
});

// ---------- 6. idioms (lit): heights in meters ----------
const H = 0.012; // 12 mm relief at 8/m: mean slope ~ H*f*grad(fBm 2.2/cell) ~ 0.2 rad
const hp = (label, build) => ({ label, build });
const fr8 = (id, uv, extra = {}, f = 8) => {
  const u = uvScale(id, f, null, uv);
  return [...u.xml, n('fractal2d', `${id}_n`, 'float', { texcoord: ['vector2', u.uv], octaves: I(5), ...extra })];
};
const scale = (id, src, k) => n('multiply', `${id}_h`, 'float', { in1: F(src), in2: F(k) });
swatch({
  file: OUT + 'idioms.mtlx',
  name: 'idioms',
  cols: 3,
  rows: 2,
  mode: 'lit',
  color: 1 / (2 * H),
  title: 'Height idioms (lit, bridge IBL), all from fractal2d/noise2d at 8/m, ~12 mm relief.',
  panels: [
    hp('plain fBm: fractal2d, 5 octaves', (id, uv) => ({
      xml: [...fr8(id, uv), scale(id, `${id}_n`, H)],
      out: `${id}_h`,
    })),
    hp('ridged: 1 - abs(fBm): sharp crests on the zero contours', (id, uv) => ({
      xml: [
        ...fr8(id, uv),
        n('absval', `${id}_a`, 'float', { in: F(`${id}_n`) }),
        n('subtract', `${id}_r`, 'float', { in1: F(0.5), in2: F(`${id}_a`) }),
        scale(id, `${id}_r`, H * 1.5),
      ],
      out: `${id}_h`,
    })),
    hp('billow: abs(fBm): rounded puffs with creases', (id, uv) => ({
      xml: [...fr8(id, uv), n('absval', `${id}_a`, 'float', { in: F(`${id}_n`) }), scale(id, `${id}_a`, H * 1.5)],
      out: `${id}_h`,
    })),
    hp('terraces: soft-stepped fBm, 6 steps over the range', (id, uv) => ({
      xml: [
        ...fr8(id, uv, { octaves: I(3) }, 4),
        n('multiply', `${id}_k`, 'float', { in1: F(`${id}_n`), in2: F(3) }),
        n('floor', `${id}_fl`, 'float', { in: F(`${id}_k`) }),
        n('subtract', `${id}_fr`, 'float', { in1: F(`${id}_k`), in2: F(`${id}_fl`) }),
        n(
          'smoothstep',
          `${id}_ss`,
          'float',
          { in: F(`${id}_fr`), low: F(0.75), high: F(1) },
          'riser occupies the top 25% of each step',
        ),
        n('add', `${id}_st`, 'float', { in1: F(`${id}_fl`), in2: F(`${id}_ss`) }),
        scale(id, `${id}_st`, H / 2),
      ],
      out: `${id}_h`,
    })),
    hp('anisotropic: noise2d(u*3, v*60), streaks along u', (id, uv) => {
      const u = uvScale(id, [3, 60], null, uv);
      return {
        xml: [
          ...u.xml,
          n('fractal2d', `${id}_n`, 'float', { texcoord: ['vector2', u.uv], octaves: I(3) }),
          scale(id, `${id}_n`, H / 4),
        ],
        out: `${id}_h`,
      };
    }),
    hp('domain-warped fBm: fractal2d(uv*8 + 0.02*fractal3(uv*4).xy (A*f 0.08))', (id, uv) => {
      const w = [
        n('multiply', `${id}_wf`, 'vector2', { in1: ['vector2', uv], in2: F(4) }),
        n('fractal2d', `${id}_w3`, 'vector3', {
          texcoord: ['vector2', `${id}_wf`],
          amplitude: ['vector3', '0.02, 0.02, 0'],
        }),
        n('convert', `${id}_w`, 'vector2', { in: ['vector3', `${id}_w3`] }),
        n('add', `${id}_wp`, 'vector2', { in1: ['vector2', uv], in2: ['vector2', `${id}_w`] }),
      ];
      return { xml: [...w, ...fr8(id, `${id}_wp`), scale(id, `${id}_n`, H)], out: `${id}_h` };
    }),
  ],
});

// ---------- 7. artifacts: lattice pinch points, mitigation, float precision ----------
const ap = (label, f) => ({
  label,
  build: (id, uv) => {
    const s = f(id, uv);
    return { xml: [...s.xml, ...grey(id, s.out, 0.8)], out: `${id}_g` };
  },
});
const plain =
  (off, f = 24) =>
  (id, uv) => {
    const u = uvScale(id, f, off, uv);
    return { xml: [...u.xml, n('noise2d', `${id}_n`, 'float', { texcoord: ['vector2', u.uv] })], out: `${id}_n` };
  };
swatch({
  file: OUT + 'artifacts.mtlx',
  name: 'artifacts',
  cols: 2,
  rows: 2,
  title:
    'Bottom row noise2d at 24/m, top row at 6/m; grey = 0.5 + 0.4*value. Lattice pinch points (value 0 at every integer texcoord) and float32 precision.',
  panels: [
    ap('plain noise2d(uv*24): mid-grey pinch dots on a square grid, blobs aligned to the axes', plain(null)),
    ap('two rotated, offset copies averaged (x0.75): no visible grid', (id, uv) => {
      const u = uvScale(id, 24, null, uv);
      return {
        xml: [
          ...u.xml,
          n('rotate2d', `${id}_ra`, 'vector2', { in: ['vector2', u.uv], amount: F(31) }),
          n('add', `${id}_oa`, 'vector2', { in1: ['vector2', `${id}_ra`], in2: V2([17.31, 5.77]) }),
          n('noise2d', `${id}_na`, 'float', { texcoord: ['vector2', `${id}_oa`] }),
          n('rotate2d', `${id}_rb`, 'vector2', { in: ['vector2', u.uv], amount: F(-58) }),
          n('add', `${id}_ob`, 'vector2', { in1: ['vector2', `${id}_rb`], in2: V2([-3.13, 41.9]) }),
          n('noise2d', `${id}_nb`, 'float', { texcoord: ['vector2', `${id}_ob`] }),
          n('add', `${id}_s`, 'float', { in1: F(`${id}_na`), in2: F(`${id}_nb`) }),
          n('multiply', `${id}_n`, 'float', { in1: F(`${id}_s`), in2: F(0.75) }),
        ],
        out: `${id}_n`,
      };
    }),
    ap('noise2d(uv*6 + 1e5): still smooth', plain([100000, 100000], 6)),
    ap('noise2d(uv*6 + 1e6): float32 steps of 1/16 cell visible', plain([1000000, 1000000], 6)),
  ],
});

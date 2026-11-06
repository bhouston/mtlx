import { measure, node, field, scaled } from './gen.mjs';
const TS = [
  [-0.8, -0.2, 0.4, 0.9],
  [-0.6, 0, 0.6, 1.0],
  [-0.4, 0.2, 0.8, 1.2],
];
const TU = [
  [0.001, 0.3, 0.6, 0.9],
  [0.1, 0.4, 0.7, 0.98],
  [0.2, 0.5, 0.8, 0.999],
];
const F = 64;
const f3 =
  (el, type, extra = {}, chan = null) =>
  (uv, i) => {
    let xml =
      scaled(F)(uv, i) +
      `\n    <separate2 name="s${i}" type="multioutput"><input name="in" type="vector2" nodename="uvf${i}" /><output name="outx" type="float" /><output name="outy" type="float" /></separate2>\n    <combine3 name="p${i}" type="vector3"><input name="in1" type="float" nodename="s${i}" output="outx" /><input name="in2" type="float" nodename="s${i}" output="outy" /><input name="in3" type="float" value="0" /></combine3>\n` +
      node(el, `n${i}`, type, { position: ['vector3', `p${i}`], ...extra });
    return { xml, out: `n${i}` };
  };
const uni = (extra) => (uv, i) => ({
  xml: node('unifiednoise2d', `n${i}`, 'float', {
    texcoord: ['vector2', uv],
    freq: ['vector2', `${F}, ${F}`],
    ...extra,
  }),
  out: `n${i}`,
});
const S = [TS, TS, TS, TS];
measure(
  'm1.mtlx',
  [
    field('noise2d', 'float', F),
    field('noise2d', 'vector3', F, {}, 1),
    field('fractal2d', 'float', F),
    field('fractal2d', 'vector3', F, {}, 2),
  ],
  S,
);
measure(
  'm2.mtlx',
  [
    f3('noise3d', 'float'),
    f3('fractal3d', 'float'),
    field('fractal2d', 'float', F, { octaves: ['integer', 6] }),
    field('fractal2d', 'float', F, { diminish: ['float', 0.7] }),
  ],
  S,
);
measure(
  'm3.mtlx',
  [
    uni({ type: ['integer', 0] }),
    uni({ type: ['integer', 1] }),
    uni({ type: ['integer', 2] }),
    uni({ type: ['integer', 3] }),
  ],
  [TU, TU, TU, TU],
);
measure(
  'm4.mtlx',
  [
    uni({ type: ['integer', 3], clampoutput: ['boolean', 'false'] }),
    uni({ type: ['integer', 3], octaves: ['integer', 1], clampoutput: ['boolean', 'false'] }),
    uni({ type: ['integer', 0], jitter: ['float', 0.5] }),
    uni({ type: ['integer', 3], jitter: ['float', 0.5], clampoutput: ['boolean', 'false'] }),
  ],
  [TU, TS, TU, TS],
);
export { TS, TU };

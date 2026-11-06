import { measure, node, field, scaled } from './gen.mjs';
const F = 64;
const TP = [
  [-0.3, 0.1, 0.5, 0.9],
  [-0.1, 0.25, 0.6, 1.0],
  [0, 0.4, 0.75, 1.1],
];
const TD = [
  [-1e-2, -1e-3, 1e-3, 1e-2],
  [-1e-4, -1e-5, 1e-5, 1e-4],
  [-0.1, -0.05, 0.05, 0.1],
];
measure(
  'm6.mtlx',
  [
    field('noise2d', 'float', F, { amplitude: ['float', 0.5], pivot: ['float', 0.5] }),
    field('fractal2d', 'float', F, { amplitude: ['float', 0.5] }),
    field('noise2d', 'vector3', F, { amplitude: ['vector3', '1, 1, 0.5'], pivot: ['float', 0.25] }, 2),
    field('fractal2d', 'vector3', F, { amplitude: ['vector3', '1, 1, 2'] }, 2),
  ],
  [TP, TP, TP, TP],
);
const d3 = (el, type, ca, cb) => (uv, i) => {
  let xml =
    scaled(F)(uv, i) +
    `\n    <separate2 name="s${i}" type="multioutput"><input name="in" type="vector2" nodename="uvf${i}" /><output name="outx" type="float" /><output name="outy" type="float" /></separate2>\n    <combine3 name="p${i}" type="vector3"><input name="in1" type="float" nodename="s${i}" output="outx" /><input name="in2" type="float" nodename="s${i}" output="outy" /><input name="in3" type="float" value="0.5" /></combine3>\n` +
    node(el, `a${i}`, type, { position: ['vector3', `p${i}`] });
  xml +=
    `\n    <extract name="ex${i}" type="float"><input name="in" type="${type}" nodename="a${i}" /><input name="index" type="integer" value="${ca}" /></extract><extract name="ey${i}" type="float"><input name="in" type="${type}" nodename="a${i}" /><input name="index" type="integer" value="${cb}" /></extract>\n` +
    node('subtract', `n${i}`, 'float', { in1: ['float', `ex${i}`], in2: ['float', `ey${i}`] });
  return { xml, out: `n${i}` };
};
measure(
  'm7.mtlx',
  [
    d3('noise3d', 'vector2', 0, 1),
    d3('fractal3d', 'vector2', 0, 1),
    d3('noise3d', 'vector3', 0, 1),
    d3('fractal3d', 'vector3', 1, 2),
  ],
  [TD, TD, TD, TD],
);
export { TP, TD };

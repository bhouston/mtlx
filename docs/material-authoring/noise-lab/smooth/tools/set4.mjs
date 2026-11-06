import { measure, node, scaled } from './gen.mjs';
const F = 64;
const TD = [
  [-1e-2, -1e-3, 1e-3, 1e-2],
  [-1e-4, -1e-5, 1e-5, 1e-4],
  [-0.1, -0.05, 0.05, 0.1],
];
const dd = (el, type, ca, cb) => (uv, i) => {
  let xml = scaled(F)(uv, i) + '\n' + node(el, `a${i}`, type, { texcoord: ['vector2', `uvf${i}`] });
  xml +=
    `\n    <extract name="ex${i}" type="float"><input name="in" type="${type}" nodename="a${i}" /><input name="index" type="integer" value="${ca}" /></extract><extract name="ey${i}" type="float"><input name="in" type="${type}" nodename="a${i}" /><input name="index" type="integer" value="${cb}" /></extract>\n` +
    node('subtract', `n${i}`, 'float', { in1: ['float', `ex${i}`], in2: ['float', `ey${i}`] });
  return { xml, out: `n${i}` };
};
measure(
  'm8.mtlx',
  [
    dd('noise2d', 'vector4', 0, 1),
    dd('noise2d', 'vector4', 0, 3),
    dd('fractal2d', 'vector4', 0, 3),
    dd('noise2d', 'color4', 1, 2),
  ],
  [TD, TD, TD, TD],
);

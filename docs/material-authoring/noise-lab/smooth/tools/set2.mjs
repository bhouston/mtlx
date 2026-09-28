import { measure, node, scaled } from './gen.mjs';
const F = 64;
const TD = [
  [-1e-2, -1e-3, 1e-3, 1e-2],
  [-1e-4, -1e-5, 1e-5, 1e-4],
  [-0.1, -0.05, 0.05, 0.1],
];
// diff field a - b; a,b are [el,type,extra,chan|null]
const diff = (A, B) => (uv, i) => {
  let xml = scaled(F)(uv, i);
  const mk = ([el, type, extra, chan], tag) => {
    xml += '\n' + node(el, `${tag}${i}`, type, { texcoord: ['vector2', `uvf${i}`], ...extra });
    if (chan === null) return `${tag}${i}`;
    xml += `\n    <extract name="${tag}x${i}" type="float"><input name="in" type="${type}" nodename="${tag}${i}" /><input name="index" type="integer" value="${chan}" /></extract>`;
    return `${tag}x${i}`;
  };
  const a = mk(A, 'a'),
    b = mk(B, 'b');
  xml += '\n' + node('subtract', `n${i}`, 'float', { in1: ['float', a], in2: ['float', b] });
  return { xml, out: `n${i}` };
};
measure(
  'm5.mtlx',
  [
    diff(['noise2d', 'vector2', {}, 0], ['noise2d', 'vector2', {}, 1]),
    diff(['fractal2d', 'vector2', {}, 0], ['fractal2d', 'vector2', {}, 1]),
    diff(['noise2d', 'float', {}, null], ['noise2d', 'vector3', {}, 0]),
    diff(['noise2d', 'vector3', {}, 0], ['noise2d', 'vector3', {}, 1]),
  ],
  [TD, TD, TD, TD],
);
export { TD };

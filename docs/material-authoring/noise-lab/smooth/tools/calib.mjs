import { measure, node, scaled } from './gen.mjs';
const q = (uv, i) => ({
  xml:
    scaled(10)(uv, i) +
    '\n' +
    `    <separate2 name="s${i}" type="multioutput"><input name="in" type="vector2" nodename="uvf${i}" /><output name="outx" type="float" /><output name="outy" type="float" /></separate2>\n    <modulo name="n${i}" type="float"><input name="in1" type="float" nodename="s${i}" output="outx" /><input name="in2" type="float" value="1" /></modulo>`,
  out: `n${i}`,
});
const T = [0, 1, 2, 3].map((i) => [
  [...Array(i).fill(-1), ...Array(4 - i).fill(2)],
  [0.2, 0.4, 0.6, 0.8],
  [-1, -1, -1, -1],
]);
measure('calib.mtlx', [q, q, q, q], T);

// CPU port of three r186 MaterialXNoise worley/cellnoise (hash = Bob Jenkins lookup3 final). Matches renders to ~0.1% area.
// usage: import {worley, cell2, cell3} from "./worley-port.mjs"; worley(u, v, jitter)[k][0] = F(k+1) with three.js 3x3 search (N=1).
const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;
function fin(a, b, c) {
  c = (c ^ b) >>> 0;
  c = (c - rotl(b, 14)) >>> 0;
  a = (a ^ c) >>> 0;
  a = (a - rotl(c, 11)) >>> 0;
  b = (b ^ a) >>> 0;
  b = (b - rotl(a, 25)) >>> 0;
  c = (c ^ b) >>> 0;
  c = (c - rotl(b, 16)) >>> 0;
  a = (a ^ c) >>> 0;
  a = (a - rotl(c, 4)) >>> 0;
  b = (b ^ a) >>> 0;
  b = (b - rotl(a, 14)) >>> 0;
  c = (c ^ b) >>> 0;
  c = (c - rotl(b, 24)) >>> 0;
  return c;
}
export function hash(...v) {
  const s = (0xdeadbeef + (v.length << 2) + 13) >>> 0;
  let a = s,
    b = s,
    c = s;
  a = (a + (v[0] >>> 0)) >>> 0;
  if (v.length > 1) b = (b + (v[1] >>> 0)) >>> 0;
  if (v.length > 2) c = (c + (v[2] >>> 0)) >>> 0;
  if (v.length > 3) throw 0;
  return fin(a, b, c);
}
export const u01 = (h) => h / 0xffffffff;
export const cell2 = (x, y) => u01(hash(Math.floor(x), Math.floor(y))); // cellnoise2d float
export const cell3 = (x, y) => [0, 1, 2].map((k) => u01(hash(Math.floor(x), Math.floor(y), k))); // cellnoise2d vector3
export function point(ix, iy, j) {
  const o = cell3(ix, iy);
  return [ix + (o[0] - 0.5) * j + 0.5, iy + (o[1] - 0.5) * j + 0.5];
}
// returns sorted distances (N=search radius: 1 => three's 3x3), plus nearest point
export function worley(u, v, j = 1, N = 1) {
  const X = Math.floor(u),
    Y = Math.floor(v);
  const d = [];
  for (let x = -N; x <= N; x++)
    for (let y = -N; y <= N; y++) {
      const p = point(X + x, Y + y, j);
      d.push([Math.hypot(p[0] - u, p[1] - v), p]);
    }
  d.sort((a, b) => a[0] - b[0]);
  return d;
}

// decode a measure() render: fraction of plane area above each threshold, per quadrant
import { createRequire } from 'node:module';
const sharp = createRequire(new URL('../../../../../packages/cli/package.json', import.meta.url))('sharp');
const LV = [69, 126, 162, 189, 212];
const lvl = (v) => {
  let b = 0;
  for (let k = 1; k < 5; k++) if (Math.abs(v - LV[k]) < Math.abs(v - LV[b])) b = k;
  return Math.abs(v - LV[b]) <= 12 ? b : -1;
};
const load = async (f) => await sharp(f).ensureAlpha().raw().toBuffer();
export async function decode(img, T, labels = ['q0', 'q1', 'q2', 'q3']) {
  const cal = await load(new URL('./calib.avif', import.meta.url).pathname),
    d = await load(img);
  const cnt = [0, 1, 2, 3].map(() => ({ n: 0, above: [0, 1, 2].map(() => [0, 0, 0, 0]) }));
  let bad = 0;
  for (let p = 0; p < d.length; p += 4) {
    if (cal[p + 3] !== 255 || d[p + 3] !== 255) continue;
    const q = lvl(cal[p]);
    if (q < 0 || q > 3) continue;
    const ls = [0, 1, 2].map((c) => lvl(d[p + c]));
    if (ls.includes(-1)) {
      bad++;
      continue;
    }
    const C = cnt[q];
    C.n++;
    for (let c = 0; c < 3; c++) for (let k = 0; k < 4; k++) if (ls[c] >= k + 1) C.above[c][k]++;
  }
  const out = {};
  cnt.forEach((C, q) => {
    const pairs = [];
    for (let c = 0; c < 3; c++)
      T[q][c].forEach((t, k) => {
        if (t > -1 && t < 2) pairs.push([t, C.above[c][k] / C.n]);
      });
    pairs.sort((a, b) => a[0] - b[0]);
    out[labels[q]] = pairs;
    console.log(labels[q].padEnd(28), `n=${C.n}`, pairs.map(([t, f]) => `${t}:${f.toFixed(3)}`).join(' '));
  });
  console.log('undecodable px:', bad);
  return out;
}

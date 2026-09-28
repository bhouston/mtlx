// CPU port of three.js MaterialXNoise.js perlin (2D float, 2D vec3, 3D float) for statistics.
const u32 = (x) => x >>> 0;
const rotl = (x, k) => u32((x << k) | (x >>> (32 - k)));
function bjfinal(a, b, c) {
  a = u32(a);
  b = u32(b);
  c = u32(c);
  c = u32(c ^ b);
  c = u32(c - rotl(b, 14));
  a = u32(a ^ c);
  a = u32(a - rotl(c, 11));
  b = u32(b ^ a);
  b = u32(b - rotl(a, 25));
  c = u32(c ^ b);
  c = u32(c - rotl(b, 16));
  a = u32(a ^ c);
  a = u32(a - rotl(c, 4));
  b = u32(b ^ a);
  b = u32(b - rotl(a, 14));
  c = u32(c ^ b);
  c = u32(c - rotl(b, 24));
  return c;
}
const hash2 = (x, y) => {
  const s = u32(0xdeadbeef + (2 << 2) + 13);
  return bjfinal(s + u32(x), s + u32(y), s);
};
const hash3 = (x, y, z) => {
  const s = u32(0xdeadbeef + (3 << 2) + 13);
  return bjfinal(s + u32(x), s + u32(y), s + u32(z));
};
const neg = (v, b) => (b ? -v : v);
function grad2(h, x, y) {
  h &= 7;
  const u = h < 4 ? x : y;
  const v = 2 * (h < 4 ? y : x);
  return neg(u, h & 1) + neg(v, h & 2);
}
function grad3(h, x, y, z) {
  h &= 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return neg(u, h & 1) + neg(v, h & 2);
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp2 = (v0, v1, v2, v3, s, t) => (1 - t) * (v0 * (1 - s) + v1 * s) + t * (v2 * (1 - s) + v3 * s);
export function perlin2(px, py, byte = 0) {
  const X = Math.floor(px),
    Y = Math.floor(py),
    fx = px - X,
    fy = py - Y;
  const h = (i, j) => hash2(X + i, Y + j) >>> (8 * byte);
  const r = lerp2(
    grad2(h(0, 0), fx, fy),
    grad2(h(1, 0), fx - 1, fy),
    grad2(h(0, 1), fx, fy - 1),
    grad2(h(1, 1), fx - 1, fy - 1),
    fade(fx),
    fade(fy),
  );
  return 0.6616 * r;
}
export function perlin3(px, py, pz) {
  const X = Math.floor(px),
    Y = Math.floor(py),
    Z = Math.floor(pz),
    fx = px - X,
    fy = py - Y,
    fz = pz - Z;
  const g = (i, j, k) => grad3(hash3(X + i, Y + j, Z + k), fx - i, fy - j, fz - k);
  const u = fade(fx),
    v = fade(fy),
    w = fade(fz);
  const a = lerp2(g(0, 0, 0), g(1, 0, 0), g(0, 1, 0), g(1, 1, 0), u, v);
  const b = lerp2(g(0, 0, 1), g(1, 0, 1), g(0, 1, 1), g(1, 1, 1), u, v);
  return 0.982 * ((1 - w) * a + w * b);
}
export function fractal(fn, x, y, oct = 3, lac = 2, dim = 0.5) {
  let r = 0,
    a = 1;
  for (let i = 0; i < oct; i++) {
    r += a * fn(x, y);
    a *= dim;
    x *= lac;
    y *= lac;
  }
  return r;
}
// stats over an N x N grid of a W x W domain (W lattice cells), irrational step to avoid lattice aliasing
export function stats(f, N = 800, W = 200) {
  const v = new Float64Array(N * N);
  let k = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) v[k++] = f(((i + 0.3137) * W) / N, ((j + 0.7071) * W) / N);
  let s = 0,
    s2 = 0,
    mn = Infinity,
    mx = -Infinity;
  for (const x of v) {
    s += x;
    s2 += x * x;
    if (x < mn) mn = x;
    if (x > mx) mx = x;
  }
  const sorted = Float64Array.from(v).sort();
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const above = (t) => v.reduce((c, x) => c + (x > t), 0) / v.length;
  return {
    mean: s / v.length,
    std: Math.sqrt(s2 / v.length - (s / v.length) ** 2),
    min: mn,
    max: mx,
    p01: q(0.01),
    p05: q(0.05),
    p50: q(0.5),
    p95: q(0.95),
    p99: q(0.99),
    above,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // self-check: perlin is exactly 0 at integer lattice points
  console.assert(perlin2(3, 7) === 0 && perlin3(2, 5, 0) === 0, 'lattice zero');
  const T = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8];
  const cases = {
    noise2d: (x, y) => perlin2(x, y),
    noise2d_vec3_y: (x, y) => perlin2(x, y, 1),
    noise2d_vec3_z: (x, y) => perlin2(x, y, 2),
    fractal2d_3oct: (x, y) => fractal(perlin2, x, y, 3),
    fractal2d_1oct: (x, y) => fractal(perlin2, x, y, 1),
    fractal2d_6oct: (x, y) => fractal(perlin2, x, y, 6),
    fractal2d_5oct_d055: (x, y) => fractal(perlin2, x, y, 5, 2, 0.55),
    fractal2d_3oct_d07: (x, y) => fractal(perlin2, x, y, 3, 2, 0.7),
    fractal2d_3oct_d1: (x, y) => fractal(perlin2, x, y, 3, 2, 1),
    noise3d_z0: (x, y) => perlin3(x, y, 0),
    fractal3d_z0: (x, y) => fractal((a, b) => perlin3(a, b, 0), x, y, 3),
    unified_fractal_default: (x, y) => fractal((a, b) => perlin3(a, b, 0), x, y, 3),
  };
  console.log('case'.padEnd(22), 'mean   std    min    max    p01    p05    p95    p99  | frac above', T.join(' '));
  for (const [n, f] of Object.entries(cases)) {
    const s = stats(f);
    console.log(
      n.padEnd(22),
      [s.mean, s.std, s.min, s.max, s.p01, s.p05, s.p95, s.p99].map((x) => x.toFixed(3).padStart(6)).join(' '),
      '|',
      T.map((t) => s.above(t).toFixed(3)).join(' '),
    );
  }
  // correlation between vec3 channels
  let sxy = 0,
    sxx = 0,
    syy = 0,
    n = 0;
  for (let j = 0; j < 400; j++)
    for (let i = 0; i < 400; i++) {
      const x = (i + 0.31) / 4,
        y = (j + 0.77) / 4;
      const a = perlin2(x, y, 0),
        b = perlin2(x, y, 1);
      sxy += a * b;
      sxx += a * a;
      syy += b * b;
      n++;
    }
  console.log('corr(vec3.x, vec3.y) =', (sxy / Math.sqrt(sxx * syy)).toFixed(3));
  // feature size: mean run length above/below 0 along a line; autocorrelation half-width
  const runs = (f, t = 0) => {
    let prev = f(0.5, 0.123) > t,
      len = 0,
      lens = [];
    for (let x = 0.5; x < 2000; x += 0.01) {
      const c = f(x, 0.123 + x * 0.0) > t;
      if (c !== prev) {
        lens.push(len);
        len = 0;
        prev = c;
      }
      len += 0.01;
    }
    return lens.reduce((a, b) => a + b, 0) / lens.length;
  };
  // use a y that is not on lattice and vary y per segment to avoid a single row
  const runs2 = (f, t) => {
    let tot = 0,
      cnt = 0;
    for (let r = 0; r < 40; r++) {
      const y = r * 7.37 + 0.41;
      let prev = f(0.5, y) > t,
        len = 0;
      for (let x = 0.5; x < 300; x += 0.01) {
        const c = f(x, y) > t;
        if (c !== prev) {
          if (len > 0) {
            tot += len;
            cnt++;
          }
          len = 0;
          prev = c;
        }
        len += 0.01;
      }
    }
    return tot / cnt;
  };
  for (const t of [0, 0.2, 0.3])
    console.log(`noise2d mean chord length (lattice units) crossing t=${t}:`, runs2(cases.noise2d, t).toFixed(3));
  for (const t of [0, 0.2])
    console.log(`fractal2d 3oct mean chord crossing t=${t}:`, runs2(cases.fractal2d_3oct, t).toFixed(3));
  // autocorrelation
  const ac = (f, d) => {
    let s = 0,
      s0 = 0;
    for (let j = 0; j < 300; j++)
      for (let i = 0; i < 300; i++) {
        const x = i * 0.337 + 0.1,
          y = j * 0.291 + 0.2;
        const a = f(x, y);
        s += a * f(x + d, y);
        s0 += a * a;
      }
    return s / s0;
  };
  console.log(
    'noise2d autocorr at d=0.25,0.5,0.75,1,1.5:',
    [0.25, 0.5, 0.75, 1, 1.5].map((d) => ac(cases.noise2d, d).toFixed(3)).join(' '),
  );
  console.log(
    'fractal2d autocorr at d=0.25,0.5,0.75,1,1.5:',
    [0.25, 0.5, 0.75, 1, 1.5].map((d) => ac(cases.fractal2d_3oct, d).toFixed(3)).join(' '),
  );
}

# Smooth noise in the mtlx preview renderer: `noise2d`, `fractal2d`, `unifiednoise2d`

Measured in three.js r186 MaterialXLoader (`three@0.186.0`). UV 1 = 1 m, so "f" means features per meter
(`texcoord = uv * f`). Every number below comes from a render, from the source, or from both.

## What changes how you author (read this first)

1. **Every `vector2` and `vector4`/`color4` noise returns the same value in all channels.** This covers
   `noise2d`, `fractal2d`, `noise3d` and `fractal3d`, and is a renderer bug (see "Renderer bugs").
   Warping `uv + noise2d(type=vector2)` only moves points along the (1,1) diagonal (`warp.avif` r1 c2).
   For a real 2D warp, use `type="vector3"` and `convert` the result to vector2 (r1 c3). The vector3
   channels are independent (correlation -0.01).
2. **The spread is much narrower than "-1..1".** `noise2d` has std 0.32, 90% of the area is inside
   ±0.54, and the extreme is ±0.97. `fractal2d` with defaults has std 0.37, 90% inside ±0.61, and an
   extreme of ±1.36. So `0.5 + 0.5·n` covers only about 0.23–0.77 over 90% of the area. For full
   contrast, use `0.5 + 0.8·n` for `noise2d` (clips ~5%) or `0.5 + 0.6·n` for `fractal2d` (clips ~2%).
3. **`unifiednoise2d type=3` (fractal) is signed and not remapped.** With the defaults
   (`outmin 0`, `outmax 1`, `clampoutput true`) **half the area is exactly 0**, which shows as black
   holes. Use `outmin 0.5`, `outmax 1`, `clampoutput false` to get `0.5 + 0.5·fractal`. This matches
   the MaterialX reference nodegraph, so it is a spec gotcha, not a bug.
4. **Feature size rule of thumb.** At f/m the lattice cell is 1/f. Bright blobs (n > 0.2–0.4) are
   about **0.7/f across** and **about 2/f apart**. The value decorrelates at 0.7/f. For blobs of
   diameter D, use f ≈ 0.7/D.
5. **Every smooth noise is exactly 0 at every integer texcoord.** Layers built as `uv·f` with integer
   f all pinch to 0 together at uv = 0, and on a shared 1/gcd grid. `fractal2d` with lacunarity 2 is
   0 at all base-lattice points. Give each layer its own offset, e.g. `+ (17.31, 5.77)`.
6. **The "lattice artifact" doesn't depend on frequency.** It appears whenever fewer than ~40 lattice
   cells span the view. 25/m on the full plane looks the same as 500/m at `-z 20`
   (`lattice-scale-evidence.avif`). You can hide it by averaging two rotated, offset copies
   (`artifacts.avif` r1 c2).
7. **Warp amplitude limit:** the space folds when A·f·|∇n| > 1. Keep **A·f ≤ 0.2** for a `noise2d`
   warp (it loops at 0.32) and **A·f ≤ 0.1** for a 3–5 octave `fractal2d` warp (0.16 already smears
   relief into streaks). A is the displacement in meters and f is the warp noise's frequency.

## Method

- **Threshold masks, decoded exactly.** `tools/gen.mjs` builds an emission material with 4 quadrants
  and 12 thresholds per quadrant. Each channel is `0.1 + 0.15·(number of thresholds exceeded)`. The
  channel levels stay in 0.1..0.7, where three's Neutral tone mapping is only a constant −0.04
  offset, so the 5 levels land on sRGB 69/126/162/189/212 (verified by `tools/calib.mjs`).
  `tools/dec.mjs` reads the PNG with sharp and reports the fraction of plane area above each
  threshold. It uses 75k–120k pixels per quadrant at f = 64, so ±0.01.
- **CPU port.** `tools/port.mjs` is a line-by-line JS port of three's `MaterialXNoise.js` perlin
  (hash, gradients, fade, 0.6616/0.9820 scales). It matches the renders within ±0.01 at every
  threshold, and it is also line-for-line identical to the MaterialX reference `lib/mx_noise.glsl`.
  Use it to predict distributions without rendering (`node tools/port.mjs`).
- To regenerate the swatches, run `node tools/swatches.mjs`. The measurement renders are
  `tools/set1..4.mjs` → render `-g plane -s 1024` (no background) → `tools/d1.mjs`.

## 1. Output range and distribution (default settings)

Fraction of area **above** t. "R" is measured from renders; the other columns come from the port on
a 200×200-cell grid.

| node / variant                      | std  | min..max    | p05..p95    | >-0.4 | >-0.2 | >0   | >0.2 | >0.4 | >0.6 | >0.8 |
| ----------------------------------- | ---- | ----------- | ----------- | ----- | ----- | ---- | ---- | ---- | ---- | ---- |
| `noise2d` float (R)                 | 0.32 | ±0.97       | ±0.54       | .885  | .722  | .498 | .271 | .113 | .030 | .002 |
| `noise2d` vector3 .y (R)            | 0.32 | ±0.97       | ±0.54       | .886  | .727  | .503 | .280 | .115 | .031 | .002 |
| `fractal2d` float, 3 oct (R)        | 0.37 | -1.36..1.35 | ±0.61       | .853  | .705  | .501 | .297 | .148 | .053 | .012 |
| `fractal2d` vector3 .z (R)          | 0.37 | same        | same        | .853  | .703  | .499 | .294 | .146 | .053 | .011 |
| `fractal2d` 6 oct (R)               | 0.37 | ±1.35       | ±0.62       | .851  | .703  | .501 | .299 | .149 | .055 | .013 |
| `fractal2d` 3 oct, diminish 0.7 (R) | 0.43 | ±1.65       | ±0.70       | .825  | .682  | .502 | .319 | .176 | .080 | .028 |
| `noise3d(u,v,0)` (R)                | 0.25 | ±0.94       | -0.43..0.42 | .940  | .783  | .504 | .221 | .056 | .003 | .000 |
| `fractal3d(u,v,0)` (R)              | 0.29 | -1.16..1.07 | ±0.48       | .915  | .750  | .495 | .244 | .087 | .019 | .002 |

- The distributions are symmetric, bell-shaped, and have mean 0.
- **The vector3/color3 x channel is bit-identical to the float variant** (|diff| < 1e-5 on 100% of
  pixels, render m5), because the float noise hashes to the same byte. So `noise2d` float and
  `noise2d` vector3 .x at the same texcoord are the same pattern. y and z are independent.
- **`noise3d`/`fractal3d` fed with `combine3(u,v,0)`** have a narrower distribution (std 0.25 vs 0.32).
  On the integer z slice the z gradient components are 0. At z = 0.5 the std is 0.28. They have no
  practical advantage over the 2D nodes, except that you get a free "seed" by changing z (the
  channels are otherwise independent and the vector3 variants work). `unifiednoise2d type=3` is
  exactly `fractal3d(u·f, v·f, (jitter−1)·90000)`.
- **Amplitude and pivot.** `noise2d` computes `n·amplitude + pivot`. A vector amplitude scales each
  channel separately. `pivot` is a float added to all channels (measured: `amp 0.5 pivot 0.5`
  → median 0.5, p95 0.77). `fractal2d` has **no pivot**: `amplitude` scales the sum, and you must
  add the offset yourself.

## 2. Feature size vs frequency

From `frequency.avif` (the `noise2d > 0.25` mask over the 1/f lattice, at f = 4/8/16/32) and from the
port:

| measure (lattice units = 1/f m)                | `noise2d`               | `fractal2d` 3 oct       |
| ---------------------------------------------- | ----------------------- | ----------------------- |
| autocorrelation at d = 0.25 / 0.5 / 0.75 / 1.0 | .76 / .28 / −.06 / −.13 | .63 / .19 / −.05 / −.10 |
| mean chord between 0-crossings on a line       | 1.0                     | 0.69                    |
| isolated blobs per cell² (t = 0.2 / 0.4)       | 0.32 / 0.25             | 0.60 / 0.68 (ragged)    |
| median blob diameter (t = 0.2 / 0.4)           | 0.73 / 0.67             | 0.37 / 0.33             |
| positive local maxima per cell²                | 0.62                    | 2.8                     |

**Rule of thumb:** blob ≈ 0.7/f across and ≈ 2/f apart. `uv·4` gives ~18 cm blobs spaced ~50 cm. At
t = 0 the `noise2d > 0` set percolates into a connected labyrinth rather than separate blobs, so
threshold at ≥ 0.2 for islands. Thresholded noise always makes worm-like shapes elongated along the
axes, never round dots (compare broom-finish).

## 3. Octaves, lacunarity, diminish, amplitude, pivot (`octaves.avif`)

- `std ≈ 0.32 · amplitude · sqrt((1 − d^(2N)) / (1 − d²))`, where d = diminish and N = octaves.
  The extreme is ≈ 1.36× amplitude for d = 0.5.

| setting (amplitude 1)              | std  | p01..p99 | min..max |
| ---------------------------------- | ---- | -------- | -------- |
| 1 oct (= `noise2d`, bit-identical) | 0.32 | ±0.68    | ±0.97    |
| 2 oct                              | 0.36 | ±0.79    | ±1.2     |
| 3 oct (default)                    | 0.37 | ±0.82    | ±1.36    |
| 6 or 8 oct                         | 0.37 | ±0.83    | ±1.35    |
| 6 oct, lacunarity 3                | 0.37 | ±0.83    | ±1.4     |
| 6 oct, diminish 0.3                | 0.34 | ±0.73    | ±1.1     |
| 6 oct, diminish 0.7                | 0.44 | ±1.01    | ±1.8     |
| 6 oct, diminish 0.8                | 0.51 | ±1.18    | ±2.1     |

- **Octaves beyond 3 add detail, not range.** Each octave doubles the finest frequency. The
  implementation loops over every octave with no filtering or LOD (the source's `Loop(octaves)`), so
  octaves above ~200/m on the 1 m plane alias to sparkle. Cap `f·lacunarity^(N−1)` at your finest
  visible scale.
- **Lacunarity** only changes the spacing between octave scales; the range is unchanged. With an
  integer lacunarity every octave's lattice contains the base lattice, so zeros and axis alignment
  reinforce. 2.0 is the default; 2.03 or 1.97 breaks the coincidence.
- **Diminish** is the contrast and roughness lever.
- **Amplitude** is a linear multiply, applied after the sum.
- **pivot** exists only on `noise2d`/`noise3d`.

## 4. `unifiednoise2d` (`unified.avif`)

Source: `MaterialXNoise.js` `mx_unifiednoise2d`, which matches MaterialX `stdlib_ng.mtlx`
`NG_unifiednoise2d_float`. The pipeline is `p = texcoord·freq + offset`, then `raw` is picked by
type, then `out = outmin + raw·(outmax − outmin)`, clamped to [outmin, outmax] if `clampoutput`
(default **true**).

| type  | raw value                               | measured distribution (defaults)                          | `jitter`                                       | `style`         | octaves/lacunarity/diminish |
| ----- | --------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- | --------------- | --------------------------- |
| 0     | `0.5 + 0.5·noise2d(rot(p))`             | exactly `0.5 + 0.5·noise2d` (same fractions as `noise2d`) | **rotates** p by (jitter−1)·90000° about p = 0 | no              | no                          |
| 1     | `cellnoise2d(rot(p))`                   | uniform 0..1, one value per unit cell                     | rotates, as for type 0                         | no              | no                          |
| 2     | `worleynoise2d(p, jitter, style)` F1    | median ~0.43, 99.5% < 0.9                                 | real worley jitter                             | yes (only here) | no                          |
| 3     | `fractal3d(p.x, p.y, (jitter−1)·90000)` | **signed** std 0.29; 50% clamped to 0                     | picks a **z slice** (a reseed)                 | no              | yes (only here)             |
| other | 0                                       | `outmin`                                                  |                                                |                 |                             |

- **For types 0, 1 and 3, `jitter` is not jitter.** jitter 1.0001 rotates the type-0 pattern by 9°
  (r2 c3). jitter 0.5 is −125 full turns, which gives almost the original pattern. For type 3, any
  change ≥ 1/90000 selects a new, independent z slice. To reseed, use `offset` (e.g. `37.1, 91.7`).
- `freq` is a vector2, so `freq="3, 60"` gives anisotropic stretching in one node.
- `unifiednoise2d type=0` is just `noise2d` with `amplitude 0.5 pivot 0.5`. It adds only `freq`/`offset`
  and the jitter rotation.

## 5. Artifacts

- **Lattice (`artifacts.avif`, `lattice-scale-evidence.avif`).** The value is 0 at every integer
  point, and there are only 8 gradient directions ((±1,±2), (±2,±1)). The result is a square grid of
  mid-value pinch points, with blobs strung along rows and columns. The effect is scale-invariant:
  it shows whenever ≲ 40 cells are in view. In normal maps, the 2×2-pixel derivative quads add a
  plaid texture on steep slopes (c2 in the evidence image). Fixes: average two copies with
  different `rotate2d` angles and offsets (r1 c2), or rotate the texcoord ~30°, or add a
  non-integer lacunarity.
- **Repetition.** None. The hash is Bob Jenkins' `bjfinal` of the integer cell coordinates, with no
  permutation table, so there is no period inside int32. The repetition you do get is
  **correlation between layers**: same texcoord means the same pattern (float equals vector3.x,
  and `fractal2d` octave 1 equals `noise2d`), and all layers share zeros at uv = 0.
- **Precision.** The texcoord magnitude sets the resolution (float32). `uv·6 + 1e5` is still smooth.
  `uv·6 + 1e6` shows 1/16-cell steps (`artifacts.avif` r2 c2). Frequency itself is harmless: 500/m
  over 1 m is only 500 units. Keep |f·uv + offset| < 1e5, and use reseed offsets < 1000.
- **Vector variants.** vector3 and color3 are independent per channel. vector2, vector4 and color4
  are all channels equal (a bug). `color3` fractal used directly as a tint gives rainbow hues,
  because the channels are independent. Tint with float noise × color instead (confirms
  exposed-aggregate).

## 6. Idioms (`idioms.avif`, `warp.avif`)

**Remap to 0..1 with full contrast.** `noise2d` in one node:

```xml
<noise2d name="n01" type="float"><input name="texcoord" type="vector2" nodename="uv_f" /><input name="amplitude" type="float" value="0.8" /><input name="pivot" type="float" value="0.5" /></noise2d>
```

**Decorrelate layers.** Give every layer its own offset, so the layers don't share lattice zeros at
uv = 0:

```xml
<multiply name="uv_a" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="8" /></multiply>
<add name="uv_a_o" type="vector2"><input name="in1" type="vector2" nodename="uv_a" /><input name="in2" type="vector2" value="17.31, 5.77" /></add>
```

**True 2D domain warp.** Use vector3 noise and convert to vector2 (**not** `type="vector2"`).
Safe when A·f ≤ 0.2 (noise2d) or ≤ 0.1 (fractal):

```xml
<multiply name="warp_f" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="4" /></multiply>
<noise2d name="warp3" type="vector3"><input name="texcoord" type="vector2" nodename="warp_f" /><input name="amplitude" type="vector3" value="0.05, 0.05, 0" /></noise2d>
<convert name="warp" type="vector2"><input name="in" type="vector3" nodename="warp3" /></convert>
<add name="uv_warped" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" nodename="warp" /></add>
```

A **U-only wobble** still works with any variant: `noise2d type="vector2"` with `amplitude "0.012, 0"`.

**Ridged.** Sharp crests on the zero contours; the value is 0.5 − |n|, mostly in 0..0.5:

```xml
<absval name="n_abs" type="float"><input name="in" type="float" nodename="fbm" /></absval>
<subtract name="ridged" type="float"><input name="in1" type="float" value="0.5" /><input name="in2" type="float" nodename="n_abs" /></subtract>
```

**Billow.** Use `absval` alone: rounded puffs with V-creases. Its mean is ≈ 0.25 for `noise2d` and
0.29 for `fractal2d`.

**Terraces.** `k` steps per unit of n, with the riser in the top 25% of each step:

```xml
<multiply name="t_k" type="float"><input name="in1" type="float" nodename="fbm" /><input name="in2" type="float" value="3" /></multiply>
<floor name="t_fl" type="float"><input name="in" type="float" nodename="t_k" /></floor>
<subtract name="t_fr" type="float"><input name="in1" type="float" nodename="t_k" /><input name="in2" type="float" nodename="t_fl" /></subtract>
<smoothstep name="t_ss" type="float"><input name="in" type="float" nodename="t_fr" /><input name="low" type="float" value="0.75" /><input name="high" type="float" value="1" /></smoothstep>
<add name="terraced" type="float"><input name="in1" type="float" nodename="t_fl" /><input name="in2" type="float" nodename="t_ss" /></add>
```

**Anisotropic.** Multiply by a vector2. `(3, 60)` gives streaks ~23 cm long and ~1.2 cm wide
(0.7/f each):

```xml
<multiply name="uv_streak" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="3, 60" /></multiply>
```

**`unifiednoise2d` fractal as 0..1:**

```xml
<unifiednoise2d name="u_fbm" type="float"><input name="texcoord" type="vector2" nodename="uv" /><input name="freq" type="vector2" value="8, 8" /><input name="type" type="integer" value="3" /><input name="outmin" type="float" value="0.5" /><input name="outmax" type="float" value="1" /><input name="clampoutput" type="boolean" value="false" /></unifiednoise2d>
```

**Height slope budget.** For height = A·n(f·x), the mean slope is ≈ 1.2·A·f and the max is ≈ 3·A·f
(noise2d); for 3-octave fBm the mean is ≈ 2·A·f and the max ≈ 7.6·A·f. To stay under 45° (see
cmu-block), use A ≤ 1/(3f) for noise2d and A ≤ 1/(8f) for fBm.

## Corrections to AUTHORING.md and AGENT_FEEDBACK.md

- AUTHORING says to warp worley cracks with "`noise2d type="vector2"` (amplitude ~0.15)". That warp
  is **diagonal-only**; use the vector3 + `convert` warp above.
- "`noise2d` and `fractal2d` are signed, about -1..1": true for the extremes, but std 0.32/0.37. The
  suggested `amplitude 0.5 + 0.5` remap gives low contrast (0.23..0.77 over 90% of the area).
- white-precast's "`noise2d` rarely exceeds ±0.5": ~13% of the area exceeds |0.5|, ~6% exceeds |0.6|,
  and the max is 0.97.
- cracked-slab's "lattice artifacts above ~500/m at zoom 20": the artifact is scale-invariant (it
  depends on cells in view), not tied to 500/m. Worley isn't needed to avoid it; two rotated copies
  hide it.
- cracked-slab's meander warp (3-octave fractal at ±0.35 cell folds, 2 octaves at ≤0.28 is OK)
  fits the fold limit A·f·max|∇n| < 1.

## Renderer bugs

The previously known bugs (the `heighttonormal` absolute threshold, and `noise2d`/`fractal2d`
vector2 returning identical x and y) are not repeated here.

**B1. The `noise3d`/`fractal3d` vector2 variants also return identical channels.** Confirmed.
This is the same root cause as the known 2D case, but it reaches the 3D nodes too.

- Repro (`tools/set3.mjs` → m7):
  `<noise3d name="n" type="vector2"><input name="position" type="vector3" nodename="p" /></noise3d>`,
  then `extract` index 0 minus index 1. Render with `-g plane -s 1024` and decode.
- Observed: x − y = 0 on 100% of pixels.
- Expected (reference `mx_noise3d_vector2.glsl`): `mx_perlin_noise_vec3(p).xy * amplitude + pivot`.
  For `mx_fractal3d_vector2.glsl`: `vec2(fractal(p), fractal(p + (19,193,17)))`.
- Source: `examples/jsm/loaders/materialx/MaterialXNodeLibrary.js`, `usesVec3Noise` (vector3/color3
  only), `mx_noise_materialx` and `mx_fractal_noise_materialx_3d`. These fall through to the float
  path, and the `MaterialXDocument.js` output cast (`nodeToTypeClass(node)`) splats the float. A
  correct `mx_fractal_noise_vec2` (3D) already exists in `MaterialXNoise.js` but is not wired in.

**B2. The `vector4`/`color4` variants of `noise2d` and `fractal2d` return the float noise in all 4
channels.** Confirmed. It very likely affects `noise3d`/`fractal3d` too; that part is from the
source, not rendered.

- Repro (`tools/set4.mjs` → m8): `noise2d type="vector4"` with x − y and x − w, `fractal2d
type="vector4"` with x − w, and `noise2d type="color4"` with g − b.
- Observed: every difference is 0 on 100% of pixels.
- Expected: reference `mx_noise2d_vector4.glsl` gives `vec4(perlin_vec3(p), perlin_float(p + (19,73)))`,
  and `mx_fractal2d_noise_vec4` gives `vec4(fractal_vec3(p), fractal_float(p + (19,193)))`.
- Source: the same dispatch as B1. `mx_noise_vec4` (`MaterialXNodes.js`) already implements the
  reference noise vec4 but is never used. A 2D fractal vec4 and a 2D fractal vec2 (offset (19,193))
  would need adding alongside `mx_fractal_noise_vec3_materialx_2d`.
- Suggested fix for B1 and B2: dispatch on the node type in `mx_noise_materialx` and
  `mx_fractal_noise_materialx_2d/3d`. vector2 should take `.xy` of the vec3 noise (noise) or
  `(f(p), f(p+off))` (fractal). vector4/color4 should use the vec4 builders.

**Checked, and not bugs** (they match the MaterialX reference):

- perlin hash, gradients and scales: the port is identical to `mx_noise.glsl`, and the renders match
  the port within ±0.01.
- `unifiednoise2d`: the signed, clamped fractal; jitter as rotation or z slice; style used only by
  worley. It matches `NG_unifiednoise2d_float`.
- `fractal2d` has no pivot.
- The 0.9820 scale in 3D.

## Files

| file                          | shows                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ranges.mtlx/.avif`           | 5-level posterize of 6 variants at 8/m: noise2d, fractal2d, fractal 6 oct d0.7, noise3d(u,v,0), unified type 3 defaults (black holes), unified type 0 = noise2d |
| `frequency.mtlx/.avif`        | `noise2d > 0.25` over the lattice grid at 4/8/16/32 per m                                                                                                       |
| `octaves.mtlx/.avif`          | fractal2d octaves 1/3/6, lacunarity 3, diminish 0.3/0.8                                                                                                         |
| `unified.mtlx/.avif`          | unifiednoise2d types 0–3, the type-3 remap fix, jitter as rotation                                                                                              |
| `warp.mtlx/.avif`             | a 10 cm grid warped by 4/m noise: vector2 (diagonal only), vector3 at A·f 0.2/0.32/0.6, fractal at 0.12                                                         |
| `idioms.mtlx/.avif`           | lit (bridge): fBm, ridged, billow, terraces, anisotropic, domain-warped fBm                                                                                     |
| `artifacts.mtlx/.avif`        | lattice pinch grid, the two-rotated-copies fix, precision at 1e5 and 1e6 offsets                                                                                |
| `lattice-scale-evidence.avif` | noise2d 500/m at z20 (emission, lit) vs 25/m at z1 (lit): same lattice look                                                                                     |
| `tools/`                      | CPU port, measurement generator/decoder with calibration, swatch generator                                                                                      |

In every swatch, panels use panel-local UVs, so all panels sample the same patch of the pattern and
can be compared directly. Row 1 is at the bottom of the image; the far (v = 1) edge is at the top.

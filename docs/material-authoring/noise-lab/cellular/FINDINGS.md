# Cellular noise in the three.js MaterialX preview (r186)

`worleynoise2d`, `cellnoise2d` and friends, as the mtlx preview renderer actually implements them.
**Sources:** `three/src/nodes/materialx/MaterialXNoise.js` (the algorithms) and
`three/examples/jsm/loaders/materialx/MaterialXNodeLibrary.js` (the dispatch by output type).
**Evidence:** threshold-mask renders (emission, `ifgreater` → 1/0 per RGB channel), with the area fraction counted
on opaque pixels with `sharp`. Those fractions were compared with a CPU port of the same hash and search
([`worley-port.mjs`](worley-port.mjs)). Every render agreed with the port to within about 0.2% of area (table at the end),
so the port's numbers (maximum F1, clipping rates) are exact for this renderer.

Swatches (UV 1 = 1 m; `plane.avif` = the 1 m tile, `closeup.avif` = `-z 5` lit or `-z 3` emission):

| Folder                                  | What it shows                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`cellular-ids`](cellular-ids/)         | emission: TL `style=1` float id, TR `style=1` vector3 id, BL `cellnoise2d` (does **not** follow the cells), BR F1 |
| [`cellular-jitter`](cellular-jitter/)   | emission: jitter 0 / 0.5 / 0.75 / 1, with radius-0.25 pits in blue and the clipped part in red                    |
| [`cellular-stones`](cellular-stones/)   | lit: round pits, domed pebbles, angular stones, faceted chips                                                     |
| [`cellular-paving`](cellular-paving/)   | lit: tapering cracks in a slab, and flagstones / crazy paving with a palette                                      |
| [`cellular-palette`](cellular-palette/) | lit: a per-chip palette (terrazzo), and sparse features on a manual grid vs. low-jitter worley                    |

## 1. What each variant returns

All 2D variants use the **same feature points**: for integer cell (i,j) the point is
`(i,j) + 0.5 + (h(i,j,0) − 0.5, h(i,j,1) − 0.5)·jitter`, where `h` = `mx_hash_int` scaled to 0..1.
The search covers the 3×3 cells around `floor(texcoord)`. The metric is **Euclidean** in every case: the loader
hard-wires metric 0, and there is no metric input.

| Node (`worleynoise2d`) | style 0      | style 1                                                                                                                |
| ---------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `type="float"`         | F1           | `h(i,j)` (2-arg hash) of the winning point's cell = **the same value `cellnoise2d` float gives at that feature point** |
| `type="vector2"`       | (F1, F2)     | (`h(i,j,0)`, `h(i,j,1)`) = the vector3 id's `.xy`                                                                      |
| `type="vector3"`       | (F1, F2, F3) | (`h(i,j,0)`, `h(i,j,1)`, `h(i,j,2)`)                                                                                   |

- **F1 = float = vector2.x = vector3.x exactly.** An overlay diff above 1e-4 is lit on 0% of pixels, and the same holds for vector2.y against vector3.y.
  The claim that "float and vector variants hash feature points differently" is **false for the points**: `mx_cell_noise_float(vec3(i,j,0|1))`
  and `mx_cell_noise_vec3(vec2(i,j)).xy` both evaluate `hash(i,j,0|1)`. Only the **style 1 ids** differ. The float id is `hash(i,j)` and
  the vector ids are `hash(i,j,k)`, so float id ≠ vector3 id.x on 100% of pixels. Take all your ids from one variant.
- **The style 1 ids are per Voronoi cell.** They are constant over each jittered cell and change exactly at the F2−F1 = 0 borders
  (`cellular-ids`, TL/TR). Each is uniform on 0..1: `id > 0.25/0.5/0.75` covers 74.9 / 49.6 / 24.7% of area.
  Use them for per-stone colour, height, presence and size. `cellnoise2d` on the same texcoord gives square cells that cut stones in two (BL).
- **The vector ids' `.xy` are the feature point's own jitter offset** (before scaling by jitter). The test: `|p − (floor(p) + id3.xy)| == F1`
  held on 63.55% of pixels, against 63.49% predicted (the pixels whose nearest point lies in their own square). The effect is that at jitter 1, `id.x`
  tells you where the point sits in its square. It is still uniform, but not independent of the geometry. **Use `id3.z` or the float id** when
  you want a random that is unrelated to position.
- `style=1` is taken from `floor(feature point)`. With jitter > 1 the points leave their squares, so both F1 (from the 3×3 search) and the ids go wrong. Keep jitter ≤ 1.
- `cellnoise2d` float is 0..1, constant per integer square, with value `hash(i,j)`. `cellnoise2d type="vector3"` works in three.js and gives
  `hash(i,j,0..2)`, but it is missing from the mtlx-core registry. `check --strict` doesn't flag it.
  `cellnoise3d(combine3(u,v,0))` equals `cellnoise2d vector3 .x` (0% of pixels differ).

### Value ranges (in cell units, measured on the CPU port and confirmed by the masks at jitter 1 and 0.5)

| jitter      | max F1 | F1 p50 / p99 | min F2 (≈ closest pair / 2) | max F2 | max F3 | max F2−F1 |
| ----------- | ------ | ------------ | --------------------------- | ------ | ------ | --------- |
| 0           | 0.707  | 0.40 / 0.66  | 0.50                        | 1.00   | 1.12   | 1.00      |
| 0.5         | 0.90   | 0.40 / 0.72  | 0.26                        | 1.20   | 1.31   | 1.10      |
| 0.75        | 1.04   | 0.41 / 0.80  | 0.16                        | 1.30   | 1.45   | 1.19      |
| 0.9         | 1.15   | 0.42 / 0.84  | 0.10                        | 1.36   | 1.48   | 1.25      |
| 1 (default) | 1.16   | 0.43 / 0.87  | 0.06                        | 1.35   | 1.54   | 1.25      |

At jitter 1: F1 > 0.4 / 0.7 / 0.9 covers 54.5 / 8.4 / 0.5% of area. F2 > 0.8 covers 28.8%, F3 > 1.0 covers 25.7%, and F2−F1 > 0.5 covers 14.4%.
F1 is 0 only at the points. **F1 at a border is anywhere from about 0.03 to 1.16**, not "0.5–0.8". Don't threshold F1 to find borders; use F2−F1.

`dotproduct(worley_vector2, (-1, 1))` = F2−F1 in one node (confirmed, used in every swatch). F2−F1 is 0 on borders and grows at about
2·cos θ per cell away from them. The measured mean gradient on borders is 1.53, so **the full width of `F2−F1 < t` is about 1.3·t cells**, and
2t cells in the corners near vertices. In metres: crack width ≈ 1.3·t / freq, and the area fraction ≈ 2.4·t (for t = 0.02 / 0.05 / 0.1: 5.1 / 12.4 / 24.0%).
A texcoord warp steepens the gradient, so a warped crack renders about 2–4× thinner (`cellular-paving`: t = 0.03 at 4/m gives 2–4 mm).

## 2. Shared points: overlays

Identical, 0 differing pixels: float F1 vs. vector2.x, vector2.y vs. vector3.y, `unifiednoise2d type=2 freq=40` vs. `worleynoise2d(uv·40)`,
and vector2 style 1 vs. vector3 style 1 .xy. So it is safe to mix `worleynoise2d float style=1` (id) with `worleynoise2d vector2`
(F1, F2) **on the same texcoord and jitter**. The swatches do exactly that.

- `worleynoise3d(combine3(u, v, 0))` is a different pattern: its points are also jittered in z, so the plane slices through 3D cells.
  F1 < 0.1 covers 0.35% of area against 3.19% for 2D, so pits are fewer and shallower, and the cells don't match the 2D ones.
  It costs 27 lookups instead of 9. Use it only if you need a z or time axis.
- `unifiednoise2d type=2` is `worleynoise2d float` plus `freq`/`offset`/`outmin`/`outmax`. It is float only and has no F2, and its
  `clampoutput` defaults to **true** (F1 > outmax clips). For types 0 and 1 its `jitter` doesn't jitter anything:
  it rotates the domain by (jitter−1)·90000°. Nothing is gained over plain `worleynoise2d`.

## 3. Jitter

The points stay inside `0.5 ± jitter/2` of their square, so the minimum spacing is at least 1 − jitter along an axis. See the `cellular-jitter` swatch.
jitter 0 gives a square grid (F1 max 0.707). At 0.5 the result still looks gridded, as rows of cells are visible. At 0.75 and above it reads as random.
The effect on maximum F1 is in the table above: 0.71 → 0.90 → 1.04 → 1.16.

## 4. Clipping and safe radii

**Why features clip.** F1 always measures to the _nearest_ point. A disk of radius r around a point P is cut by a straight line
wherever another point Q lies within 2r of P, because past the bisector F1 measures to Q instead. That is the only mechanism.
**The 3×3 search is not the cause.** F1 was never wrong in 400k samples. F2 is wrong on 0.012% of pixels and F3 on 0.40% (at jitter 1;
0.03% at 0.75), which shows up as rare seams in F3-based effects.

**Rule: a feature of radius r ≤ (1 − jitter)/2 cells is never clipped.** At jitter 0.5 with r 0.25, F2 < 0.25 covers exactly 0% of pixels
(F2 < r marks the overlap zone, so it is where clipping happens). At jitter 1, 0.49% of pixels at r 0.25 and 1.22% at r 0.3. Share of features clipped:

| jitter | r 0.10 | 0.15 | 0.20 | 0.25 | 0.30 | 0.35 | 0.40 |
| ------ | ------ | ---- | ---- | ---- | ---- | ---- | ---- |
| 0.5    | 0      | 0    | 0    | 0    | 4.5% | 23%  | 52%  |
| 0.75   | 0      | 0.2% | 3.3% | 12%  | 27%  | 48%  | 70%  |
| 0.9    | 0.6%   | 3.4% | 10%  | 22%  | 38%  | 57%  | 75%  |
| 1      | 2.1%   | 6.7% | 15%  | 28%  | 44%  | 61%  | 78%  |

The earlier "≲0.25–0.3" limit at jitter 0.9 clips 22–38% of features. It gets away with that only because most clips are shallow slivers.
Lower the jitter instead (0.5–0.7 still looks random once presence and size vary per feature).

**Which constructions clip:**

- Any `r − F1` disk (pits, grains, round stones) with r > (1−jitter)/2.
- **`cellnoise2d` gating** on the worley texcoord: the square cell and the Voronoi cell disagree, so half the pit gets a different value.
  It becomes safe when r ≤ (1−jitter)/2, since the disk then stays inside its own square. `style=1` is always consistent.
- F2−F1 constructions (cracks, insets, flagstones) never clip. They _are_ the borders.
- Clipping also applies when warping: warping the texcoord moves the borders together with the disks, so a warp doesn't cause clipping, but it doesn't fix it either.

## 5. Recipes (every snippet is lifted from the swatch files; `uv` = default texcoord, heights in metres)

### Round pits of varied size, never clipped (`cellular-stones` TL)

30 cells/m, jitter 0.7, r = 0.05..0.15 cell from the per-pit id, no pit where id < 0.35. Paraboloid bowl, depth r/2 (45° rim).
Radius from `style=1` gives true circles. The AUTHORING.md noise2d radius gives deformed, varied blobs; both are fine within the safe radius.

```xml
<multiply name="uv_p" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="30" /></multiply>
<worleynoise2d name="p_f1" type="float"><input name="texcoord" type="vector2" nodename="uv_p" /><input name="jitter" type="float" value="0.7" /></worleynoise2d>
<worleynoise2d name="p_id" type="float"><input name="texcoord" type="vector2" nodename="uv_p" /><input name="jitter" type="float" value="0.7" /><input name="style" type="integer" value="1" /></worleynoise2d>
<ifgreater name="p_on" type="float"><input name="value1" type="float" nodename="p_id" /><input name="value2" type="float" value="0.35" /><input name="in1" type="float" value="1" /><input name="in2" type="float" value="0" /></ifgreater>
<multiply name="p_r0" type="float"><input name="in1" type="float" nodename="p_id" /><input name="in2" type="float" value="0.154" /></multiply>
<subtract name="p_r1" type="float"><input name="in1" type="float" nodename="p_r0" /><input name="in2" type="float" value="0.004" /></subtract>
<multiply name="p_r2" type="float"><input name="in1" type="float" nodename="p_r1" /><input name="in2" type="float" nodename="p_on" /></multiply>
<add name="p_r" type="float"><input name="in1" type="float" nodename="p_r2" /><input name="in2" type="float" value="0.0001" /></add>
<divide name="p_t" type="float"><input name="in1" type="float" nodename="p_f1" /><input name="in2" type="float" nodename="p_r" /></divide>
<multiply name="p_t2" type="float"><input name="in1" type="float" nodename="p_t" /><input name="in2" type="float" nodename="p_t" /></multiply>
<subtract name="p_b0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="p_t2" /></subtract>
<max name="p_bowl" type="float"><input name="in1" type="float" nodename="p_b0" /><input name="in2" type="float" value="0" /></max>
<multiply name="p_depth" type="float"><input name="in1" type="float" nodename="p_r" /><input name="in2" type="float" value="-0.0167" /></multiply>
<multiply name="h_tl" type="float"><input name="in1" type="float" nodename="p_bowl" /><input name="in2" type="float" nodename="p_depth" /></multiply>
```

### Domed pebbles: smooth-min packing with a crown (`cellular-stones` TR)

s = smin((F2−F1−gap)/2, R−F1, k); dome = smoothstep(s, 0, 0.18) · (1 − 0.6(F1/0.7)²). Use gap 0.06, R 0.55, k 0.3, jitter 0.85, 25/m.
Height 2.5–4 mm per pebble from the id. The id multiplies a profile that is 0 at the edge, so there are no steps.
A larger R packs tighter; at about 0.42 the pebbles sit apart in the matrix.

```xml
<multiply name="uv_b" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="25" /></multiply>
<worleynoise2d name="b_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_b" /><input name="jitter" type="float" value="0.85" /></worleynoise2d>
<worleynoise2d name="b_id" type="float"><input name="texcoord" type="vector2" nodename="uv_b" /><input name="jitter" type="float" value="0.85" /><input name="style" type="integer" value="1" /></worleynoise2d>
<extract name="b_f1" type="float"><input name="in" type="vector2" nodename="b_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="b_e" type="float"><input name="in1" type="vector2" nodename="b_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<subtract name="b_a0" type="float"><input name="in1" type="float" nodename="b_e" /><input name="in2" type="float" value="0.06" /></subtract>
<multiply name="b_a" type="float"><input name="in1" type="float" nodename="b_a0" /><input name="in2" type="float" value="0.5" /></multiply>
<subtract name="b_b" type="float"><input name="in1" type="float" value="0.55" /><input name="in2" type="float" nodename="b_f1" /></subtract>
<subtract name="b_ab" type="float"><input name="in1" type="float" nodename="b_a" /><input name="in2" type="float" nodename="b_b" /></subtract>
<absval name="b_abs" type="float"><input name="in" type="float" nodename="b_ab" /></absval>
<subtract name="b_h0" type="float"><input name="in1" type="float" value="0.3" /><input name="in2" type="float" nodename="b_abs" /></subtract>
<max name="b_h1" type="float"><input name="in1" type="float" nodename="b_h0" /><input name="in2" type="float" value="0" /></max>
<divide name="b_h" type="float"><input name="in1" type="float" nodename="b_h1" /><input name="in2" type="float" value="0.3" /></divide>
<multiply name="b_hh" type="float"><input name="in1" type="float" nodename="b_h" /><input name="in2" type="float" nodename="b_h" /></multiply>
<multiply name="b_corr" type="float"><input name="in1" type="float" nodename="b_hh" /><input name="in2" type="float" value="0.075" /></multiply>
<min name="b_min" type="float"><input name="in1" type="float" nodename="b_a" /><input name="in2" type="float" nodename="b_b" /></min>
<subtract name="b_s" type="float"><input name="in1" type="float" nodename="b_min" /><input name="in2" type="float" nodename="b_corr" /></subtract>
<smoothstep name="b_prof" type="float"><input name="in" type="float" nodename="b_s" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.18" /></smoothstep>
<divide name="b_q" type="float"><input name="in1" type="float" nodename="b_f1" /><input name="in2" type="float" value="0.7" /></divide>
<multiply name="b_q2" type="float"><input name="in1" type="float" nodename="b_q" /><input name="in2" type="float" nodename="b_q" /></multiply>
<multiply name="b_q3" type="float"><input name="in1" type="float" nodename="b_q2" /><input name="in2" type="float" value="0.6" /></multiply>
<subtract name="b_crown" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="b_q3" /></subtract>
<multiply name="b_dome" type="float"><input name="in1" type="float" nodename="b_prof" /><input name="in2" type="float" nodename="b_crown" /></multiply>
<multiply name="b_hs0" type="float"><input name="in1" type="float" nodename="b_id" /><input name="in2" type="float" value="0.0015" /></multiply>
<add name="b_hs" type="float"><input name="in1" type="float" nodename="b_hs0" /><input name="in2" type="float" value="0.0025" /></add>
<multiply name="h_tr" type="float"><input name="in1" type="float" nodename="b_dome" /><input name="in2" type="float" nodename="b_hs" /></multiply>
<mix name="b_col" type="color3"><input name="bg" type="color3" value="0.42, 0.36, 0.28" /><input name="fg" type="color3" value="0.2, 0.2, 0.21" /><input name="mix" type="float" nodename="b_id" /></mix>
<smoothstep name="b_mask" type="float"><input name="in" type="float" nodename="b_s" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.03" /></smoothstep>
```

### Angular stones: F2−F1 inset (`cellular-stones` BL)

min(F2−F1 − 0.07, 0.85 − F1), then `smoothstep(·, 0, 0.06)`. Keep R at 0.8 or more. With R about 0.6 the circle dominates on off-centre points and
the stones come out D-shaped (seen in the first iteration).

```xml
<multiply name="uv_a" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="20" /></multiply>
<worleynoise2d name="a_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_a" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="a_id" type="float"><input name="texcoord" type="vector2" nodename="uv_a" /><input name="jitter" type="float" value="1" /><input name="style" type="integer" value="1" /></worleynoise2d>
<extract name="a_f1" type="float"><input name="in" type="vector2" nodename="a_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="a_e" type="float"><input name="in1" type="vector2" nodename="a_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<subtract name="a_e1" type="float"><input name="in1" type="float" nodename="a_e" /><input name="in2" type="float" value="0.07" /></subtract>
<subtract name="a_e2" type="float"><input name="in1" type="float" value="0.85" /><input name="in2" type="float" nodename="a_f1" /></subtract>
<min name="a_s" type="float"><input name="in1" type="float" nodename="a_e1" /><input name="in2" type="float" nodename="a_e2" /></min>
<smoothstep name="a_prof" type="float"><input name="in" type="float" nodename="a_s" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.06" /></smoothstep>
<multiply name="a_hs0" type="float"><input name="in1" type="float" nodename="a_id" /><input name="in2" type="float" value="0.0012" /></multiply>
<add name="a_hs" type="float"><input name="in1" type="float" nodename="a_hs0" /><input name="in2" type="float" value="0.0018" /></add>
<multiply name="h_bl" type="float"><input name="in1" type="float" nodename="a_prof" /><input name="in2" type="float" nodename="a_hs" /></multiply>
<mix name="a_col" type="color3"><input name="bg" type="color3" value="0.5, 0.47, 0.42" /><input name="fg" type="color3" value="0.24, 0.22, 0.2" /><input name="mix" type="float" nodename="a_id" /></mix>
```

### Faceted chips (`cellular-stones` BR)

chip = max over layers of `max(1 − F1/0.6, 0) · smoothstep(F2−F1, 0, 0.12)`, with the second layer `rotate2d` 37° and offset; depth −3 mm.
With a cone radius of 0.8 and 1.2 mm depth the result read as crazed plaster (thin rim lines), so it needs the steeper cone.

```xml
<multiply name="uv_k" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="30" /></multiply>
<rotate2d name="uv_k2r" type="vector2"><input name="in" type="vector2" nodename="uv_k" /><input name="amount" type="float" value="37" /></rotate2d>
<add name="uv_k2" type="vector2"><input name="in1" type="vector2" nodename="uv_k2r" /><input name="in2" type="vector2" value="17.3, 5.1" /></add>
<worleynoise2d name="k1_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_k" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<extract name="k1_f1" type="float"><input name="in" type="vector2" nodename="k1_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="k1_e" type="float"><input name="in1" type="vector2" nodename="k1_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<divide name="k1_c0" type="float"><input name="in1" type="float" nodename="k1_f1" /><input name="in2" type="float" value="0.6" /></divide>
<subtract name="k1_c1" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="k1_c0" /></subtract>
<max name="k1_cone" type="float"><input name="in1" type="float" nodename="k1_c1" /><input name="in2" type="float" value="0" /></max>
<smoothstep name="k1_rim" type="float"><input name="in" type="float" nodename="k1_e" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.12" /></smoothstep>
<multiply name="k1" type="float"><input name="in1" type="float" nodename="k1_cone" /><input name="in2" type="float" nodename="k1_rim" /></multiply>
<worleynoise2d name="k2_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_k2" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<extract name="k2_f1" type="float"><input name="in" type="vector2" nodename="k2_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="k2_e" type="float"><input name="in1" type="vector2" nodename="k2_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<divide name="k2_c0" type="float"><input name="in1" type="float" nodename="k2_f1" /><input name="in2" type="float" value="0.6" /></divide>
<subtract name="k2_c1" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="k2_c0" /></subtract>
<max name="k2_cone" type="float"><input name="in1" type="float" nodename="k2_c1" /><input name="in2" type="float" value="0" /></max>
<smoothstep name="k2_rim" type="float"><input name="in" type="float" nodename="k2_e" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.12" /></smoothstep>
<multiply name="k2" type="float"><input name="in1" type="float" nodename="k2_cone" /><input name="in2" type="float" nodename="k2_rim" /></multiply>
<max name="k_chip" type="float"><input name="in1" type="float" nodename="k1" /><input name="in2" type="float" nodename="k2" /></max>
<multiply name="h_br" type="float"><input name="in1" type="float" nodename="k_chip" /><input name="in2" type="float" value="-0.003" /></multiply>
```

### Cracks with warp and tapering threshold (`cellular-paving` left)

Warp with **`noise2d type="vector3"`, then extract x and y**. `noise2d`/`fractal2d type="vector2"` return x == y
(0% of pixels differ; the loader only has float and vec3 paths), so a "vector2 warp" slides along the diagonal only.
A low-frequency mask multiplies the **threshold**, which tapers the tips; clamp the threshold to ≥ 1e-4.

```xml
<multiply name="uv_c" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="4" /></multiply>
<multiply name="uv_cw" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="7" /></multiply>
<noise2d name="c_wn" type="vector3"><input name="texcoord" type="vector2" nodename="uv_cw" /><input name="amplitude" type="float" value="0.18" /></noise2d>
<extract name="c_wx" type="float"><input name="in" type="vector3" nodename="c_wn" /><input name="index" type="integer" value="0" /></extract>
<extract name="c_wy" type="float"><input name="in" type="vector3" nodename="c_wn" /><input name="index" type="integer" value="1" /></extract>
<combine2 name="c_w" type="vector2"><input name="in1" type="float" nodename="c_wx" /><input name="in2" type="float" nodename="c_wy" /></combine2>
<add name="uv_cwarp" type="vector2"><input name="in1" type="vector2" nodename="uv_c" /><input name="in2" type="vector2" nodename="c_w" /></add>
<multiply name="uv_cf" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="30" /></multiply>
<noise2d name="c_fn" type="vector3"><input name="texcoord" type="vector2" nodename="uv_cf" /><input name="amplitude" type="float" value="0.012" /></noise2d>
<extract name="c_fx" type="float"><input name="in" type="vector3" nodename="c_fn" /><input name="index" type="integer" value="0" /></extract>
<extract name="c_fy" type="float"><input name="in" type="vector3" nodename="c_fn" /><input name="index" type="integer" value="1" /></extract>
<combine2 name="c_f" type="vector2"><input name="in1" type="float" nodename="c_fx" /><input name="in2" type="float" nodename="c_fy" /></combine2>
<add name="uv_cw2" type="vector2"><input name="in1" type="vector2" nodename="uv_cwarp" /><input name="in2" type="vector2" nodename="c_f" /></add>
<worleynoise2d name="c_w12" type="vector2"><input name="texcoord" type="vector2" nodename="uv_cw2" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<dotproduct name="c_e" type="float"><input name="in1" type="vector2" nodename="c_w12" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<multiply name="uv_cm" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="2.5" /></multiply>
<noise2d name="c_m0" type="float"><input name="texcoord" type="vector2" nodename="uv_cm" /><input name="amplitude" type="float" value="0.5" /><input name="pivot" type="float" value="0.5" /></noise2d>
<smoothstep name="c_mask" type="float"><input name="in" type="float" nodename="c_m0" /><input name="low" type="float" value="0.3" /><input name="high" type="float" value="0.55" /></smoothstep>
<multiply name="c_t0" type="float"><input name="in1" type="float" nodename="c_mask" /><input name="in2" type="float" value="0.03" /></multiply>
<max name="c_t" type="float"><input name="in1" type="float" nodename="c_t0" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="c_s" type="float"><input name="in" type="float" nodename="c_e" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="c_t" /></smoothstep>
<subtract name="crack" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="c_s" /></subtract>
<multiply name="h_crack" type="float"><input name="in1" type="float" nodename="crack" /><input name="in2" type="float" value="-0.003" /></multiply>
```

### Flagstones / crazy paving (`cellular-paving` right)

5/m, jitter 1, 0.08-cell vector3 warp for irregular edges. The joint is F2−F1 < 0.05 (≈1.3 cm), the arris is `smoothstep(F2−F1, 0.05, 0.11)`,
and the per-stone id (on the **same warped texcoord**) sets +0..2 mm and a palette colour.

```xml
<multiply name="uv_f" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="5" /></multiply>
<multiply name="uv_fw" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="12" /></multiply>
<noise2d name="f_wn" type="vector3"><input name="texcoord" type="vector2" nodename="uv_fw" /><input name="amplitude" type="float" value="0.08" /></noise2d>
<extract name="f_wx" type="float"><input name="in" type="vector3" nodename="f_wn" /><input name="index" type="integer" value="0" /></extract>
<extract name="f_wy" type="float"><input name="in" type="vector3" nodename="f_wn" /><input name="index" type="integer" value="1" /></extract>
<combine2 name="f_w" type="vector2"><input name="in1" type="float" nodename="f_wx" /><input name="in2" type="float" nodename="f_wy" /></combine2>
<add name="uv_fwarp" type="vector2"><input name="in1" type="vector2" nodename="uv_f" /><input name="in2" type="vector2" nodename="f_w" /></add>
<worleynoise2d name="f_w12" type="vector2"><input name="texcoord" type="vector2" nodename="uv_fwarp" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="f_id" type="float"><input name="texcoord" type="vector2" nodename="uv_fwarp" /><input name="jitter" type="float" value="1" /><input name="style" type="integer" value="1" /></worleynoise2d>
<dotproduct name="f_e" type="float"><input name="in1" type="vector2" nodename="f_w12" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<smoothstep name="f_top" type="float"><input name="in" type="float" nodename="f_e" /><input name="low" type="float" value="0.05" /><input name="high" type="float" value="0.11" /></smoothstep>
<multiply name="f_hs0" type="float"><input name="in1" type="float" nodename="f_id" /><input name="in2" type="float" value="0.002" /></multiply>
<add name="f_hs" type="float"><input name="in1" type="float" nodename="f_hs0" /><input name="in2" type="float" value="0.004" /></add>
<multiply name="f_h0" type="float"><input name="in1" type="float" nodename="f_top" /><input name="in2" type="float" nodename="f_hs" /></multiply>
```

### Per-cell colour palette (`cellular-palette` left, also used on the flagstones)

`modulo(id·13.7, 1)` feeds an `ifgreater` chain (N colours, thresholds i/N), and brightness comes from the raw id, so hue and brightness are decorrelated.

```xml
<multiply name="uv_t" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="30" /></multiply>
<worleynoise2d name="t_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_t" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="t_id" type="float"><input name="texcoord" type="vector2" nodename="uv_t" /><input name="jitter" type="float" value="1" /><input name="style" type="integer" value="1" /></worleynoise2d>
<dotproduct name="t_e" type="float"><input name="in1" type="vector2" nodename="t_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<smoothstep name="t_chip" type="float"><input name="in" type="float" nodename="t_e" /><input name="low" type="float" value="0.08" /><input name="high" type="float" value="0.1" /></smoothstep>
<multiply name="t_pal_k0" type="float"><input name="in1" type="float" nodename="t_id" /><input name="in2" type="float" value="13.7" /></multiply>
<modulo name="t_pal_k" type="float"><input name="in1" type="float" nodename="t_pal_k0" /><input name="in2" type="float" value="1" /></modulo>
<ifgreater name="t_pal_c1" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.1667" /><input name="in1" type="color3" value="0.55, 0.53, 0.5" /><input name="in2" type="color3" value="0.05, 0.05, 0.05" /></ifgreater>
<ifgreater name="t_pal_c2" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.3333" /><input name="in1" type="color3" value="0.35, 0.12, 0.08" /><input name="in2" type="color3" nodename="t_pal_c1" /></ifgreater>
<ifgreater name="t_pal_c3" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.5" /><input name="in1" type="color3" value="0.12, 0.2, 0.14" /><input name="in2" type="color3" nodename="t_pal_c2" /></ifgreater>
<ifgreater name="t_pal_c4" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.6667" /><input name="in1" type="color3" value="0.45, 0.33, 0.18" /><input name="in2" type="color3" nodename="t_pal_c3" /></ifgreater>
<ifgreater name="t_pal_c5" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.8333" /><input name="in1" type="color3" value="0.25, 0.27, 0.3" /><input name="in2" type="color3" nodename="t_pal_c4" /></ifgreater>
<multiply name="t_br0" type="float"><input name="in1" type="float" nodename="t_id" /><input name="in2" type="float" value="0.5" /></multiply>
<add name="t_br" type="float"><input name="in1" type="float" nodename="t_br0" /><input name="in2" type="float" value="0.75" /></add>
<multiply name="t_col" type="color3"><input name="in1" type="color3" nodename="t_pal_c5" /><input name="in2" type="float" nodename="t_br" /></multiply>
```

### Sparse features that never clip: manual jittered grid (`cellular-palette` TR)

`cellnoise2d type="vector3"` per square gives (jx, jy, presence). Centre = floor(p) + 0.5 + (jxy − 0.5)·0.4, and r < 0.5 − 0.2.
This version also gives you the local vector `p − centre`, for ellipses, orientation or tilt, which worley doesn't expose.

```xml
<multiply name="uv_g" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="8" /></multiply>
<floor name="g_cell" type="vector2"><input name="in" type="vector2" nodename="uv_g" /></floor>
<cellnoise2d name="g_rnd" type="vector3"><input name="texcoord" type="vector2" nodename="uv_g" /></cellnoise2d>
<extract name="g_jx" type="float"><input name="in" type="vector3" nodename="g_rnd" /><input name="index" type="integer" value="0" /></extract>
<extract name="g_jy" type="float"><input name="in" type="vector3" nodename="g_rnd" /><input name="index" type="integer" value="1" /></extract>
<extract name="g_pres" type="float"><input name="in" type="vector3" nodename="g_rnd" /><input name="index" type="integer" value="2" /></extract>
<combine2 name="g_j" type="vector2"><input name="in1" type="float" nodename="g_jx" /><input name="in2" type="float" nodename="g_jy" /></combine2>
<subtract name="g_j0" type="vector2"><input name="in1" type="vector2" nodename="g_j" /><input name="in2" type="vector2" value="0.5, 0.5" /></subtract>
<multiply name="g_j1" type="vector2"><input name="in1" type="vector2" nodename="g_j0" /><input name="in2" type="float" value="0.4" /></multiply>
<add name="g_j2" type="vector2"><input name="in1" type="vector2" nodename="g_j1" /><input name="in2" type="vector2" value="0.5, 0.5" /></add>
<add name="g_ctr" type="vector2"><input name="in1" type="vector2" nodename="g_cell" /><input name="in2" type="vector2" nodename="g_j2" /></add>
<subtract name="g_dv" type="vector2"><input name="in1" type="vector2" nodename="uv_g" /><input name="in2" type="vector2" nodename="g_ctr" /></subtract>
<magnitude name="g_d" type="float"><input name="in" type="vector2" nodename="g_dv" /></magnitude>
<multiply name="g_rk" type="float"><input name="in1" type="float" nodename="g_pres" /><input name="in2" type="float" value="7.3" /></multiply>
<modulo name="g_rm" type="float"><input name="in1" type="float" nodename="g_rk" /><input name="in2" type="float" value="1" /></modulo>
<multiply name="g_r0" type="float"><input name="in1" type="float" nodename="g_rm" /><input name="in2" type="float" value="0.18" /></multiply>
<add name="g_r1" type="float"><input name="in1" type="float" nodename="g_r0" /><input name="in2" type="float" value="0.1" /></add>
<ifgreater name="g_r" type="float"><input name="value1" type="float" nodename="g_pres" /><input name="value2" type="float" value="0.55" /><input name="in1" type="float" nodename="g_r1" /><input name="in2" type="float" value="0.0001" /></ifgreater>
<divide name="g_t" type="float"><input name="in1" type="float" nodename="g_d" /><input name="in2" type="float" nodename="g_r" /></divide>
<multiply name="g_t2" type="float"><input name="in1" type="float" nodename="g_t" /><input name="in2" type="float" nodename="g_t" /></multiply>
<subtract name="g_b0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="g_t2" /></subtract>
<max name="g_dome" type="float"><input name="in1" type="float" nodename="g_b0" /><input name="in2" type="float" value="0" /></max>
<multiply name="g_hs" type="float"><input name="in1" type="float" nodename="g_r" /><input name="in2" type="float" value="0.02" /></multiply>
<multiply name="h_tr" type="float"><input name="in1" type="float" nodename="g_dome" /><input name="in2" type="float" nodename="g_hs" /></multiply>
<smoothstep name="g_mask" type="float"><input name="in" type="float" nodename="g_dome" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.05" /></smoothstep>
```

**Equivalent with worley** (`cellular-palette` BR, visually the same): jitter 0.4, F1 from `float`, and presence and radius from `style=1`, with r ≤ 0.3.

```xml
<worleynoise2d name="v_f1" type="float"><input name="texcoord" type="vector2" nodename="uv_g" /><input name="jitter" type="float" value="0.4" /></worleynoise2d>
<worleynoise2d name="v_id" type="float"><input name="texcoord" type="vector2" nodename="uv_g" /><input name="jitter" type="float" value="0.4" /><input name="style" type="integer" value="1" /></worleynoise2d>
<multiply name="v_rk" type="float"><input name="in1" type="float" nodename="v_id" /><input name="in2" type="float" value="7.3" /></multiply>
<modulo name="v_rm" type="float"><input name="in1" type="float" nodename="v_rk" /><input name="in2" type="float" value="1" /></modulo>
<multiply name="v_r0" type="float"><input name="in1" type="float" nodename="v_rm" /><input name="in2" type="float" value="0.18" /></multiply>
<add name="v_r1" type="float"><input name="in1" type="float" nodename="v_r0" /><input name="in2" type="float" value="0.1" /></add>
<ifgreater name="v_r" type="float"><input name="value1" type="float" nodename="v_id" /><input name="value2" type="float" value="0.55" /><input name="in1" type="float" nodename="v_r1" /><input name="in2" type="float" value="0.0001" /></ifgreater>
<divide name="v_t" type="float"><input name="in1" type="float" nodename="v_f1" /><input name="in2" type="float" nodename="v_r" /></divide>
<multiply name="v_t2" type="float"><input name="in1" type="float" nodename="v_t" /><input name="in2" type="float" nodename="v_t" /></multiply>
<subtract name="v_b0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="v_t2" /></subtract>
<max name="v_dome" type="float"><input name="in1" type="float" nodename="v_b0" /><input name="in2" type="float" value="0" /></max>
<multiply name="v_hs" type="float"><input name="in1" type="float" nodename="v_r" /><input name="in2" type="float" value="0.02" /></multiply>
<multiply name="h_br" type="float"><input name="in1" type="float" nodename="v_dome" /><input name="in2" type="float" nodename="v_hs" /></multiply>
<smoothstep name="v_mask" type="float"><input name="in" type="float" nodename="v_dome" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.05" /></smoothstep>
```

## 6. Artifacts and fixes

- **Steps from per-cell randoms.** The `style=1` id and `cellnoise` jump at borders. Adding id·k directly to height makes vertical cliffs
  that render as blocky 2×2-pixel stair-steps. **Always multiply the id by a profile that is 0 at the border** (pebble, stone and pit recipes).
- **Creases.** F1 has a slope discontinuity on every border, and F2−F1 has a V-shaped kink there. Used raw as height they make sharp ridges
  and valleys (chips, dome creases). Pass them through a `smoothstep` (the chip rim), or use the crown on domes.
- **Steep walls.** A ramp narrower than about 3–4 px stair-steps in the derivative normal. On the 1 m plane (about 2 mm/px) the 8 mm flagstone arris
  shows a sawtooth along joints (`cellular-paving/plane.avif`), while the close-up is clean. Widen the ramp in F2−F1 units
  (≥ 0.06 cell and ≥ 4 px at the viewing scale) or lower the height, and keep slopes ≲ 45°.
- **Dark glossy bumps read as pits.** Very dark (0.13) domes at roughness 0.55 looked concave under `--ibl bridge`, because
  the specular on the camera-facing lower slope dominated. A sign-flip test proved the normals right. Lighter albedo (0.22) and roughness 0.8 fixed it.
  When in doubt, flip the height sign and compare (cmu-block's advice).
- **Thin cracks alias.** Under about 2 px they break into dots on the plane. The first crack attempt (t 0.012 plus a fine 0.03-cell warp at 30/m)
  rendered as dotted specks. Fix it with a larger t (0.03) and a gentler fine warp (0.012 cell), because the warp gradient multiplies the thinning.
- `heighttonormal` needs the millimetre workaround (AUTHORING.md). All swatches use it.

## Evidence table (area % of the plane with the mask on; "pred" is the CPU port)

| Mask (40 cells/m, jitter 1 unless noted)                                                                                                                                 | pred                  | render                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | --------------------- |
| F1 > 0.4 / 0.7 / 0.9                                                                                                                                                     | 54.64 / 8.41 / 0.53   | 54.52 / 8.44 / 0.53   |
| F2 > 0.8 / F3 > 1.0 / F2−F1 > 0.5 (vector3)                                                                                                                              | 28.82 / 25.84 / 14.41 | 28.75 / 25.71 / 14.36 |
| jitter 0.5: F1 > 0.6 / 0.72 / 0.85                                                                                                                                       | 9.81 / 1.03 / 0.01    | 9.92 / 1.04 / 0.01    |
| jitter 0.5: F1 < 0.25 / F2 < 0.25 / F2 < 0.27                                                                                                                            | 19.67 / 0 / 0         | 19.66 / 0 / 0         |
| jitter 1: F1 < 0.25 / F2 < 0.25 / F2 < 0.3                                                                                                                               | 19.37 / 0.50 / 1.23   | 19.15 / 0.49 / 1.22   |
| style 1 float id > 0.25 / 0.5 / 0.75                                                                                                                                     | 75 / 50 / 25          | 74.85 / 49.56 / 24.69 |
| \|p − (floor p + id3.xy)\| == F1                                                                                                                                         | 63.49                 | 63.55                 |
| F1 < 0.1: 2D / worleynoise3d(u,v,0)                                                                                                                                      | 3.08 / –              | 3.19 / 0.35           |
| diffs (> 1e-4): float vs vec2.x, vec2.y vs vec3.y, unified type 2 vs F1, vec2 id vs vec3 id.xy, cellnoise3d(u,v,0) vs cellnoise2d vec3 .x, noise2d/fractal2d vec2 x vs y | 0                     | 0                     |
| diff: float id vs vec3 id.x                                                                                                                                              | 100                   | 100                   |

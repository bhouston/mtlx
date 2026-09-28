# Composition techniques: from noise to believable relief

> **Camera note:** these measurements were taken with the original `-g plane -z N` camera: 35°
> elevation, perspective, vertical plane. `mtlx render --view plane|closeup|detail|plane:<m>` now
> frames the plane **head-on at an exact width** (1 m, 20 cm, 5 cm). The z1, z5, and z20 figures
> below map roughly to `plane`, `plane:0.3`, and `plane:0.075` (same pixel footprint). The slope,
> wavelength, and warp rules don't depend on the camera. Saved from the composition explorer's
> report; the subagent couldn't write this file itself.

These findings cover the mtlx preview renderer (three.js 0.186 MaterialXLoader, `mtlx render`). Each
fact below was measured on a render in this folder or read from the source
(`three/src/nodes/materialx/`, `packages/viewer/src/scene.ts`). Pixel numbers are
for `-s 512`.

| Swatch               | What it shows                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `ruler.mtlx`         | Unlit calibration grid: 1 cm grey, 5 cm blue, 10 cm black, u=0.5/v=0.5 red                 |
| `neutral-grey.mtlx`  | Flat linear 0.18 (left) and 0.5 (right), roughness 0.8. Shows the IBL tint                 |
| `relief-ladder.mtlx` | An 8×4 grid of egg-crate bumps with known max slope (columns) and wavelength (rows)        |
| `layering-lod.mtlx`  | Macro, meso and micro height layers, a slope budget, and a footprint-LOD fade (quadrants)  |
| `warp-ladder.mtlx`   | Warp strength × warp type, with a finite-difference fold detector (unlit)                  |
| `masks.mtlx`         | Specks, crack presence (multiply vs threshold), and union of domes (max vs smooth max)     |
| `directional.mtlx`   | `sin` vs stretched noise, grooves vs corrugation, and per-band random rotation (quadrants) |
| `correlation.mtlx`   | Color and roughness from the height field (left) vs from an unrelated field (right)        |

`gen/` holds the Python generators. Run them from inside `gen/`, for example
`python3 ladder.py out.mtlx [k]`. `gen/mx.py` is a tiny node writer that cuts XML verbosity.
`gen/` also produces the lab-only variants behind some renders. The quadrant swatches split at
u=0.5 and v=0.5, so all four variants meet at the tile center and show up in every zoom.

## 1. Viewing and measurement

**Original camera** (`scene.ts`): fov 45°, 35° elevation, distance 1.829 m. The "plane" is a
**vertical** 1×1 m wall facing the camera, with V up. `--zoom` narrows the fov and doesn't move the
camera.

| View | Visible width                    | mm/px (u / v) | UV footprint J (m²/px) | Smallest λ at full contrast (6 px) |
| ---- | -------------------------------- | ------------- | ---------------------- | ---------------------------------- |
| z1   | tile ≈ 336 px wide at mid-height | 2.9 / 3.5     | ~1.0e-5                | ~17 mm (≤ 60/m)                    |
| z5   | 30.2 × 37 cm                     | 0.59 / 0.72   | ~4.2e-7                | ~3.5 mm (≤ 280/m)                  |
| z20  | 7.5 × 9.2 cm                     | 0.147 / 0.18  | ~2.6e-8                | ~0.9 mm (≤ 1100/m)                 |

- **Width ≈ 1.51/z m.** Head-on `--view plane:<w>` at 512 px gives w/512 m per pixel.
- The sphere is 1 m in diameter, so 1 UV = π m around u and π/2 m along v. The totem isn't metric.
- PNGs have alpha, and the background is transparent unless you pass `--background environment`.
  Lit emission is tone-mapped (1.0 renders as 240). `render --channel` now renders without tone
  mapping, so its values are linear.

**IBL color** (`neutral-grey-*.avif`). Bridge is a sunny canal: a warm sun and walls, green water below.

| Surface             | 0.18 renders (sRGB) | 0.5 renders (sRGB) | Linear B/G |
| ------------------- | ------------------- | ------------------ | ---------- |
| plane, bridge       | 112, 112, 101       | 189, 189, 175      | 0.80–0.84  |
| sphere, sun side    | –                   | –                  | 0.82       |
| sphere, shadow side | –                   | –                  | 1.01       |
| plane, studio       | 32, 32, 32          | 84, 84, 84         | 1.00       |

So neutral grey reads **olive/khaki** under bridge. Don't bake a blue correction into base_color;
judge color under `--ibl neutral` or `overcast`. Studio is neutral but about 3 stops darker.

**Relief lighting.** At matched brightness, studio gives about **4× less** relief contrast than
bridge. Bridge light is directional in UV space (10° stripes, luma std):

| Slope direction | Luma std |
| --------------- | -------- |
| along UV (1,1)  | 16.1     |
| along u         | 13.3     |
| along v         | 9.5      |
| along (1,−1)    | **4.0**  |

Judge a directional pattern in both orientations before calling it "too weak". (`--ibl sun` gives
the strongest relief.)

**Gloss.** The plane mirrors empty space, so roughness 0.05 and 0.5 look the same. Judge gloss on
the `sphere` view (environment backdrop). Use a v-split, because u wraps around the sphere.

## 2. Height: what reads, and at what amplitude

`heighttonormal` builds the normal from **screen-space** `dFdx`/`dFdy` of the height and texcoord.

- **Visibility depends only on slope and pixels per wavelength.** The same ladder at z5 and z20
  gives the same per-cell contrast.
- Contrast is about **1.2 grey levels per degree** of max slope (bridge, albedo 0.4):

  | max slope | 0.17°   | 0.45°   | 1.2°   | 3°     | 7.8°  | 20°    | 43°                            | 67°          |
  | --------- | ------- | ------- | ------ | ------ | ----- | ------ | ------------------------------ | ------------ |
  | luma std  | 0.3     | 0.5     | 1.4    | 3.6    | 9.1   | 23     | 46                             | 58           |
  | reads as  | nothing | nothing | barely | subtle | clear | strong | bluish sky patches, 2×2 blocks | blocky, fake |

  Use **2–20°** and cap at about **30°**.

- You need **≥ 6 px per wavelength**. At about 2.5 px, contrast drops about 30% and moiré starts.
- **Minimum visible relief** (3°, λ = 6 px): amplitude ≈ λ/120. That's 0.14 mm at z1, 0.03 mm at
  z5, and 0.008 mm at z20. Relief is cheap to see, and the risk is too much of it.
- **Height steps** don't render as steps. They render as 1–2 px dashed hairlines. Keep height
  continuous.

**Noise slope:**

| Node                   | Typical slope   | Tail                                    |
| ---------------------- | --------------- | --------------------------------------- |
| `noise2d(uv·f)·A`      | **1.3·A·f rad** | max ≈ 2.7·A·f; \|value\| rarely > 0.5·A |
| `fractal2d`, 5 octaves | **≈ 2.5·A·f**   | to 6·A·f                                |

`fractal2d` sums octaves with amplitude ×0.5 and frequency ×2, so every octave adds the same slope.
The finest octave dominates the shading and aliases first. Set the octave count by the finest
wavelength the view can resolve.

### Layering recipe: budget slope, not amplitude

| Layer | Node               | Scale              | Amplitude | Slope | Reads at             |
| ----- | ------------------ | ------------------ | --------- | ----- | -------------------- |
| macro | `noise2d`          | f=3/m (~30 cm)     | 6.7 mm    | ~1.5° | z1                   |
| meso  | `fractal2d`, 3 oct | f=40/m (~2.5 cm)   | 1 mm      | ~3–5° | z1, z5               |
| micro | `noise2d`          | f=1500/m (~0.7 mm) | 0.036 mm  | ~4°   | z20, quiet elsewhere |

A "hot" micro layer (0.24 mm, about 25°) is **worst where its wavelength is 1–2 px (z5)**. The
high-pass luma std there is 21.4, salt-and-pepper, against 5.2 for the budgeted layer. At z20 it
looks great. Budget micro slope to ≤ 5°, and move any lost slope into roughness.

## 3. Domain warping

Warp strength **s = A·f**. A is the displacement noise amplitude in meters (displacement ≈ ±0.5·A)
and f is the warp frequency per meter. Build the warp from **two float noises at offset
coordinates**, or `noise2d type="vector3"`, not vector2 (renderer bug: x == y). Fold, smear, and
crush measured as % of each cell (f = 10/m):

| s = A·f                             | 0.05  | 0.087 | 0.15    | 0.26        | 0.46        | 0.8     |
| ----------------------------------- | ----- | ----- | ------- | ----------- | ----------- | ------- |
| single `noise2d` fold/smear/crush % | 0/0/0 | 0/0/0 | 0/0/0   | 0/0/0       | **1.8**/5/0 | 18/8/2  |
| `fractal2d` 3 oct                   | 0/0/0 | 0/0/0 | 0/0.3/0 | **2.8**/7/0 | 18/9/3      | 38/5/14 |
| nested `noise2d`                    | 0/0/0 | 0/0/0 | 0/0/0   | 0/**10**/0  | 2/31/3      | 31/32/8 |

- Safe limits: **single noise2d s ≤ 0.25; fractal warp s ≤ 0.12; nested, each stage ≤ 0.12**.
  Nested warps smear into magnified blobs before they fold.
- For a big displacement, lower f (a broader warp) instead of raising A.

**Finite-difference derivative.** Re-evaluate the chain at uv+(e,0) and uv+(0,e), with e = 1e-4 m.
Then `det = (dx.x·dy.y − dx.y·dy.x)/e²`. The same trick gives the gradient, slope, or Laplacian of
any graph, at 3× the node count.

## 4. Masks

**Specks.** Thresholded noise makes **worms, never specks**. For specks, use worley F1 with a
smooth-noise radius:

- `pits = smoothstep(r − F1, 0, 0.04)`
- `r = noise2d(uv·9, amplitude 0.6, pivot 0.05)`; r < 0 means no pit.

**Presence and tapering.**

- Multiplying the _output_ by presence gives full-width ghost lines that fade in depth.
- Multiplying the _threshold_ gives full-depth lines that **narrow to points**.
- Always gate thresholds, radii, or amplitudes before the smoothstep, never the result.

```xml
<multiply name="crack_thr" type="float"><input name="in1" type="float" nodename="presence" /><input name="in2" type="float" value="0.05" /></multiply>
<add name="crack_thr_hi" type="float"><input name="in1" type="float" nodename="crack_thr" /><input name="in2" type="float" value="0.0005" /></add>
<smoothstep name="crack_s" type="float"><input name="in" type="float" nodename="f2_f1" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="crack_thr_hi" /></smoothstep>
<subtract name="crack" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="crack_s" /></subtract>
```

The +0.0005 keeps `high > low` where presence is 0. `smoothstep` with low > high returns
`step(high, x)`, as the reference does, so invert with `1 − smoothstep`.

**Combining masks.**

| Operation  | Meaning            | Side effect                                          |
| ---------- | ------------------ | ---------------------------------------------------- |
| `max`      | union              | crease where the inputs cross; visible in the normal |
| `min`      | intersection       | crease where the inputs cross                        |
| `multiply` | soft intersection  | darkens partial overlaps                             |
| smooth max | union with fillets | –                                                    |

Smooth max: `smax(a,b,k) = max(a,b) + h²·k/4`, with `h = max(k − |a−b|, 0)/k` and k ≈ 1/3 of the
field's range. A single worley set still creases on its own Voronoi borders.

**Edge softness.** Give height-affecting masks an edge ≥ 1.5 px wide at the farthest view.

## 5. Directional structure

- **Stretch:** `noise2d(uv·(3, 330))` gives strokes about 30 cm long and 3 mm apart. Two layers, at
  (3, 330) and (5, 462) with an offset, used **directly as height** read as broom strokes.
- `sin` stripes read as corduroy or a machined finish.
- `smoothstep(noise)` flat-bottom grooves render only as edge hairlines.
- **Rotation:** `rotate2d amount` and `place2d rotate` are both in **degrees** and identical. A
  positive amount turns the pattern counter-clockwise on the plane.
- **Per-band randoms:** `band = floor((v + noise2d(uv·2.5)·0.06)·6)`, then
  `cellnoise2d(combine2(band, seed))` with distinct seeds for each parameter. Band borders are height
  steps and show as dashed seams. Cross-fade neighboring bands, or scale height by a smooth
  distance-to-border mask.

```xml
<floor name="band" type="float"><input name="in" type="float" nodename="v_band" /></floor>
<combine2 name="band_a" type="vector2"><input name="in1" type="float" nodename="band" /><input name="in2" type="float" value="7.5" /></combine2>
<cellnoise2d name="band_rand" type="float"><input name="texcoord" type="vector2" nodename="band_a" /></cellnoise2d>
```

Periodic sub-pixel detail makes **moiré on the totem**; noise only speckles.

## 6. Correlating channels

- **Cavity** = `max(smoothstep(−convexity, 0.06, 0.16), smoothstep(−H, 0.25, 0.45))`. Make it darker
  (~0.16) and rougher (0.95).
- **Wear** = `smoothstep(convexity, 0.06, 0.16) · smoothstep(H, 0, 0.15)`. Make it lighter and
  smoother (0.45).
- **Convexity for free:** `fractal2d(p, 5 oct) − fractal2d(p, 2 oct)` is exactly octaves 3–5,
  because fractal is a plain octave sum. It needs no derivatives.
- The correlated version reads as a 3D rock face, and the uncorrelated one as stains on a bumpy
  surface. The difference is clearest at the close-up.

## 7. Anti-aliasing without a derivative node

1. **Frequency caps.** Keep λ ≥ 6 px at the farthest view that must look clean, and set octave
   counts to match. Make lines and ridges ≥ 1.5–2 px wide at that view: 1 m view ≥ 5 mm,
   20–30 cm view ≥ 1 mm, 5–7 cm view ≥ 0.3 mm.
2. **Footprint LOD probe (lab hack only).** `heighttonormal` with height = u, texcoord = uv·s, and
   scale = 160·s flips to exactly flat when the pixel footprint J < 1e-7/s². That gives a binary
   per-quad test that removed ruler and totem moiré (`gen/lod.py`). **It depends on the
   heighttonormal threshold bug and breaks once that bug is fixed, so never use it in library
   materials.** It argues for a real derivative or footprint node.
3. **Move lost slope into roughness** when a layer is faded from the normal.
4. **Smoothstep widths** should be ≥ 1 px footprint at the farthest view.

## Renderer bugs (suspected)

- **Coarse derivatives give 2×2 blocky normals (likely).**
  - Location: `three/src/renderers/webgpu/nodes/WGSLNodeBuilder.js` `wgslMethods` maps
    `dFdx` → `dpdx`. The WGSL spec lets that be fine or coarse, and `mx_heighttonormal` depends on
    it.
  - Repro: `cd gen && python3 ladder.py /tmp/l.mtlx 13.4`, then render
    `-g plane -s 512 --ibl bridge -z 20`. The 43–67° cells show 2×2-pixel stair-steps.
  - Fix to try: `dpdxFine`/`dpdyFine`.

Gotchas that match the reference, not bugs: `smoothstep` with low > high; `rotate2d` rotates the
vector clockwise, so the pattern turns counter-clockwise (the spec wording is unverified); `place2d`
follows the reference order.

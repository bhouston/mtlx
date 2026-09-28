# Renderer bug report: three.js MaterialXLoader

Bugs found while agents authored procedural materials with the mtlx preview renderer (three.js r186
`MaterialXLoader`). Each one is compared against the reference implementation in
an upstream MaterialX checkout (`libraries/stdlib/genglsl`).

Abbreviations for paths:

- **NodeLibrary:** `three/examples/jsm/loaders/materialx/MaterialXNodeLibrary.js`
- **MaterialXNodes:** `three/src/nodes/materialx/MaterialXNodes.js`

**Confidence:**

- **confirmed:** reproduced in renders, and it differs from the reference.
- **likely:** a source reading that shows the same defect as a confirmed bug, not yet rendered.
- **unsure:** needs investigation.

## Bugs

### 1. `heighttonormal` returns a flat normal at real-world UV scales (confirmed)

- **Where:** MaterialXNodes `mx_heighttonormal` (line ~183):
  `dot(n, n).lessThan(float(1e-12))`.
- **Reference:** `mx_heighttonormal_vector3.glsl` uses `dot(n, n) < M_FLOAT_EPS * M_FLOAT_EPS`, with
  `M_FLOAT_EPS = 1e-8`, so the threshold is **1e-16**. three.js uses 1e-12, which is 10⁴× larger.
- **Why it bites:** `n = cross((dU/dx, dV/dx, dH/dx), (dU/dy, dV/dy, dH/dy))`, so `n.z ≈ dU/dx · dV/dy`.
  With UVs in meters and a 20 cm close-up at 640 px, dU/dx ≈ 3e-4 per pixel, so
  |n|² ≈ 1e-14 < 1e-12. Almost every pixel is treated as degenerate and gets (0, 0, 1).
- **Repro:** a plane with UV 0..1 and `heighttonormal(in = 0.002·noise2d(uv·300), scale = 16,
texcoord = uv)` → `normalmap` → `standard_surface.normal`. Render with
  `mtlx render f.mtlx -o o.png --view closeup --channel n_tangent`. The result is uniform
  (0.5, 0.5, 1), with isolated speckles where slopes are extreme.
- **Fix:** use the reference epsilon (1e-16). Better still, make the test scale-invariant, e.g.
  `dot(n,n) < 1e-12 * dot(t,t) * dot(b,b)`, or normalize the tangent and bitangent before
  the cross product. The reference is also absolute, so it would fail at extreme zoom too; that may
  be worth an upstream MaterialX issue as well.
- **Also affects:** `bump`. `mx_bump` (NodeLibrary ~171) calls `mx_heighttonormal(height, 1)`. It
  matches the reference nodegraph structure `NG_bump_vector3`, but inherits the threshold.
- **Workaround in the library:** multiply height and texcoord by 1000 (millimeters), with scale 16.

### 2. `noise2d` / `fractal2d` vector2 variants return the same value in x and y (confirmed)

- **Where:** NodeLibrary `mx_noise_materialx` and `mx_fractal_noise_materialx_2d` (lines ~515–522)
  only branch on `usesVec3Noise` (vector3/color3). Everything else, including `vector2`, takes
  the **float** path, and the scalar is broadcast.
- **Reference:** `mx_noise2d_vector2.glsl` gives `mx_perlin_noise_vec3(texcoord).xy * amplitude +
pivot`, which has independent channels. `mx_fractal2d_vector2.glsl` works the same way.
- **Repro:** `<noise2d name="n" type="vector2">` on `uv·6`, rendered with
  `--channel n --range=-1,1`. The red and green channels are identical (0 pixels differ in the
  explorer's overlay test).
- **Fix:** add a vector2 branch: `mx_noise_vec3(texcoord, vec3(amplitude, 1), pivot).xy`. Do the
  same for fractal: `mx_fractal_noise_vec3(...).xy`. `usesVec2Noise` already exists at line 515
  but is only used for worley.
- **Impact:** every "vector2 domain warp" warps only along the diagonal, which gives visibly
  directional, skewed warps.

### 3. `noise3d` / `fractal3d` vector2 variants share bug 2 (confirmed)

- **Where:** `noise3d` (NodeLibrary line 848) uses the same `mx_noise_materialx`, and
  `mx_fractal_noise_materialx_3d` has the same single `usesVec3Noise` branch.
- **Reference:** `perlin_vec3(p).xy`. For fractal it is `(fractal(p), fractal(p + (19, 193, 17)))`.
- **Repro:** `docs/material-authoring/noise-lab/smooth/tools/set3.mjs` (m7): x − y is 0 on 100% of pixels.
- **Fix:** the same as bug 2. The output cast in `MaterialXDocument.js` copies the float into every
  channel. A correct `mx_fractal_noise_vec2` already exists in `MaterialXNoise.js` but is unused.

### 4. `noise*` / `fractal*` vector4 and color4 variants take the float path (confirmed for 2D, likely for 3D)

- **Where:** the same functions. `usesVec3Noise` is false for `vector4`/`color4`, so they get a
  broadcast scalar. three.js defines `mx_noise_vec4` (MaterialXNodes line ~69) but the loader never
  calls it.
- **Reference:** `mx_noise2d_vector4.glsl` gives
  `vec4(mx_perlin_noise_vec3(t), mx_perlin_noise_float(t + vec2(19, 73)))`.
- **Repro:** `docs/material-authoring/noise-lab/smooth/tools/set4.mjs` (m8) shows all four channels equal.
- **Fix:** add a vec4 branch that uses `mx_noise_vec4` and a fractal vec4 counterpart
  (`vec4(fractal_vec3(p), fractal_float(p + (19, 193)))`).

### 5. Coarse screen-space derivatives give 2×2 blocky normals (likely)

- **Where:** `three/src/renderers/webgpu/nodes/WGSLNodeBuilder.js` `wgslMethods` maps `dFdx` →
  `dpdx` and `dFdy` → `-dpdy`. The mtlx viewer uses `WebGPURenderer`, and WGSL `dpdx` is allowed to
  be coarse (one value per 2×2 quad). `mx_heighttonormal` builds normals from these derivatives.
- **Symptom:** 2×2-pixel stair-steps on steep relief (≥ 40° slopes), and "+" marks on sub-pixel
  pores. Several material agents and the composition explorer saw both.
- **Repro:** `docs/material-authoring/noise-lab/composition/gen/ladder.py /tmp/l.mtlx 13.4`, then render
  `-g plane -s 512 --ibl bridge -z 20`. The top-right (43–67°) cells step in 2×2 blocks.
- **Reference:** GLSL `dFdx`, which is fine precision on most desktop drivers.
- **Fix to try:** `dpdxFine` / `dpdyFine` (or the GLSL backend's `dFdxFine`). The artifact is
  confirmed; that coarse derivatives cause it is likely.

### 6. `noise2d` on a deep texcoord graph makes shader compile time grow exponentially (confirmed timing, likely mechanism)

- **Found by:** walnut-herringbone (round 3).
- **Repro:** a herringbone layout gives local coordinates; two `noise2d` warp them (the vector3
  variant behaves the same), and the result feeds a third `noise2d`. Render one node with
  `mtlx render f.mtlx -o x.png --view plane --channel g2 -s 256`.
- **Observed:**

  | Graph                                                                                   | Time   |
  | --------------------------------------------------------------------------------------- | ------ |
  | the warp alone                                                                          | 5 s    |
  | one node, `g2`                                                                          | 22.7 s |
  | three stacked noises                                                                    | 144 s  |
  | the full material, per view                                                             | 177 s  |
  | the same graph with every `noise2d` replaced by `fractal2d octaves=1` (identical noise) | 2.3 s  |
  | the full material after that swap, 5 views                                              | ~11 s  |

- **Expected:** compile time roughly linear in node count.
- **Where:** `noise2d` float goes through `mx_noise_float` (`MaterialXNodes.js:66`), which calls
  `mx_perlin_noise_float`, an `overloadingFn` in `MaterialXNoise.js` (~677). The texcoord
  expression is not cached. The loader's `fractal2d` path (`MaterialXNodeLibrary.js` ~543/565) wraps
  its input in `vec2(texcoordInput).toVar()`, which is presumably why it stays fast. The time is
  spent in the browser, not in CPU-side parsing.
- **Suspected fix:** cache the texcoord or position input with `.toVar()` in `mx_noise_materialx`,
  and probably in the worley and cell wrappers, before calling the perlin functions.
- **Likely also affects `worleynoise2d` and `cellnoise2d`** (oak-plank, round 3). After swapping every
  `noise2d` for `fractal2d`, `--channel base_color` still took 147 s and `roughness` 52 s, against
  ~20 s for a full render of the same material. That graph has worley and cellnoise on layout
  coordinates. Repro: `render submodules/mtlx-sample-library/materials/ai_authored/oak-plank/oak-plank.mtlx -o x.png --view plane --channel base_color`.
- **Workaround:** use `fractal2d octaves=1` (add the pivot by hand) for noise on warped or layout
  coordinates.

### 7. Nodes read by several consumers seem to be expanded, not shared, which blows up compile time (confirmed timing, likely mechanism; possibly the root of bug 6)

- **Found by:** the cookbook-v3 agent.
- **Repro:** the first `cookbook_wood.mtlx` (~290 nodes) chained tints as `mix(c, c·k, m)`, reading
  `c` twice at every step, and fed one graph into four identical quadrant mixes. First view took
  41–43 s. The generator is in `noise-lab/cookbook/gen/`, and `treesize.py` measures the expanded
  graph.
- **Observed:**

  | Change                                                            | First view                      |
  | ----------------------------------------------------------------- | ------------------------------- |
  | every noise node swapped for a constant                           | 45 s (so noise isn't the cause) |
  | `wk_loc` swapped for a constant                                   | 8.8 s                           |
  | tints rewritten as `c·mix(1, k, m)` and the quadrant copy removed | ~5 s                            |

  With the rewrite, the fully expanded tree went from **1.7M to 0.23M nodes**, while the node count
  stayed ~290.

- **Expected:** a MaterialX node output used by N consumers is computed once, and compile time scales
  with node count.
- **Suspected cause:** the loader converts each `<input nodename=...>` reference by recursively
  rebuilding the upstream TSL subgraph, with no per-(node, output) memo. Chains that reuse a value
  then grow exponentially. Bug 6 (`noise2d` on deep texcoords) may be the same issue, surfacing where
  a texcoord chain is referenced many times inside the perlin code. Worth checking the node cache in
  `MaterialXLoader`/`MaterialXDocument.js` first.
- **Confirmed again (barnwood-wall, round 4):**

  | Nodes | Expanded | First view |
  | ----- | -------- | ---------- |
  | 580   | 3.39M    | 320.9 s    |
  | 587   | 0.39M    | 12.9 s     |
  | 644   | 0.88M    | ~33 s      |

  The fix was replacing `min`/`max` of a joint pair (each joint read twice) with `|n − j|` and
  `(n + j)/2`. Compile time is roughly exponential in re-reads. `render` now prints the expanded size
  and the worst re-read nodes when it passes 0.3M.

- **Real-world impact:** `render --channel` originally converted with a 3-branch inverse-sRGB graph
  that read its source ~9 times. For shiplap-whitewash that took the channel compile from ~4 s to
  54 s. The fix was to read the source once.
- **Workaround:** avoid reading one node through several paths in long chains (use `c·mix(1, k, m)`,
  not `mix(c, c·k, m)`), and keep graphs shallow. `treesize.py` estimates the blowup.

### 8. `specular_rotation` uses the wrong units and may rotate twice (likely; confirmed against reference source, not yet rendered)

- **Found by:** bookmatched-veneer (round 4), from reading the source.
- **Where:** `examples/jsm/loaders/materialx/MaterialXSurfaceMappings.js`, `setAnisotropy()` (~L167):

  ```js
  material.anisotropyNode = vec2(cos(rotation), sin(rotation)).mul(strength);
  material.anisotropyRotationNode = rotation;
  ```

  It is called with `inputs.specular_rotation` (standard_surface, ~L286) and with
  `anisotropy_rotation` (~L461).

- **Reference:** `libraries/bxdf/standard_surface.mtlx` defines `specular_rotation` as 0..1 (a
  fraction of a turn). The implementation multiplies it by 360 (`tangent_rotate_degree`) and applies
  `rotate3d` in degrees.
- **Defects:**
  1. The value is used as radians with no ×2π, so 0.25 (a 90° turn) rotates ~14°.
  2. The rotation is encoded in the `anisotropyNode` direction _and_ set as `anisotropyRotationNode`,
     so it probably applies twice.

  Check the OpenPBR mapping's units as well.

- **Repro to confirm:** `standard_surface` with `specular_anisotropy 0.8`, roughness 0.3, and
  `specular_rotation` 0 vs 0.25, via `render --view sphere --ibl sun`. The highlight streak should
  turn 90°.
- **Suggested fix:** `angle = rotation * 2π`. Set the direction via `anisotropyNode` only, or pass
  (strength, 0) with `anisotropyRotationNode = angle`, whichever matches
  MeshPhysicalNodeMaterial's convention.

## Tooling issues in mtlx-core and the CLI (not the three.js renderer)

- **`check` runs only the `basic` rules by default**, so agents never saw type errors.
  `separate2 type="vector2"` (should be `multioutput`) passed in three places: `assets/brick.mtlx`,
  `assets/road_aggregate.mtlx`, and `submodules/mtlx-sample-library/materials/ai_authored/cmu-block`. All three are fixed. `docs/material-authoring/render.sh`
  now runs `--rules basic structure types unused`. Consider making `structure` and `types` the
  default in `check`.
- **Integer-typed inputs accept floats (confirmed).** `<extract><input name="index" type="float" value="1"/></extract>`
  passes the `types` rule, but the nodedef says `index` is an integer. The render effect is unsure
  (possibly a slower compile). Same class as the next item.
- **An unknown type variant passes validation (confirmed).** `cellnoise2d type="vector3"` passes
  `check --strict --rules basic structure types unused`, but no such nodedef exists in the reference
  stdlib or the mtlx-core registry. three.js renders it anyway. Expected: a warning that no nodedef
  matches this node signature under the `types` rule.

- **Intermittent WebGPU "Instance dropped in popErrorScope"** on `--channel` renders of large graphs
  under concurrency (unsure; likely device loss in headless Chrome). `render` now retries once. If it
  persists without load, investigate WebGPU error-scope handling in the viewer.
- **`render --timeout` didn't cover screenshots** (fixed). Slow compiles failed with Playwright's
  30 s `locator.screenshot` timeout. The page's default timeout now uses `--timeout`, and `render`
  prints the first-view time and warns when it passes 20 s.

## Not bugs: these match the reference

- `smoothstep` with low > high returns ~1 rather than inverting. The reference
  `mx_smoothstep_float` returns 1 when `val >= high`.
- In `worleynoise2d` style 1 (vector3), `.xy` equal the feature point's jitter offsets. The
  reference jitters points by `mx_cell_noise_vec2(cell)` and style 1 returns
  `mx_cell_noise_vec3(featurepoint)` of the same cell. Documented as a gotcha: use `.z` or the
  float id.
- Worley F2 and F3 are slightly wrong (0.012% and 0.4% of pixels at jitter 1). The reference uses
  the same 3×3 search. The error is visible: at jitter 0.88–1, relief built from F2−F1 shows
  dashed straight seams in `detail` normals (bush-hammered r5). They vanish at jitter ≤ 0.75. A 5×5
  search would fix it at a cost, if matching the reference isn't required.
- Worley is always Euclidean. The 1.39 nodedefs have no `metric` input.
- "+" and stair-step artifacts on sub-pixel or steep relief. The reference `heighttonormal` also
  uses screen-space `dFdx`/`dFdy`, so 2×2 quad artifacts are inherent.

## Resolved: not a bug

- **"Lattice artifacts above ~500 features/m"** do not depend on frequency. They appear whenever
  fewer than about 40 lattice cells are in view (25/m at the 1 m view looks the same). This is
  inherent to Perlin noise. The noise hash, gradients, scales, and `unifiednoise2d` graph all match
  the reference line for line (checked against a CPU port that matches renders within ±0.01).
  Precision is fine up to texcoord magnitudes of about 1e5.
- **`unifiednoise2d` quirks** match the reference: type 3 is signed and not remapped, and for types
  0, 1, and 3 `jitter` rotates the pattern or picks a z slice rather than jittering.

## Unsure: needs investigation

- **`cellnoise2d` returns exactly 0 for some computed half-integer inputs** (fish-scale, round 2).
  - **Repro:** `tile_id = cellnoise2d(center + (0.5, 0.5))`, where `center` =
    `mix(vector2)` of `combine2(2·floor((x−odd)/2 + 0.5) + odd, floor(y))`, with
    `odd = modulo(floor(y), 2)` and x, y = uv·26. Render with
    `--view plane:0.4 --channel tile_id --range=0,1`.
  - **Observed:** 5.5% of the area is exactly 0, in whole tiles. At `--center 0.538462,0.5`, the tile
    centers (14, 12) and (14, 14) both give 0.
  - **Expected:** uniform 0..1 with no exact zeros.
  - **Checks:** a standalone `cellnoise2d(floor(uv·26) + 0.5)` over the same cells gives no zeros, and
    reseeding to +(200.37, 300.61) removes them. Possible causes: a precision or -0.0 issue in the
    computed center feeding the integer hash, or a codegen quirk. Worth diffing the generated WGSL.
  - **Workaround:** give per-tile hashes a non-half-integer seed offset. Half-integer seeds don't
    always fail: herringbone-marble uses (0.5, 0.5) and (37.5, 11.5) with no zero ids.

- **`rotate2d` direction.** A positive `amount` turns the pattern counter-clockwise, meaning the
  vector rotates clockwise: `(c·x + s·y, c·y − s·x)`. Compare this with the spec wording and the
  reference `mx_rotate_vector2`.

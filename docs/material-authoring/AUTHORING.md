# Authoring procedural materials for this library

How to build photorealistic, fully procedural MaterialX materials with the mtlx tools in
this repository, and how the preview renderer (three.js `MaterialXLoader`) actually behaves.
Everything here was verified by rendering. Evidence and detail are in `noise-lab/*/FINDINGS.md`.

**Read in this order:**

1. This guide: workflow, tools, conventions, and what looks real.
2. [NOISE_COOKBOOK.md](NOISE_COOKBOOK.md): node ranges, rules of thumb, gotchas, and a table of contents of the
   copy-paste recipes in [`cookbook/`](cookbook/): [noise](cookbook/noise.md), [cellular](cookbook/cellular.md),
   [layouts](cookbook/layouts.md), [planks](cookbook/planks.md), [surfaces](cookbook/surfaces.md),
   [wood](cookbook/wood.md), [grain](cookbook/grain.md) (straight/rift, pine, fiddleback, lacquer layering, per-cell knots),
   [profiles](cookbook/profiles.md) (mouldings, panel steps, battens, flutes, channels),
   [end grain](cookbook/endgrain.md), [aggregate](cookbook/aggregate.md) (sand, grit, river pebbles, air voids), and
   [weathering](cookbook/weathering.md) (sparse cracks, rain streaks, grinder swirls, cross-faded bands, board-formed
   imprints). Read only the topic files you need.
3. `mtlx nodes <query>`: exact node names, inputs, and renderer notes for surprising nodes.
4. [RENDERER_BUGS.md](RENDERER_BUGS.md): known renderer bugs and their workarounds.

## 1. Tools

```sh
cli() { node packages/cli/bin/cli.js "$@"; }   # a function, not cli="...": zsh won't word-split $cli
# build the CLI once first: (cd packages/cli && pnpm build)
cli check  m.mtlx --strict --rules basic structure types unused      # always use all four rule groups
cli render m.mtlx -o sheet.png --view plane closeup detail sphere totem --ibl bridge --supersample
cli render m.mtlx -o sheet.png --view closeup --center 0.3,0.7      # aim at a feature
cli render m.mtlx -o room.png --view plane --uv-scale 4             # 4 m × 4 m: layout and room-scale read
cli render m.mtlx -o g.png --view plane:0.3 --grid 0.05             # labelled UV lines every 5 cm (find features, check joints)
cli render m.mtlx -o c.png --view closeup --crop 200,200,48         # 48 px square enlarged, to inspect pixels without sheet downscaling
cli render m.mtlx -o s.png --view closeup --center 0.15,0.5 --channel figure --range=-1,1 --mirror u=0.15   # symmetry about a seam
cli render m.mtlx -o h.png --view plane --channel height --range=-0.003,0.002   # numbers for any node
cli nodes worley,fract,modulo                          # node names, inputs, defaults, renderer notes (comma-separate)
docs/material-authoring/render.sh submodules/mtlx-sample-library/materials/ai_authored/<name>/<name>.mtlx   # final check + library screenshots (AVIF)
```

**`render --view`** compiles the material once and renders every listed view in one browser
session, which takes ~5–20 s. One `-o x.png` gives a captioned contact sheet; `-o dir/` gives
`dir/<view>.png`. The `-o` extension (or `--format` for a directory) picks png, jpg, webp or avif; commit
images as AVIF. The views:

| View        | What it shows                                                                                                                                 | Pixel size at `-s 512` |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `plane`     | the whole 1 m UV tile, head-on                                                                                                                | 1.95 mm                |
| `closeup`   | 20 cm, head-on                                                                                                                                | 0.39 mm                |
| `detail`    | 5 cm, head-on                                                                                                                                 | 0.1 mm                 |
| `plane:<m>` | any width, head-on (e.g. `plane:0.4` for a 40 cm tile)                                                                                        | width/512              |
| `grazing`   | the plane at 72° with the environment behind. Adds little for gloss; for reflection ripple on glossy floors use `plane` under `--ibl neutral` | –                      |
| `sphere`    | 1 m sphere, environment backdrop: **the only view that shows gloss and reflections**                                                          | –                      |
| `totem`     | shader ball: how the material reads on curves. **UVs are not metric**                                                                         | –                      |

`--center u,v` aims plane views at a UV point (V is up in plane views: drips run toward −V). The plane geometry is exactly 1 m, so `plane:3` just
pads it. `--center` applies only to plane views narrower than 1 m, so `--view plane closeup
--center u,v` keeps the full tile whole. To judge layout and large-scale variation over several meters (plank staggering, room-scale
repetition), add **`--uv-scale N`**: every texcoord is multiplied by N, so `plane` shows N × N m. Only `plane*` views are at true scale; on the sphere
1 UV = π m around, and patterns pinch at the poles (that's the UVs, not your material). Glossy relief
under `sun` or `bridge` shows hard-edged reflected-horizon contours, and on `detail` it mirrors
straight lines from the environment. That's physically right, so don't chase it; confirm with
`--channel base_color` or `--channel n_tangent`.

**`--ibl` lighting** (one preset per call; compare presets with separate calls):

| Preset           | Use it for                                                                                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bridge`         | the default for relief: outdoor, directional. It gives neutral greys an olive cast (B/G ≈ 0.82)                                                                                                                                                                |
| `sun`            | the harshest relief check: hard midday sun. Strong yellow cast, so don't judge color here                                                                                                                                                                      |
| `overcast`       | soft, medium daylight, near neutral: overall read. **Best for judging reflection breakup on white or bright glossy materials** (on `sphere`)                                                                                                                   |
| `neutral`        | **judging albedo and color**: colorless grey studio (R = G = B). It's bright, with 0.6 albedo reading ~239/255, so use `-e -1` for albedos above ~0.6. It has hard-edged panel reflections on glossy materials, so use `--channel base_color` for albedo there |
| `strips`         | dark room with sharp softbox strips: **judging gloss, haze, and roughness variation** (swirls, scuffs, wear) on `sphere` and `plane`                                                                                                                           |
| `dusk` / `night` | darker settings: does the material still read?                                                                                                                                                                                                                 |
| `studio`         | the old default. Dim, and shows about 4× less relief than bridge                                                                                                                                                                                               |

Relief is directional. Under **bridge**, slopes along UV (1,1) read ~4× stronger than along (1,−1).
Under **sun**, the key light comes from +U (slightly +V), so ridges running along U (slopes along
V) read weakly. Check directional patterns in both orientations before calling one "too weak".

**`--channel <node>`** renders any nodegraph node unlit: floats as grey, vectors as rgb, with
`--range min,max` mapped to black..white, no tone mapping. It prints **min/p5/mean/p95/max** and
warns about clipping. On head-on plane views it also prints the **UV of the minimum and maximum**, so you can
find a rare feature (a pinhole, a chip) and aim `--center` at it. Use it to confirm heights in
meters, mask coverage, and roughness ranges instead of guessing. Precision is (range width)/255, so
narrow the range to read small values exactly. Float nodes print one `value:` line; vector and
color nodes print `r:`, `g:`, and `b:` lines. Write negative ranges as `--range=-0.003,0.002`. Values in
the bottom 4% of the range read slightly high (0 reads as ~0.012 at `--range 0,1`), so confirm exact
zeros with a tighter range. A tangent normal (`heighttonormal` output) is encoded 0..1, with 0.5 flat, so use `--range=0,1`.

**`submodules/mtlx-sample-library/materials/ai_authored/tools/mx.py`** (optional) is a tiny Python node writer. `g.n('multiply', in1=a, in2=2)`
replaces a 3-line XML block, and it has helpers for noise, remap, the normal chain, and smooth max.
If you use it, commit the generator next to the `.mtlx`. Hand-written XML is fine too.

**Practicalities:**

- Put experiments in your own scratch directory, `$TMPDIR/<material>/`. Never use a shared path;
  parallel agents have overwritten each other's scripts.
- zsh doesn't word-split `$cmd`, so use a shell function or the full command. Chain edit and
  render steps with `&&`, not `;`, so a failed edit doesn't render a stale file.
- Use Bash timeouts of ≥ 300 s. Renders slow down a lot when many agents render at once. For
  large graphs pass `render --timeout 300` too; it covers compile and every screenshot.
- The Write tool may refuse `.md` files for subagents. Write them with a Bash heredoc, or return the
  text in your report.
- To load `sharp` from a script, use
  `createRequire('<repo>/packages/cli/package.json')('sharp')`.

## 2. Conventions

- Finished materials go in [`mtlx-sample-library`](https://github.com/bhouston/mtlx-sample-library), cloned as in
  [README.md](README.md), one folder per material:
  `submodules/mtlx-sample-library/materials/ai_authored/<name>/<name>.mtlx`, the generator if any, and the AVIF screenshots from `render.sh`. Add
  a row to the gallery in `materials/ai_authored/README.md` there, and commit and open a PR in that repo. These materials double as fidelity test cases across MaterialX renderers. Name
  the nodes `NG_<name>`, `SR_<name>`, and `M_<name>`.
- **UV 0..1 = 1 m.** Frequencies are features per meter (`uv·33` gives 3 cm cells). **Heights are
  in meters.**
- Use `standard_surface`, with `base_color`, `specular_roughness`, `metalness`, and `normal` all
  driven by **one nodegraph with multiple outputs**. Metalness comes from a graph output even when
  it's 0. Keep `specular` 0.5 and `specular_IOR` 1.5 unless the material needs otherwise. Felt,
  velvet, and other fibrous surfaces need a lower `specular` (~0.2, from a graph output), or
  roughness-1 black shows a grey Fresnel sheen at grazing angles.
- `separate2` and `separate3` are `type="multioutput"`, with outputs `outx`, `outy`, `outz`
  (`outr`, `outg`, `outb` for color3). `fract(x)` gives tile-local coordinates, and `modulo` is
  floor-based like GLSL `mod`.
  `ifgreater` takes `value1`, `value2`, `in1`, `in2`, and gives in1 when value1 > value2.
- Define nodes before use, and comment each section with its physical scale.
- Start from a similar library material. [`smooth-cast`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/smooth-cast/smooth-cast.mtlx) is the
  minimal reference.

## 3. The loop

1. **Plan the scales before building.** List every feature with its real size, spacing, height or
   depth, color, and roughness. Also decide which view each feature must read at (see §4).
2. **Build the height field in meters** as a sum of layers, then derive the color and roughness masks
   **from the same layers** (see §5).
3. `check` with all four rule groups. `render` prints a **graph-size warning** when the expanded
   tree passes 0.3M nodes, naming the worst re-read nodes. Fix those before iterating: compile
   time tracks the expanded size, not the node count (renderer bug 7). One barnwood graph went
   from 320 s to 13 s this way.
4. Render a sheet: `--view plane closeup detail sphere totem --ibl bridge --supersample`.
5. Verify numerically with `--channel height`, and `--channel` for any mask you're unsure of.
6. Judge color under `--ibl neutral`, relief under `bridge` and `sun`, and gloss on `sphere`.
7. Iterate. When something looks wrong, isolate it with `--channel` and `--center` rather than
   editing blind. To check that a concave or convex feature reads correctly, flip its height sign
   once and compare.

## 4. What reads, and at what scale

Relief visibility depends only on **slope** and **pixels per wavelength**, not on physical size.

| Rule             | Value                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Visible slope    | ~1.2 grey levels per degree. Nothing below 0.5°, subtle at 3°, strong at 20°                                                                                                                                                                                                                                                                                                                                             |
| Slope budget     | **2–20°**; cap noise relief at **~30°**. Designed edges: up to ~45° with a ramp ≥ 4 px wide, and steeper (a crisp 60–65° square step) when the ramp is ≥ ~10 px at the view you judge (a circular cove of half-width w and radius R has a wall of asin(w/R) at the arris; 20 mm × 4 mm is 43.6° and renders cleanly with a ~6 px ramp at closeup). At ≥ 40° with narrow ramps you get sky-colored patches and 2×2 blocks |
| Wavelength       | ≥ **6 px** at the view it must read in. Under ~3 px it becomes speckle and moiré                                                                                                                                                                                                                                                                                                                                         |
| Lines and ridges | ≥ 2 px wide at the farthest view that must look clean (plane ≥ 4 mm, closeup ≥ 0.8 mm, detail ≥ 0.2 mm). Thinner ones break into dashes. Height ramps should be ≥ 4 px. A designed joint (e.g. 2 mm grout) may be narrower at `plane` if the ramp and color change beside it are ≥ 4 px at `closeup`                                                                                                                     |
| Height steps     | render as 1–2 px dashed hairlines. **Keep height continuous** and ramp every edge. Edge profiles need continuous curvature (cubic or smoothstep, not a quarter parabola), or a crease shows where they meet the flat face. Use **smooth min** for distance fields that drive masks or domes (a hard min creases along the medial axis), and a hard min only for the outline itself                                       |
| Noise slope      | `noise2d·A` at f/m gives ~1.3·A·f rad; a 5-octave `fractal2d` ~2.5·A·f                                                                                                                                                                                                                                                                                                                                                   |

- **Budget slope per layer, not amplitude.** A micro layer too strong for its view looks worst where
  its wavelength is 1–2 px (salt-and-pepper speckle). A typical budget:
  - macro: ~30 cm features, ~1–2°;
  - meso: ~2 cm, ~3–5°;
  - micro: ~1 mm, ≤ 5°.

  Replace slope you can't afford with roughness variation. **Polished and honed surfaces** (stone,
  glaze) want micro relief ≤ 0.5°; more reads as hammered or orange peel.

- **Periodic detail** (`sin` stripes, wood grain) shows moiré when sub-pixel, which is strongest on the
  totem. Noise only speckles. There is no derivative or LOD node, so cap frequencies at the
  farthest view that matters.

## 5. Making it look real

- **Correlate the channels.** Cavities are darker and rougher, raised or worn areas lighter and
  smoother, and stains only change color. Correlated masks read as 3D, while uncorrelated ones read
  as stains printed on a bumpy surface. For a free convexity mask, use
  `fractal2d(5 oct) − fractal2d(2 oct)` (see [cavity and wear masks](cookbook/noise.md#correlated-cavity-and-wear-masks)).
- **Vary everything at several scales.** Use per-element randoms (stone, board, tile) from
  `worleynoise2d style=1` or `cellnoise2d(floor(...))`. Add large-scale tone drift (~30 cm+) plus
  meso and micro variation. Uniformity is the biggest giveaway.
- **Deep grooves and reveals** (deeper than they are wide, with real vertical walls) can't be modeled
  within the slope budget. Use a ramped profile of a few mm, and put the depth into **albedo**:
  darken the channel floor toward the walls, a baked AO term. Otherwise the channel reads as paint,
  not depth.
- **Seed per element, not per layout cell,** when cells cut through members. In frame-and-panel,
  stiles and rails cross panel-cell edges, so seed them per member (e.g. per stile column), or tone
  steps appear mid-member.
- **Large raised steps** (battens, trim, reveals of 10–20 mm): build the side as the _integral of a
  smoothstep-shaped slope_ for continuous curvature, with width W ≈ H/tan(θmax) + (fillet + ease)/2.
  A 50–60° face renders cleanly if the ramp is ≥ 4 px at the farthest view. Compose a raised element
  over a varying base as `h = H·m + h_base·(1 − m)`; adding it on top of a cupped base creases
  where the base slope changes sign.
- **Add edge eases and joints to the surface height; don't multiply them into it.** `top·ease`
  leaves joints standing above neighbors wherever the surface waviness is negative.
- **Taper masks by modulating the threshold,** not the output. Cracks and streaks then narrow to
  points instead of fading as full-width ghosts.
- **Strokes and brushed or broom finishes:** use noise stretched along the stroke
  (`uv·(3, 330)`), used directly as continuous height. Flat-bottomed `smoothstep` grooves render as
  hairlines, and `sin` reads as machined.
- **Specks and pits:** use worley F1 with a smooth-noise-driven radius. Thresholded noise always makes
  worms. Keep the radius ≤ (1 − jitter)/2 cells, and features never clip.
- **Irregular outlines:** domain-warp the texcoord with a **vector3** noise converted to vector2
  (the vector2 noise variant is broken). Keep warp strength A·f ≤ 0.2 for noise2d, and ≤ 0.1 for
  fractal2d or per stage of nested warps.

## 6. Renderer facts you must design around

These are summaries; the cookbook has details and the workarounds.

- **`heighttonormal` needs millimeters** (a renderer bug: with meter UVs the normal comes out flat).
  Always use:

  ```xml
  <multiply name="uv_mm" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="1000" /></multiply>
  <multiply name="height_mm" type="float"><input name="in1" type="float" nodename="height" /><input name="in2" type="float" value="1000" /></multiply>
  <heighttonormal name="n_tangent" type="vector3"><input name="in" type="float" nodename="height_mm" /><input name="scale" type="float" value="16" /><input name="texcoord" type="vector2" nodename="uv_mm" /></heighttonormal>
  <normalmap name="n_world" type="vector3"><input name="in" type="vector3" nodename="n_tangent" /></normalmap>
  ```

  `scale 16` makes slopes physically correct. Don't use `bump`.

- **Smooth noises are signed and narrow.** noise2d has std 0.32 (90% within ±0.54), and fractal2d
  std 0.37. For noise2d use `amplitude 0.8, pivot 0.5`; for fractal2d use `·0.6 + 0.5`. Don't use
  `0.5 + 0.5·n`.
  All smooth noises are 0 at integer texcoords, so give each layer an offset.
- **vector2, vector4, and color4 noise variants repeat one value in every channel.** Use vector3
  or color3.
- **Worley:** float = F1, vector2 = (F1, F2), vector3 = (F1, F2, F3). Borders are where F2 − F1 = 0.
  F1 alone does _not_ find borders (max 1.16 at jitter 1). `style=1` gives a per-cell random that
  matches the style-0 cells; that's the right per-stone id. `cellnoise2d` doesn't align with
  jittered cells.
- `smoothstep` with low > high doesn't invert (this matches the reference). Use `1 − smoothstep`.
- Derivative normals come in 2×2 pixel blocks, so tiny or steep features show "+" marks and stair
  steps. Supersampling helps, and so does staying within the slope budget.
- `unifiednoise2d` type 3 clamps half its area to 0 with the defaults. See `mtlx nodes unifiednoise2d`.
- **Compile time:** `noise2d` fed by a deep texcoord graph (layout → warp → noise) can take minutes to
  compile (renderer bug 6). `render` prints the first-view time and warns above 20 s. If it's
  slow, replace `noise2d` on warped or layout coordinates with `fractal2d octaves=1` (the same noise,
  cached input; add the pivot by hand).
- **Shared nodes may be recomputed per consumer** (renderer bug 7), so reuse multiplies. Prefer
  `c·mix(1, k, m)` over `mix(c, c·k, m)` for tint chains, and don't feed one big graph into several
  branches that are then mixed again. If the first view passes ~20 s,
  `python3 docs/material-authoring/noise-lab/cookbook/gen/treesize.py <file.mtlx>` shows how large the expanded graph
  is.

## 7. Physically plausible values (linear base_color)

| Surface                      | base_color                                                              | roughness                     | Notes                                                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grey Portland concrete       | 0.30–0.45                                                               | 0.75–0.92                     | neutral to slightly warm                                                                                                                                                     |
| White precast                | 0.55–0.70                                                               | 0.65–0.85                     |                                                                                                                                                                              |
| Weathered, dirty mineral     | 0.15–0.30                                                               | 0.85–0.95                     |                                                                                                                                                                              |
| Polished concrete or stone   | as mix                                                                  | 0.15–0.45                     | judge on `sphere`                                                                                                                                                            |
| Stone aggregate              | 0.05–0.6                                                                | 0.5–0.8 (polished 0.1–0.3)    | varied hues                                                                                                                                                                  |
| Glazed ceramic tile          | glaze color                                                             | 0.03–0.25                     | `specular 0.5` at low roughness is enough. If you add a coat, wire `coat_normal` too. Glaze pools darker in hollows, and edges run thicker or thinner depending on the glaze |
| Unglazed tile, terracotta    | 0.25–0.5                                                                | 0.7–0.9                       |                                                                                                                                                                              |
| Cement grout                 | 0.2–0.6                                                                 | 0.85–0.95                     | recessed 1–3 mm                                                                                                                                                              |
| Finished wood (oil, lacquer) | 0.05–0.45 by species; pale species (maple, birch, ash) up to ~0.65 in R | 0.25–0.6 (gloss poly 0.1–0.2) | grain modulates both color and roughness. Visible reflection ripple on gloss needs ~0.2–0.5° waviness                                                                        |
| Painted surfaces             | paint color                                                             | 0.3–0.9 (gloss to matte)      |                                                                                                                                                                              |

Metalness is 0 for minerals, wood, ceramics, and paint. Only bare metal is metallic, and rust isn't.
The `bridge` light tints greys olive, so check color under `neutral`.

## 8. Acceptance checklist

1. `check --strict --rules basic structure types unused` passes with no warnings.
2. `plane` (1 m) reads as a real sample at that distance, with large-scale variation, no obvious
   repeats, and no noise soup. For floors, walls, and layouts, `--uv-scale 4` still reads as the real
   thing at room scale.
3. `closeup` and `detail` show plausible relief at real scale, with no flat normals, speckle,
   dashes, clipped features, or blocky 2×2 artifacts.
4. `--channel height` confirms the planned depths, in meters.
5. Color looks right under `--ibl neutral`, and gloss looks right on `sphere`.
6. `totem`: no strong moiré or artifacts, and it reads correctly on curves.
7. Values fall within §7.

## 9. Reporting (for agents)

End every material task with a report containing:

1. **A one-line description for the gallery in `materials/ai_authored/README.md`.**
2. **The physical scales used:** a feature table with sizes, heights, and colors.
3. **Metrics:** edit and render iterations, total render calls, and wall time. These let us compare
   rounds.
4. **Friction & issues:** everything that slowed you down or confused you. Name the tool, doc
   section, or missing feature, and say what would have helped most.
5. **Guide corrections:** anything in this guide, the cookbook, or `mtlx nodes` that was wrong or
   missing.
6. **Renderer bugs:** anything that differs from MaterialX behavior. For each, give a minimal repro
   (a tiny .mtlx and the command), observed vs expected behavior, the three.js source location if
   known, and confidence (confirmed, likely, or unsure). Keep true bugs separate from gotchas that
   match the spec.

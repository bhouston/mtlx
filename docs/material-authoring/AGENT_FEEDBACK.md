# Agent feedback: authoring procedural materials with the mtlx tools

Friction reported by the agents that built this library, collected per round. The status table
records what has been acted on.

## Status after round 1 and noise-lab (2026-09-27)

What the feedback below led to. Renderer bugs are tracked separately in [RENDERER_BUGS.md](RENDERER_BUGS.md).

| Request (agents asking)                                           | Status                                                                                                                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Render several views in one browser session / contact sheet (all) | **Done:** `render --view a b c`, one compile, sheet or folder, timing printed                                                                 |
| Channel or node debug render, numeric ranges (7)                  | **Done:** `render --channel <node> --range a,b`, unlit and untonemapped, prints min/p5/mean/p95/max                                           |
| Pan to a feature / head-on or top-down view (4)                   | **Done:** head-on metric `--view plane/closeup/detail/plane:<m>`, `--center u,v`, `--elevation`                                               |
| Grazing view for gloss (1)                                        | **Done:** `grazing` and `sphere` views; the guide says to judge gloss on `sphere`                                                             |
| Neutral light for color / more lighting (3 + user)                | **Done:** `--ibl sun, overcast, neutral, dusk, night` (CC0 HDRs), plus `bridge` and `studio`                                                  |
| Supersampling for thin lines (2)                                  | **Done:** `--supersample`                                                                                                                     |
| Node semantics, e.g. worley style (3)                             | **Done:** `mtlx nodes <query>` with renderer notes; shared with MCP `list_node_definitions`                                                   |
| Unused-node warning (2)                                           | **Done:** `check --rules unused` (opt-in, so the live editor isn't affected)                                                                  |
| Structure and type checks never ran                               | **Done:** the guide and `render.sh` use `--rules basic structure types unused`. A real type bug surfaced in cmu-block and two example assets  |
| Per-agent scratch dirs (3)                                        | **Done:** guide rule `$TMPDIR/<material>/`                                                                                                    |
| XML verbosity, expression shorthand (5)                           | **Partial:** optional `submodules/mtlx-sample-library/materials/ai_authored/tools/mx.py` node writer. There's no expression syntax in the CLI |
| Accurate zoom-to-width (3)                                        | **Done:** metric views replace `-z` for plane work                                                                                            |
| Noise knowledge gaps (all)                                        | **Done:** noise-lab explorers, [NOISE_COOKBOOK.md](NOISE_COOKBOOK.md), rewritten AUTHORING.md                                                 |
| Derivative, fwidth, or LOD node for anti-aliasing (2)             | **Open:** not in the MaterialX stdlib. The guide caps frequencies per view                                                                    |
| Metric curved preview, totem with 1 UV = 1 m (4)                  | **Open**                                                                                                                                      |
| Render server or queue under heavy concurrency (all)              | **Mitigated:** one browser per multi-view call cut calls ~3×. No shared queue                                                                 |
| Reference photo comparison or histogram (1)                       | **Covered** by `--channel` stats and `--mirror`; no reference-photo diff                                                                      |

## Orchestrator (built `smooth-cast`, wrote AUTHORING.md)

- **The MCP server wasn't connected** in the session. It needs a manual
  `claude mcp add mtlx -- mtlx mcp` and `mtlx` isn't installed globally. I used the CLI
  (`packages/cli/bin/cli.js`) instead, which is equivalent.
- **`heighttonormal` returns a flat normal at real-world UV scales.** This is a three.js bug:
  `mx_heighttonormal` checks `dot(n,n) < 1e-12` as an absolute degenerate test, and with meter UVs
  the cross product is ~1e-8. Worked around by feeding millimeters. Fix upstream with a relative
  threshold (or normalize the tangent frames before the cross product). `bump` has the same bug.
- **The default studio IBL hides normal maps.** It is soft and dim, so a correct normal map is
  nearly invisible and bright diffuse materials read mid-grey. Added `--ibl bridge` and `--exposure`
  to `mtlx render` and `render_material`.
- **There was no way to zoom in.** A 1 m plane at 512–800 px can't show mm detail. Added `--zoom`.
- **The noise ranges in the MCP tool doc didn't cover 2D noises.** `noise2d` and `fractal2d` are
  signed (-1..1), and raw use renders half black. Added to the `edit_material` description.
- **`cellnoise2d` gating of worley features clips pits** into half-moons at cell borders, because
  jitter moves feature points across cells. Needs a doc note or a worley variant that returns a
  per-feature random id.
- **The reference asset `assets/road_aggregate.mtlx` looks poor** (blocky cellnoise and dot pits), so
  it's a weak example for agents to copy.
- **Only the plane is at true scale.** Totem and sphere UVs aren't 1 UV = 1 m, which makes the totem
  shot misleading for scale.
- **Derivative normals alias on sub-pixel features** (little "+" marks on distant pores).
- **Plain renders take ~6 s** each (they launch a new Chrome per render). A persistent browser or
  multi-shot render (plane, close-up, and totem in one launch) would speed up iteration.
- **CLI tests time out while many agents render concurrently.** 33 tests hit timeouts under load
  and pass when idle; re-verify after the run.

## cracked-slab

**Issues**

- **Renders are very slow under load.** With ~16 concurrent `cli.js render` processes, a batch of 3
  renders took over 2 minutes and hit the 120 s Bash timeout. Wanted: a warning in the guide, or
  plane, close-up, and totem rendered in one browser session.
- **The XML is verbose.** Every arithmetic step is a node, which came to ~170 nodes. The agent edited
  with Python find/replace instead of by hand. Wanted: an expression or macro shorthand, or at least
  documented snippets for "remap to 0..1" and "F2−F1".
- **`check` doesn't mention forward references** (a node used above its definition). It's valid,
  but confusing.
- **Channel debugging is slow.** Each debug means rewiring the file to emission. Wanted:
  `render --channel <output>` to show one nodegraph output unlit.
- **Plane-scale aliasing.** At ~2 mm/px, cracks under ~3 mm break into dotted pixels.
  Supersampling would help.
- **The totem isn't at true scale,** so cracks look too wide there.

**Findings to add to the guide**

- `dotproduct(worley_vector2, (-1, 1))` gives F2−F1 in one node.
- Crack width ≈ threshold / frequency (m). Warping steepens the gradient, so the rendered width is
  about half that. `smoothstep` `low` and `high` can be node-connected.
- To avoid a uniform cell network, multiply the crack **threshold** by a low-frequency mask instead
  of masking the output. Tips then taper, and only some borders crack.
- Meander warp: a 3-octave fractal at ±0.35 cell folds space into tangled micro-cells. Use 2 octaves
  at ≤0.28.
- Chipped edges: a step renders as terraces. A ramp, `1 − smoothstep(e, crack_t, chip_t)`, reads
  as broken. High-frequency noise in the chip threshold makes detached islands at Y-junctions.
- `noise2d` and `fractal2d` above ~500/m show axis-aligned lattice artifacts at zoom 20. Worley F1
  domes are better for sand grains.
- Soften thin features (edge width ~0.004 in F2−F1 units) to reduce plane-scale aliasing.

## weathered

**Issues**

- **Render time varies a lot.** A batch of 3 went past the 180 s timeout once the machine was loaded,
  and the final `render.sh` took 1 m 43 s. Wanted: several views rendered in one process.
- **The close-up can only zoom on the tile center.** The plane is a perspective trapezoid using ~55%
  of the frame, so there's no way to aim the close-up at a specific feature. Wanted:
  `--center u,v`, or a head-on plane view.
- **"+" artifacts at zoom 20.** Derivative-normal artifacts limit how fine the relief can be judged.
- **Hand-editing is verbose** (~150 nodes). `check --strict` doesn't warn about unused nodes, and a
  dead chain only got caught by reading. Wanted: an unused-node warning.
- **No way to check tones objectively.** Wanted: comparison against a reference photo, or a
  luminance/histogram readout.

**Findings to add to the guide**

- `noise2d type="vector2"` with a vector2 `amplitude "0.012, 0"` gives a U-only wobble.
  `multiply` a vector2 by `value="70, 0.9"` gives anisotropic (stretched) noise, useful for
  streaks.
- The varied-radius pit technique also works for sand grains, with `noise2d` `pivot` as the mean
  radius. Warping the worley texcoord by ~0.35 cell turns round grains into irregular flakes.
- Soft-falloff worley F1 looks like cobblestones. Use hard, radius-varied edges for sand.
- A `fractal2d type="vector2"` warp (~1.5 cm, 22/m, 6 octaves) gives jagged spall outlines.
- On the totem, V-aligned features such as streaks don't run straight down. That's expected, but
  worth a note.

## white-precast

**Issues**

- **Shared scratchpad collision (its biggest problem).** Parallel agents share the session scratchpad.
  Another agent overwrote its `r.sh`, so it rendered `cmu-block.mtlx` by mistake and timed out.
  Wanted: a per-agent scratch dir, or a guide rule to use `$TMPDIR/<name>/`.
- **Renders were killed under load.** Exit 143 (SIGTERM) with no message, and the re-run worked.
  Wanted: the CLI to report why, or retry.
- **No contact sheet.** It opened each PNG separately to compare iterations. Wanted: one image with
  plane, z5, and z20 side by side.
- **The bridge IBL tints colors green-yellow.** Neutral or warm greys read greenish, which cost 2
  iterations. Wanted: a guide note, or a neutral-grey reference swatch, or a neutral light preset.
- **No per-feature random value from worley.** `cellnoise2d` doesn't align with jittered cells, so
  it used smooth noise at the grain frequency instead. Wanted: a worley variant that outputs a
  per-feature id or random value (also asked for by the orchestrator and cmu-block).

**Findings to add to the guide**

- The varied-radius pit recipe only avoids clipping while the max radius is ≲0.25–0.3 of a cell. At
  ~0.45, pits merge into clipped splats.
- With default settings `noise2d` rarely exceeds ±0.5, so size radius multipliers for that range.
- Detail under 1 mm needs `-z 20`, since z5 is ~0.4 mm/px.
- `max`, and `noise2d` `amplitude`/`pivot`, work as expected, as does worley `jitter` 0.9.

## bush-hammered

**Issues**

- **Renders took ~2 min per batch.** `render.sh` took 1:55 at 29% CPU with ~13 concurrent renders,
  and it had to raise tool timeouts to 400–600 s. Wanted: several views in one browser session, or a
  shared render queue.
- **Node discovery has no semantics.** The listing one-liner gives names and types only, so it had to
  read `three/src/nodes/materialx/MaterialXNoise.js` to learn what worley `style` does. Wanted:
  enum and semantic notes in the guide or registry.
- **Channel debugging needs manual rewiring.** Wanted: `--debug-output <name>`
  (see cracked-slab `--channel`).
- **Blocky ~1 mm squares at z20** on dark stones, from 2×2-quad derivatives on height
  discontinuities (per-chip random depth steps). They're invisible at z5.
- **Totem is not at true scale.** Aggregate looks ~3× too large. Wanted: a metric-UV curved preview.
- **XML is verbose** (~150 nodes). It edited with Python regex, and one copied layer kept a stale
  comment.

**Findings to add to the guide**

- **`worleynoise2d style=1` returns a random 0..1 value per Voronoi cell,** hashed from the feature
  point. This is the correct per-stone or per-chip id, it has no `cellnoise2d` clipping, and it
  answers the "per-feature random" request above. The guide should recommend it over `cellnoise2d`.
- Angular stones: `smoothstep(F2−F1, t, t+0.04)` insets cells into straight-edged polygons. Keep
  t ≲ 0.35 cell, because it turns round above that.
- Faceted chips: an F1 cone × `smoothstep(F2−F1, 0, ~0.12)`, with several rotated layers combined by
  `max`. A plateau without the cone reads as thin cracks.
- `modulo(rand*13.7, 1)` decorrelates a palette pick from a per-cell random already used for size.

## exposed-aggregate

**Issues**

- **Slow renders.** A batch of 3 took 1.5–2 min and hit the 120 s timeout. Wanted: a render server
  mode or multi-view render, or at least a documented expected time.
- **Worley `style` is undocumented.** It had to read the three.js source to confirm `style=1`. The
  float and vector worley variants hash feature points differently.
- **Common patterns are verbose.** smin, pow, dome, and palette chains take 5–10 lines each, and it
  edited with Python string-replace. Wanted: a snippet library (smin, `ifgreater` palette,
  per-stone id).
- **The z5 close-up is too far out for ~10 mm features** (~20 px per stone). It used `-z 15`
  throughout. Wanted: zoom guidance tied to feature size.
- **The guide's aggregate recipe is too thin.** "F1 threshold + cellnoise color" followed literally
  gives sparse identical circles with color seams.
- **Faint horizontal moiré** in derivative normals when stones are only ~4 px on the 1 m plane.

**Findings to add to the guide**

- **Per-stone id:** use `worleynoise2d type="vector3" style=1` (a random vec3 per Voronoi cell) with
  the vector3 `style=0` for F1/F2, so both come from the same feature points. `cellnoise2d` splits
  stones in two. (Bush-hammered found the same.)
- **Packed pebbles:** smooth-min of the Voronoi inset `(F2−F1−gap)/2` and a per-stone circle
  `(R−F1)`, with k≈0.4 cell. A hard min or F2−F1 alone gives flagstones or shards, and plain F1
  leaves voids.
- **Dome crease:** a dome built from that distance field creases on the medial axis. Multiply by a
  crown, `1 − 0.6·(F1/0.7)²`. The guide's `1 − F1/threshold` gives cones.
- **Tint with a float noise times a color,** not `color3` `fractal2d`, which varies per channel and
  gives rainbow tints.

## cmu-block

**Issues**

- **Shared scratchpad clash.** This agent and cracked-slab overwrote each other's `r.sh`. Wanted: a
  per-material scratch subfolder in the brief (see white-precast).
- **Slow renders.** `render.sh` took 2 min 13 s under load, and one batch passed the 180 s timeout.
- **No camera pan or UV offset.** It had to make a copy with a shifted texcoord to see a joint
  crossing. Wanted: `--center u,v` (also asked for by weathered).
- **No single-channel render.** Wanted: `--debug-output height` (third agent to ask).
- **The totem shot misrepresents porous materials.** Its non-metric UVs blow pores up into a
  granite-like speckle.
- **Faint stair-stepping** along vertical joint edges at z5, from derivative normals on steep slopes.

**Findings to add to the guide**

- Keep slopes ≲45°. Steeper walls (chips, joint drops) pick up bluish sky lines and stair-stepping.
- `min(dx, dy)` joint distance leaves a diagonal crease where joints cross.
- To check that a concave (or convex) feature reads correctly, render once with the sign flipped
  and compare.
- Joint-level view: offset the UV so the feature is at the center, then render at z15. `--center`
  would replace this.

## broom-finish

**Issues**

- **Slow renders.** `render.sh` took 2:06 at 27% CPU, and it hit the 120 s timeout once. The guide's
  6 s figure is wrong under load.
- **No channel inspection.** Wanted: `--channel base_color|roughness|normal|height`, or rendering
  any named node as emission (fourth agent to ask).
- **Can't verify physical depth.** Nothing reports a node's value range. Wanted: a CLI command to
  sample min/max of a node over UV.
- **No scale reference.** Wanted: a ruler overlay, or an exact zoom-to-width formula.
- **Rewiring and removing chains is fragile.** It used Python string replacement.
- **Remapping signed noise is verbose.** `noise2d` `pivot` does it in one node, so make that the
  main recommendation.

**Findings to add to the guide / corrections**

- **The zoom table is wrong.** Measured against the 4 mm joint, z20 shows ~6–9 cm (not ~5 cm) and z5
  shows ~25–40 cm (not ~20 cm), because of perspective. The plane's far edge is ~400 px at zoom 1.
- Thresholded `noise2d` makes worm-like blobs, never round specks. Use the worley pit recipe for
  specks; uneven UV scaling smears them.
- Flat-bottomed `smoothstep(noise)` grooves render as hairlines. Continuous signed corrugation
  (the sum of stretched noises used directly as height) reads far better.
- For broom and brushed lines, stretched noise (`noise2d(u·3, w·330)`) beats `sin`, because the
  strokes start and stop naturally.
- Per-band random: `cellnoise2d(combine2(floor(v·3), const))`.

## board-formed

**Issues**

- **No `--center u,v`** (third agent to ask). It wrote shifted-UV copies to inspect a knot or tie
  hole, and estimating pixels to UV on the perspective plane was off by cm, so it took 3 tries.
- **Wanted: a top-down orthographic plane view.** The perspective plane wastes ~half the image.
- **Manual channel debugging** (fifth agent to ask for `--channel` or `--debug-output`).
- **Contention.** One batch passed 180 s, and another exited 144. Wanted: per-render timing in the
  output, or a render queue.
- **Verbose XML** (~240 lines). It used Python replacements with assertions. Wanted: inline constant
  expressions or helpers (`1 − x`, etc.).
- **No derivative or LOD node (`fwidth`)** to fade out sub-pixel frequencies. This blocks the
  totem acceptance item for any stripe or grain material.

**Findings to add to the guide**

- **Periodic detail (`sin` stripes, grain) makes strong moiré on the totem** when sub-pixel. Noise only
  speckles. A material can't fix it without a derivative node.
- Thin ridges under ~2–3 px break into dashes where they tilt. Keep ridges ≥1 mm for the z5 close-up.
- A steep presence mask on a coordinate warp (knot bump) leaves a crease and dashes where the mask
  crosses. The smooth-radius recipe works for pits, not for warps.
- **Sparse, never-clipped features:** use a manual jittered grid, `cell = floor(uv·f)`, with
  per-cell `cellnoise` for offset (±0.2 cell) and presence, and radius < 0.5 − jitter. `cellnoise`
  is safe here; the warning applies only to worley jitter.
- Knot swirl: add a smooth bump to the across-grain coordinate before the `sin`. Route every
  grain-aligned noise through the same bent coordinate.
- `magnitude`, `ifgreater`, and `floor`/`modulo` on vector2, plus anisotropic vector2 multipliers,
  all work.

## polished-floor

**Issues**

- **Slow renders.** Each render took ~60–100 s with a ~200-node graph, and one batch was killed at
  the 120 s timeout.
- **No camera elevation or grazing view.** Gloss needs a grazing angle. Wanted: `--camera-elevation`
  or a grazing preset.
- **No channel debug.** It wrote its own "emit any node" script, which raced in parallel on a shared
  temp file. Wanted: `--debug-node <name>` (sixth agent to ask).
- **Registry lookup gaps.** No output names and no meaning for `style`. `ifgreater` uses
  `value1`/`value2`, which cost a failed edit.
- **Emission debug goes through sRGB,** so roughness 0.2 displays at ~0.48 grey.

**Findings to add to the guide / corrections**

- `worleynoise2d style=1` gives a per-jittered-cell random that exactly matches the `style=0` cells
  (third confirmation). Get more per-cell randoms with `modulo(id*k, 1)`.
- **The plane can't show reflections.** Even roughness 0.05 with `--background environment` shows a
  featureless sky gradient. Judge gloss, haze, and swirl on the totem or on
  `-g sphere --background environment`.
- **`smoothstep` with low > high does not invert** in three.js; it returns ~1. Use
  `1 − smoothstep(x, 0, w)`.
- Angular stones: `min(F2−F1 − gap, radius − F1)`, then a smoothstep (straight sides, trimmed
  corners).
- Hairline scratches: Voronoi borders on anisotropically stretched coords (vector2 multiply
  `4, 100`), with a noise in the same stretched space to switch lines on and off.

## noise-lab: cellular (explorer)

Full report is in [noise-lab/cellular/FINDINGS.md](noise-lab/cellular/FINDINGS.md), verified with a CPU port of three's
worley code (`worley-port.mjs`) that matches rendered masks within ~0.2% of area.

**Renderer bug**

- **`noise2d`/`fractal2d` `type="vector2"` return identical x and y.** The loader has only float and
  vector3 paths, so a vector2 warp shifts coordinates only along the diagonal. Use `type="vector3"`
  and take x and y. (AUTHORING.md recommended the vector2 warp, which was wrong.)

**Corrections to the guide**

- F1 at a cell border ranges ~0.03–1.16 (max F1 at jitter 1 is 1.16, median 0.43). The guide's
  "0.5–0.8 at borders" is wrong. Use F2−F1 for borders.
- **Clipping rule:** a disk of radius r ≤ (1 − jitter)/2 never clips. The material agents' "0.25–0.3"
  limit clips 22–38% of features at jitter 0.9. Lower the jitter instead. `cellnoise2d` gating is
  safe under the same rule.
- The float, vector2, and vector3 worley variants **share identical feature points**. The claim that
  they hash differently is false; only the style-1 ids differ between variants.
- Style 1: the float output is a hash of the winning cell. The vector3 output's `.xy` are the
  point's own jitter offsets, so use `.z` or the float id for an uncorrelated random. Ids are uniform
  on 0..1.
- `unifiednoise2d` type 2 gives the same F1 (it adds nothing, and `clampoutput` defaults to true).
  `worleynoise3d` with z = 0 is a different pattern.
- Jitter: max F1 is 0.71, 0.90, 1.04, and 1.16 at jitter 0, 0.5, 0.75, and 1. Jitter 0.5 still looks
  gridded, and ≥0.75 looks random.
- Crack width ≈ 1.3 × threshold / frequency. Warping thins cracks a further 2–4×.
- Per-cell id added straight into height makes stair-step cliffs. Multiply it by a profile that is 0
  at borders.
- Dark glossy domes read as pits under the bridge light. Raising albedo and roughness fixed it.

**Friction**

- Importing `sharp` via the pnpm symlink path failed. Use `createRequire` from the CLI `package.json`.
- Tone-mapped emission masks bleed between channels (up to ~33/255). Use a fixed threshold of ~120.
  (`render --channel` now removes this: no tone mapping, linear 8-bit values.)
- The registry lacks `cellnoise2d type="vector3"` (three renders it, and check doesn't flag it). No
  `style` semantics in the registry (now in `mtlx nodes` notes).
- Wanted: `--channel` or `mtlx measure`, now covered by `render --channel` statistics.

## noise-lab: composition (explorer)

The full report is in [noise-lab/composition/FINDINGS.md](noise-lab/composition/FINDINGS.md). The
renderer bug it found (coarse `dpdx`) is logged in [RENDERER_BUGS.md](RENDERER_BUGS.md).

**Key findings for the guide**

- **Relief visibility depends only on slope and pixels per wavelength.** Contrast is about 1.2 grey
  levels per degree. Use 2–20° slopes and cap at ~30°; at 43° you get sky patches and 2×2 blocks.
  Features need ≥ 6 px per wavelength.
- **Noise slope:** `noise2d·A` at f gives ~1.3·A·f rad, and a 5-octave `fractal2d` ~2.5·A·f (every
  octave adds equal slope). **Budget slope per layer, not amplitude.** A hot micro layer looks worst
  where its wavelength is 1–2 px.
- **Warp strength s = A·f:** keep s ≤ 0.25 for a single noise2d, ≤ 0.12 for fractal, ≤ 0.12 per
  stage for nested warps.
- **Height steps render as dashed hairlines.** Keep height continuous and cross-fade band borders.
- **Correlated channels read as 3D, uncorrelated as stains.** Convexity for free:
  `fractal(5 oct) − fractal(2 oct)`.
- **Bridge tint:** neutral 0.18 renders olive (B/G ≈ 0.82 on lit faces). Studio gives about 4× less
  relief contrast. Bridge relief is directional in UV: slopes along (1,1) read 4× stronger than along
  (1,−1).
- **Old z-zoom width ≈ 1.51/z m** (the guide's figures were wrong). This is superseded by the
  `--view plane:<m>` presets.
- **Finite-difference derivatives in-graph** (re-evaluate at uv+e) give fold detection, gradients,
  and Laplacians.

**Friction**

- **Subagents were blocked from writing FINDINGS.md** by the harness ("return findings as text"). The
  orchestrator saved it from the report. Future briefs should say where the harness allows writes,
  or ask for the text in the report.
- The MCP `zoom` doc said "plane is 2×2 units", but it's normalized to 1 m. That doc was rewritten.
- The docs never said the plane is a vertical wall at 35° elevation. The head-on presets now make
  this moot.
- Lit emission is tone-mapped (1.0 → 240). `--channel` now renders untonemapped.
- `check --strict` didn't warn about an unused nodegraph output (only basic rules). `--rules unused`
  now covers unused nodes.
- It wrote `gen/mx.py`, a small Python node writer, to cut XML verbosity. Consider shipping an
  equivalent helper.

## noise-lab: smooth (explorer)

The full report is in [noise-lab/smooth/FINDINGS.md](noise-lab/smooth/FINDINGS.md). Its measurements come from a
CPU noise port that matches renders within ±0.01. Renderer bugs B1 and B2 (vector2 and vector4 noise
variants repeat one channel) are in [RENDERER_BUGS.md](RENDERER_BUGS.md).

**Corrections and findings for the guide**

- Only vector3 and color3 noise variants have independent channels. **The guide's vector2 crack warp
  moves points only along the diagonal.** Use `noise2d type="vector3"` → `convert` to vector2 →
  `add` to uv.
- **The ranges are narrower than −1..1.** noise2d: std 0.32, 90% within ±0.54. fractal2d (defaults):
  std 0.37, 90% within ±0.61. So `0.5 + 0.5·n` spans only ~0.23–0.77. For full contrast use
  `0.5 + 0.8·n` (noise2d) or `0.5 + 0.6·n` (fractal2d). Octaves past 3 add detail but not range,
  and diminish controls contrast.
- **`unifiednoise2d` type 3 is signed, and with defaults 50% of the area is clamped to 0 (black
  holes).** Use `outmin 0.5, outmax 1, clampoutput false`. `jitter` rotates or re-slices types 0,
  1, and 3. Type 0 is `0.5 + 0.5·noise2d`.
- Feature size: blobs are ~0.7/f across and ~2/f apart. Threshold 0 gives a maze; use ≥ 0.2 for
  islands.
- **Every smooth noise is 0 at integer texcoords.** Layers with integer frequencies all hit 0 at the
  same points, so offset each layer.
- The lattice artifact is from too few cells in view (< ~40), not high frequency. Averaging two
  rotated, offset copies hides it.
- Warp limits: A·f ≤ 0.2 for noise2d (it loops at 0.32), ≤ 0.1 for fractal. This agrees with the
  composition explorer.
- `ifgreater` panel layouts sample different parts of the pattern, so subtract the panel origin
  for fair comparisons.

**Friction**

- **The Write tool refused FINDINGS.md for subagents.** It used a Bash heredoc instead. Briefs
  should expect this.
- Emission debugging goes through Neutral tone mapping, which couples channels above ~0.76.
  (`--channel` now bypasses this.)
- `sharp` can't be imported from `$TMPDIR`; `createRequire` from the CLI package works.
- zsh doesn't word-split `$VAR` commands, which broke the first batch.
- A background command piped to `head` hung (exit 144).

## Status after round 2 (before round 3)

| Request from round 2 (agents asking)                                                  | Status                                                                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Tile and plank layout recipes with per-tile local frame, id, and edge distance (6)    | **Done:** cookbook §4 has bond/grid, hex, herringbone, random-length planks, and the owner method |
| Edge profiles: rounded rect, crease-free cushion, per-edge and per-corner randoms (3) | **Done:** cookbook `edge_rrect`, `edge_cushion`, `edge_hand`                                      |
| Marble veins that don't look drawn (2)                                                | **Done:** redesigned `veins` recipe (core, patchy halo, hairlines)                                |
| Wedge-free tapered cracks, hierarchical cracks (1)                                    | **Done:** `crack_true` (gradient-normalized), `crack_child`                                       |
| Sparse scuffs without crosshatch (1)                                                  | **Done:** `scuffs`                                                                                |
| Round pits read as domes (1)                                                          | **Done:** default depth r/4                                                                       |
| `neutral` IBL cast (4)                                                                | **Done:** HDR desaturated, R = G = B                                                              |
| `--channel` low-value error (2)                                                       | **Done:** exact inverse sRGB                                                                      |
| Find rare features (2)                                                                | **Done:** `--channel` prints the UV of min and max                                                |
| Slow or fuzzy `mtlx nodes` (2)                                                        | **Done:** comma-separated queries, exact category wins, `fract`/`modulo` notes                    |
| Gloss hard to judge on the sphere under bridge (1)                                    | **Done:** `render.sh` renders the sphere under `overcast`                                         |
| Coat hook in `mx.py`; coat_normal gotcha (1)                                          | **Done**                                                                                          |
| View more than 1 m (1)                                                                | **Documented:** scale texcoord in a scratch copy                                                  |
| `cellnoise2d` exact zeros with half-integer seeds (1)                                 | **Worked around:** non-half-integer seeds in the recipes; logged as unsure in RENDERER_BUGS       |
| LOD or derivative node for sub-pixel hairlines and grain (2)                          | **Open**                                                                                          |
| EPIPE crash when piping `mtlx nodes` to `head` (1)                                    | **Fixed** (round 4)                                                                               |

## Status after round 3 (before round 4)

| Request from round 3 (agents asking)                                                     | Status                                                                                   |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Wood grain recipe: rings, pith, frequency cap, pores, rays, knots (5)                    | **Done:** `cookbook/wood.md`, `endgrain.md` (verified, no totem moiré)                   |
| Cookbook too big for one Read (3)                                                        | **Done:** entry page plus 7 topic files, each ≤ 330 lines                                |
| Chevron layout; stagger-guaranteed planks; plank length formula; variable-width rows (4) | **Done:** `cookbook/layouts.md`, `planks.md`                                             |
| Scoop-dish surface, polar/sector features, crisp-rim dents (3)                           | **Done:** `cookbook/surfaces.md`                                                         |
| Slow compiles, `noise2d` on deep texcoords (2)                                           | **Documented** (AUTHORING §6, renderer bug 6); `render` prints first-view time and warns |
| `--timeout` not covering screenshots (1)                                                 | **Fixed**                                                                                |
| View more than 1 m (2)                                                                   | **Fixed:** `render --uv-scale N`                                                         |
| Transient WebGPU popErrorScope failures (1)                                              | **Mitigated:** one automatic retry                                                       |
| Channel stats unreadable for mm heights (1)                                              | **Fixed:** 4 significant digits                                                          |
| `mx.py` integer inputs written as float (1)                                              | **Fixed**                                                                                |
| Edge ease multiplied into height lifts joints (1)                                        | **Documented**                                                                           |
| `grazing` useless for gloss; `plane` under `neutral` shows ripple (1)                    | **Documented**                                                                           |
| Pale-wood albedo range, `sun` cast (2)                                                   | **Documented**                                                                           |
| 1:1 crop / UV grid overlay for inspection (1)                                            | **Done:** `--crop`, `--grid`                                                             |
| Integer-typed inputs accept floats in `check` (1)                                        | **Open** (logged)                                                                        |

## Status after round 4 (before the concrete redo)

| Request from round 4 (agents asking)                                                                                                                                                                      | Status                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compile blowups from re-read nodes (2)                                                                                                                                                                    | **Fixed:** `render` prints expanded graph size and worst re-reads above 0.3M. Documented in AUTHORING §3 and bug 7                                         |
| `--channel` slow compile (1)                                                                                                                                                                              | **Fixed:** channel conversion reads its source once (54 s → 4 s)                                                                                           |
| `--center` shifting the full plane (3)                                                                                                                                                                    | **Fixed:** only applies to views narrower than 1 m                                                                                                         |
| EPIPE crash when piping to `head` (2)                                                                                                                                                                     | **Fixed**                                                                                                                                                  |
| `mx.std(extra)` node outputs; `smin`; `smax` mask ghosting (3)                                                                                                                                            | **Fixed/documented**                                                                                                                                       |
| Steep designed edges, large raised steps, raised-over-cupped composition (3)                                                                                                                              | **Documented** (AUTHORING §4/§5)                                                                                                                           |
| Felt specular; deep-channel AO; per-member seeding; light direction per preset; V is up (5)                                                                                                               | **Documented**                                                                                                                                             |
| Moulding profiles, panel steps, book-match, lacquer layering, kerf marks, along-grain checks, straight grain vs moiré fade, relief-aware ring frequency, min/max joint fix, FMAX at supersampled size (7) | **Done:** cookbook v4 (`profiles.md`, `grain.md`; plank joints read once, with pixel-identical outputs)                                                    |
| Symmetry and mirror diff tool; 1:1 crop; UV grid overlay; plane rotation (3)                                                                                                                              | **Done:** `--mirror u=…`, `--crop x,y,size`, `--grid N` (also in MCP). Plane rotation isn't needed: `--grid` plus the documented light directions cover it |
| `specular_rotation` units                                                                                                                                                                                 | **Renderer bug 8**                                                                                                                                         |

## Status after round 5

| Request from round 5 (agents asking)                                                                                                         | Status                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Sand, grain, and aggregate packing recipes (4)                                                                                               | **Done:** `cookbook/aggregate.md`                                                                                         |
| Rounded river pebbles; domed-pebble recipe faceting (1)                                                                                      | **Done:** river-pebble recipe; old recipe annotated                                                                       |
| Air voids read as dimples or craters (2)                                                                                                     | **Done:** flat-floor void recipe; pits and dents text updated                                                             |
| Sparse structural cracks, rain streaks, grinder swirls, cross-faded bands, imprints, knot cells (5)                                          | **Done:** `cookbook/weathering.md`, `surfaces.md`, `grain.md`                                                             |
| Correlated neighbouring worley ids (1)                                                                                                       | **Not a bug:** measured neighbour correlation ≈ 0.005. Same-colored neighbours are chance with small palettes. Documented |
| `--channel` accepting output names (2)                                                                                                       | **Done**                                                                                                                  |
| Gotchas: jitter ≤ 0.75 at `detail`, rotate high-frequency noise, sparse features missing the tile, relaxed pine fade, shell-function CLI (4) | **Done:** cookbook gotchas 17–21                                                                                          |
| `mx.py` op wrappers, remap default per noise kind (2)                                                                                        | **Done:** all 33 generators produce byte-identical output                                                                 |
| Sharp environment for judging gloss (1)                                                                                                      | **Done:** `--ibl strips`                                                                                                  |
| Mirror diff, 1:1 crop, UV grid (3)                                                                                                           | **Done:** `--mirror`, `--crop`, `--grid`                                                                                  |

# Round metrics

Wall time and tool calls are from the agent harness. Iterations and render calls are self-reported.

| Round | Material               | Wall time                                                              | Tool calls | Iterations | Render calls                                |
| ----- | ---------------------- | ---------------------------------------------------------------------- | ---------- | ---------- | ------------------------------------------- |
| 1     | cracked-slab           | 17 min                                                                 | 30         | 5          | –                                           |
| 1     | weathered              | 21 min                                                                 | 34         | 6          | –                                           |
| 1     | white-precast          | 26 min                                                                 | 40         | 7          | –                                           |
| 1     | bush-hammered          | 28 min                                                                 | 50         | 8          | –                                           |
| 1     | exposed-aggregate      | 31 min                                                                 | 55         | 8          | –                                           |
| 1     | cmu-block              | 32 min                                                                 | 38         | 5          | –                                           |
| 1     | broom-finish           | 33 min                                                                 | 50         | 10         | –                                           |
| 1     | board-formed           | 38 min                                                                 | 57         | 9          | –                                           |
| 1     | polished-floor         | 39 min                                                                 | 61         | 5          | –                                           |
| 2     | encaustic-cement       | 11 min                                                                 | 20         | 3          | 6                                           |
| 2     | penny-round            | 13 min                                                                 | 31         | 4          | 11                                          |
| 2     | hex-marble-mosaic      | 15 min                                                                 | 30         | 5          | 14                                          |
| 2     | zellige                | 16 min                                                                 | 31         | 4          | 14                                          |
| 2     | herringbone-marble     | 17 min                                                                 | 33         | 6          | 14                                          |
| 2     | crackle-glaze          | 19 min                                                                 | 50         | ~10        | 18                                          |
| 2     | subway-gloss           | 19 min                                                                 | 39         | 5          | 24 (9 were diagnosing tool issues)          |
| 2     | fish-scale             | 21 min                                                                 | 45         | 7          | ~30 (22 were `--channel`/`--center` probes) |
| 3     | maple-strip            | 8 min                                                                  | 23         | 3          | 10                                          |
| 3     | chevron-oak            | 11 min                                                                 | 28         | 3          | 13                                          |
| 3     | end-grain-block        | 13 min                                                                 | 27         | 5          | 8                                           |
| 3     | basketweave-parquet    | 14 min                                                                 | 34         | 6          | 17                                          |
| 3     | hickory-handscraped    | 15 min                                                                 | 34         | 4          | 12                                          |
| 3     | walnut-herringbone     | 28 min (~10 spent diagnosing a slow compile)                           | 75         | 6          | ~28                                         |
| 3     | reclaimed-pine         | 29 min                                                                 | 55         | 10         | ~26 (3 failed GPU renders)                  |
| 3     | oak-plank              | 36 min (most lost to slow compiles before the bug-6 workaround landed) | 53         | 10         | 25 (3 timeouts)                             |
| 4     | acoustic-slat          | 5.4 min                                                                | 28         | 4          | 10                                          |
| 4     | fluted-walnut          | 6 min                                                                  | 36         | 3          | 15                                          |
| 4     | shaker-panel           | 6 min                                                                  | 37         | 5          | 14                                          |
| 4     | beadboard              | 8 min                                                                  | 41         | 4          | 17                                          |
| 4     | bookmatched-veneer     | 8 min                                                                  | 40         | 4          | 15                                          |
| 4     | board-batten           | 9 min                                                                  | 38         | 4          | 16                                          |
| 4     | shiplap-whitewash      | 13 min                                                                 | 42         | 8          | 17                                          |
| 4     | barnwood-wall          | 26 min (5.4 min was one 320 s compile)                                 | 68         | ~11        | 29                                          |
| 5     | smooth-cast (r5)       | 7.5 min                                                                | 33         | ~7         | 14                                          |
| 5     | broom-finish (r5)      | 9.7 min (r1: 33 min, 50 calls)                                         | 30         | 4          | 19 (3 stale)                                |
| 5     | polished-floor (r5)    | 10 min (r1: 39 min, 61 calls)                                          | 39         | 7          | 16                                          |
| 5     | white-precast (r5)     | 11 min (r1: 26 min, 40 calls)                                          | 45         | 9          | 21                                          |
| 5     | bush-hammered (r5)     | 11.5 min (r1: 28 min, 50 calls)                                        | 42         | 7          | 18                                          |
| 5     | cmu-block (r5)         | 12.5 min (r1: 32 min, 38 calls)                                        | 45         | 9          | 16                                          |
| 5     | weathered (r5)         | 12.5 min (r1: 21 min, 34 calls)                                        | 41         | 9          | 18                                          |
| 5     | cracked-slab (r5)      | 13 min (r1: 17 min, 30 calls)                                          | 45         | 9          | 22                                          |
| 5     | board-formed (r5)      | 13 min (r1: 38 min, 57 calls)                                          | 42         | 5          | 20                                          |
| 5     | exposed-aggregate (r5) | 17 min (r1: 31 min, 55 calls)                                          | 65         | 15         | ~29                                         |

# Round 2: kitchen backsplash tiling

## encaustic-cement

**Friction**

- **The cookbook's round-pit recipe inverts.** Depth r/2 gives a 45° rim, which reads as a raised
  dome under bridge at `detail`. r/4 (~27°) plus a darker bowl works. Make r/4 the default, or add a
  warning.
- **Stretched-noise scuffs at a low threshold form a regular crosshatch.** They need a higher
  threshold and a patchy presence mask. Wanted: a sparse scuffs/scratches recipe.
- **No recipe for a regular tile grid** (floor/fract, distance to edge, folded symmetric motifs).
  It derived fract by hand. Wanted: a "tiles + grout" recipe.
- **`render.sh` renders only under bridge,** but the guide says to judge color under neutral. Add a
  neutral pass, or say so.
- `mx.py` worked well; its `std()` and `normal()` helpers removed all the boilerplate.

**Renderer bugs:** none.

## penny-round

**Friction**

- **Bucketing lattice centers into sheets flickered per pixel.** When centers land exactly on a
  bucket boundary, `floor` flips from pixel to pixel. Wanted: a cookbook note to offset bucket grids
  so no center lies on a boundary.
- **No hex-lattice or circle recipe.** It built two offset rectangular lattices with a nearest-center
  `ifgreater`. Wanted: a regular tiles recipe (square, hex, running bond) with ids and clip-free
  offsets (second agent to ask).
- **The grout meniscus is only continuous** if meniscus width + per-tile offset ≤ half pitch − R.
  It worked this out by hand.
- The flip-sign test was needed to judge dark raised discs in white grout. It worked, at a cost of
  2 renders.

**Guide gaps**

- `overcast` renders dim for very dark albedos.
- `ifgreater` works on vector2 for selecting between lattices.

**Renderer bugs:** none.

## hex-marble-mosaic

**Friction**

- **`--ibl neutral` had a magenta cast.** A 0.6 grey rendered at sRGB (238, 230, 233); the source HDR
  means were R 0.754, G 0.690, B 0.703. **Fixed:** `neutral.hdr` is now desaturated to luminance,
  and 0.6 grey renders as (238.8, 238.8, 238.8). Note that it's bright: 0.6 albedo reads ~239.
- **Marble veins are hard to size.** Contour width from fractal2d depends on the octave count. Wanted:
  a marble-vein recipe (core plus halo, width vs octaves).
- **Honed micro relief.** A 300/m layer at 0.04 mm read as hammered. Polished and honed stone wants
  ≤ 0.5° of micro relief, with roughness carrying the rest.
- **No hex-grid recipe** (third agent to ask for tiling recipes). Its two-lattice nearest-center method
  worked on the first try.

**Renderer bugs:** none new. It reported the neutral cast, which was a tooling asset issue, now fixed.

## zellige

**Friction**

- **`--channel` stats were wrong for small values.** Roughness p5 read 0.016 at `--range 0,1` vs
  0.046 at `0,0.2`. **Fixed:** the channel path used a `pow(2.2)` pre-gamma, but the renderer's sRGB
  encode has a linear toe. It now applies the exact inverse sRGB curve, and both ranges agree
  (p5 0.047). Precision is range/255.
- **`mtlx nodes fract` also returned `fractal2d`.** **Fixed:** exact category matches now win.
  Piping `mtlx nodes` to `head` crashes with an EPIPE stack trace (open).
- **Hard-edged studio-panel reflections under `neutral`** hide the base color of glossy materials.
  Use `--channel base_color` for albedo.
- Under `sun` and `bridge`, glossy undulating glaze shows **hard-edged reflected-horizon contours**.
  This is physically right, but cost an iteration.
- **Wanted recipes:** rounded-box tile distance; per-edge insets for out-of-square tiles and variable
  joints; per-corner randoms (`cell·2 + floor(fr·2)`); per-element noise reseed (`uv·f + id·97`).
- Coat is optional for glaze: specular roughness 0.035–0.1 at `specular 0.5` was enough.

**Renderer bugs:** none new. The channel precision issue was in the tooling, now fixed.

## herringbone-marble

**Friction**

- **No tile-layout recipe with a per-tile local frame** (along/across coords, id, edge distance) for
  brick, herringbone, or basketweave. Deriving and verifying the lattice was the main cost
  (fourth agent to ask).
- **`fract`/`modulo` semantics were undocumented.** **Fixed:** `mtlx nodes` notes now cover them
  (floor-based, like GLSL `mod`).
- **The neutral IBL looked lavender** (fixed; see hex-marble-mosaic).
- **Sphere pole pinching** makes periodic tile patterns look distorted there. That's expected from
  the UVs, but worth a note.
- It chained a patch script and a render with `;`, so the render ran after a failed assert. Use `&&`.

**Renderer bugs:** none. `rotate2d`, `cellnoise2d`, `modulo`, `floor`, `fract`, `ifgreater`, and
vector3 `fractal2d` all behaved as expected.

## crackle-glaze

**Friction**

- `--ibl` takes one preset per call. **Documented.**
- `neutral` at exposure 0 blows out bright albedos. Use `-e -1` above ~0.6. **Documented.** (Its lilac
  cast predates the neutral fix.)
- **Tapered F2−F1 cracks smear into dark wedges** where |∇(F2−F1)| is small (short edges, warping).
  Dividing by a finite-difference gradient fixed it. Wanted: a "true border distance" recipe; the
  cookbook width formula only holds where |∇| ≈ 2.
- **The Voronoi look was removed with hierarchical crack layers,** children gated by the parent
  cell's `style=1` id (so they T-junction), plus per-tile rotation and stretch. Wanted as a recipe.
- Sub-pixel stained hairlines alias to speckle at 1 m, and there's no LOD node (open).
- `mx.py` `std()` had no hook for coat inputs. **Fixed:** `extra=`. It also doesn't catch a
  float × vector2 operand-order mistake.
- **A coat without `coat_normal` reflects as a flat mirror** over the relief. **Documented.**

**Renderer bugs:** none new.

## subway-gloss

**Friction**

- **`--channel` low-value error and the `neutral` tint.** Both were measured before the fixes landed.
  Re-verified after the rebuild: constants 0.035, 0.2, and 0.5 read 0.0353, 0.2000, and 0.4980.
- **Finding rare features is hard.** It scanned a `--channel` PNG with sharp to locate a pinhole's UV.
  Wanted: `--channel` printing the UV of the max pixel, or a `--find` option.
- **The guide's `cli="..."; $cli` example breaks in zsh.** **Fixed:** the example now uses a function.
- White glossy dielectrics are hard to judge on `sphere` under bridge. `overcast` shows the
  reflection breakup better. **Documented.**
- **A quarter-parabola edge profile creased** where it met the flat face. A cubic, with continuous
  curvature, fixed it. **Documented.**
- Wanted: a rectangular or running-bond tile recipe (fifth agent to ask). Its `gen.py` could serve as
  the source.
- "Edges thinner and lighter" for glaze contradicted its brief. Now "thicker or thinner".

## fish-scale

**Friction**

- **`--channel` caught its own geometry bug immediately** (a missing row-below disk showed as a seam),
  and `--channel tile_id` confirmed ownership. This is the channel tool working as intended.
- **Hard-min distance fields crease along the medial axis.** Use smooth min for masks and domes, and
  the hard min only for the outline itself. Wanted as a cookbook note.
- **`mtlx nodes` was slow:** 7 sequential calls took over 120 s. **Fixed:** comma-separated queries,
  `mtlx nodes a,b,c`.
- **A straight-line reflection in the environment looked like a seam** on glossy `detail` under
  bridge. It cost 3 renders to rule out. **Documented.**
- **The `--channel` normal encoding was unclear** (`n_tangent` is 0..1, with 0.5 flat). **Documented.**
- **Designed 2 mm grout can't meet the ≥ 2 px line rule at `plane`,** but it reads anyway via the ramp
  and color change. **Documented** as fine when the adjacent ramp is ≥ 4 px at closeup.
- **Wanted:** a deterministic non-Voronoi tiling recipe: row band → nearest center in two candidate
  rows → owner → exact distances from the owner's local offset (sixth request for tiling recipes).
- **Rare features** (also requested by subway). **Fixed:** `--channel` now prints the UV of the max
  value on head-on plane views.

**Renderer bugs:** one unsure. `cellnoise2d` returns exactly 0 for whole tiles with some computed
half-integer inputs. This is logged in RENDERER_BUGS.md.

# Round 3: wood flooring

## maple-strip

**Friction**

- **The cookbook plank recipe hard-codes its segment and joint-range constants.** Working out the
  length formula took time. Wanted: "for lengths Lmin..Lmax use SEG = (Lmin+Lmax)/2 and a joint
  range of width (Lmax−Lmin)/(2·SEG)", or a parameterized helper.
- **`grazing` shows almost no reflection on glossy floors.** The environment is out of mirror range
  at 72°. The best gloss check was **`plane` under `--ibl neutral`**, where the panel reflections
  show per-strip ripple. That isn't in the guide.
- **Reflection ripple needs ~0.2–0.5° of waviness.** 0.04° was invisible and cost an iteration.
- **Bridge exaggerates the saturation of pale warm woods.** Use neutral at `-e -1` for color.

**Guide corrections**

- §7 finished wood base_color 0.05–0.45 is too low for pale species. Maple, birch, and ash are
  ~0.5–0.65 in R.

**Renderer bugs:** none.

## chevron-oak

**Friction**

- **NOISE_COOKBOOK.md (~45k tokens) is too big for one Read.** It took 3 reads, one of which hit the
  token cap. Wanted: split it (e.g. §4 layouts in its own file).
- **No chevron recipe.** Chevron is simpler than herringbone: two line families, `s = v − x` and
  `s = v + x − 0.5`, with the ends on vertical lines. ~20 nodes; worth adding.
- **No wood grain guidance.** It built its own flat-sawn elliptic ring model around a pith line for
  cathedral figure (worth a recipe). Rings of 3–5 mm are 1.5–2.5 px at `plane`, which breaks the
  6 px rule. It showed mild shimmer, but no objectionable moiré on the totem.
- It derived the block-center coordinate along the block axis itself; the chevron layout needs a
  `*_loc` equivalent.

**Guide gaps:** the chevron layout; a wood grain/rings recipe; flat-sawn oak ray flecks are small
spindles along the grain; the `sun` preset has a strong yellow cast, so don't judge color under it.

**Renderer bugs:** none.

## end-grain-block

**Friction**

- **The cookbook is too big for one Read** (second agent to say so). Wanted: a table of contents
  with line numbers, or a split.
- **Jitter added after `absval` breaks a line into beads.** Add wobble to the signed offset before
  the abs.
- **The `max(t, 1e-4)` threshold floor on tapered cracks still draws a faint full-length hairline**
  where the distance is exactly 0. Also gate the mask by `smoothstep(t, 2e-5, 6e-5)`.
- **`mx.py` mix with tuple colors** silently makes a float mix unless the node type is `'color3'`.
- **No polar or angular-sector recipe** (rays and radial checks around a point: `atan2`, sectors, and
  perpendicular distance r·Δθ).
- **The no-clip jitter (0.4) laid pores out in visible grid rows.** Jitter 0.85 with invisible
  clipping was better. The no-clip rule matters only when features are ≥ ~4 px.
- 1–2 mm rings at `plane` with `--supersample` averaged out without objectionable moiré (low-contrast,
  color-only detail).

**Renderer bugs:** none.

## basketweave-parquet

**Result:** the layout is exact, but the wood reads painterly or smeared at closeup and detail. It's
the weakest grain so far.

**Friction**

- **`mx.py` `basics()` makes `uv_sep` by default,** which triggered an unused warning and cost a cycle
  (`split=False` exists).
- **Wood rings (3–5 mm) are only 2–3 px at `plane`.** It used uneven year widths and coarser figure
  bands so they alias as noise, not moiré. **No wood-grain recipe** (third agent to say so).
- **`--channel` printed meters to 4 decimals,** so −0.15 mm showed as −0.0001. **Fixed:** 4
  significant digits.
- The 5 cm `detail` view looks soft. Crisp sub-mm wood texture without speckle is hard with no LOD
  node.

**Guide corrections**

- A wood-grain recipe: the ring-radius cone model, R = √((across+o)² + D²) + taper·along. It covers
  quarter-sawn (D ≈ 0) and plain-sawn (cathedral) grain with one formula.
- Periodic detail finer than 6 px at `plane` needs irregular spacing (phase noise) to avoid moiré.
- `render` defaults to 800 px, while the guide's pixel tables assume `-s 512`.

**Renderer bugs:** none.

## hickory-handscraped

**Friction**

- **The cookbook is too big for one Read** (third agent to say so).
- **Layout checks over several meters needed a hand-made `texcoord × N` copy** (second agent to ask).
  **Fixed:** `render --uv-scale N`. A 4 m view of this floor also shows that the within-board
  sap/heart streaking reads a bit vinyl-like at room scale, which is a useful new realism check.
- **The plank recipe's segment grid is shared by all rows,** so adjacent rows' joints cluster. Add a
  per-row shift (row × 0.618). The general length formula is the same as maple-strip asked for:
  S = (Lmin+Lmax)/2, JW = (Lmax−Lmin)/(2S).
- **`mx.py` appends nodes in call order.** Define before use; worth a docstring note.

**Guide corrections:** add a **paraboloid-dish scoop** recipe: smooth-min(F1², F2²) − 1, scaled by
a _continuous_ depth field (a per-cell depth makes steps). It works for hand-scraped, adzed, and
hammered surfaces.

**Renderer bugs:** none. The known workarounds were confirmed again.

## walnut-herringbone

**Friction**

- **The first version took 177 s per view, and the 5-view sheet timed out twice.** It traced this by
  hand to `noise2d` on deep texcoord graphs; that's **renderer bug 6**. The workaround is
  `fractal2d octaves=1`, after which it took 11 s for 5 views. **Documented** in AUTHORING §6.
- **`--timeout` didn't cover the screenshot step,** giving a cryptic Playwright error. **Fixed.** Render
  also prints the first-view time and warns when it passes 20 s.
- **It chained a failed edit and a render with `;`,** so two renders were of a stale file (guide
  already says to use `&&`).
- **Copying `herringbone-marble/gen.py` was the biggest time saver.** Existing generators are
  valuable templates.
- `overcast` beat `neutral` for judging color on satin, where the neutral panel reflections wash
  out half the plane.
- Wanted: a compile-time or shader-size readout (now the first-view time), and guidance on safe
  noise nodes for deep texcoords (documented).

**Guide corrections**

- Half-integer seeds in herringbone-marble didn't produce zeros. The cookbook note is now softened.
- **Add edge eases to the surface; don't multiply them into it.** Multiplying left joints above the
  blocks where the waviness is negative. **Documented.**

**Renderer bugs:** renderer bug 6, new: `noise2d` compile-time blowup. The screenshot-timeout issue
was a CLI bug, now fixed.

## reclaimed-pine

**Result:** the brief was rich and the geometry is correct, but the wood reads as smooth plastic at
closeup, and the dents read cartoonish. It's the weakest of round 3, along with basketweave.

**Friction**

- **Intermittent "Instance dropped in popErrorScope" failures** and a stability timeout on `--channel`
  for big graphs. Likely WebGPU device loss under contention. **Fixed:** `render` retries once on
  transient GPU errors.
- **Downscaled contact sheets showed a false vertical grid.** Viewing artifacts cost 2 renders.
  Wanted: a 1:1 `--crop` inspection option (open).
- **Pixel ↔ UV mapping is easy to get wrong** (v points up). The printed min/max UVs helped. Wanted: a
  UV gridline overlay (open).
- **Bowl dents (1−t²) read as domes under bridge.** A crisp rim with a flat floor
  (1 − smoothstep(t, 0.45, 1)) reads as a dent. Add this to the pits recipe.
- **A color-only traffic path disappears under per-board variation.** Wanted: guidance on how strong
  large-scale wear must be relative to per-element variation.
- **Variable-width rows:** the random-length plank trick works along V too; worth a note.
- Wood grain guidance is missing (fourth agent to say so): rings as cylinders around an offset pith,
  on-surface frequency vs |∇r|, and moiré limits.

**Renderer bugs:** the popErrorScope crash is unsure, probably harness or contention; retry now
handles it. No MaterialXLoader shading bugs.

## oak-plank

**Result:** the most photographic wood of the round: cathedral figure, pore dashes, clean
micro-bevel.

**Friction**

- **Slow compiles were the biggest time sink** (60 s timeouts, then 30 s screenshot timeouts). The
  new warning pointed it to AUTHORING §6 mid-session, and the `fractal2d` swap cut the first view
  from 59 s to ~6 s.
- **`--channel` still compiled slowly** (52–147 s) after the swap. Suspected: worley and cellnoise on
  layout coordinates. Added to renderer bug 6.
- **`--timeout` and `--uv-scale` were found only via `--help`.** Both are now in AUTHORING §1.
- **The cookbook plank recipe can't guarantee stagger.** It shipped a two-phase variant (odd rows
  shifted half a segment, window w < 0.5): lengths S(1 ± w), minimum stagger S(0.5 − w). The
  stagger vs length-range tradeoff forced 0.70–1.70 m instead of the brief's 0.6–1.8 m.
- **"Cap grain frequency" had no recipe.** It derived the local ring frequency analytically and faded
  the figure to its mean above 45–90 lines/m; fine grain is carried by pores and stretched noise,
  which only speckle. No totem moiré. **Worth a recipe.**
- **Knots:** contours of a phase bump read as bullseyes. Deflecting the across-grain coordinate,
  y' = y − qy·1.6r²/(ρe² + r²), makes the grain flow around the knot.
- **`mx.py` wrote `extract index=1` as a float.** **Fixed:** `index`, `type`, and interval params
  are now integers. `check` didn't flag it (logged as a validation gap).

**Renderer bugs:** bug 6 extended to worley and cellnoise (likely); `extract` float index passes
validation (tooling).

# Round 4: wall panelling

## acoustic-slat

**Result:** 5 minutes, the fastest material in any round. Every render was 2–13 s, with no compile
problems.

**Friction**

- **The `wood.md` frequency fade erases straight or rift grain** (the ring frequency is constant, so
  it fades everywhere). It used stretched fractal lines (~380:1), which speckle instead of aliasing.
  Wanted: a straight-grain note in wood.md.
- **`mx.std(extra=...)` crashed on a new output.** **Fixed:** `extra` accepts a node Ref and creates
  its graph output.
- **No guidance for channels deeper than they are wide.** It used a ramp plus AO-style albedo
  darkening. **Documented** in AUTHORING §5.
- Felt texture: blobby noise read as camouflage, and two strand angles as crosshatch. Three angles at
  low contrast worked.

**Guide corrections:** lower `specular` (~0.2) for felt and velvet, or grazing Fresnel sheen shows.
**Documented** in AUTHORING §2.

**Renderer bugs:** none. Bugs 1 and 5 were routed around as documented.

## fluted-walnut

**Result:** 6 minutes, 3 iterations. The flutes read as smooth gradients with no stripes or steps,
and the figure shifts with the cut depth.

**Friction**

- **Cove wall slope vs the budget.** A 20 × 4 mm circular cove has a 43.6° arris wall, but it rendered
  cleanly with a ~6 px ramp. **Documented** in AUTHORING §4 with the asin(w/R) rule.
- **The wood frequency fade ignores relief.** Where flutes cut the board, rings cross faster. It added
  the flute slope (pith depth × dh/dx) to ∇R. Wanted: a wood.md note.
- **`--center` on full `plane` just shifts the 1 m square** into padding. **Documented.**
- **Room scale:** 22 mm flutes at `--uv-scale 4` are ~4.4 px apart, near moiré, and the 3 mm reveals
  vanish. Wanted: guidance on judging periodic relief at room scale (open).

**Guide corrections (wood.md):** relief raises the local ring frequency; add its slope to ∇R. Taper
sets cathedral spire spacing (≈ λ/taper): ±4% makes spires ~5 cm apart that read as beads, so ±5%
with more wobble suits veneer.

**Renderer bugs:** none.

## shaker-panel

**Result:** 6 minutes. The 8 mm steps read clearly as 3D, with satin enamel, brush marks, and nibs.

**Friction**

- **A crisp square step needed ~63°, past the 45° guideline, and rendered cleanly** with a 4 mm ramp
  (~10 px at closeup). **Documented:** steep edges are fine when the ramp is ≥ ~10 px.
- **Per-cell seeds put tone steps mid-member,** because frame-and-panel members cross panel-cell edges.
  **Documented:** seed per member.
- **`--center` shifts the whole plane** (also reported by fluted-walnut). **Documented.**
- **No raised/recessed panel-step recipe** (cubic smooth-min arris plus quadratic smooth-max fillet).
  Wanted in layouts.md. `mx.py` lacked `smin`. **Fixed:** `smin` added.

**Renderer bugs:** none. The graph is shallow, and the first view took under 5 s.

## beadboard

**Result:** 8 minutes, with "almost no friction". The guide, `mx.py`, and the reclaimed-pine
generator as a template made it quick. The beads read as rounded half-rounds under sun.

**Friction**

- **Recipe files overflow `cat`** in tool output. It used `grep '^#'` and `sed` ranges. Wanted: a
  heading index per file or a way to fetch one section.
- **`--center` shifts `plane` in mixed-view sheets** (third agent to say so).
- **Faint grain relief running along V is hard to judge** under sun/bridge. It added sheen and color
  terms. Wanted: a "subtle relief visibility" row for paint-telegraphed features.

**Wanted recipes:** a 1-D moulding profile (bead via `sqrt(max(R²−t²,0))−R`, 45° quirk wall, `smax`
fillet, `smin` arris, flat-slot floor), for wainscot, reeded glass, and flutes; and `sin(πx/L)`
bows that are 0 at the boundary, for per-board unevenness.

**Renderer bugs:** none.

## bookmatched-veneer

**Result:** 8 minutes. Exact mirror symmetry at every seam (mean |L−R| 0.000; the best mirror axis
lands exactly on the seam pixel). Fiddleback chevrons shimmer via a fibre-tilt pseudo-normal on the
base layer only, while the coat gets the true surface normal.

**Friction**

- **No docs on layered shading.** A per-leaf sign flip of relief has to be continuous at the seams,
  or a seam line appears. Wanted: "base normal ≠ coat normal for chatoyance" and the "continuous at
  seams" rule.
- **No built-in symmetry check.** It wrote a PIL script to diff a channel PNG against its mirror.
  Wanted: a `--channel` mirror diff, or a tip (open).
- **Anisotropy and coat support is unclear from `mtlx nodes standard_surface`.** It had to read
  MaterialXSurfaceMappings.js, and found **renderer bug 8** (`specular_rotation` units).

**Wanted recipes:** lacquered wood (coat + `coat_normal` from the true height, base normal from
height plus fibre pseudo-height); book-match with the flitch coordinate `L − |mod(x, 2L) − L|`
(4 nodes, exactly symmetric).

**Renderer bugs:** bug 8, new: `specular_rotation` is missing ×2π and may rotate twice (likely,
source-verified against the reference).

## board-batten

**Result:** 9 minutes. The 19 mm battens with caulked 55° sides read clearly in 3D.

**Friction**

- **`mx.py` `smax(0, 0, k)` returns k/4,** which ghosted a sparse drip mask over 35% of the wall.
  `--channel` caught it. **Documented** in the docstring: use `max` for masks.
- **No guidance on large height steps.** It integrated a smoothstep slope to get a 55° face over
  ~17 mm, and it renders cleanly. **Documented** in AUTHORING §5, with the width formula.
- **Raised elements over a cupped base creased** when added on top. `H·m + h_base·(1−m)` fixed it.
  **Documented.**
- **Shadow-side ramps pick up a maroon tint under bridge** (brick in the HDR). Not visible under
  neutral or sun.
- **A `--channel` call "printed no stats":** a grep issue. Vector channels print `r:`/`g:`/`b:`.
  **Documented.**
- "V is up in plane views" wasn't stated. **Documented.**

**Renderer bugs:** none. The bug-6 workaround kept the first view at 1–6 s.

## shiplap-whitewash

**Result:** 13 minutes. At `--uv-scale 3` it reads as a real shiplap wall: staggered boards, grain
breaking at joints, and per-board wash variation.

**Friction**

- **`--channel height` compiled in 54 s,** against 8–16 s for normal views. **Root cause: my channel
  tooling.** The exact inverse-sRGB nodes read the channel source ~9 times, and renderer bug 7 (no
  node sharing) duplicated the whole graph each time. **Fixed:** a single-reference conversion,
  `pow((v+0.055)/1.055, 2.4)`, exact above 4% of the range and within 0.011 below. The same render
  now takes 4 s.
- **Which pixel size do FMAX and pixel limits target?** `render.sh` uses `-s 512 --supersample`,
  which is effectively 1024 px. Wanted: a line in the moiré-cap recipe (open, for the cookbook).
- **The moiré cap has no view input,** so FMAX trades closeup detail against plane aliasing (inherent
  without an LOD node).
- **Near-white stains:** `neutral` blows out at `-e 0`, bridge and sun turn it yellow, and overcast
  reads cool. `neutral -e -1` worked (already documented for albedo above 0.6).
- **Wanted recipes:** rough-sawn kerf marks (zero-crossing groove of stretched noise,
  `1 − smoothstep(|n|, 0, 0.22)`); the 0.618 row-shift snippet; knot offsets scaled by board length;
  a pine latewood profile.

**Renderer bugs:** none new. The slow channel compile was the tooling amplifying bug 7, now fixed.

## barnwood-wall

**Result:** strong weathered relief, checks, rusty nails with bleed, and paint remnants. The 5 cm
`detail` view is still a bit painterly.

**Friction**

- **Compile time was the biggest cost:** a 3.4M expanded graph took 320 s. Fixes brought it to 0.4M
  and 13 s: `|n−j|` and `(n+j)/2` instead of min/max of a joint pair, a single read of the ring
  phase, and no noise on R. **Fixed:** `render` now prints the expanded size and the worst re-read
  nodes above 0.3M. Also documented in AUTHORING §3.
- **The cookbook plank and variable-width snippets use min/max,** reading each joint twice. Fix in
  the cookbook (pending).
- **`sun` lights from +U, not from above,** so horizontal-board ridges read weakly under it.
  **Documented.** Wanted: per-preset directions, or a plane rotate option (open).
- **Noise-contour checks zigzag across lattice rows.** Per-band slits (quantized across-grain coord
  plus wobble, random presence along U) give straight tapered checks. Wanted as a recipe.
- **"The two-view `--channel` wrote no PNG":** couldn't reproduce. A `.png` output writes a contact
  sheet. It did reveal the **EPIPE crash when piping to `head`**, now **fixed** (quiet exit).

**Renderer bugs:** bug 7 confirmed again, with a dramatic timing table.

# Round 5: concrete rerun (same briefs as round 1)

## smooth-cast (r5)

**Result:** 7 minutes, 7 iterations, 14 renders; the graph is 139 nodes (expanded 857). "Very little
friction." The pits and crisp-rim recipes transferred directly. `--channel` min UV aimed `--center` at
the deepest bug hole.

**Friction**

- **Bug holes need `1 − smoothstep(t, 0.68, 1)` plus strong floor AO.** The round-pits bowl reads as
  soft dimples.
- **Unrotated high-frequency `noise2d` (420–1400/m) gives a woven, canvas look.** Rotating the
  texcoords reduces it. Gotcha 6 mentions only the "< 40 cells in view" case.
- **fBm mottle at room scale looks like "Photoshop clouds".** Wanted: a concrete-mottle note (drift +
  patches + pour/lift structure).
- AUTHORING §2 says to start from `smooth-cast`, which conflicts with this round's rule. It's fine
  in general.

**Renderer bugs:** none.

## broom-finish (r5)

**Result:** 9.5 minutes, against 33 in round 1. Wavy overlapping striations in 35 cm passes, a clean
saw cut with AO, and a compact graph (expanded 8.2k).

**Friction**

- **Still chained an edit and a render with `;`,** giving 3 stale renders (the guide warns about this;
  a habit, not a doc gap).
- **No chipped-arris recipe:** threshold-widening made rectangular notches.
- **The per-pass angle wander (±4°) is invisible at 1 m.** It can be verified only via
  `--channel h_broom`.
- **No rule for anisotropic features near the pixel limit:** strokes 1–2 px across but long along U
  read fine.

**Guide corrections**

- **Band cross-fade recipe:** two half-offset band lattices, `smoothstep(tri, 0.3, 0.7)`, normalized by
  `sqrt(w0²+w1²)`. This keeps contrast through overlaps and beats fading height at borders.
- Nested material folders reach `mx.py` via `../../tools`.
- The cookbook §3 CLI sample still uses `cli=...; node $cli` (inconsistent with AUTHORING).

**Renderer bugs:** none.

## polished-floor (r5)

**Result:** 9.5 minutes, against 39 in round 1. Expanded graph 2.3k; first view 4–5 s.

**Friction**

- **Grinder swirls built from polar coords came out as bullseyes.** Wanted: a swirl or arc recipe
  (partial arcs with an angular gate, hide the atan2 seam).
- **The "angular stones" recipe packs like terrazzo.** Lump noise on the `R − F1` term gives fractured
  outlines. Worth a line.
- **Neighboring stones with a fixed F2−F1 gap read as one cracked stone.** Lower the presence.
- **Worley sand grains look like bubbles at `detail`.** Wanted: a sand-speckle-in-paste recipe.
- **Mid-roughness (~0.2) gloss is hard to judge on the sphere.** Wanted: a sharp high-contrast
  environment preset, or expected-look guidance (open).
- **`--center` near tile edges shows off-tile padding** (no clamp or wrap). Worth a docs line.

**Renderer bugs:** none.

## white-precast (r5)

**Result:** 10 minutes, against 26 in round 1. Most iterations went on getting the closeup to read
as stone rather than paper.

**Friction**

- **Sand of 0.5 mm or less averages away at closeup under `--supersample` (0.39 mm/px).** A sparse
  0.8–1.6 mm grain layer gave the stone read. Wanted: a sand/stucco/etched-stone recipe (second agent
  to ask, after polished-floor).
- **F2−F1 plateau grains look like Voronoi pavement, and sharp-rim F1 plateaus look like bubbles.** Domes
  plus a grain-scale vector3 warp fixed it.
- **The zsh `cli=...` variable failed again**, before it saw the guide's warning.
- **The `--channel` min UV → `plane:0.015 --center` workflow** was the fastest way to verify a
  pinhole. Good.
- **Whether `detail`/`closeup` honor `--center` was unclear.** They do (width < 1 m); it may have
  mis-aimed. Wanted: a density-per-m² table for sparse worley thresholds.

**Renderer bugs:** none. A faint grid at `--uv-scale 4` is likely sub-pixel worley aliasing.

## bush-hammered (r5)

**Result:** 11.5 minutes, against 28 in round 1. A dense angular chip field with fractured aggregate.

**Friction**

- **zsh variable trap again** (third r5 agent). The guide warns about it, but agents still try it
  first.
- **`--channel roughness_out` failed:** only node names worked. **Fixed:** `--channel` now also
  accepts nodegraph output names.
- **Dashed hairline seams at `detail`** took 4 renders to isolate. They vanished at jitter ≤ 0.75.
  Likely F2 from the 3×3 search at high jitter, which the reference shares.
- **Stones in deep relief drew dark outline rings.** Use a wider height ramp than the color ramp.
- Color-only round F1 sand reads as printed decals. Polygonal F2−F1 cells at low opacity look like
  crushed grains.

**Guide corrections:** add a gotcha: for F2−F1 relief judged at `detail`, use jitter ≤ 0.75.

**Renderer bugs:** F2 seams at jitter 0.88–1 (likely; probably matches the reference's 3×3 search).

## cmu-block (r5)

**Result:** 11 minutes, against 32 in round 1. Used subway-gloss/gen.py as a template.

**Friction**

- **`neutral -e 0` makes a 0.3 albedo look near-white.** It needed `-e -1` even for mid-grey.
- **Recessed concave joints read as raised beads under bridge and sun** until baked AO darkened the
  mortar. Recessed or tooled joints need the deep-channel AO treatment.
- **F2−F1 plateau sand looks like crazed plaster.** Two rotated layers of separate F1 domes read as
  packed sand. Wanted: a packed-grains recipe (third request for sand/grain recipes in r5).
- **Round (1−t²) pits look lunar on porous concrete.** A flat floor on warped coords plus strong AO
  reads as voids (the same finding as smooth-cast r5).
- **Thresholded fBm at 220/m made ink-blot worms.** Higher frequency plus a wider threshold fixed it.

**Guide gaps:** a packed-grains recipe; on dry-cast concrete the void read is mostly albedo AO; an
`mx.py` `remap01` default per noise type.

**Renderer bugs:** none.

## weathered (r5)

**Result:** 12 minutes, against 21 in round 1. The graph is compact (expanded 716).

**Friction**

- **`--channel base_color` failed** (graph output name). **Fixed** during this round: output names
  now work.
- **Per-cell `style=1` color on granular fill tiled into a Voronoi mosaic.** Tint only the grain dome
  and keep a neutral matrix. The palette recipe should warn about this.
- **Tapered zero-contour streaks ended in "grass-blade" points.** For soft stains, fade intensity
  together with the threshold. Threshold-only taper is right for cracks.
- **Worley F1 spalls stay round** until the edge jitter is about 1/3 of the radius.
- **Wanted:** a rain-streak/drip recipe (zero contours of `|noise(uv·(fu, fv))| < w·presence` on a
  u-warped texcoord).

**Renderer bugs:** none.

## cracked-slab (r5)

**Result:** 12 minutes, against 17 in round 1. Long meandering cracks with dirt fill and chipped lips,
plus hairline cracks that T-junction, stains, and scuffs.

**Friction**

- **The Voronoi crack recipes produce uniform crazing,** not "a few long cracks". It needed a rotation
  and 1.7× stretch (to break the 120° Y-junctions), ~1 cell/m, and presence at ≤ ½ the cell frequency.
  Wanted: a sparse structural-crack recipe. This would have saved ~4 iterations.
- **Sparse features can miss the 1 m tile entirely.** Shift the noise offset by f·Δu to bring one into
  view. Worth a note.
- **Printed-looking masks:** a `style=1` per-grain palette reads as mosaic once grains are ≥ 6 px (third
  agent to say so). A 4-octave grime threshold reads as blurry blobs; 6 octaves plus speckle fixes it.
- **Smooth tide lines look cartoonish.** Crisp ones (0.2–0.212) gated by presence look right.
- True distance in cells on stretched coordinates needs a mean scale factor to convert to meters.

**Renderer bugs:** none.

## board-formed (r5)

**Result:** 12 minutes, against 38 in round 1. Pine imprints with cathedral grain, knots, kerf marks,
seam fins, and tie cones. The expanded graph is 18.8k.

**Friction**

- **One knot per board is too sparse for boards over ~0.5 m;** the 1 m tile had none. It moved to
  per-cell knots every 0.4 m with a windowed deflection. The wood.md knot recipe should say so.
- **Knots from deflection plus a core alone read as stains.** Explicit noise-wobbled swirl rings fix
  it, but perfect rings look like a bullseye. Wanted: a knot-swirl snippet.
- **The pine fade (1.4 factor, 85–170 lines/m) erased visible 7–11 mm rings.** 150–230 without the
  factor stayed moiré-free.
- **The closeup looked flatter on its own than in a sheet,** but the numbers were identical (a viewing
  illusion; cost 3 renders).
- **Wanted in `mx.py`:** standard `add`/`mul`/`mix`/`ss`/`rnd` wrappers that pass `**kw` through.
- **Wanted:** an imprint recipe (concrete takes the negative of the wood height; fade grain to 0
  inside joint fins).

**Renderer bugs:** none.

## exposed-aggregate (r5)

**Result:** 16 minutes, against 31 in round 1. Rounded warped pebbles in a 6-color palette, with
crevice AO. It took the most iterations of round 5 (15).

**Friction**

- **The cookbook's domed-pebbles recipe gives faceted, cell-shaped stones at `detail`.** Smooth
  alternative: `max(1−(F1/R)², 0)·smoothstep(F2−F1, 0.04, 0.28)`; a wider gate creases the domes.
  Finding this cost ~7 iterations.
- **Two worley layers for mixed sizes left crescent slivers.** Vary R per stone instead.
- **Neighboring `style=1` float ids are correlated (2×2 clusters),** so `fract(id·k)` palettes give
  same-colored neighbors that read as split stones. Fix: mix in the vector3 style-1 `.z`. (Possibly
  inherent to the reference hash; unverified.)
- Masks reading the negative side of the stone field need constant R and gap, or they jump at cell
  borders.

**Renderer bugs:** none. A suspected "jitter ignored" was ruled out by a repro.

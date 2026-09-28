# Report: teaching agents to author procedural materials

**Question:** can AI agents author photorealistic, fully procedural MaterialX materials with the
`mtlx` tools, and how much do better docs and tooling help?

**Method:**

- Over five rounds, 43 agents built 43 materials; one more was built by hand.
- Each agent reported what slowed it down, what was wrong in the docs, and any renderer bugs.
- Between rounds, that feedback went into the guide, the cookbook, and the `mtlx` CLI.
- Three research agents mapped the noise nodes.
- Four cookbook agents turned the findings into verified recipes.
- Round 5 reran the round-1 briefs word for word, to measure the gain directly.

## Results

**Same briefs, 2.4× faster.** Round-5 agents took a mean of 12.2 minutes per material against 29.4
in round 1, on identical concrete briefs. Tool calls and iterations stayed about the same (46 → 44
calls, 7.0 → 8.2 iterations). The gain is that each iteration became cheap, not that agents
iterated less:

- **Renders:** 2–20 s for several views, against 1–3 min per view in round 1.
- **Checks:** numeric, instead of visual guesses.
- **Recipes:** verified, so they usually work on the first try.

Details are in [ROUND_COMPARISON.md](ROUND_COMPARISON.md).

| Round | Subject                   | Mean time | Median                                             |
| ----- | ------------------------- | --------- | -------------------------------------------------- |
| 1     | Concrete                  | 29.4 min  | 31 min                                             |
| 2     | Kitchen backsplash tiling | 16.4 min  | 16.5 min                                           |
| 3     | Wood flooring             | 19.3 min  | 14.5 min (three agents lost time to slow compiles) |
| 4     | Wall panelling            | 10.2 min  | 8 min                                              |
| 5     | Concrete rerun            | 12.2 min  | 12.5 min                                           |

**Quality.** Geometry is now reliable. Exact tilings came out right, often on the first try, and
agents verified them numerically:

- hexagons, herringbone, and chevron;
- fish scales and basketweave;
- book-matched mirror leaves;
- random-length planks with guaranteed stagger.

Mouldings, battens, flutes, and panel steps read as real 3D. Round 5 beats round 1 on three of nine
briefs, matches it on five, and is mixed on one (exposed-aggregate: nicer stones, but sparser packing
than asked).

**Where agents still struggle.** These are organic micro-textures near the pixel limit:

- sand grains finer than about 0.5 mm, which average out at a 20 cm view;
- the painterly look of wood at 5 cm;
- concrete mottle that reads as "Photoshop clouds" at room scale.

The underlying limit is that the renderer has no LOD or derivative node, so detail can't fade by
pixel footprint.

## What moved the needle

Ranked by the time saved, according to the agents' own reports:

1. **One browser session per render, with named views** (`render --view plane closeup detail sphere
totem`). One compile renders every view, and plane views are head-on at exact metric widths.
   This removed the biggest round-1 cost.
2. **`--channel <node>` with statistics.** It shows any node unlit and prints min, p5, mean, p95, and
   max, with the UVs of the extremes. Agents stopped guessing heights and masks, and used the
   printed UVs to aim `--center` at features. Six agents asked for it in round 1.
3. **The noise cookbook.** Three explorer agents measured the noise nodes: ranges, feature sizes,
   worley outputs, a clipping rule, warp limits, and a slope budget in degrees. Cookbook agents then
   turned this into 73 verified recipes across eleven topic files. Every snippet is checked to
   appear verbatim in a test material that builds, checks, and renders.
4. **Lighting presets:**

   | Preset          | Use                |
   | --------------- | ------------------ |
   | `bridge`        | relief             |
   | `sun`           | harsh relief       |
   | `neutral`       | albedo (R = G = B) |
   | `overcast`      | general read       |
   | `strips`        | gloss              |
   | `dusk`, `night` | darker settings    |

   The original studio light hid about 75% of the relief contrast.

5. **Compile-time visibility:** `render` prints the first-view time and warns when the expanded
   shader graph passes 0.3M nodes, naming the nodes that are read repeatedly. This turned
   5-minute compiles into a one-line fix.
6. **Stricter `check`:** running `--rules basic structure types unused` exposed a real type error
   that the example assets had taught to agents.
7. **Smaller fixes:**
   - per-agent scratch directories;
   - `--uv-scale` for room-scale checks;
   - `mtlx nodes` with renderer notes;
   - `--grid`, `--crop`, and `--mirror` for inspection;
   - an EPIPE-safe CLI;
   - retries on transient GPU errors;
   - `submodules/mtlx-sample-library/materials/ai_authored/tools/mx.py`, a small node-writing helper that most agents adopted.

## Renderer bugs found (three.js MaterialXLoader)

Full repros, source locations, and suggested fixes are in [RENDERER_BUGS.md](RENDERER_BUGS.md).

| #   | Bug                                                                                                               | Status                             | Impact                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `heighttonormal` degenerate threshold is `1e-12` (reference `1e-16`), so normals are flat at real-world UV scales | confirmed                          | every material needs a millimetre workaround                                                                                                       |
| 2   | `noise2d`/`fractal2d` vector2 return the same value in x and y                                                    | confirmed                          | domain warps only move along the diagonal                                                                                                          |
| 3   | `noise3d`/`fractal3d` vector2: the same problem                                                                   | confirmed                          |                                                                                                                                                    |
| 4   | vector4/color4 noise takes the float path                                                                         | confirmed (2D), likely (3D)        |                                                                                                                                                    |
| 5   | coarse `dpdx`/`dpdy` in WGSL, so 2×2 blocky normals                                                               | likely                             | "+" and stair-step artifacts                                                                                                                       |
| 6   | `noise2d` on deep texcoord graphs compiles exponentially slowly                                                   | confirmed timing                   | up to 177 s per view                                                                                                                               |
| 7   | **nodes read by several consumers are rebuilt per consumer instead of shared**                                    | confirmed timing, likely mechanism | **largest cost**: 290 nodes expanded to 1.7M, and one barnwood graph took 320 s to compile until re-reads were removed. Probably the root of bug 6 |
| 8   | `specular_rotation` is missing ×2π and may be applied twice                                                       | likely (source read, not rendered) |                                                                                                                                                    |

Tooling gaps found in mtlx-core and the CLI, most now fixed:

- `check` ran only `basic` rules by default.
- No unused-node lint existed.
- Integer inputs accept floats.
- Unknown type variants pass validation.

## Artifacts

- **Library:** the materials live in `mtlx-sample-library` under
  [`materials/ai_authored/`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/), whose README has galleries of the 34 materials from rounds 1–4,
  plus the 10 round-5 reruns (the `*-r5` folders). Most materials have a `gen.py` next to them that regenerates the
  file.
- **Guide:** [AUTHORING.md](AUTHORING.md) covers workflow, tools, conventions, the slope and pixel
  budget, realism rules, renderer facts, and the acceptance checklist.
- **Cookbook:** [NOISE_COOKBOOK.md](NOISE_COOKBOOK.md) plus the topic files in
  [cookbook/](cookbook/). The research behind it is in [noise-lab/](noise-lab/).
- **Feedback:** [AGENT_FEEDBACK.md](AGENT_FEEDBACK.md) holds every agent's report, a status ledger
  per round, and the raw metrics.
- **Tooling:** in this repository (`packages/cli`, `packages/core`, `packages/viewer`):
  - `render --view --channel --center --uv-scale --grid --crop --mirror --supersample`;
  - `--ibl` presets;
  - `mtlx nodes`;
  - `check --rules unused`;
  - matching MCP tool options.

## Lessons

- **Measure, don't eyeball.** The biggest single gain was letting agents read numbers from the
  renderer. Numeric checks caught geometry bugs in one render that visual review missed across
  several.
- **Feedback compounds.** Each round's top request, once fixed, disappeared from the next round's
  reports:
  - round 1: multi-view render and channel view;
  - round 2: tiling recipes;
  - round 3: wood grain and cookbook size;
  - round 4: compile blowups.
- **Verified recipes beat prose.** Agents copied working generators and cookbook snippets far more
  reliably than they applied general advice. Several of the worst time sinks came from following a
  subtly wrong recipe (the domed pebbles, the vector2 warp).
- **Agents find real renderer bugs.** Seven of the eight bugs came from agents noticing that
  something "should" have worked, then isolating it with the channel tools.
- **Ceiling:** without an LOD or derivative node, sub-pixel organic texture remains the hardest
  thing to make photographic.

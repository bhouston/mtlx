# Noise cookbook for procedural MaterialX

A working reference for noise in the mtlx preview renderer (three.js r186 MaterialXLoader): the facts, rules of thumb
and recipes. This page is the entry point: cheat sheet, gotchas and pixel limits. The recipes live in topic files under
[`cookbook/`](cookbook/), each small enough for one Read. The evidence is in [smooth](noise-lab/smooth/FINDINGS.md),
[cellular](noise-lab/cellular/FINDINGS.md), [composition](noise-lab/composition/FINDINGS.md) and
[RENDERER_BUGS.md](RENDERER_BUGS.md). It follows the [AUTHORING.md](AUTHORING.md) conventions: UV 0..1 = 1 m, f in
features per metre, and heights in metres.

Every snippet is quoted verbatim from a fragment in `noise-lab/cookbook/gen/s/` that passes
`check --strict --rules basic structure types unused` and renders in a test material in
[`noise-lab/cookbook/`](noise-lab/cookbook/) (`cookbook_*.mtlx`, contact sheets `*.avif`). `gen/mkmd.py` regenerates all
of these pages and refuses a snippet line that isn't in a built material.

**Using the snippets.** Each snippet's first comment names its inputs and outputs. `uv` is
`<texcoord name="uv" type="vector2" />`, `uv_sep` is its `separate2`, and `h_*` outputs are heights in metres. Names are
unique across snippets (except drop-in alternatives such as the two plank layouts), so paste several, sum the `h_*`
terms into `height`, and finish with [height to normal](cookbook/noise.md#height-to-normal-always-last).

## Recipes

One line per recipe; each file is a single Read.

**[cookbook/noise.md](cookbook/noise.md)**: smooth-noise building blocks.

- [Height to normal](cookbook/noise.md#height-to-normal-always-last): the millimetre `heighttonormal` chain; always last.
- [Decorrelated layers](cookbook/noise.md#decorrelated-layers): a private frequency and offset per layer.
- [Remap to 0..1](cookbook/noise.md#remap-to-01): full-contrast remaps of noise2d, fractal2d and unifiednoise2d.
- [Domain warp](cookbook/noise.md#true-2d-domain-warp-vector3): a true 2D warp from vector3 noise, within the fold limit.
- [Anisotropic stretch](cookbook/noise.md#anisotropic-stretch): streaks from per-axis frequencies.
- [Ridged and billow](cookbook/noise.md#ridged-and-billow): crests and puffs from |fBm|.
- [Terraces](cookbook/noise.md#terraces): stepped height with a wide riser.
- [Layering with a slope budget](cookbook/noise.md#height-layering-with-a-slope-budget): macro, meso and micro relief.
- [Cavity and wear masks](cookbook/noise.md#correlated-cavity-and-wear-masks): colour and roughness from the height field.
- [Smooth max](cookbook/noise.md#smooth-max): a filleted union (and smooth min).
- [Finite differences](cookbook/noise.md#finite-difference-derivative): the slope of any chain, and a fold test.

**[cookbook/cellular.md](cookbook/cellular.md)**: worley and cell ids.

- [Pits and specks](cookbook/cellular.md#round-pits-and-specks-never-clipped): round pits that never clip (bug holes: see voids).
- [Palette](cookbook/cellular.md#per-cell-id-and-palette): per-cell colour and brightness (terrazzo); same-coloured neighbours are chance.
- [Pebbles](cookbook/cellular.md#domed-pebbles-smooth-min-plus-crown): domed pebbles in a matrix (faceted at `detail`).
- [Stones](cookbook/cellular.md#angular-stones): angular stones with an edge ramp; lump noise for fractured outlines.
- [Chips](cookbook/cellular.md#faceted-chips): faceted chips from two cone layers.
- [Tapered cracks](cookbook/cellular.md#cracks-with-taper): cracks that narrow to points, with the hairline gate.
- [Flagstones](cookbook/cellular.md#flagstones-or-crazy-paving): crazy paving on a warped texcoord.
- [Sparse features](cookbook/cellular.md#sparse-features-never-clipped): sparse, unclipped features.
- [True-distance cracks](cookbook/cellular.md#true-distance-cracks-and-t-junctions): fixed-width cracks and T-junctions.

**[cookbook/aggregate.md](cookbook/aggregate.md)**: grains, pebbles and voids (concrete, stucco, stone).

- [Packed sand](cookbook/aggregate.md#packed-sand): two rotated layers of F1 domes, tinted on the domes only.
- [Coarse grit](cookbook/aggregate.md#sparse-coarse-grit): sparse 0.8–1.5 mm grains, the stone read at `closeup`.
- [River pebbles](cookbook/aggregate.md#rounded-river-pebbles): paraboloid domes with per-stone R, gated at the border.
- [Air voids](cookbook/aggregate.md#air-voids-and-bug-holes): flat-floored bug holes with AO, not bowls.

**[cookbook/weathering.md](cookbook/weathering.md)**: weathering and concrete finishes.

- [Sparse cracks](cookbook/weathering.md#sparse-structural-cracks): a few long structural cracks; true distance in metres on stretched cells.
- [Rain streaks](cookbook/weathering.md#rain-streaks-and-drips): zero contours on a wavering texcoord, fading in intensity too.
- [Grinder swirls](cookbook/weathering.md#grinder-swirls-partial-arcs): partial arcs round jittered centres, atan2 seam hidden.
- [Cross-faded bands](cookbook/weathering.md#cross-faded-bands): two half-offset lattices, RMS-normalised; no seams.
- [Board-formed imprint](cookbook/weathering.md#board-formed-imprint): the negative of the wood, grain faded at the fins.

**[cookbook/layouts.md](cookbook/layouts.md)**: tile layouts and per-tile detail.

- [Grid and running bond](cookbook/layouts.md#rectangular-grid-and-running-bond): stack, half and third bond.
- [Hex](cookbook/layouts.md#hex-two-lattice-nearest-centre): hexagons from two lattices.
- [Herringbone](cookbook/layouts.md#herringbone-90): 90° herringbone.
- [Chevron](cookbook/layouts.md#chevron): mitred chevron from two line families, with a block frame and id.
- [Rounded rectangle and cushion edge](cookbook/layouts.md#rounded-rectangle-and-cushion-edge): exact box distance and a crease-free edge.
- [Hand-cut outline](cookbook/layouts.md#hand-cut-outline-per-corner-randoms-and-per-edge-insets): out-of-square tiles from per-corner randoms.
- [Per-tile reseed and slab coordinates](cookbook/layouts.md#per-tile-reseed-and-slab-coordinates): patterns that break at every joint.
- [Book-match](cookbook/layouts.md#book-match-mirror-flitch-coordinate): the mirror flitch coordinate, exactly symmetric at every seam.

**[cookbook/profiles.md](cookbook/profiles.md)**: panelling profiles.

- [Moulding profile](cookbook/profiles.md#1-d-moulding-profile): bead, V quirk, fillet, arris, slot floor, and cove flutes.
- [Panel step](cookbook/profiles.md#recessed-or-raised-panel-step): recessed or raised panels, with per-member seeds.
- [Batten](cookbook/profiles.md#large-raised-step-batten-or-trim): a 19 mm raised step from the integral of a smoothstep slope.
- [Raised over a varying base](cookbook/profiles.md#raised-element-over-a-varying-base): H·m + h_base·(1 − m).
- [Deep channels](cookbook/profiles.md#deep-channels-and-albedo-ao): ramped profile plus albedo AO.
- [Bows](cookbook/profiles.md#bows-that-vanish-at-the-joints): sin(πx/L) unevenness that is 0 at every joint.

**[cookbook/planks.md](cookbook/planks.md)**: wood-floor layouts.

- [Random-length planks](cookbook/planks.md#random-length-planks): boards Lmin..Lmax, the general formula and the 0.618 row shift; each joint read once.
- [Guaranteed-stagger planks](cookbook/planks.md#guaranteed-stagger-planks): lengths S(1 ± w), joints ≥ S(0.5 − w) apart.
- [Variable-width rows](cookbook/planks.md#variable-width-rows): the plank trick along V.

**[cookbook/surfaces.md](cookbook/surfaces.md)**: marks on a surface.

- [Broom or brushed strokes](cookbook/surfaces.md#broom-or-brushed-strokes): stretched noise as height.
- [Per-band randoms](cookbook/surfaces.md#per-band-randoms): bands with their own stroke angle and pressure.
- [Marble veins](cookbook/surfaces.md#marble-veins): tapered veins, halos and hairlines.
- [Sparse scuffs](cookbook/surfaces.md#sparse-scuffs-and-scratches): separate marks, not a crosshatch.
- [Scoops](cookbook/surfaces.md#paraboloid-dish-scoops): paraboloid dishes for hand-scraped wood and hammered metal.
- [Polar features](cookbook/surfaces.md#polar-features-rays-and-radial-checks): rays and radial checks round a point.
- [Crisp-rim dents](cookbook/surfaces.md#crisp-rim-dents): dents that don't read as domes.
- [Kerf marks](cookbook/surfaces.md#rough-sawn-kerf-marks): rough-sawn band-saw lines and grooves.
- [Wash pooling](cookbook/surfaces.md#translucent-wash-or-stain-pooling): a translucent finish that pools in the valleys.
- [Along-grain checks](cookbook/surfaces.md#along-grain-checks-per-band-slits): straight tapered slits, not noise contours.

**[cookbook/wood.md](cookbook/wood.md)**: wood grain.

- [Knots](cookbook/wood.md#knots-with-deflected-grain): grain that flows round a knot.
- [Growth rings](cookbook/wood.md#growth-rings-plain-sawn-and-quarter-sawn): the cone model for cathedral and straight grain.
- [Earlywood and latewood](cookbook/wood.md#earlywood-and-latewood-profile): the ring profile as a colour and relief mask.
- [Uneven ring widths](cookbook/wood.md#uneven-ring-widths): monotonic phase noise.
- [Moiré cap](cookbook/wood.md#local-frequency-fade-moiré-cap): fade the figure where the analytic ring frequency aliases.
- [Pore dashes](cookbook/wood.md#pore-dashes): open pores along the grain in the earlywood.
- [Ray fleck](cookbook/wood.md#quarter-sawn-ray-fleck): quarter-sawn flecks.
- [Colour and roughness](cookbook/wood.md#wood-colour-and-roughness): white oak, correlated with the figure.
- [Wire-brushed relief](cookbook/wood.md#wire-brushed-and-eroded-earlywood): eroded earlywood and brush scratches.

**[cookbook/grain.md](cookbook/grain.md)**: more wood grain, for panels and finishes.

- [Relief-aware rings](cookbook/grain.md#relief-aware-ring-frequency): flutes and bevels in the moiré cap; taper and spire spacing.
- [Straight and rift grain](cookbook/grain.md#straight-and-rift-grain): stretched fractal lines, no fade needed.
- [Pine latewood](cookbook/grain.md#pine-latewood-profile): the softwood ring profile.
- [Eroded earlywood](cookbook/grain.md#eroded-earlywood-weathered): weathered ridges and troughs.
- [Book-matched figure](cookbook/grain.md#book-matched-figure): fiddleback and ribbon on flitch coordinates.
- [Lacquered wood](cookbook/grain.md#lacquered-wood-two-normals): base and coat normals for chatoyance.
- [Per-cell knots](cookbook/grain.md#knots-along-long-boards-per-cell-knots-and-swirl-rings): a knot every 0.4 m on long boards, with wobbled swirl rings.

**[cookbook/endgrain.md](cookbook/endgrain.md)**: end grain.

- [End-grain ring arcs](cookbook/endgrain.md#end-grain-ring-arcs): ring arcs round an off-block pith, with rays and checks.

## 1. Cheat sheet

**Smooth noise** (signed, mean 0, bell-shaped):

| node                             | extreme      | std                     | 90% of area | 0..1 remap (full contrast)                          |
| -------------------------------- | ------------ | ----------------------- | ----------- | --------------------------------------------------- |
| `noise2d`                        | ±0.97        | 0.32                    | ±0.54       | `amplitude 0.8, pivot 0.5` (~4% clips)              |
| `fractal2d` ≥ 3 oct              | ±1.36        | 0.37                    | ±0.61       | `·0.6 + 0.5` (~2% clips). It has **no pivot**       |
| `fractal2d` diminish d, N oct    | ≈ 3.7·std    | 0.32·√((1−d^2N)/(1−d²)) |             | diminish is the contrast lever                      |
| `noise3d`/`fractal3d` at (u,v,0) | ±0.94 / ±1.2 | 0.25 / 0.29             |             | narrower; the only gain is reseeding via z          |
| `unifiednoise2d` type 0 / 3      |              |                         |             | type 0 = `0.5+0.5·noise2d`; for type 3 see gotcha 5 |

`0.5 + 0.5·n` (the old AUTHORING advice) spans only 0.23..0.77 over 90% of the area. Octaves past 3 add detail, not
range, and lacunarity changes spacing, not range.

**Feature size:** at f/m, blobs are **≈ 0.7/f across and ≈ 2/f apart**, so for blobs of diameter D use **f ≈ 0.7/D**.
fBm blobs are ≈ 0.35/f and ragged. Threshold at ≥ 0.2 to get islands; at 0 you get a labyrinth. Thresholded noise
makes worms, never round specks (use worley for those).

**Cellular** (`worleynoise2d`; cell = 1/f m; numbers are for jitter 1):

| output            | value                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `float` style 0   | F1: 0..1.16, p50 0.43, p99 0.87 (max 0.90 at jitter 0.5, 0.71 at 0)                                                                                                                                                                              |
| `vector2` style 0 | (F1, F2). **F2−F1 = `dotproduct(w, (-1,1))`** is 0 on borders, max 1.25. `F2−F1 < t` is ≈ **1.3·t/f m** wide (area ≈ 2.4·t)                                                                                                                      |
| `vector3` style 0 | (F1, F2, F3). F3 is wrong on 0.4% of pixels, which shows as rare seams                                                                                                                                                                           |
| `float` style 1   | a **per-Voronoi-cell id**, uniform 0..1, that changes exactly at F2−F1 = 0. Neighbouring ids are independent (measured \|r\| < 0.08); same-coloured neighbours in a palette are chance ([palette](cookbook/cellular.md#per-cell-id-and-palette)) |
| `vector3` style 1 | ids, but `.xy` is the point's jitter offset (correlated with position); use `.z` or the float id                                                                                                                                                 |
| `cellnoise2d`     | uniform 0..1 per **integer square**, so it cuts worley cells in two. Use it for bands and grids                                                                                                                                                  |

The same texcoord and jitter give the same feature points in every variant, so mixing F1/F2 and the id is safe. Float id
≠ vector id.x, so take ids from one variant. F1 at a border ranges from 0.03 to 1.16, so find borders with F2−F1.
The metric is Euclidean. Keep jitter ≤ 1.

**Clipping rule:** a disk of radius r cells around a worley point **never clips if r ≤ (1 − jitter)/2**. At jitter 1,
r 0.1 clips 2% of features and r 0.25 clips 28%. Lower the jitter (0.5–0.7 still looks random) rather than accept
clips. F2−F1 shapes never clip ([cellular §4](noise-lab/cellular/FINDINGS.md)). The rule matters only for features ≥ ~4 px at
the view: tiny pores and specks look better at jitter 0.85–1, where the clipped ones are invisible and lower jitter shows
grid rows.

**Warp limit:** the strength is s = A·f, with A the warp amplitude in metres and f the warp frequency. Keep
**s ≤ 0.2 for `noise2d`, s ≤ 0.1 for `fractal2d`, and ≤ 0.1 per stage when nested**. For a larger displacement, lower
f.

**Slope budget** (height = A·n(f·x), slope in radians). Aim for **2–20° typical and ≤ 30° max** on noise relief.
Contrast is ~1.2 grey levels per degree under bridge; below 0.5° nothing reads, and above 40° you get 2×2 blocks.

| source            | typical                           | max               | A for a 30° max |
| ----------------- | --------------------------------- | ----------------- | --------------- |
| `noise2d`         | 1.2·A·f                           | ≈ 3·A·f           | ≤ 0.19/f        |
| `fractal2d` N oct | ≈ 1.2·√N·A·f (3 oct 2, 5 oct 2.5) | ≈ 7.6·A·f (3 oct) | ≤ 0.075/f       |

Every octave adds the same slope, so the finest octave dominates the shading and aliases first.

**Pixels:** at the farthest view that must look clean, keep **≥ 6 px per wavelength** (λ = 1/f), **lines ≥ 2 px**,
**height ramps ≥ 4 px**, and **smoothstep widths ≥ 1 px**. Per-view numbers are in §3.

## 2. Gotchas and renderer bugs to route around

1. **`vector2`/`vector4`/`color4` noise has all channels equal** (bugs 2–4). This hits `noise2d`, `fractal2d`, `noise3d`
   and `fractal3d`, so a `vector2` warp slides points only along the (1,1) diagonal. **Use `type="vector3"`** (its
   channels are independent), then `convert` to vector2. Its `.x` is bit-identical to the float noise at the same
   texcoord, so offset the texcoord to get a different pattern.
2. **`heighttonormal` needs millimetres** (bug 1). With metre UVs the normal is flat. Use the `normal` snippet (×1000,
   `scale 16`), which gives physically correct slopes. Don't use `bump`, which has the same bug.
3. **`smoothstep` with low > high returns `step(high, x)`**, not an inverted ramp. Invert with `1 − smoothstep`. When a
   mask drives a threshold, floor it (`max(t, 1e-4)`) so that high stays above low.
4. **Smooth noise is exactly 0 at every integer texcoord.** Integer-f layers pinch to 0 together at uv = 0 and on a
   shared grid. Give each layer its own offset, or use lacunarity 2.03.
5. **`unifiednoise2d type=3` is signed, and the defaults clamp half the area to 0** (black holes). Use
   `outmin 0.5, outmax 1, clampoutput false`, or outmax 1.3 for full contrast. For types 0, 1 and 3, `jitter` rotates
   the domain or picks a z slice, so reseed with `offset`. Both behaviours match the reference.
6. **The lattice look** (pinch points, blobs in rows) appears whenever < ~40 cells span the view, at any f. Rotate the
   texcoord ~30°, or average two rotated, offset copies.
7. **Coarse 2×2 derivatives** (bug 5): slopes ≳ 40°, ramps < 4 px and height steps render as stair-steps or dashed
   hairlines. Keep height continuous.
8. **Per-cell randoms jump at borders.** Multiply an id by a profile that is 0 at the border; never add `id·k` to height.
   Pass raw F1 and F2−F1 (which have kinks) through a smoothstep before using them as height.
9. **No LOD:** `fractal2d` evaluates every octave. Cap the finest octave, `f·2^(N−1)`, at the view limit in §5.
10. **Precision:** keep |f·uv + offset| < 1e5, so reseed offsets should be < 1000.
11. **Judging:** bridge tints grey olive, so judge albedo under `--ibl neutral`/`overcast`. Bridge relief along (1,−1)
    reads 4× weaker than along (1,1). Studio shows ~4× less relief. Judge gloss on `sphere`. Dark glossy domes can read
    as pits, so flip the height sign to test.
12. `rotate2d`/`place2d` angles are degrees; a positive amount turns the pattern counter-clockwise.
    `cellnoise2d type="vector3"` works and passes `check`, but it isn't in the mtlx-core registry.
13. **Compile time: `noise2d` on deep texcoords** (bug 6). `noise2d` fed by a layout, a warp or another noise can take
    minutes to compile; `render` prints the first-view time and warns above 20 s. On warped or layout coordinates use
    **`fractal2d octaves=1`** (the same noise, cached input; add the pivot by hand). `worleynoise2d` and `cellnoise2d` are
    probably affected too, so derive extra per-tile randoms as `fract(id·k + c)` instead of one cellnoise each.
14. **Compile time: nodes read twice double the shader.** `mix(c, c·k, m)` reads `c` twice, so a chain of five such tints
    copies everything upstream 32 times; so does mixing one node into four identical quadrants. The loader appears not
    to share a node between consumers. The wood test went from 37 s to ~5 s (tree 1.7M to 0.23M) by writing **`c·mix(1, k, m)`** and
    dropping the quadrant copy. `python3 noise-lab/cookbook/gen/treesize.py f.mtlx` prints the expanded size (1.7M took 37 s;
    0.2–0.6M takes 4–6 s).
15. **Wobble a line before `absval`, never after.** `|d| + jitter` pinches the line to zero width wherever the jitter is
    negative, so it breaks into beads; `|d + jitter|` moves the whole line.
16. **Tapered thresholds leave a hairline** where the distance is exactly 0, even with the `max(t, floor)` guard. Also
    gate the mask by `smoothstep(t, 2·floor, 6·floor)` (the crack and polar recipes do).
17. **F2−F1 relief judged at `detail` needs jitter ≤ 0.75.** At jitter 0.88–1 dashed hairline seams appear, likely
    where the 3×3 cell search misses the true F2 of a far-jittered point (the reference searches 3×3 too). F1-only features
    are unaffected.
18. **Unrotated high-frequency `noise2d` (above ~400/m) reads as woven canvas**, likely its gradient lattice lining up
    with U and V over thousands of cells. Rotate the texcoord (e.g. 31° and −17° for two layers). This is separate from gotcha 6,
    which is about < 40 cells in view.
19. **Sparse features can miss the 1 m tile.** At ~1 feature per metre (cracks, spalls, streaks) the tile may show none.
    Shift the placing noise's offset by f·Δu to slide it Δu metres, and check with `--channel` on `plane`.
20. **Ring-figure fades can be relaxed.** The pine latewood fade now runs over 150–230 true lines/m (no 1.4 factor) and
    stays moiré-free under `render.sh`; the older 85–170 with the factor erased visible 7–11 mm rings. Oak rings (thin,
    high-contrast earlywood) keep the [moiré cap](cookbook/wood.md#local-frequency-fade-moiré-cap) as written.
21. **`materials/ai_authored/tools/mx.py`** is at `../tools` from a material folder:
    `sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools'))`. It has thin
    wrappers `g.add/sub/mul/div/mix/ss/clamp/fract/rnd` that pass `name=` and `comment=` through, and `remap01(g, n)`
    picks the scale from the node (0.6 for `fractal2d`, else 0.8).

## 3. Choosing frequencies and amplitudes for a view

`mtlx render --view plane|closeup|detail|plane:<m>` frames the plane head-on at an exact width. At `-s 512` the pixel
size is width/512; `render` defaults to 800 px (1.25 mm/px on `plane`), so these limits are conservative there.
**`docs/material-authoring/render.sh` uses `-s 512 --supersample`**: it renders 1024 px and downsamples, so for aliasing (moiré, the
ring-fade FMAX) count 1024 px (plane 0.98 mm/px, FMAX ≈ 170/m), while detail finer than 512 px (the table) is averaged
away rather than shown.

| view      | width  | mm/px | min λ at 6 px (max f) | line ≥ 2 px | ramp ≥ 4 px | min visible relief (A ≈ λ/120) | lattice look if f < |
| --------- | ------ | ----- | --------------------- | ----------- | ----------- | ------------------------------ | ------------------- |
| `plane`   | 1 m    | 1.95  | 11.7 mm (85/m)        | 4 mm        | 8 mm        | 0.1 mm                         | 40/m                |
| `closeup` | 0.2 m  | 0.39  | 2.3 mm (430/m)        | 0.8 mm      | 1.6 mm      | 0.02 mm                        | 200/m               |
| `detail`  | 0.05 m | 0.098 | 0.59 mm (1700/m)      | 0.2 mm      | 0.4 mm      | 0.005 mm                       | 800/m               |

The FINDINGS use the old camera: z1 ≈ 2.9, z5 ≈ 0.59 and z20 ≈ 0.147 mm/px, which is `plane:1.5`, `plane:0.3` and
`plane:0.075`. So `plane`, `closeup` and `detail` have **1.5× finer pixels** than z1, z5 and z20. A z1 limit is slightly
conservative for `plane`, and "1–2 px at z5" becomes 1.5–3 px at `closeup`.

1. **Octaves from the finest clean view:** the finest octave is f·2^(N−1). On `plane`, 8/m allows 4 octaves (64/m).
   Detail finer than that pays off only at `closeup`/`detail`, and it must be slope-budgeted so it stays quiet where
   it is 1–3 px.
2. **Amplitude from slope:** pick a typical slope (5° = 0.087 rad), then A = slope/(1.2·f) for `noise2d` or
   slope/(1.2·√N·f) for fBm. Check the max against 30°.
3. **Check each small feature against each view.** A 3 mm crack is 8 px at `closeup` but needs ≥ 4 mm on `plane`. A
   2 mm pit is 1 px on `plane`, so give it colour as well as depth.
4. **Keep ≥ 40 cells across the view**, or rotate the texcoord, when one low-f layer dominates.
5. **Fade what a view can't resolve into roughness or colour.** There is no footprint node, and the composition LOD
   probe relies on bug 1, so it must not ship.

```sh
cli() { node packages/cli/bin/cli.js "$@"; }   # a function: zsh won't word-split cli="node ..."
cli check f.mtlx --strict --rules basic structure types unused
cli render f.mtlx -o out.png --view plane closeup detail --ibl bridge -s 512
cli render f.mtlx -o ch.png --view plane --channel fbm01 --range=0,1   # prints min/p5/mean/p95/max
```

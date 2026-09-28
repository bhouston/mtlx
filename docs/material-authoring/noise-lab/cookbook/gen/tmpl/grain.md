# More wood grain: panels, softwood and finishes

Grain recipes for wall panelling: relief-aware ring frequency, straight and rift grain, pine latewood, eroded earlywood,
book-matched figure, lacquered layering and per-cell knots with swirl rings. The base wood recipes (cone ring model, moiré cap, pores, fleck, colour) are
in [wood.md](wood.md); read that first. Part of the [noise cookbook](../NOISE_COOKBOOK.md). Test materials:
[`cookbook_wood2`](../noise-lab/cookbook/cookbook_wood2.mtlx) (flutes, rift oak, whitewashed and weathered pine; sheet
`wood2.avif`) and [`cookbook_veneer`](../noise-lab/cookbook/cookbook_veneer.mtlx) (book-match and lacquer; sheet
`veneer.avif`); the per-cell knots are tested in [`cookbook_boards`](../noise-lab/cookbook/cookbook_boards.mtlx) (see the
[board-formed imprint](weathering.md#board-formed-imprint)). Harvested from round 4 ([fluted-walnut](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/fluted-walnut/gen.py),
[acoustic-slat](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/acoustic-slat/gen.py), [shiplap-whitewash](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/shiplap-whitewash/gen.py),
[barnwood-wall](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/barnwood-wall/gen.py), [bookmatched-veneer](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/bookmatched-veneer/gen.py)).

The fades here use **FMAX = 170 lines/m**, for `docs/material-authoring/render.sh` (`-s 512 --supersample`, effectively 1024 px across
the 1 m `plane`); see the [moiré cap](wood.md#local-frequency-fade-moiré-cap).

### Relief-aware ring frequency

Where a flute, scoop or bevel cuts into the board, the face dips toward the pith and rings cross it faster. Feed the
cut depth into the pith depth, D + h (so the figure shifts where the cutter went deeper), and add the relief slope to
the ring gradient: **∂R/∂x = (yo + (D + h)·∂h/∂x)/R0**, so f = 1.3·|(∂R/∂x, taper)|/λ. On the test panels the ring frequency is ~20–100 lines/m on the
lands and 280–390 on the flute walls, so the walls fade while the lands keep their figure; the flat-face formula would
let the walls alias.
The slope comes from the profile analytically (`fl_dh` in the [cove flute](profiles.md#1-d-moulding-profile)).

**Taper sets the cathedral spire spacing:** along the board the ring radius grows by taper·x, so arches repeat every
**≈ λ/taper**. ±4% with 5 mm rings gives spires ~12 cm apart that read as beads on a 1 m panel; veneer and panels want
±5% or less plus more wobble, or a smaller taper for longer arches.
@@wood_relief@@

### Straight and rift grain

Quarter-sawn and rift boards show straight parallel lines. The analytic [moiré cap](wood.md#local-frequency-fade-moiré-cap)
cannot help here: the ring frequency is constant, so it fades the figure everywhere (or nowhere). Draw the lines with
**noise stretched ~380:1** instead (`fractal2d` at 380 × 1 /m): thresholded, it gives straight, irregular latewood lines
1–3 mm apart, grouped by a slower field. Noise that is too fine only speckles, it never moirés, so no fade is needed.
Add streaks and pore dashes; feed board-local coordinates, shifted per board, for a private patch per board or slat.
@@wood_straight@@

### Pine latewood profile

Softwoods are the reverse of oak: pale straw earlywood, then an abrupt dark, hard latewood band that ends sharply at the
ring boundary, `smoothstep(t, 0.56, 0.61)·(1 − smoothstep(t, 0.92, 1))`. Fade it to its mean (0.28) where the rings
alias: the latewood line frequency |dR/dy|/pitch fades between **150 and 230 lines/m** (round 5: the older 85–170
with a 1.4 safety factor erased visible 7–11 mm rings, and 150–230 stayed moiré-free under `render.sh`, totem included).
Plantation pine has wide rings (6–11 mm). The recipe carries its own flat-sawn cone and row frame (150 mm rows
along V, grain along U), and exports the phase, pitch and fade for the eroded profile below.
@@wood_pine@@

### Eroded earlywood (weathered)

Weathering removes the soft earlywood deeply and leaves the latewood as narrow rounded ridges. Re-centre the phase on the
latewood, `er_t = fract(phase + 0.24)`, and use `1 − smoothstep(|er_t − 0.5|, 0.15, 0.4)`: a wide trough and a narrow
ridge, 0.15 × ring pitch deep (~1–1.6 mm), faded like the figure. Read the phase once: barnwood's first graph read it
three times and took minutes to compile (bug 7). Lighten the ridges and darken the troughs with the same mask. For a
brushed or sanded floor use the shallower [wire-brushed](wood.md#wire-brushed-and-eroded-earlywood) recipe.
@@wood_erode@@

### Book-matched figure

Veneer leaves are sliced in sequence and opened like a book, so each seam is a mirror line. The
[flitch coordinate](layouts.md#book-match-mirror-flitch-coordinate) `a = L − |mod(u, 2L) − L|` makes any function of
(a, along) exactly symmetric. Fiddleback is noise at 75/m along the grain on a slanted, warped coordinate, so the bands
meet each seam as chevrons, in patches; ribbon stripes are noise across at 22/m. `lq_fib` turns the figure into a fibre
pseudo-height for the lacquer recipe below. The test measured the pseudo-height against its mirror at a seam: at most 1
grey level apart, mean 0.0002.
@@wood_fiddle@@

### Lacquered wood: two normals

Figured wood under a clear coat shimmers (chatoyance): the highlight rolls across the fiddleback as you move, because
the fibres below the coat are tilted while the coat is flat. Give the layers different normals:

- **base** (`normal`): the true height plus the fibre pseudo-height (`lq_fib`, ±12° of fibre tilt);
- **coat** (`coat_normal`): the true height only, the usual `n_world`. Set `coat 1`, `coat_IOR 1.5`, coat roughness
  ~0.3, base roughness a little higher and varied with the figure.

Every per-leaf term must be continuous at the seams. A leaf tilt written as `a·k` is continuous (its slope flips, which
is what makes alternate leaves light and dark); `sign(leaf)·k` steps and draws a seam line. Without `coat_normal` the
coat is a perfect mirror; `specular_rotation` has a units bug (bug 8), so avoid anisotropy for this.
@@wood_lacquer@@

### Knots along long boards: per-cell knots and swirl rings

One knot per board (the [wood.md knot](wood.md#knots-with-deflected-grain)) is too sparse on boards over ~0.5 m: a 1 m
tile of long boards can show none. Cut each board into 0.4 m cells along the grain, keyed on (board id, cell), and let
40% hold a knot. The deflection and bump are **windowed** by `1 − smoothstep(|x_cell|, 0.33, 0.5)` so they reach 0 at
the cell ends, and the grain stays continuous from cell to cell. Deflection plus a dark core alone reads as a stain, so
add **explicit swirl rings** round the knot (4 mm apart, 0.9r to ~2.6r) and mix them into the figure,
`fig = mix(wr_fig, kc_ring, kc_swirl)`. Wobble the ring radius with noise (±1.2 mm): perfect rings read as a bullseye.
It outputs the same `wk_*` as the one-knot recipe, so it drops in before [growth rings](wood.md#growth-rings-plain-sawn-and-quarter-sawn).
Squared radii use `dotproduct` so `wk_loc` stays small: the ring recipe reads it ~8 times, and a first version with
`magnitude`·`magnitude` and a board-length term made the test tree 3.7× larger (144k vs 39k) and the first view 8× slower (25 s vs 3 s; bug 7).
@@knot_cells@@

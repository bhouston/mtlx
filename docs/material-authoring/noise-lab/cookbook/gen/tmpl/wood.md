# Wood recipes

Growth rings, figure, pores, ray fleck, knots and relief (end grain is in [endgrain.md](endgrain.md)) for wood floors and furniture. Part of the
[noise cookbook](../NOISE_COOKBOOK.md); layouts that feed these are in [planks.md](planks.md) and
[layouts.md](layouts.md). Test materials: [`cookbook_wood`](../noise-lab/cookbook/cookbook_wood.mtlx) (white oak on
guaranteed-stagger planks, sheet `wood.avif`) and [`cookbook_wood_end`](../noise-lab/cookbook/cookbook_wood_end.mtlx)
(end-grain blocks, sheet `wood_end.avif`; recipe in [endgrain.md](endgrain.md)). Harvested from round 3; [`oak-plank`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/oak-plank/gen.py) is the best
complete example. Straight and rift grain, relief-aware rings, pine latewood, weathered erosion, book-matched figure and
lacquered layering are in [grain.md](grain.md).

**How the pieces chain.** A plank layout gives `pk_loc` (m from the board centre, x along the grain) and `pk_id`. The
knot deflects the frame (`wk_loc`), the rings turn it into a ring phase and masks (`wr_*`), pores and fleck read those,
and colour and height combine everything. Every board gets its own randoms as `fract(pk_id·k + c)` and its own patch of
the shared noises (`wr_lp`), so figure breaks at every joint. For another layout, rename `pk_loc`/`pk_id` to its frame;
without knots, feed `pk_loc` as `wk_loc` and 0 as `wk_bump`.

| Feature                  | Size                                            | Relief                       | Colour / roughness                               |
| ------------------------ | ----------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| rings                    | 4–7 mm pitch, figure faded above 65–130 lines/m | earlywood −0.07 mm (brushed) | earlywood ×(0.74, 0.66, 0.58), up to +0.06 rough |
| ring groups              | ~2–5 cm bands along the rings                   | –                            | ±15% tone                                        |
| pores                    | ~2 × 0.15 mm dashes along the grain             | −0.02 mm                     | ×0.5 dark, +0.07 rough                           |
| ray fleck (quarter-sawn) | flakes 1–4 cm × 2–5 mm                          | +5 µm                        | ×1.18 light, −0.1 rough                          |
| knot                     | r 4–9 mm, grain deflected over ~3r              | −0.06 mm                     | near black core, darker rim                      |
| brush scratches          | 1800/m across                                   | 12 µm (~2°)                  | –                                                |

Colour and relief are **correlated**: the porous earlywood is darker, rougher and lower. For softwoods (pine, fir) the
latewood is the dark, hard band: darken by `1 − wr_ew` instead and keep eroding the earlywood. Pale species (maple,
birch, ash) have base_color R ≈ 0.5–0.65, above the AUTHORING §7 wood range; judge colour under `--ibl neutral -e -1`.

### Knots with deflected grain

A knot is a dark core plus rings that flow around it. Contours of a bump added to the ring phase read as a bullseye;
instead deflect the across-grain coordinate, y' = y − qy·1.6r²/(ρe² + r²), with q the offset from the knot and
ρe = |q·(0.4, 1)| stretched along the grain, and add a small bump r²/(ρ² + r²)·4 mm to the ring radius. `wk_core` and
`wk_rim` mask the core and its dark rim. About 20% of boards get one; with `wk_on` = 0 everything passes through. The
position along the board scales with the board length `pk_lm` (up to 12.5 cm from either end), so every length can
carry a knot anywhere. For boards over ~0.5 m use [per-cell knots](grain.md#knots-along-long-boards-per-cell-knots-and-swirl-rings)
(every 0.4 m, with swirl rings), a drop-in replacement.
@@wood_knot@@

### Growth rings: plain-sawn and quarter-sawn

Rings are cylinders round the pith, cut by the board face. With y across, x along, the **cone model**
R = √((y + o)² + D²) + taper·x gives both cuts from one formula:

- **plain-sawn (flat-sawn):** the pith is D = 4–14 cm below the face and o = ±11 cm off the board centre, and the log axis
  tilts against the face (taper ±4%). Rings cross the face in **cathedral arches** above the pith and run as **straight
  flanks** at the sides;
- **quarter-sawn:** D ≈ 0 and o = 0.2–0.3 m, so the rings meet the face at right angles and read as straight parallel
  lines, with slight runout from the taper.

The ring phase is R/λ (λ = 4–7 mm per board) plus a slow wobble along the grain. `wr_flank` = |y + o|/R is 1 where rings
stand perpendicular to the face; the fleck reads it. The [basketweave-parquet](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/basketweave-parquet/gen.py) generator
introduced the model; its render was painterly because the ring detail aliased, which the fade below fixes.
**Taper sets the cathedral spire spacing:** arches repeat about every **λ/taper** along the board (5 mm rings at 4% →
~12 cm), so a large taper reads as a row of beads; use ≤ 5% with more wobble on veneer and panels. Where relief cuts the
face (flutes, scoops), use the [relief-aware](grain.md#relief-aware-ring-frequency) frequency.
@@wood_rings@@

### Earlywood and latewood profile

Within each ring (t = fract(phase), 0 at the ring boundary), `wr_ew = smoothstep(t, 0, 0.1)·(1 − smoothstep(t, 0.25,
0.55))` rises sharply where growth restarts in spring and fades slowly into the dense latewood; its mean is 0.35. Use
the same mask for colour, roughness and relief. A symmetric sine or a hard step reads as printed or machined.

### Uneven ring widths

Real years differ. `wr_yr` adds `fractal2d(R·35, seed)·1.2` to the phase: a slow function of the radius, so whole rings
widen and narrow together (±30%) and ring lines never cross. Keep its derivative below 1/λ so the phase stays monotonic.
The end-grain recipe does the same in ring units (`eg_qn`).

### Local-frequency fade (moiré cap)

Parallel rings finer than ~6 px alias into moiré (strongest on the totem); noise only speckles. There is no derivative
node, so compute the frequency analytically: the ring lines per metre on the face are **f = |∇R|/λ**, and for the cone
|∇R| = |((y + o)/R, taper)|. `wr_f` adds 30% for the wobble and uneven widths. Fade the figure to its mean where it
would alias: `wr_fig = mix(0.35, wr_ew, 1 − smoothstep(f, FMAX/2, FMAX))`, with **FMAX = (pixels per metre at the
farthest view)/6**: 130 for `plane` at the default 800 px, 85 at `-s 512`, ~430 if nothing is judged beyond `closeup`.
**`docs/material-authoring/render.sh` renders `-s 512 --supersample`**, i.e. 1024 px across the 1 m `plane` before downsampling, so its
aliasing limit is **FMAX ≈ 170** (fade 85..170): lines between 85 and 170/m are averaged to grey by the downsample
rather than aliasing. The snippet below uses 130; the round-4 recipes use 170. There is no view input, so one FMAX
trades `closeup` detail against `plane` aliasing. The fade can't help constant-frequency straight grain; see
[straight and rift grain](grain.md#straight-and-rift-grain).
Everything periodic (colour, roughness, relief) uses `wr_fig`, not `wr_ew`. On the test plane 66% of the area is fully
faded (flanks and quarter-sawn boards) and 16% shows full figure (arch tips); the totem shows no moiré. Fine grain
survives through things that only speckle: pores that follow the earlywood (`wr_t`), stretched fibre noise, and ring
groups (`wr_band`, noise of R·40, so they follow the rings at a safe frequency).

### Pore dashes

Oak and ash have open pores: short dashes along the grain, dense in the earlywood band. Worley on stretched board
coordinates (cells 5.6 × 0.38 mm) with `F1 < 0.1..0.22` gives the dashes; presence is 1 in the earlywood (using the raw
`wr_t`, since pores are sub-pixel at `plane` and only speckle) and 20% in the latewood. At `closeup` the pores draw the
ring lines that the fade removed. Jitter 1: for features this small, clipping is invisible and lower jitter shows grid
rows.
@@wood_pores@@

### Quarter-sawn ray fleck

Medullary rays cut lengthwise show as lighter, glossier flakes on quarter-sawn oak: irregular, a few centimetres long,
a few millimetres wide, tilted slightly to the grain. Thresholded stretched fBm gives the ragged shapes (thresholded
noise makes worms, and flecks are worms); a jittered worley lens read as polka dots. The mask is gated by `wr_flank`, so
flecks appear on quarter-sawn boards and on the rift edges of plain-sawn ones. On flat-sawn faces rays show only as
tiny spindles ~3 × 0.3 mm; `oak-plank` adds those as sparse worley dashes.
@@wood_fleck@@

### Wood colour and roughness

White oak under matte oil: per-board honey to light tan with ±14% level, streaks along the grain, mottle, fibre
speckle, a 70 cm drift and ring groups, then the figure, fleck, pores and knot. Tints are written `c·mix(1, k, m)`: the
`mix(c, c·k, m)` form reads c twice per step and made this graph take 37 s to compile (gotcha 14).
@@wood_color@@

### Wire-brushed and eroded earlywood

Wire brushing and wear remove the soft earlywood and leave the latewood proud: relief is −0.07 mm × `wr_fig` (faded,
so it can't alias either), plus shallow pores, brush scratches along the grain, and a sunk knot core. For sanded
floors scale the earlywood term to ~0.01 mm; chevron-oak's brushed look uses 0.07 mm. Add the joint profile to this
(`cookbook_wood` uses a 1.6 mm cubic micro-bevel, 0.35 mm deep); don't multiply it in.
@@wood_height@@

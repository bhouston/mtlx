# Weathering and concrete finishes

Structural cracks, rain streaks, grinder swirls, cross-faded broom passes and board-formed imprints. Part of the
[noise cookbook](../NOISE_COOKBOOK.md). Test materials: [`cookbook_weathering`](../noise-lab/cookbook/cookbook_weathering.mtlx)
(TL sparse cracks, TR rain streaks, BL cross-faded broom passes, BR grinder swirls) and
[`cookbook_boards`](../noise-lab/cookbook/cookbook_boards.mtlx) (board-formed concrete with per-cell knots). Harvested
from round 5 ([cracked-slab](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/cracked-slab-r5/gen.py), [weathered](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/weathered-r5/gen.py),
[polished-floor](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/polished-floor-r5/gen.py), [broom-finish](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/broom-finish-r5/gen.py),
[board-formed](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/board-formed-r5/gen.py)).

**Sparse features can miss the 1 m tile.** At ~1 feature per metre, the tile may hold none, or all of them in one
corner. Shift the offset of the noise that places them by f·Δu to slide the pattern by Δu metres (the rain test moved
its presence fields by 0.5 m this way). `--channel <mask>` on `plane` shows where they fell.

### Sparse structural cracks

A slab cracks in a few long, meandering lines, not a uniform crazing network. The [tapered](cellular.md#cracks-with-taper)
and [true-distance](cellular.md#true-distance-cracks-and-t-junctions) crack recipes draw every Voronoi border, so:

- use **~1 cell/m** and turn the texcoord (28°), then **stretch it ~1.7×** along one axis, which breaks the 120°
  Y-junctions and runs the cracks long;
- keep borders where a **presence noise at ≤ ½ the cell frequency** (0.55/m here) passes a **wide ramp** (0.4..0.55),
  which removes ~60% of them and tapers the rest to points over ~20 cm;
- nest three warps (12 cm, 3 cm, 2.5 mm) for the meander and the jagged kinks.

**Metres on stretched coordinates.** True distance is (F2 − F1)/|∇(F2 − F1)|. If the finite-difference step is taken in
cell space (after the stretch), the result is in cells, and there is no single factor to metres: the scale is f·1.7
across the stretch and f along it. Dividing by a mean (≈ 1.3·f) is off by ±25% depending on the crack's direction. Take
the step **in metres, before the rotate and stretch** (`sk_uvw + (0.005, 0)`), and the distance comes out in metres in
every direction; the three worley reads cost the same either way. The width is then exact up to the warp's local
stretch (s ≤ 0.2).
@@crack_sparse@@

### Rain streaks and drips

Streaks are the zero contours of noise stretched along the fall line: `|n(uv·(fu, fv))| < w·presence`, on a texcoord
whose u wavers slowly as it runs down (6 mm at 2 × 5 /m), so lines drift sideways instead of running ruler-straight.
The threshold carries the presence, so streaks thin out and end. **Soft stains must also fade their intensity with the
presence** (`· smoothstep(pres, 0.05, 0.6)`): a threshold-only taper, right for cracks, ends every streak in a sharp
"grass-blade" point. Use two families (thin lines and broad washes) and a slow intensity noise along the streak. Streaks
are colour and roughness only (×0.45 albedo, slightly smoother). For streaks that start under a ledge or sill, multiply
the presence by a ramp that decays downward from the source.
@@rain@@

### Grinder swirls: partial arcs

Rings round a centre read as a bullseye. A grinder leaves **partial arcs**: per jittered cell centre, take polar
coordinates (r, θ = atan2), draw fine arcs as noise of (r·k, θ·2.2) thresholded, keep a ring band 0.12..0.4 cell, and
gate by a noise of θ (a different one per cell) so only ~1/3 of each circle survives. `atan2` jumps at θ = ±π, so the
gate is multiplied by `1 − smoothstep(|θ|, 2.7, 3.1)`, which hides the seam in a gap. Repeat the block on 2–3 grids with
different turns and sizes (38, 29 and 33 cm) and take the max, so arcs overlap without a lattice. This is a
**roughness** mask (+0.07 on 0.185): check it with `--channel sw_swirl`, and judge the look on `sphere`.
@@swirl@@

### Cross-faded bands

Bands with their own randoms (broom passes, trowel sweeps, strip-cut stone) step at their borders; fading the height to
0 there leaves a smooth stripe. Instead run **two band lattices half a period apart**, each with its own randoms, and
blend them by `w = smoothstep(tri, 0.3, 0.7)`, where `tri` is 1 at a band's centre and 0 at its border (so
w0 + w1 = 1). Normalise by the RMS weight, `(w0·h0 + w1·h1)/sqrt(w0² + w1²)`: two independent textures averaged with
equal weight lose ~30% of their contrast, and this keeps it constant through the overlap. Per-band colour (`bx_tone`)
uses the plain weighted sum. Borders wobble ±3 cm; on a 0.7 m period the dominant lattice alternates every 35 cm.
@@band_xfade@@

### Board-formed imprint

Concrete cast against boards takes the **negative** of the board surface. On weathered or rough-sawn boards the soft
earlywood is eroded and the knots stand proud, so in the concrete the earlywood is a ridge and each knot a dimple:
`h = −h_wood`. Fade the grain to 0 near each joint (`smoothstep(pk_d, 1.5, 5 mm)`); there the paste squeezed between
the boards leaves a fin (+0.28 mm, broken in patches), and grain running into the fin reads as a printed texture. Knots
come from [per-cell knots](grain.md#knots-along-long-boards-per-cell-knots-and-swirl-rings), which also add the swirl
rings to the figure. For kerf marks, add [surf_kerf](surfaces.md#rough-sawn-kerf-marks) to `h_wood`; for seam lips,
give each board a small offset and tilt and mix them across the joint over ~8 mm (see the
[board-formed](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/board-formed-r5/gen.py) generator).
@@imprint@@

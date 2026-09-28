# Cellular recipes

Worley and cell-id recipes: pits, palettes, pebbles, stones, chips, cracks, flagstones and sparse features. Sand,
grit, river pebbles and air voids are in [aggregate.md](aggregate.md); sparse structural cracks in
[weathering.md](weathering.md#sparse-structural-cracks). Part of the
[noise cookbook](../NOISE_COOKBOOK.md); read its cheat sheet (the cellular table and the clipping rule) first. Test
materials: [`cookbook_cells_a`](../noise-lab/cookbook/cookbook_cells_a.mtlx),
[`cookbook_cells_b`](../noise-lab/cookbook/cookbook_cells_b.mtlx) and
[`cookbook_surface`](../noise-lab/cookbook/cookbook_surface.mtlx) (true-distance cracks).

### Round pits and specks, never clipped

Jitter 0.7 at 30/m allows r ≤ 0.15 cell. The radius (0.05..0.15) comes from the id, there is no pit where id < 0.35,
and the depth is r/4 (a ~27° rim); r/2 (45°) reads as a raised dome under bridge, so darken the bowl as well.
The (1 − t²) bowl suits small specks and pores. In wood or metal it reads as a dome (use the crisp-rim
[dents](surfaces.md#crisp-rim-dents)); in concrete it reads as a soft dimple or a lunar crater, so bug holes and air
voids need a flat floor and strong AO ([voids](aggregate.md#air-voids-and-bug-holes)). Alternative: `r = noise2d(uv·9, amp 0.6, pivot 0.05)`,
`pit = smoothstep(r − F1, 0, edge)`, which gives varied blobs.
@@pits@@

### Per-cell id and palette

`modulo(id·13.7, 1)` picks one of 6 colours, and the raw id sets brightness, so the two are independent. This is
terrazzo at 30/m. Feed any id (e.g. `f_id`) to the chain.

**Same-coloured neighbours are chance, not correlation.** Neighbouring `style=1` ids are independent: sampled at 400
cell centres on the GPU, the neighbour correlation is |r| < 0.08 for the float id and for the vector3 `.z`, and a port
of the hash agrees. Mixing in the `.z` changes nothing. With n equally likely colours, 1/n of all neighbour pairs match,
so with 6 colours about 2/3 of stones (6 neighbours each) touch a same-coloured one, and clusters of 2–4 are common.
Where a small gap makes two such stones read as one split stone, vary brightness per stone with an independent random
(here the raw id; or `fract(id·k + c)`), widen the gap, or use more colours. **On granular fills** (sand, grit) don't
fill whole cells with the palette at all: it tiles into a Voronoi mosaic, so tint only the grain
([aggregate.md](aggregate.md)).
@@palette@@

### Domed pebbles (smooth-min plus crown)

`smin((F2−F1−gap)/2, R−F1, k)`, then smoothstep, times a crown `1 − 0.6(F1/0.7)²` that removes the medial crease.
Raising R packs the pebbles tighter; at 0.42 they float in the matrix. At `detail` these stones show flat plateaus
with faceted, cell-shaped rims: fine for crushed, tumbled stone, but for water-worn pebbles use the paraboloid
[river pebbles](aggregate.md#rounded-river-pebbles).
@@pebbles@@

### Angular stones

`min(F2−F1 − inset, R − F1)`, with R ≥ 0.8 (0.6 gives D shapes). The 3 mm edge ramp stair-steps on `plane`, so for
that view widen the smoothstep to ≥ 0.16 cell or lower the height. With these straight F2−F1 edges the stones pack
like terrazzo; for fractured outlines add lump noise to the circle term, `R − F1 + n(uv·220)·0.2` (a ~3 mm lump), as in
[polished-floor](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/polished-floor-r5/gen.py). A fixed F2−F1 gap between two neighbours reads as one cracked
stone, so lower the presence (fewer cells hold a stone). Judged at `detail`, F2−F1 relief needs jitter ≤ 0.75
([gotcha 17](../NOISE_COOKBOOK.md#2-gotchas-and-renderer-bugs-to-route-around)).
@@stones@@

### Faceted chips

The max of two rotated, offset layers of `cone(F1) · smoothstep(F2−F1, 0, 0.12)`, 3 mm deep. A shallower cone reads as
crazed plaster.
@@chips@@

### Cracks with taper

The presence mask scales the **threshold** (full-depth cracks that narrow to points), not the output (ghost lines).
Width ≈ 1.3·0.03/4 m before the warp, and 2–4× thinner after. That width is 2t/(|∇(F2−F1)|·f), so the rule holds only
where |∇(F2−F1)| ≈ 1.5–2 (mid-edge); short edges far from their points smear into wedges. For a fixed width use
[true-distance cracks](#true-distance-cracks-and-t-junctions). All three crack recipes here draw a uniform network
(crazing, crackle glaze); for a few long structural cracks use [sparse cracks](weathering.md#sparse-structural-cracks). Cracks under 2 px break into dots, so raise t before you
add a fine warp. The `max(t, 1e-4)` floor alone still leaves a hairline where F2−F1 is exactly 0, so the mask is
also gated by `smoothstep(t0, 2e-4, 6e-4)` (the true-distance and child cracks below do the same).
@@cracks@@

### Flagstones or crazy paving

5 stones/m on the warped texcoord. The joint is F2−F1 < 0.05 (≈ 1.3 cm) with an arris up to 0.11, and the id on the
**same** warped texcoord sets +0..2 mm and the colour.
@@flag@@

### Sparse features, never clipped

Jitter 0.4 allows r ≤ 0.3 cell: 55% of cells present, r 0.1..0.28. If you need the local offset vector (ellipses,
orientation), use the manual jittered grid (`g_*` in `cookbook_cells_b.mtlx`, [cellular §5](../noise-lab/cellular/FINDINGS.md)).
@@sparse@@

### True-distance cracks and T-junctions

Dividing F2−F1 by its finite-difference gradient gives the distance to the border in cells, so width = 2t/f
everywhere. Measured with the taper off: median 0.49 mm (design 0.5), p99 3.2 mm, versus 0.73 and 5.1 mm (+33% area)
for raw F2−F1 at the same mid-edge width. Children gated by the parent's `style=1` id stop at the parent border, so
they end in T-junctions. Keep crack depth ≤ ~0.4× the width; deeper renders as beads.
@@crack_true@@
@@crack_child@@

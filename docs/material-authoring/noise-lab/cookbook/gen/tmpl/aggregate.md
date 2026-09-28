# Grains, pebbles and voids

Sand, coarse grit, river pebbles and air voids: the granular recipes for concrete, terrazzo, stucco and stone. Part of
the [noise cookbook](../NOISE_COOKBOOK.md); read its cellular cheat sheet and clipping rule first, and
[cellular.md](cellular.md) for pits, palettes and angular stones. Test material:
[`cookbook_grains`](../noise-lab/cookbook/cookbook_grains.mtlx) (TL packed sand, TR river pebbles, BL air voids, BR
sparse grit in white paste). Harvested from round 5 ([cmu-block](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/cmu-block-r5/gen.py),
[white-precast](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/white-precast-r5/gen.py), [exposed-aggregate](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/exposed-aggregate-r5/gen.py),
[smooth-cast](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/smooth-cast-r5/gen.py)).

| Feature       | Size                                         | Relief                  | Colour / roughness                                  |
| ------------- | -------------------------------------------- | ----------------------- | --------------------------------------------------- |
| packed sand   | grains ~1.3 and ~2 mm, 1.9 and 3 mm cells    | +0.12 mm domes (~8°)    | ±0.3 tone on the domes only                         |
| coarse grit   | 0.8–1.5 mm grains, 3.3 mm cells, 55% present | +0.04 mm                | −18..+12% tone, flat-topped mask                    |
| river pebbles | 7–14 mm, 13.9 mm cells                       | 1–2.8 mm domes          | 5-colour palette ×0.8–1.15; 0.5 rough vs 0.9 matrix |
| air voids     | 1.7–6 mm radius, 12 cells/m, 30% present     | 0.25 r deep, flat floor | albedo ×0.2 at the core; +0.1 rough                 |

**What doesn't read as grains**, found by four round-5 agents:

- **F2−F1 plateaus** (flat cells with a border ramp) read as crazed plaster or Voronoi pavement: every grain touches its
  neighbours along a straight edge.
- **Sharp-rim F1 plateaus** (`smoothstep(r − F1, 0, small)`) read as bubbles or blisters at `detail`. Use domes, whose
  slope rises all the way to the crown.
- **A per-cell palette fill** (`style=1` colour over the whole cell) tiles into a Voronoi mosaic once grains are ≥ 6 px.
  Tint only the grain dome and keep the matrix between grains neutral.
- **Grains under ~0.5 mm** average away at `closeup` under `--supersample` (0.39 mm/px): they add roughness-like
  speckle, not grains. The stone read comes from a sparse 0.8–1.6 mm layer ([grit](#sparse-coarse-grit)).
- **Colour-only round F1 specks** read as printed decals. Give grains a little height, and correlate their tone with it.

### Packed sand

Two rotated layers of separate F1 domes, `1 − smoothstep(F1, 0.05, 0.35)` (r ≈ 0.35 cell), combined with `max`. The
rotation (11° and −37°) and the two cell sizes hide both lattices; the gaps between domes are the matrix. `sd_tone` is 0
between grains, so `col = matrix·(1 + 0.6·sd_tone)` tints only the grains. At `plane` this is fine speckle; the grains
read from `closeup` down.
@@sand@@

### Sparse coarse grit

The layer that turns paste into stone at `closeup`: 55% of 3.3 mm cells hold one 0.8–1.5 mm grain. Jitter 0.55 with
r ≤ 0.22 cell obeys the clipping rule, and a grain-scale warp (1700/m, 0.1 mm, s = 0.17) makes the outlines irregular.
Height uses the dome (`gt_dome`); colour uses a flat-topped mask (`gt_m`, ramp 0.35 r), so each grain has a crisp edge
and a soft relief.
@@grit@@

### Rounded river pebbles

`max(1 − (F1/R)², 0) · smoothstep(F2 − F1, 0.04, 0.28)`: a paraboloid per stone, gated to 0 before the cell border so
per-stone R and height never jump. R comes from the stone id (0.24–0.46 cell), which gives the size variety. Keep the
gate short: a wider one (e.g. 0.04..0.4) reaches the kinks of F2−F1 inside the cell and creases the domes, and a stone
that crowds its neighbour gets a flattened side. Don't layer two worley grids for mixed sizes; where their stones
overlap they leave crescent slivers. Jitter 0.45 keeps feature points ≥ 0.55 cell apart, and the two-stage warp hides
the lattice. `rp_near` is a continuous signed distance (constant R and gap, so it doesn't jump at borders) for crevice
AO on the matrix. This replaces the [domed pebbles](cellular.md#domed-pebbles-smooth-min-plus-crown) when stones must
look water-worn at `detail`.
@@river@@

### Air voids and bug holes

Cast concrete has steep-walled voids with a flat floor: `1 − smoothstep(t, 0.6, 1)`, t = F1/r (the rim at 0.45–0.68 of
r; higher is crisper and steeper). A `(1 − t²)` bowl, as in the [pits](cellular.md#round-pits-and-specks-never-clipped)
recipe, reads as a soft dimple or a lunar crater. A warp at about the void scale (250/m, 0.5 mm) makes the outlines
ragged, and strong baked AO does most of the work: walls ×0.5, the core ×0.4 more. On dry-cast block the void read is
almost all albedo. `r ∝ rand²` makes most voids small. To find one to inspect, run `--channel h_void` over the region
(`plane:0.48 --center …`) and aim `--center` at the minimum UV it prints.
@@voids@@

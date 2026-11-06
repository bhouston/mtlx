# Tile layouts, edges and per-tile variation

Grid and running bond, hex, herringbone and chevron, plus edge profiles, hand-cut outlines and per-tile reseeding.
Planks (random-length, guaranteed stagger, variable-width rows) are in [planks.md](planks.md). Part of the
[noise cookbook](../NOISE_COOKBOOK.md). Test materials: [`cookbook_layouts`](../noise-lab/cookbook/cookbook_layouts.mtlx),
[`cookbook_layouts2`](../noise-lab/cookbook/cookbook_layouts2.mtlx) (chevron),
[`cookbook_surface`](../noise-lab/cookbook/cookbook_surface.mtlx) and [`cookbook_veneer`](../noise-lab/cookbook/cookbook_veneer.mtlx)
(book-match). Panel steps, mouldings and battens are in [profiles.md](profiles.md).

Every layout gives a **tile-local frame**: `*_loc` (m from the tile centre, x along), `*_id` (`cellnoise2d` of the
integer tile index + (200.37, 300.61); half-integer seeds gave whole tiles of exact 0, see [RENDERER_BUGS.md](../RENDERER_BUGS.md)), `*_d` (m to
the tile edge: exact on the tile, negative in the joint) and `*_tile` (1 tile, 0 joint). Drive profiles from `*_d`,
variation from `*_id`, and pattern from `*_loc`. Checked with `--channel` over 6 m: one id per tile, no zero ids.

- **Noise on layout coordinates:** use `fractal2d octaves=1`, not `noise2d` (compile time, gotcha 13), and tint with
  `c·mix(1, k, m)` rather than `mix(c, c·k, m)` (gotcha 14).
- **Bucketing** centres into sheets or groups: offset the bucket grid (e.g. +0.017) so that no centre lies on a boundary,
  or `floor` flickers per pixel.
- **Smooth min** for distance fields that drive masks, domes or glaze pooling; a hard min creases along the medial
  axis. Keep the hard min for the outline itself.
- **Seed per member, not per layout cell,** when members cross cell edges. In frame-and-panel the stiles run through
  and the rails cross panel-cell edges, so key stiles on their column, rails on (column, rail row) and panels on the
  cell, or tone steps appear mid-member ([panel step](profiles.md#recessed-or-raised-panel-step)).
- **Other shapes** (fish scale, scallop, arch): take the row band `floor(y)`, the nearest centre in each of the two
  candidate rows, pick the owner by the stacking rule, then compute exact distances from the owner's local offset
  ([`fish-scale/gen.py`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/fish-scale/gen.py)).

### Rectangular grid and running bond

The row offset o sets the bond: 0 gives a stack or square grid, 0.5 half bond, 0.333 third bond.
@@lay_bond@@

### Hex (two-lattice nearest centre)

@@lay_hex@@

### Herringbone (90°)

@@lay_herr@@

### Chevron

Two families of long joints: `s = v − x` on the left half-column and `s = v + x − 2·HC` on the right, which meet on
the half-column lines, so every block end is a straight vertical mitre and the points face +V. Block k owns
P·k ≤ s < P·(k+1) with P = W·√2; `cv_d` is the exact distance to the parallelogram (the mitre lines or the long
joints). `cv_loc.x` runs along the block axis from the block centre (the test tints by it), and `cv_cell` is
(half-column, k). Blocks here are 90 mm × 354 mm on the centre line (long edges 264/444 mm) in 0.5 m columns; change
W and HC together. From [`chevron-oak`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/chevron-oak/gen.py).
@@lay_chevron@@

### Rounded rectangle and cushion edge

`rr_d` is exact inside and out, so use r = 0 for a plain box. The cubic shoulder meets the face with zero slope and
curvature (a quarter-parabola creases there). For an eased edge instead, use `smoothstep(d, 0, W)` (max slope
1.5·depth/W).
@@edge_rrect@@
@@edge_cushion@@

### Hand-cut outline: per-corner randoms and per-edge insets

`cell·2 + corner` keys one random per tile corner. Each edge insets by the mix of its two corners, so edges tilt
independently and joints vary 3–5 mm. For one eval of the nearest corner's random (chips), key on
`cell·2 + floor(fr·2)`.
@@edge_hand@@

### Per-tile reseed and slab coordinates

`uv·f + id·97` gives every tile its own patch of a shared noise (undulation, mottle). For veins or grain, rotate the
local frame by a random angle and offset it into one big slab, so patterns break at every joint.
@@vary@@

### Book-match: mirror flitch coordinate

Book-matched veneer mirrors the figure at every seam. With leaves L wide across U, the flitch coordinate
**a = L − |mod(u, 2L) − L|** is a triangle wave (4 nodes): any pattern that is a function of (a, along) is then exactly
symmetric about every seam, with no seam-line artefact (measured: ≤ 1 grey level against its mirror). Use `bm_ds`
(distance to the nearest seam) for a glue hairline. **Leaves 2–3 repeat leaves 0–1**: a only spans one leaf width, so
every pair shows the same flitch. Real panels are cut from successive slices, so shift the along-grain coordinate per
panel (here 0.31 m per 600 mm panel), or use a four-way (book-and-slip) match by mirroring along V too. The figure and
lacquer that read it are in [grain.md](grain.md#book-matched-figure). From [`bookmatched-veneer`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/bookmatched-veneer/gen.py).
@@lay_bookmatch@@

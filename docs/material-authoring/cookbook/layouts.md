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

```xml
<!-- in: uv_sep. out: rg_loc (tile-local m, centred; x along, y across), rg_cell (integer tile index), rg_id (0..1 per tile), rg_d (m to the tile edge, + on tile, - in grout), rg_tile (1 tile, 0 grout). 150x75 mm tiles + 3 mm grout = 153x78 mm pitch; row offset o = 0.5 (0 = stack or square grid, 0.333 = third bond) -->
<divide name="rg_v" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" value="0.078" /></divide>
<floor name="rg_row" type="float"><input name="in" type="float" nodename="rg_v" /></floor>
<multiply name="rg_off" type="float"><input name="in1" type="float" nodename="rg_row" /><input name="in2" type="float" value="0.5" /></multiply>
<divide name="rg_u0" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.153" /></divide>
<add name="rg_u" type="float"><input name="in1" type="float" nodename="rg_u0" /><input name="in2" type="float" nodename="rg_off" /></add>
<combine2 name="rg_p" type="vector2"><input name="in1" type="float" nodename="rg_u" /><input name="in2" type="float" nodename="rg_v" /></combine2>
<floor name="rg_cell" type="vector2"><input name="in" type="vector2" nodename="rg_p" /></floor>
<subtract name="rg_fr" type="vector2"><input name="in1" type="vector2" nodename="rg_p" /><input name="in2" type="vector2" nodename="rg_cell" /></subtract>
<subtract name="rg_fc" type="vector2"><input name="in1" type="vector2" nodename="rg_fr" /><input name="in2" type="vector2" value="0.5, 0.5" /></subtract>
<multiply name="rg_loc" type="vector2"><input name="in1" type="vector2" nodename="rg_fc" /><input name="in2" type="vector2" value="0.153, 0.078" /></multiply>
<add name="rg_seed" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="rg_id" type="float"><input name="texcoord" type="vector2" nodename="rg_seed" /></cellnoise2d>
<absval name="rg_al" type="vector2"><input name="in" type="vector2" nodename="rg_loc" /></absval>
<subtract name="rg_e" type="vector2"><input name="in1" type="vector2" value="0.075, 0.0375" /><input name="in2" type="vector2" nodename="rg_al" /></subtract>
<separate2 name="rg_es" type="multioutput"><input name="in" type="vector2" nodename="rg_e" /></separate2>
<min name="rg_d" type="float"><input name="in1" type="float" nodename="rg_es" output="outx" /><input name="in2" type="float" nodename="rg_es" output="outy" /></min>
<smoothstep name="rg_tile" type="float"><input name="in" type="float" nodename="rg_d" /><input name="low" type="float" value="-0.00025" /><input name="high" type="float" value="0.00025" /></smoothstep>
```

### Hex (two-lattice nearest centre)

```xml
<!-- in: uv. out: hx_loc (m from the hex centre), hx_id, hx_d (m to the hex edge, + on tile), hx_tile. Pointy-top hexes, 52 mm pitch across flats (50 mm tile + 2 mm grout): nearest centre of two offset rectangular lattices -->
<modulo name="hx_a0" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="0.052, 0.0900666" /></modulo>
<subtract name="hx_qa" type="vector2"><input name="in1" type="vector2" nodename="hx_a0" /><input name="in2" type="vector2" value="0.026, 0.0450333" /></subtract>
<subtract name="hx_b1" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="0.026, 0.0450333" /></subtract>
<modulo name="hx_b0" type="vector2"><input name="in1" type="vector2" nodename="hx_b1" /><input name="in2" type="vector2" value="0.052, 0.0900666" /></modulo>
<subtract name="hx_qb" type="vector2"><input name="in1" type="vector2" nodename="hx_b0" /><input name="in2" type="vector2" value="0.026, 0.0450333" /></subtract>
<magnitude name="hx_la" type="float"><input name="in" type="vector2" nodename="hx_qa" /></magnitude>
<magnitude name="hx_lb" type="float"><input name="in" type="vector2" nodename="hx_qb" /></magnitude>
<ifgreater name="hx_loc" type="vector2"><input name="value1" type="float" nodename="hx_la" /><input name="value2" type="float" nodename="hx_lb" /><input name="in1" type="vector2" nodename="hx_qb" /><input name="in2" type="vector2" nodename="hx_qa" /></ifgreater>
<subtract name="hx_ctr" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" nodename="hx_loc" /></subtract>
<divide name="hx_ci" type="vector2"><input name="in1" type="vector2" nodename="hx_ctr" /><input name="in2" type="vector2" value="0.026, 0.0450333" /></divide>
<add name="hx_seed" type="vector2"><input name="in1" type="vector2" nodename="hx_ci" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="hx_id" type="float"><input name="texcoord" type="vector2" nodename="hx_seed" /></cellnoise2d>
<absval name="hx_al" type="vector2"><input name="in" type="vector2" nodename="hx_loc" /></absval>
<dotproduct name="hx_ed" type="float"><input name="in1" type="vector2" nodename="hx_al" /><input name="in2" type="vector2" value="0.5, 0.866025" /></dotproduct>
<separate2 name="hx_as" type="multioutput"><input name="in" type="vector2" nodename="hx_al" /></separate2>
<max name="hx_hd" type="float"><input name="in1" type="float" nodename="hx_as" output="outx" /><input name="in2" type="float" nodename="hx_ed" /></max>
<subtract name="hx_d" type="float"><input name="in1" type="float" value="0.025" /><input name="in2" type="float" nodename="hx_hd" /></subtract>
<smoothstep name="hx_tile" type="float"><input name="in" type="float" nodename="hx_d" /><input name="low" type="float" value="-0.00025" /><input name="high" type="float" value="0.00025" /></smoothstep>
```

### Herringbone (90°)

```xml
<!-- in: uv. out: hb_loc (plank-local m, centred; x along, y across), hb_id, hb_d (m to the plank edge), hb_tile. 90-deg herringbone at 45 deg, 25x100 mm planks, 1.5 mm grout; module WM = 26.5 mm, K = LM/WM = 3.8302 -->
<rotate2d name="hb_r" type="vector2"><input name="in" type="vector2" nodename="uv" /><input name="amount" type="float" value="45" /></rotate2d>
<divide name="hb_q" type="vector2"><input name="in1" type="vector2" nodename="hb_r" /><input name="in2" type="float" value="0.0265" /></divide>
<separate2 name="hb_qs" type="multioutput"><input name="in" type="vector2" nodename="hb_q" /></separate2>
<subtract name="hb_t" type="float"><input name="in1" type="float" nodename="hb_qs" output="outx" /><input name="in2" type="float" nodename="hb_qs" output="outy" /></subtract>
<add name="hb_t1" type="float"><input name="in1" type="float" nodename="hb_t" /><input name="in2" type="float" value="1" /></add>
<divide name="hb_nh0" type="float"><input name="in1" type="float" nodename="hb_t1" /><input name="in2" type="float" value="7.66038" /></divide>
<floor name="hb_nh" type="float"><input name="in" type="float" nodename="hb_nh0" /></floor>
<multiply name="hb_nhk" type="float"><input name="in1" type="float" nodename="hb_nh" /><input name="in2" type="float" value="3.83019" /></multiply>
<add name="hb_yh" type="float"><input name="in1" type="float" nodename="hb_qs" output="outy" /><input name="in2" type="float" nodename="hb_nhk" /></add>
<floor name="hb_mh" type="float"><input name="in" type="float" nodename="hb_yh" /></floor>
<subtract name="hb_fyh" type="float"><input name="in1" type="float" nodename="hb_yh" /><input name="in2" type="float" nodename="hb_mh" /></subtract>
<modulo name="hb_xl0" type="float"><input name="in1" type="float" nodename="hb_t1" /><input name="in2" type="float" value="7.66038" /></modulo>
<add name="hb_xl1" type="float"><input name="in1" type="float" nodename="hb_xl0" /><input name="in2" type="float" nodename="hb_fyh" /></add>
<subtract name="hb_xl" type="float"><input name="in1" type="float" nodename="hb_xl1" /><input name="in2" type="float" value="1" /></subtract>
<ifgreater name="hb_ish0" type="float"><input name="value1" type="float" value="3.83019" /><input name="value2" type="float" nodename="hb_xl" /><input name="in1" type="float" value="1" /><input name="in2" type="float" value="0" /></ifgreater>
<ifgreater name="hb_ish" type="float"><input name="value1" type="float" value="0" /><input name="value2" type="float" nodename="hb_xl" /><input name="in1" type="float" value="0" /><input name="in2" type="float" nodename="hb_ish0" /></ifgreater>
<subtract name="hb_nv0" type="float"><input name="in1" type="float" nodename="hb_t1" /><input name="in2" type="float" value="3.83019" /></subtract>
<divide name="hb_nv1" type="float"><input name="in1" type="float" nodename="hb_nv0" /><input name="in2" type="float" value="7.66038" /></divide>
<floor name="hb_nv" type="float"><input name="in" type="float" nodename="hb_nv1" /></floor>
<multiply name="hb_nvk" type="float"><input name="in1" type="float" nodename="hb_nv" /><input name="in2" type="float" value="3.83019" /></multiply>
<add name="hb_nvk1" type="float"><input name="in1" type="float" nodename="hb_nvk" /><input name="in2" type="float" value="3.83019" /></add>
<subtract name="hb_gx" type="float"><input name="in1" type="float" nodename="hb_qs" output="outx" /><input name="in2" type="float" nodename="hb_nvk1" /></subtract>
<floor name="hb_mv" type="float"><input name="in" type="float" nodename="hb_gx" /></floor>
<subtract name="hb_fxv" type="float"><input name="in1" type="float" nodename="hb_gx" /><input name="in2" type="float" nodename="hb_mv" /></subtract>
<subtract name="hb_av0" type="float"><input name="in1" type="float" nodename="hb_qs" output="outy" /><input name="in2" type="float" nodename="hb_mv" /></subtract>
<add name="hb_av1" type="float"><input name="in1" type="float" nodename="hb_av0" /><input name="in2" type="float" nodename="hb_nvk1" /></add>
<subtract name="hb_av" type="float"><input name="in1" type="float" nodename="hb_av1" /><input name="in2" type="float" value="1" /></subtract>
<mix name="hb_al" type="float"><input name="bg" type="float" nodename="hb_av" /><input name="fg" type="float" nodename="hb_xl" /><input name="mix" type="float" nodename="hb_ish" /></mix>
<mix name="hb_ac" type="float"><input name="bg" type="float" nodename="hb_fxv" /><input name="fg" type="float" nodename="hb_fyh" /><input name="mix" type="float" nodename="hb_ish" /></mix>
<combine2 name="hb_ac2" type="vector2"><input name="in1" type="float" nodename="hb_al" /><input name="in2" type="float" nodename="hb_ac" /></combine2>
<multiply name="hb_l0" type="vector2"><input name="in1" type="vector2" nodename="hb_ac2" /><input name="in2" type="float" value="0.0265" /></multiply>
<subtract name="hb_loc" type="vector2"><input name="in1" type="vector2" nodename="hb_l0" /><input name="in2" type="vector2" value="0.05075, 0.01325" /></subtract>
<mix name="hb_in" type="float"><input name="bg" type="float" nodename="hb_nv" /><input name="fg" type="float" nodename="hb_nh" /><input name="mix" type="float" nodename="hb_ish" /></mix>
<multiply name="hb_io" type="float"><input name="in1" type="float" nodename="hb_ish" /><input name="in2" type="float" value="173" /></multiply>
<add name="hb_in2" type="float"><input name="in1" type="float" nodename="hb_in" /><input name="in2" type="float" nodename="hb_io" /></add>
<mix name="hb_im" type="float"><input name="bg" type="float" nodename="hb_mv" /><input name="fg" type="float" nodename="hb_mh" /><input name="mix" type="float" nodename="hb_ish" /></mix>
<combine2 name="hb_cell" type="vector2"><input name="in1" type="float" nodename="hb_in2" /><input name="in2" type="float" nodename="hb_im" /></combine2>
<add name="hb_seed" type="vector2"><input name="in1" type="vector2" nodename="hb_cell" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="hb_id" type="float"><input name="texcoord" type="vector2" nodename="hb_seed" /></cellnoise2d>
<absval name="hb_abs" type="vector2"><input name="in" type="vector2" nodename="hb_loc" /></absval>
<subtract name="hb_e" type="vector2"><input name="in1" type="vector2" value="0.05, 0.0125" /><input name="in2" type="vector2" nodename="hb_abs" /></subtract>
<separate2 name="hb_es" type="multioutput"><input name="in" type="vector2" nodename="hb_e" /></separate2>
<min name="hb_d" type="float"><input name="in1" type="float" nodename="hb_es" output="outx" /><input name="in2" type="float" nodename="hb_es" output="outy" /></min>
<smoothstep name="hb_tile" type="float"><input name="in" type="float" nodename="hb_d" /><input name="low" type="float" value="-0.00025" /><input name="high" type="float" value="0.00025" /></smoothstep>
```

### Chevron

Two families of long joints: `s = v − x` on the left half-column and `s = v + x − 2·HC` on the right, which meet on
the half-column lines, so every block end is a straight vertical mitre and the points face +V. Block k owns
P·k ≤ s < P·(k+1) with P = W·√2; `cv_d` is the exact distance to the parallelogram (the mitre lines or the long
joints). `cv_loc.x` runs along the block axis from the block centre (the test tints by it), and `cv_cell` is
(half-column, k). Blocks here are 90 mm × 354 mm on the centre line (long edges 264/444 mm) in 0.5 m columns; change
W and HC together. From [`chevron-oak`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/chevron-oak/gen.py).

```xml
<!-- in: uv_sep. out: cv_loc (block-local m, centred; x along the block axis, y across), cv_cell, cv_id, cv_d (m to the block edge), cv_tile. Columns 2*HC = 0.5 m along U, each split into two half-columns; 90 mm blocks at 45 deg, mitred ends on the vertical half-column lines. Long joints: left s = v - x, right s = v + x - 2*HC (continuous at both lines, points toward +V); block k owns P*k <= s < P*(k+1), P = W*sqrt(2) = 0.127279. 1 mm joints -->
<divide name="cv_u" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.5" /></divide>
<floor name="cv_col" type="float"><input name="in" type="float" nodename="cv_u" /></floor>
<subtract name="cv_3" type="float"><input name="in1" type="float" nodename="cv_u" /><input name="in2" type="float" nodename="cv_col" /></subtract>
<multiply name="cv_x" type="float"><input name="in1" type="float" nodename="cv_3" /><input name="in2" type="float" value="0.5" /></multiply>
<ifgreater name="cv_l" type="float"><input name="value1" type="float" value="0.25" /><input name="value2" type="float" nodename="cv_x" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<add name="cv_6" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" nodename="cv_x" /></add>
<subtract name="cv_7" type="float"><input name="in1" type="float" nodename="cv_6" /><input name="in2" type="float" value="0.5" /></subtract>
<subtract name="cv_8" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" nodename="cv_x" /></subtract>
<mix name="cv_s" type="float"><input name="bg" type="float" nodename="cv_7" /><input name="fg" type="float" nodename="cv_8" /><input name="mix" type="float" nodename="cv_l" /></mix>
<divide name="cv_q" type="float"><input name="in1" type="float" nodename="cv_s" /><input name="in2" type="float" value="0.127279" /></divide>
<floor name="cv_k" type="float"><input name="in" type="float" nodename="cv_q" /></floor>
<subtract name="cv_fr" type="float"><input name="in1" type="float" nodename="cv_q" /><input name="in2" type="float" nodename="cv_k" /></subtract>
<subtract name="cv_r" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="cv_l" /></subtract>
<multiply name="cv_14" type="float"><input name="in1" type="float" nodename="cv_r" /><input name="in2" type="float" value="0.25" /></multiply>
<subtract name="cv_xh" type="float"><input name="in1" type="float" nodename="cv_x" /><input name="in2" type="float" nodename="cv_14" /></subtract>
<subtract name="cv_16" type="float"><input name="in1" type="float" value="0.25" /><input name="in2" type="float" nodename="cv_xh" /></subtract>
<min name="cv_dend" type="float"><input name="in1" type="float" nodename="cv_xh" /><input name="in2" type="float" nodename="cv_16" /></min>
<subtract name="cv_18" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="cv_fr" /></subtract>
<min name="cv_19" type="float"><input name="in1" type="float" nodename="cv_fr" /><input name="in2" type="float" nodename="cv_18" /></min>
<multiply name="cv_dside" type="float"><input name="in1" type="float" nodename="cv_19" /><input name="in2" type="float" value="0.09" /></multiply>
<min name="cv_21" type="float"><input name="in1" type="float" nodename="cv_dend" /><input name="in2" type="float" nodename="cv_dside" /></min>
<subtract name="cv_d" type="float"><input name="in1" type="float" nodename="cv_21" /><input name="in2" type="float" value="0.0005" /></subtract>
<multiply name="cv_23" type="float"><input name="in1" type="float" nodename="cv_col" /><input name="in2" type="float" value="2.0" /></multiply>
<add name="cv_24" type="float"><input name="in1" type="float" nodename="cv_23" /><input name="in2" type="float" nodename="cv_r" /></add>
<combine2 name="cv_cell" type="vector2"><input name="in1" type="float" nodename="cv_24" /><input name="in2" type="float" nodename="cv_k" /></combine2>
<add name="cv_26" type="vector2"><input name="in1" type="vector2" nodename="cv_cell" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="cv_id" type="float"><input name="texcoord" type="vector2" nodename="cv_26" /></cellnoise2d>
<add name="cv_28" type="float"><input name="in1" type="float" nodename="cv_k" /><input name="in2" type="float" value="0.5" /></add>
<multiply name="cv_sc" type="float"><input name="in1" type="float" nodename="cv_28" /><input name="in2" type="float" value="0.127279" /></multiply>
<add name="cv_30" type="float"><input name="in1" type="float" nodename="cv_x" /><input name="in2" type="float" nodename="uv_sep" output="outy" /></add>
<subtract name="cv_31" type="float"><input name="in1" type="float" nodename="cv_30" /><input name="in2" type="float" value="0.25" /></subtract>
<subtract name="cv_32" type="float"><input name="in1" type="float" nodename="cv_31" /><input name="in2" type="float" nodename="cv_sc" /></subtract>
<subtract name="cv_33" type="float"><input name="in1" type="float" nodename="cv_x" /><input name="in2" type="float" nodename="uv_sep" output="outy" /></subtract>
<subtract name="cv_34" type="float"><input name="in1" type="float" nodename="cv_33" /><input name="in2" type="float" value="0.25" /></subtract>
<add name="cv_35" type="float"><input name="in1" type="float" nodename="cv_34" /><input name="in2" type="float" nodename="cv_sc" /></add>
<mix name="cv_36" type="float"><input name="bg" type="float" nodename="cv_35" /><input name="fg" type="float" nodename="cv_32" /><input name="mix" type="float" nodename="cv_l" /></mix>
<multiply name="cv_along" type="float"><input name="in1" type="float" nodename="cv_36" /><input name="in2" type="float" value="0.707107" /></multiply>
<subtract name="cv_38" type="float"><input name="in1" type="float" nodename="cv_fr" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="cv_39" type="float"><input name="in1" type="float" nodename="cv_38" /><input name="in2" type="float" value="0.09" /></multiply>
<combine2 name="cv_loc" type="vector2"><input name="in1" type="float" nodename="cv_along" /><input name="in2" type="float" nodename="cv_39" /></combine2>
<smoothstep name="cv_tile" type="float"><input name="in" type="float" nodename="cv_d" /><input name="low" type="float" value="-0.00025" /><input name="high" type="float" value="0.00025" /></smoothstep>
```

### Rounded rectangle and cushion edge

`rr_d` is exact inside and out, so use r = 0 for a plain box. The cubic shoulder meets the face with zero slope and
curvature (a quarter-parabola creases there). For an eased edge instead, use `smoothstep(d, 0, W)` (max slope
1.5·depth/W).

```xml
<!-- in: rg_loc (any centred tile-local m). out: rr_d = exact signed distance (m) to a 150x75 mm rectangle with 3 mm corners, + inside. half size h = (0.075, 0.0375), r = 0.003: d = r - |max(q,0)| - min(max(qx,qy),0), q = |loc| - h + r -->
<absval name="rr_a" type="vector2"><input name="in" type="vector2" nodename="rg_loc" /></absval>
<subtract name="rr_q" type="vector2"><input name="in1" type="vector2" nodename="rr_a" /><input name="in2" type="vector2" value="0.072, 0.0345" /></subtract>
<max name="rr_qp" type="vector2"><input name="in1" type="vector2" nodename="rr_q" /><input name="in2" type="float" value="0" /></max>
<magnitude name="rr_out" type="float"><input name="in" type="vector2" nodename="rr_qp" /></magnitude>
<separate2 name="rr_qs" type="multioutput"><input name="in" type="vector2" nodename="rr_q" /></separate2>
<max name="rr_qm" type="float"><input name="in1" type="float" nodename="rr_qs" output="outx" /><input name="in2" type="float" nodename="rr_qs" output="outy" /></max>
<min name="rr_in" type="float"><input name="in1" type="float" nodename="rr_qm" /><input name="in2" type="float" value="0" /></min>
<add name="rr_s" type="float"><input name="in1" type="float" nodename="rr_out" /><input name="in2" type="float" nodename="rr_in" /></add>
<subtract name="rr_d" type="float"><input name="in1" type="float" value="0.003" /><input name="in2" type="float" nodename="rr_s" /></subtract>
```

```xml
<!-- in: rr_d (m, + inside). out: h_cush (m: 0 on the face, -1.2 mm in the grout), cu_tile. Cubic shoulder 1 - (1 - d/W)^3 over W = 6 mm: slope 0 and curvature 0 where it meets the face (no crease), 3*1.2/6 = 31 deg at the arris -->
<divide name="cu_x0" type="float"><input name="in1" type="float" nodename="rr_d" /><input name="in2" type="float" value="0.006" /></divide>
<clamp name="cu_x" type="float"><input name="in" type="float" nodename="cu_x0" /></clamp>
<subtract name="cu_o" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="cu_x" /></subtract>
<multiply name="cu_o2" type="float"><input name="in1" type="float" nodename="cu_o" /><input name="in2" type="float" nodename="cu_o" /></multiply>
<multiply name="cu_o3" type="float"><input name="in1" type="float" nodename="cu_o2" /><input name="in2" type="float" nodename="cu_o" /></multiply>
<multiply name="h_cush" type="float"><input name="in1" type="float" nodename="cu_o3" /><input name="in2" type="float" value="-0.0012" /></multiply>
<smoothstep name="cu_tile" type="float"><input name="in" type="float" nodename="rr_d" /><input name="low" type="float" value="-0.00025" /><input name="high" type="float" value="0.00025" /></smoothstep>
```

### Hand-cut outline: per-corner randoms and per-edge insets

`cell·2 + corner` keys one random per tile corner. Each edge insets by the mix of its two corners, so edges tilt
independently and joints vary 3–5 mm. For one eval of the nearest corner's random (chips), key on
`cell·2 + floor(fr·2)`.

```xml
<!-- in: rg_loc, rg_cell (a grid layout). out: hm_d (m to a hand-cut, out-of-square outline, + inside), hm_c00..hm_c11 (one random per tile corner). Each corner is inset 0..1.2 mm on top of the grid grout; each edge interpolates its two corners, so edges tilt independently -->
<multiply name="hm_k" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="float" value="2" /></multiply>
<add name="hm_s00" type="vector2"><input name="in1" type="vector2" nodename="hm_k" /><input name="in2" type="vector2" value="60.37, 20.61" /></add>
<cellnoise2d name="hm_c00" type="float"><input name="texcoord" type="vector2" nodename="hm_s00" /></cellnoise2d>
<add name="hm_s10" type="vector2"><input name="in1" type="vector2" nodename="hm_k" /><input name="in2" type="vector2" value="61.37, 20.61" /></add>
<cellnoise2d name="hm_c10" type="float"><input name="texcoord" type="vector2" nodename="hm_s10" /></cellnoise2d>
<add name="hm_s01" type="vector2"><input name="in1" type="vector2" nodename="hm_k" /><input name="in2" type="vector2" value="60.37, 21.61" /></add>
<cellnoise2d name="hm_c01" type="float"><input name="texcoord" type="vector2" nodename="hm_s01" /></cellnoise2d>
<add name="hm_s11" type="vector2"><input name="in1" type="vector2" nodename="hm_k" /><input name="in2" type="vector2" value="61.37, 21.61" /></add>
<cellnoise2d name="hm_c11" type="float"><input name="texcoord" type="vector2" nodename="hm_s11" /></cellnoise2d>
<divide name="hm_st0" type="vector2"><input name="in1" type="vector2" nodename="rg_loc" /><input name="in2" type="vector2" value="0.153, 0.078" /></divide>
<add name="hm_st" type="vector2"><input name="in1" type="vector2" nodename="hm_st0" /><input name="in2" type="vector2" value="0.5, 0.5" /></add>
<separate2 name="hm_sts" type="multioutput"><input name="in" type="vector2" nodename="hm_st" /></separate2>
<mix name="hm_il" type="float"><input name="bg" type="float" nodename="hm_c00" /><input name="fg" type="float" nodename="hm_c01" /><input name="mix" type="float" nodename="hm_sts" output="outy" /></mix>
<mix name="hm_ir" type="float"><input name="bg" type="float" nodename="hm_c10" /><input name="fg" type="float" nodename="hm_c11" /><input name="mix" type="float" nodename="hm_sts" output="outy" /></mix>
<mix name="hm_ib" type="float"><input name="bg" type="float" nodename="hm_c00" /><input name="fg" type="float" nodename="hm_c10" /><input name="mix" type="float" nodename="hm_sts" output="outx" /></mix>
<mix name="hm_it" type="float"><input name="bg" type="float" nodename="hm_c01" /><input name="fg" type="float" nodename="hm_c11" /><input name="mix" type="float" nodename="hm_sts" output="outx" /></mix>
<combine2 name="hm_ilb" type="vector2"><input name="in1" type="float" nodename="hm_il" /><input name="in2" type="float" nodename="hm_ib" /></combine2>
<combine2 name="hm_irt" type="vector2"><input name="in1" type="float" nodename="hm_ir" /><input name="in2" type="float" nodename="hm_it" /></combine2>
<multiply name="hm_lo0" type="vector2"><input name="in1" type="vector2" nodename="hm_ilb" /><input name="in2" type="float" value="0.0012" /></multiply>
<multiply name="hm_hi0" type="vector2"><input name="in1" type="vector2" nodename="hm_irt" /><input name="in2" type="float" value="0.0012" /></multiply>
<add name="hm_lo1" type="vector2"><input name="in1" type="vector2" nodename="rg_loc" /><input name="in2" type="vector2" value="0.075, 0.0375" /></add>
<subtract name="hm_lo" type="vector2"><input name="in1" type="vector2" nodename="hm_lo1" /><input name="in2" type="vector2" nodename="hm_lo0" /></subtract>
<subtract name="hm_hi1" type="vector2"><input name="in1" type="vector2" value="0.075, 0.0375" /><input name="in2" type="vector2" nodename="rg_loc" /></subtract>
<subtract name="hm_hi" type="vector2"><input name="in1" type="vector2" nodename="hm_hi1" /><input name="in2" type="vector2" nodename="hm_hi0" /></subtract>
<min name="hm_m" type="vector2"><input name="in1" type="vector2" nodename="hm_lo" /><input name="in2" type="vector2" nodename="hm_hi" /></min>
<separate2 name="hm_ms" type="multioutput"><input name="in" type="vector2" nodename="hm_m" /></separate2>
<min name="hm_d" type="float"><input name="in1" type="float" nodename="hm_ms" output="outx" /><input name="in2" type="float" nodename="hm_ms" output="outy" /></min>
```

### Per-tile reseed and slab coordinates

`uv·f + id·97` gives every tile its own patch of a shared noise (undulation, mottle). For veins or grain, rotate the
local frame by a random angle and offset it into one big slab, so patterns break at every joint.

```xml
<!-- in: uv, rg_loc, rg_id, rg_cell. out: rs_n (fBm 40/m reseeded per tile: uv*f + id*97), sl_p (slab coords, m: tile-local frame turned by a random angle and shifted 0..7 m into one shared field, so veins or grain break at every joint) -->
<multiply name="rs_p0" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="40" /></multiply>
<multiply name="rs_o" type="float"><input name="in1" type="float" nodename="rg_id" /><input name="in2" type="float" value="97" /></multiply>
<add name="rs_p" type="vector2"><input name="in1" type="vector2" nodename="rs_p0" /><input name="in2" type="float" nodename="rs_o" /></add>
<fractal2d name="rs_n" type="float"><input name="texcoord" type="vector2" nodename="rs_p" /><input name="octaves" type="integer" value="3" /></fractal2d>
<add name="sl_s" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="410.37, 90.61" /></add>
<cellnoise2d name="sl_r" type="float"><input name="texcoord" type="vector2" nodename="sl_s" /></cellnoise2d>
<multiply name="sl_ang" type="float"><input name="in1" type="float" nodename="sl_r" /><input name="in2" type="float" value="360" /></multiply>
<rotate2d name="sl_rot" type="vector2"><input name="in" type="vector2" nodename="rg_loc" /><input name="amount" type="float" nodename="sl_ang" /></rotate2d>
<multiply name="sl_off" type="vector2"><input name="in1" type="vector2" value="7.3, 5.9" /><input name="in2" type="float" nodename="rg_id" /></multiply>
<add name="sl_p" type="vector2"><input name="in1" type="vector2" nodename="sl_rot" /><input name="in2" type="vector2" nodename="sl_off" /></add>
```

### Book-match: mirror flitch coordinate

Book-matched veneer mirrors the figure at every seam. With leaves L wide across U, the flitch coordinate
**a = L − |mod(u, 2L) − L|** is a triangle wave (4 nodes): any pattern that is a function of (a, along) is then exactly
symmetric about every seam, with no seam-line artefact (measured: ≤ 1 grey level against its mirror). Use `bm_ds`
(distance to the nearest seam) for a glue hairline. **Leaves 2–3 repeat leaves 0–1**: a only spans one leaf width, so
every pair shows the same flitch. Real panels are cut from successive slices, so shift the along-grain coordinate per
panel (here 0.31 m per 600 mm panel), or use a four-way (book-and-slip) match by mirroring along V too. The figure and
lacquer that read it are in [grain.md](grain.md#book-matched-figure). From [`bookmatched-veneer`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/bookmatched-veneer/gen.py).

```xml
<!-- in: uv_sep. out: bm_a (flitch m across the grain, 0..L), bm_q (flitch coords: across, along), bm_ds (m to the nearest seam). Book-matched leaves L = 150 mm wide across U: a = L - |mod(u, 2L) - L| is a triangle wave, so every seam is an exact mirror line (4 nodes). Leaves 2-3 repeat leaves 0-1, so shift the along-grain coordinate per panel (600 mm panels here, 0.31 m each) or repeats show -->
<modulo name="bm_t" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.3" /></modulo>
<subtract name="bm_2" type="float"><input name="in1" type="float" nodename="bm_t" /><input name="in2" type="float" value="0.15" /></subtract>
<absval name="bm_3" type="float"><input name="in" type="float" nodename="bm_2" /></absval>
<subtract name="bm_a" type="float"><input name="in1" type="float" value="0.15" /><input name="in2" type="float" nodename="bm_3" /></subtract>
<subtract name="bm_5" type="float"><input name="in1" type="float" value="0.15" /><input name="in2" type="float" nodename="bm_a" /></subtract>
<min name="bm_ds" type="float"><input name="in1" type="float" nodename="bm_a" /><input name="in2" type="float" nodename="bm_5" /></min>
<divide name="bm_7" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.6" /></divide>
<floor name="bm_8" type="float"><input name="in" type="float" nodename="bm_7" /></floor>
<multiply name="bm_9" type="float"><input name="in1" type="float" nodename="bm_8" /><input name="in2" type="float" value="0.31" /></multiply>
<add name="bm_b" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" nodename="bm_9" /></add>
<combine2 name="bm_q" type="vector2"><input name="in1" type="float" nodename="bm_a" /><input name="in2" type="float" nodename="bm_b" /></combine2>
```

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

```xml
<!-- in: uv. out: h_pits (m), p_bowl (0..1 pit mask). 30 cells/m, jitter 0.7, r = 0.05..0.15 cell, 35% of cells empty, depth r/4 (~27 deg rim) -->
<multiply name="uv_p" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="30" /></multiply>
<worleynoise2d name="p_f1" type="float"><input name="texcoord" type="vector2" nodename="uv_p" /><input name="jitter" type="float" value="0.7" /></worleynoise2d>
<worleynoise2d name="p_id" type="float"><input name="texcoord" type="vector2" nodename="uv_p" /><input name="jitter" type="float" value="0.7" /><input name="style" type="integer" value="1" /></worleynoise2d>
<ifgreater name="p_on" type="float"><input name="value1" type="float" nodename="p_id" /><input name="value2" type="float" value="0.35" /><input name="in1" type="float" value="1" /><input name="in2" type="float" value="0" /></ifgreater>
<multiply name="p_r0" type="float"><input name="in1" type="float" nodename="p_id" /><input name="in2" type="float" value="0.154" /></multiply>
<subtract name="p_r1" type="float"><input name="in1" type="float" nodename="p_r0" /><input name="in2" type="float" value="0.004" /></subtract>
<multiply name="p_r2" type="float"><input name="in1" type="float" nodename="p_r1" /><input name="in2" type="float" nodename="p_on" /></multiply>
<add name="p_r" type="float"><input name="in1" type="float" nodename="p_r2" /><input name="in2" type="float" value="0.0001" /></add>
<divide name="p_t" type="float"><input name="in1" type="float" nodename="p_f1" /><input name="in2" type="float" nodename="p_r" /></divide>
<multiply name="p_t2" type="float"><input name="in1" type="float" nodename="p_t" /><input name="in2" type="float" nodename="p_t" /></multiply>
<subtract name="p_b0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="p_t2" /></subtract>
<max name="p_bowl" type="float"><input name="in1" type="float" nodename="p_b0" /><input name="in2" type="float" value="0" /></max>
<multiply name="p_depth" type="float"><input name="in1" type="float" nodename="p_r" /><input name="in2" type="float" value="-0.0083" /></multiply>
<multiply name="h_pits" type="float"><input name="in1" type="float" nodename="p_bowl" /><input name="in2" type="float" nodename="p_depth" /></multiply>
```

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

```xml
<!-- in: uv. out: t_col (per-chip palette colour), t_chip (0 in joints, 1 on chips), t_id. 30 cells/m, 6 colours -->
<multiply name="uv_t" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="30" /></multiply>
<worleynoise2d name="t_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_t" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="t_id" type="float"><input name="texcoord" type="vector2" nodename="uv_t" /><input name="jitter" type="float" value="1" /><input name="style" type="integer" value="1" /></worleynoise2d>
<dotproduct name="t_e" type="float"><input name="in1" type="vector2" nodename="t_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<smoothstep name="t_chip" type="float"><input name="in" type="float" nodename="t_e" /><input name="low" type="float" value="0.08" /><input name="high" type="float" value="0.1" /></smoothstep>
<multiply name="t_pal_k0" type="float"><input name="in1" type="float" nodename="t_id" /><input name="in2" type="float" value="13.7" /></multiply>
<modulo name="t_pal_k" type="float"><input name="in1" type="float" nodename="t_pal_k0" /><input name="in2" type="float" value="1" /></modulo>
<ifgreater name="t_pal_c1" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.1667" /><input name="in1" type="color3" value="0.55, 0.53, 0.5" /><input name="in2" type="color3" value="0.05, 0.05, 0.05" /></ifgreater>
<ifgreater name="t_pal_c2" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.3333" /><input name="in1" type="color3" value="0.35, 0.12, 0.08" /><input name="in2" type="color3" nodename="t_pal_c1" /></ifgreater>
<ifgreater name="t_pal_c3" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.5" /><input name="in1" type="color3" value="0.12, 0.2, 0.14" /><input name="in2" type="color3" nodename="t_pal_c2" /></ifgreater>
<ifgreater name="t_pal_c4" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.6667" /><input name="in1" type="color3" value="0.45, 0.33, 0.18" /><input name="in2" type="color3" nodename="t_pal_c3" /></ifgreater>
<ifgreater name="t_pal_c5" type="color3"><input name="value1" type="float" nodename="t_pal_k" /><input name="value2" type="float" value="0.8333" /><input name="in1" type="color3" value="0.25, 0.27, 0.3" /><input name="in2" type="color3" nodename="t_pal_c4" /></ifgreater>
<multiply name="t_br0" type="float"><input name="in1" type="float" nodename="t_id" /><input name="in2" type="float" value="0.5" /></multiply>
<add name="t_br" type="float"><input name="in1" type="float" nodename="t_br0" /><input name="in2" type="float" value="0.75" /></add>
<multiply name="t_col" type="color3"><input name="in1" type="color3" nodename="t_pal_c5" /><input name="in2" type="float" nodename="t_br" /></multiply>
```

### Domed pebbles (smooth-min plus crown)

`smin((F2−F1−gap)/2, R−F1, k)`, then smoothstep, times a crown `1 − 0.6(F1/0.7)²` that removes the medial crease.
Raising R packs the pebbles tighter; at 0.42 they float in the matrix. At `detail` these stones show flat plateaus
with faceted, cell-shaped rims: fine for crushed, tumbled stone, but for water-worn pebbles use the paraboloid
[river pebbles](aggregate.md#rounded-river-pebbles).

```xml
<!-- in: uv. out: h_peb (m, 2.5..4 mm), b_id, b_col, b_mask (pebble vs matrix). 25 cells/m, jitter 0.85, gap 0.06, R 0.55, k 0.3 -->
<multiply name="uv_b" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="25" /></multiply>
<worleynoise2d name="b_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_b" /><input name="jitter" type="float" value="0.85" /></worleynoise2d>
<worleynoise2d name="b_id" type="float"><input name="texcoord" type="vector2" nodename="uv_b" /><input name="jitter" type="float" value="0.85" /><input name="style" type="integer" value="1" /></worleynoise2d>
<extract name="b_f1" type="float"><input name="in" type="vector2" nodename="b_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="b_e" type="float"><input name="in1" type="vector2" nodename="b_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<subtract name="b_a0" type="float"><input name="in1" type="float" nodename="b_e" /><input name="in2" type="float" value="0.06" /></subtract>
<multiply name="b_a" type="float"><input name="in1" type="float" nodename="b_a0" /><input name="in2" type="float" value="0.5" /></multiply>
<subtract name="b_b" type="float"><input name="in1" type="float" value="0.55" /><input name="in2" type="float" nodename="b_f1" /></subtract>
<subtract name="b_ab" type="float"><input name="in1" type="float" nodename="b_a" /><input name="in2" type="float" nodename="b_b" /></subtract>
<absval name="b_abs" type="float"><input name="in" type="float" nodename="b_ab" /></absval>
<subtract name="b_h0" type="float"><input name="in1" type="float" value="0.3" /><input name="in2" type="float" nodename="b_abs" /></subtract>
<max name="b_h1" type="float"><input name="in1" type="float" nodename="b_h0" /><input name="in2" type="float" value="0" /></max>
<divide name="b_h" type="float"><input name="in1" type="float" nodename="b_h1" /><input name="in2" type="float" value="0.3" /></divide>
<multiply name="b_hh" type="float"><input name="in1" type="float" nodename="b_h" /><input name="in2" type="float" nodename="b_h" /></multiply>
<multiply name="b_corr" type="float"><input name="in1" type="float" nodename="b_hh" /><input name="in2" type="float" value="0.075" /></multiply>
<min name="b_min" type="float"><input name="in1" type="float" nodename="b_a" /><input name="in2" type="float" nodename="b_b" /></min>
<subtract name="b_s" type="float"><input name="in1" type="float" nodename="b_min" /><input name="in2" type="float" nodename="b_corr" /></subtract>
<smoothstep name="b_prof" type="float"><input name="in" type="float" nodename="b_s" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.18" /></smoothstep>
<divide name="b_q" type="float"><input name="in1" type="float" nodename="b_f1" /><input name="in2" type="float" value="0.7" /></divide>
<multiply name="b_q2" type="float"><input name="in1" type="float" nodename="b_q" /><input name="in2" type="float" nodename="b_q" /></multiply>
<multiply name="b_q3" type="float"><input name="in1" type="float" nodename="b_q2" /><input name="in2" type="float" value="0.6" /></multiply>
<subtract name="b_crown" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="b_q3" /></subtract>
<multiply name="b_dome" type="float"><input name="in1" type="float" nodename="b_prof" /><input name="in2" type="float" nodename="b_crown" /></multiply>
<multiply name="b_hs0" type="float"><input name="in1" type="float" nodename="b_id" /><input name="in2" type="float" value="0.0015" /></multiply>
<add name="b_hs" type="float"><input name="in1" type="float" nodename="b_hs0" /><input name="in2" type="float" value="0.0025" /></add>
<multiply name="h_peb" type="float"><input name="in1" type="float" nodename="b_dome" /><input name="in2" type="float" nodename="b_hs" /></multiply>
<mix name="b_col" type="color3"><input name="bg" type="color3" value="0.42, 0.36, 0.28" /><input name="fg" type="color3" value="0.2, 0.2, 0.21" /><input name="mix" type="float" nodename="b_id" /></mix>
<smoothstep name="b_mask" type="float"><input name="in" type="float" nodename="b_s" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.03" /></smoothstep>
```

### Angular stones

`min(F2−F1 − inset, R − F1)`, with R ≥ 0.8 (0.6 gives D shapes). The 3 mm edge ramp stair-steps on `plane`, so for
that view widen the smoothstep to ≥ 0.16 cell or lower the height. With these straight F2−F1 edges the stones pack
like terrazzo; for fractured outlines add lump noise to the circle term, `R − F1 + n(uv·220)·0.2` (a ~3 mm lump), as in
[polished-floor](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/polished-floor-r5/gen.py). A fixed F2−F1 gap between two neighbours reads as one cracked
stone, so lower the presence (fewer cells hold a stone). Judged at `detail`, F2−F1 relief needs jitter ≤ 0.75
([gotcha 17](../NOISE_COOKBOOK.md#2-gotchas-and-renderer-bugs-to-route-around)).

```xml
<!-- in: uv. out: h_stone (m, 1.8..3 mm), a_id, a_col. 20 cells/m, jitter 1, inset 0.07, R 0.85 -->
<multiply name="uv_st" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="20" /></multiply>
<worleynoise2d name="a_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_st" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="a_id" type="float"><input name="texcoord" type="vector2" nodename="uv_st" /><input name="jitter" type="float" value="1" /><input name="style" type="integer" value="1" /></worleynoise2d>
<extract name="a_f1" type="float"><input name="in" type="vector2" nodename="a_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="a_e" type="float"><input name="in1" type="vector2" nodename="a_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<subtract name="a_e1" type="float"><input name="in1" type="float" nodename="a_e" /><input name="in2" type="float" value="0.07" /></subtract>
<subtract name="a_e2" type="float"><input name="in1" type="float" value="0.85" /><input name="in2" type="float" nodename="a_f1" /></subtract>
<min name="a_s" type="float"><input name="in1" type="float" nodename="a_e1" /><input name="in2" type="float" nodename="a_e2" /></min>
<smoothstep name="a_prof" type="float"><input name="in" type="float" nodename="a_s" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.06" /></smoothstep>
<multiply name="a_hs0" type="float"><input name="in1" type="float" nodename="a_id" /><input name="in2" type="float" value="0.0012" /></multiply>
<add name="a_hs" type="float"><input name="in1" type="float" nodename="a_hs0" /><input name="in2" type="float" value="0.0018" /></add>
<multiply name="h_stone" type="float"><input name="in1" type="float" nodename="a_prof" /><input name="in2" type="float" nodename="a_hs" /></multiply>
<mix name="a_col" type="color3"><input name="bg" type="color3" value="0.5, 0.47, 0.42" /><input name="fg" type="color3" value="0.24, 0.22, 0.2" /><input name="mix" type="float" nodename="a_id" /></mix>
```

### Faceted chips

The max of two rotated, offset layers of `cone(F1) · smoothstep(F2−F1, 0, 0.12)`, 3 mm deep. A shallower cone reads as
crazed plaster.

```xml
<!-- in: uv. out: h_chip (m, down to -3 mm). Two rotated/offset 30/m worley layers, cone r 0.6, rim smoothstep 0.12 -->
<multiply name="uv_k" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="30" /></multiply>
<rotate2d name="uv_k2r" type="vector2"><input name="in" type="vector2" nodename="uv_k" /><input name="amount" type="float" value="37" /></rotate2d>
<add name="uv_k2" type="vector2"><input name="in1" type="vector2" nodename="uv_k2r" /><input name="in2" type="vector2" value="17.3, 5.1" /></add>
<worleynoise2d name="k1_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_k" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<extract name="k1_f1" type="float"><input name="in" type="vector2" nodename="k1_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="k1_e" type="float"><input name="in1" type="vector2" nodename="k1_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<divide name="k1_c0" type="float"><input name="in1" type="float" nodename="k1_f1" /><input name="in2" type="float" value="0.6" /></divide>
<subtract name="k1_c1" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="k1_c0" /></subtract>
<max name="k1_cone" type="float"><input name="in1" type="float" nodename="k1_c1" /><input name="in2" type="float" value="0" /></max>
<smoothstep name="k1_rim" type="float"><input name="in" type="float" nodename="k1_e" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.12" /></smoothstep>
<multiply name="k1" type="float"><input name="in1" type="float" nodename="k1_cone" /><input name="in2" type="float" nodename="k1_rim" /></multiply>
<worleynoise2d name="k2_w" type="vector2"><input name="texcoord" type="vector2" nodename="uv_k2" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<extract name="k2_f1" type="float"><input name="in" type="vector2" nodename="k2_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="k2_e" type="float"><input name="in1" type="vector2" nodename="k2_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<divide name="k2_c0" type="float"><input name="in1" type="float" nodename="k2_f1" /><input name="in2" type="float" value="0.6" /></divide>
<subtract name="k2_c1" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="k2_c0" /></subtract>
<max name="k2_cone" type="float"><input name="in1" type="float" nodename="k2_c1" /><input name="in2" type="float" value="0" /></max>
<smoothstep name="k2_rim" type="float"><input name="in" type="float" nodename="k2_e" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.12" /></smoothstep>
<multiply name="k2" type="float"><input name="in1" type="float" nodename="k2_cone" /><input name="in2" type="float" nodename="k2_rim" /></multiply>
<max name="k_chip" type="float"><input name="in1" type="float" nodename="k1" /><input name="in2" type="float" nodename="k2" /></max>
<multiply name="h_chip" type="float"><input name="in1" type="float" nodename="k_chip" /><input name="in2" type="float" value="-0.003" /></multiply>
```

### Cracks with taper

The presence mask scales the **threshold** (full-depth cracks that narrow to points), not the output (ghost lines).
Width ≈ 1.3·0.03/4 m before the warp, and 2–4× thinner after. That width is 2t/(|∇(F2−F1)|·f), so the rule holds only
where |∇(F2−F1)| ≈ 1.5–2 (mid-edge); short edges far from their points smear into wedges. For a fixed width use
[true-distance cracks](#true-distance-cracks-and-t-junctions). All three crack recipes here draw a uniform network
(crazing, crackle glaze); for a few long structural cracks use [sparse cracks](weathering.md#sparse-structural-cracks). Cracks under 2 px break into dots, so raise t before you
add a fine warp. The `max(t, 1e-4)` floor alone still leaves a hairline where F2−F1 is exactly 0, so the mask is
also gated by `smoothstep(t0, 2e-4, 6e-4)` (the true-distance and child cracks below do the same).

```xml
<!-- in: uv, uv_w (warped uv, m). out: crack (0..1), h_crack (m, -3 mm). 4 cells/m; presence mask scales the threshold, so cracks taper to points; the gate smoothstep(t0, 2e-4, 6e-4) removes the hairline left where t sits on its 1e-4 floor -->
<multiply name="uv_c" type="vector2"><input name="in1" type="vector2" nodename="uv_w" /><input name="in2" type="float" value="4" /></multiply>
<worleynoise2d name="c_w12" type="vector2"><input name="texcoord" type="vector2" nodename="uv_c" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<dotproduct name="c_e" type="float"><input name="in1" type="vector2" nodename="c_w12" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<multiply name="uv_cm" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="2.5" /></multiply>
<noise2d name="c_m0" type="float"><input name="texcoord" type="vector2" nodename="uv_cm" /><input name="amplitude" type="float" value="0.5" /><input name="pivot" type="float" value="0.5" /></noise2d>
<smoothstep name="c_mask" type="float"><input name="in" type="float" nodename="c_m0" /><input name="low" type="float" value="0.3" /><input name="high" type="float" value="0.55" /></smoothstep>
<multiply name="c_t0" type="float"><input name="in1" type="float" nodename="c_mask" /><input name="in2" type="float" value="0.03" /></multiply>
<max name="c_t" type="float"><input name="in1" type="float" nodename="c_t0" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="c_s" type="float"><input name="in" type="float" nodename="c_e" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="c_t" /></smoothstep>
<subtract name="c_line" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="c_s" /></subtract>
<smoothstep name="c_gate" type="float"><input name="in" type="float" nodename="c_t0" /><input name="low" type="float" value="0.0002" /><input name="high" type="float" value="0.0006" /></smoothstep>
<multiply name="crack" type="float"><input name="in1" type="float" nodename="c_line" /><input name="in2" type="float" nodename="c_gate" /></multiply>
<multiply name="h_crack" type="float"><input name="in1" type="float" nodename="crack" /><input name="in2" type="float" value="-0.003" /></multiply>
```

### Flagstones or crazy paving

5 stones/m on the warped texcoord. The joint is F2−F1 < 0.05 (≈ 1.3 cm) with an arris up to 0.11, and the id on the
**same** warped texcoord sets +0..2 mm and the colour.

```xml
<!-- in: uv_w (warped uv, m). out: h_flag (m, 4..6 mm tops), f_top (1 on stone, 0 in joint), f_id. 5 stones/m, joint F2-F1 < 0.05 (~1.3 cm), arris to 0.11 -->
<multiply name="uv_fl" type="vector2"><input name="in1" type="vector2" nodename="uv_w" /><input name="in2" type="float" value="5" /></multiply>
<worleynoise2d name="f_w12" type="vector2"><input name="texcoord" type="vector2" nodename="uv_fl" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="f_id" type="float"><input name="texcoord" type="vector2" nodename="uv_fl" /><input name="jitter" type="float" value="1" /><input name="style" type="integer" value="1" /></worleynoise2d>
<dotproduct name="f_e" type="float"><input name="in1" type="vector2" nodename="f_w12" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<smoothstep name="f_top" type="float"><input name="in" type="float" nodename="f_e" /><input name="low" type="float" value="0.05" /><input name="high" type="float" value="0.11" /></smoothstep>
<multiply name="f_hs0" type="float"><input name="in1" type="float" nodename="f_id" /><input name="in2" type="float" value="0.002" /></multiply>
<add name="f_hs" type="float"><input name="in1" type="float" nodename="f_hs0" /><input name="in2" type="float" value="0.004" /></add>
<multiply name="h_flag" type="float"><input name="in1" type="float" nodename="f_top" /><input name="in2" type="float" nodename="f_hs" /></multiply>
```

### Sparse features, never clipped

Jitter 0.4 allows r ≤ 0.3 cell: 55% of cells present, r 0.1..0.28. If you need the local offset vector (ellipses,
orientation), use the manual jittered grid (`g_*` in `cookbook_cells_b.mtlx`, [cellular §5](../noise-lab/cellular/FINDINGS.md)).

```xml
<!-- in: uv. out: h_sparse (m), v_mask. 8 cells/m, jitter 0.4 so r <= 0.3 cell never clips; 45% of cells empty, r 0.1..0.28 cell -->
<multiply name="uv_g" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="8" /></multiply>
<worleynoise2d name="v_f1" type="float"><input name="texcoord" type="vector2" nodename="uv_g" /><input name="jitter" type="float" value="0.4" /></worleynoise2d>
<worleynoise2d name="v_id" type="float"><input name="texcoord" type="vector2" nodename="uv_g" /><input name="jitter" type="float" value="0.4" /><input name="style" type="integer" value="1" /></worleynoise2d>
<multiply name="v_rk" type="float"><input name="in1" type="float" nodename="v_id" /><input name="in2" type="float" value="7.3" /></multiply>
<modulo name="v_rm" type="float"><input name="in1" type="float" nodename="v_rk" /><input name="in2" type="float" value="1" /></modulo>
<multiply name="v_r0" type="float"><input name="in1" type="float" nodename="v_rm" /><input name="in2" type="float" value="0.18" /></multiply>
<add name="v_r1" type="float"><input name="in1" type="float" nodename="v_r0" /><input name="in2" type="float" value="0.1" /></add>
<ifgreater name="v_r" type="float"><input name="value1" type="float" nodename="v_id" /><input name="value2" type="float" value="0.55" /><input name="in1" type="float" nodename="v_r1" /><input name="in2" type="float" value="0.0001" /></ifgreater>
<divide name="v_t" type="float"><input name="in1" type="float" nodename="v_f1" /><input name="in2" type="float" nodename="v_r" /></divide>
<multiply name="v_t2" type="float"><input name="in1" type="float" nodename="v_t" /><input name="in2" type="float" nodename="v_t" /></multiply>
<subtract name="v_b0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="v_t2" /></subtract>
<max name="v_dome" type="float"><input name="in1" type="float" nodename="v_b0" /><input name="in2" type="float" value="0" /></max>
<multiply name="v_hs" type="float"><input name="in1" type="float" nodename="v_r" /><input name="in2" type="float" value="0.02" /></multiply>
<multiply name="h_sparse" type="float"><input name="in1" type="float" nodename="v_dome" /><input name="in2" type="float" nodename="v_hs" /></multiply>
<smoothstep name="v_mask" type="float"><input name="in" type="float" nodename="v_dome" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.05" /></smoothstep>
```

### True-distance cracks and T-junctions

Dividing F2−F1 by its finite-difference gradient gives the distance to the border in cells, so width = 2t/f
everywhere. Measured with the taper off: median 0.49 mm (design 0.5), p99 3.2 mm, versus 0.73 and 5.1 mm (+33% area)
for raw F2−F1 at the same mid-edge width. Children gated by the parent's `style=1` id stop at the parent border, so
they end in T-junctions. Keep crack depth ≤ ~0.4× the width; deeper renders as beads.

```xml
<!-- in: uv, uv_w (warped uv, m). out: tc_e (true distance to the Voronoi border, cells), tc_id (parent cell id), tc_crack (0..1). 5 cells/m; F2-F1 divided by its finite-difference gradient (step 0.01 cell), so width = 2*t/f m everywhere: here up to 1 mm, tapered by presence -->
<multiply name="tc_p" type="vector2"><input name="in1" type="vector2" nodename="uv_w" /><input name="in2" type="float" value="5" /></multiply>
<add name="tc_px" type="vector2"><input name="in1" type="vector2" nodename="tc_p" /><input name="in2" type="vector2" value="0.01, 0" /></add>
<add name="tc_py" type="vector2"><input name="in1" type="vector2" nodename="tc_p" /><input name="in2" type="vector2" value="0, 0.01" /></add>
<worleynoise2d name="tc_w" type="vector2"><input name="texcoord" type="vector2" nodename="tc_p" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="tc_wx" type="vector2"><input name="texcoord" type="vector2" nodename="tc_px" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="tc_wy" type="vector2"><input name="texcoord" type="vector2" nodename="tc_py" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<worleynoise2d name="tc_id" type="float"><input name="texcoord" type="vector2" nodename="tc_p" /><input name="jitter" type="float" value="1" /><input name="style" type="integer" value="1" /></worleynoise2d>
<dotproduct name="tc_e0" type="float"><input name="in1" type="vector2" nodename="tc_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<dotproduct name="tc_ex" type="float"><input name="in1" type="vector2" nodename="tc_wx" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<dotproduct name="tc_ey" type="float"><input name="in1" type="vector2" nodename="tc_wy" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<subtract name="tc_gx" type="float"><input name="in1" type="float" nodename="tc_ex" /><input name="in2" type="float" nodename="tc_e0" /></subtract>
<subtract name="tc_gy" type="float"><input name="in1" type="float" nodename="tc_ey" /><input name="in2" type="float" nodename="tc_e0" /></subtract>
<combine2 name="tc_g" type="vector2"><input name="in1" type="float" nodename="tc_gx" /><input name="in2" type="float" nodename="tc_gy" /></combine2>
<magnitude name="tc_gm0" type="float"><input name="in" type="vector2" nodename="tc_g" /></magnitude>
<multiply name="tc_gm1" type="float"><input name="in1" type="float" nodename="tc_gm0" /><input name="in2" type="float" value="100" /></multiply>
<max name="tc_gm" type="float"><input name="in1" type="float" nodename="tc_gm1" /><input name="in2" type="float" value="0.3" /></max>
<divide name="tc_e" type="float"><input name="in1" type="float" nodename="tc_e0" /><input name="in2" type="float" nodename="tc_gm" /></divide>
<multiply name="tc_mp" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="2.5" /></multiply>
<noise2d name="tc_m0" type="float"><input name="texcoord" type="vector2" nodename="tc_mp" /><input name="amplitude" type="float" value="0.5" /><input name="pivot" type="float" value="0.5" /></noise2d>
<smoothstep name="tc_m" type="float"><input name="in" type="float" nodename="tc_m0" /><input name="low" type="float" value="0.3" /><input name="high" type="float" value="0.55" /></smoothstep>
<multiply name="tc_t0" type="float"><input name="in1" type="float" nodename="tc_m" /><input name="in2" type="float" value="0.0025" /></multiply>
<max name="tc_t" type="float"><input name="in1" type="float" nodename="tc_t0" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="tc_s" type="float"><input name="in" type="float" nodename="tc_e" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="tc_t" /></smoothstep>
<subtract name="tc_line" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="tc_s" /></subtract>
<smoothstep name="tc_gate" type="float"><input name="in" type="float" nodename="tc_t0" /><input name="low" type="float" value="0.0002" /><input name="high" type="float" value="0.0006" /></smoothstep>
<multiply name="tc_crack" type="float"><input name="in1" type="float" nodename="tc_line" /><input name="in2" type="float" nodename="tc_gate" /></multiply>
```

```xml
<!-- in: uv_w, tc_id, tc_crack. out: hc_crack (parent + children, 0..1), h_hcrack (m, -0.2 mm: deeper on a 1 mm crack is > 30 deg and beads into dots). Children 2.4x finer (12 cells/m), 0.6 mm, only in parent cells with id > 0.35 (~65%): they stop at the parent border, so they end in T-junctions -->
<multiply name="hc_p0" type="vector2"><input name="in1" type="vector2" nodename="uv_w" /><input name="in2" type="float" value="12" /></multiply>
<add name="hc_p" type="vector2"><input name="in1" type="vector2" nodename="hc_p0" /><input name="in2" type="vector2" value="19.37, 44.13" /></add>
<worleynoise2d name="hc_w" type="vector2"><input name="texcoord" type="vector2" nodename="hc_p" /><input name="jitter" type="float" value="1" /></worleynoise2d>
<dotproduct name="hc_e" type="float"><input name="in1" type="vector2" nodename="hc_w" /><input name="in2" type="vector2" value="-1, 1" /></dotproduct>
<smoothstep name="hc_on" type="float"><input name="in" type="float" nodename="tc_id" /><input name="low" type="float" value="0.3" /><input name="high" type="float" value="0.4" /></smoothstep>
<multiply name="hc_t0" type="float"><input name="in1" type="float" nodename="hc_on" /><input name="in2" type="float" value="0.0055" /></multiply>
<max name="hc_t" type="float"><input name="in1" type="float" nodename="hc_t0" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="hc_s" type="float"><input name="in" type="float" nodename="hc_e" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="hc_t" /></smoothstep>
<subtract name="hc_line" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="hc_s" /></subtract>
<smoothstep name="hc_gate" type="float"><input name="in" type="float" nodename="hc_t0" /><input name="low" type="float" value="0.0002" /><input name="high" type="float" value="0.0006" /></smoothstep>
<multiply name="hc_c" type="float"><input name="in1" type="float" nodename="hc_line" /><input name="in2" type="float" nodename="hc_gate" /></multiply>
<multiply name="hc_c2" type="float"><input name="in1" type="float" nodename="hc_c" /><input name="in2" type="float" value="0.7" /></multiply>
<max name="hc_crack" type="float"><input name="in1" type="float" nodename="tc_crack" /><input name="in2" type="float" nodename="hc_c2" /></max>
<multiply name="h_hcrack" type="float"><input name="in1" type="float" nodename="hc_crack" /><input name="in2" type="float" value="-0.0002" /></multiply>
```

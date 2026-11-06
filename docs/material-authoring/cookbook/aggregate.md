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

```xml
<!-- in: uv. out: sd_dome (0..1 grain domes), sd_tone (signed per-grain tone, 0 between grains), h_sand (m). Packed sand: two rotated layers of separate F1 domes 1 - smoothstep(F1, 0.05, 0.35) (r ~0.35 cell), 330/m (3 mm cells, ~2 mm grains) turned 11 deg and 520/m (1.9 mm cells, ~1.3 mm grains) turned -37 deg, jitter 0.85, max of the two; 0.12 mm high (~8 deg). Tint only the domes (sd_tone), so the matrix between them stays neutral -->
<multiply name="sd_1" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="330.0" /></multiply>
<rotate2d name="sd_2" type="vector2"><input name="in" type="vector2" nodename="sd_1" /><input name="amount" type="float" value="11.0" /></rotate2d>
<add name="sd_p0" type="vector2"><input name="in1" type="vector2" nodename="sd_2" /><input name="in2" type="vector2" value="9.1, 2.7" /></add>
<worleynoise2d name="sd_f0" type="float"><input name="texcoord" type="vector2" nodename="sd_p0" /><input name="jitter" type="float" value="0.85" /></worleynoise2d>
<smoothstep name="sd_5" type="float"><input name="in" type="float" nodename="sd_f0" /><input name="low" type="float" value="0.05" /><input name="high" type="float" value="0.35" /></smoothstep>
<subtract name="sd_d0" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="sd_5" /></subtract>
<worleynoise2d name="sd_id0" type="float"><input name="texcoord" type="vector2" nodename="sd_p0" /><input name="jitter" type="float" value="0.85" /><input name="style" type="integer" value="1" /></worleynoise2d>
<multiply name="sd_8" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="520.0" /></multiply>
<rotate2d name="sd_9" type="vector2"><input name="in" type="vector2" nodename="sd_8" /><input name="amount" type="float" value="-37.0" /></rotate2d>
<add name="sd_p1" type="vector2"><input name="in1" type="vector2" nodename="sd_9" /><input name="in2" type="vector2" value="1.3, 44.9" /></add>
<worleynoise2d name="sd_f1" type="float"><input name="texcoord" type="vector2" nodename="sd_p1" /><input name="jitter" type="float" value="0.85" /></worleynoise2d>
<smoothstep name="sd_12" type="float"><input name="in" type="float" nodename="sd_f1" /><input name="low" type="float" value="0.05" /><input name="high" type="float" value="0.35" /></smoothstep>
<subtract name="sd_d1" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="sd_12" /></subtract>
<worleynoise2d name="sd_id1" type="float"><input name="texcoord" type="vector2" nodename="sd_p1" /><input name="jitter" type="float" value="0.85" /><input name="style" type="integer" value="1" /></worleynoise2d>
<max name="sd_dome" type="float"><input name="in1" type="float" nodename="sd_d0" /><input name="in2" type="float" nodename="sd_d1" /></max>
<subtract name="sd_16" type="float"><input name="in1" type="float" nodename="sd_id0" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="sd_17" type="float"><input name="in1" type="float" nodename="sd_d0" /><input name="in2" type="float" nodename="sd_16" /></multiply>
<subtract name="sd_18" type="float"><input name="in1" type="float" nodename="sd_id1" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="sd_19" type="float"><input name="in1" type="float" nodename="sd_d1" /><input name="in2" type="float" nodename="sd_18" /></multiply>
<add name="sd_tone" type="float"><input name="in1" type="float" nodename="sd_17" /><input name="in2" type="float" nodename="sd_19" /></add>
<multiply name="h_sand" type="float"><input name="in1" type="float" nodename="sd_dome" /><input name="in2" type="float" value="0.00012" /></multiply>
```

### Sparse coarse grit

The layer that turns paste into stone at `closeup`: 55% of 3.3 mm cells hold one 0.8–1.5 mm grain. Jitter 0.55 with
r ≤ 0.22 cell obeys the clipping rule, and a grain-scale warp (1700/m, 0.1 mm, s = 0.17) makes the outlines irregular.
Height uses the dome (`gt_dome`); colour uses a flat-topped mask (`gt_m`, ramp 0.35 r), so each grain has a crisp edge
and a soft relief.

```xml
<!-- in: uv. out: gt_dome (0..1, for height), gt_m (0..1 flat-topped colour mask), gt_tone (signed per-grain tone), h_grit (m). Sparse coarse grains, the layer that makes paste read as stone at closeup: 300/m (3.3 mm cells), jitter 0.55, 55% of cells hold a grain r 0.12..0.22 cell (0.8..1.5 mm across; r <= (1 - jitter)/2, so none clip), on a grain-scale warp (1700/m, 0.1 mm, s = 0.17) so outlines are irregular. Dome smoothstep(r - F1, 0, r), 0.04 mm (~8 deg max) -->
<multiply name="gt_1" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="1700.0" /></multiply>
<add name="gt_2" type="vector2"><input name="in1" type="vector2" nodename="gt_1" /><input name="in2" type="vector2" value="5.3, 71.9" /></add>
<noise2d name="gt_3" type="vector3"><input name="texcoord" type="vector2" nodename="gt_2" /><input name="amplitude" type="vector3" value="0.0001, 0.0001, 0.0" /></noise2d>
<convert name="gt_4" type="vector2"><input name="in" type="vector3" nodename="gt_3" /></convert>
<add name="gt_5" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" nodename="gt_4" /></add>
<multiply name="gt_6" type="vector2"><input name="in1" type="vector2" nodename="gt_5" /><input name="in2" type="float" value="300.0" /></multiply>
<add name="gt_p" type="vector2"><input name="in1" type="vector2" nodename="gt_6" /><input name="in2" type="vector2" value="8.8, 40.3" /></add>
<worleynoise2d name="gt_f1" type="float"><input name="texcoord" type="vector2" nodename="gt_p" /><input name="jitter" type="float" value="0.55" /></worleynoise2d>
<worleynoise2d name="gt_id" type="float"><input name="texcoord" type="vector2" nodename="gt_p" /><input name="jitter" type="float" value="0.55" /><input name="style" type="integer" value="1" /></worleynoise2d>
<multiply name="gt_10" type="float"><input name="in1" type="float" nodename="gt_id" /><input name="in2" type="float" value="5.17" /></multiply>
<add name="gt_11" type="float"><input name="in1" type="float" nodename="gt_10" /><input name="in2" type="float" value="0.3" /></add>
<fract name="gt_12" type="float"><input name="in" type="float" nodename="gt_11" /></fract>
<multiply name="gt_13" type="float"><input name="in1" type="float" nodename="gt_12" /><input name="in2" type="float" value="0.1" /></multiply>
<add name="gt_14" type="float"><input name="in1" type="float" nodename="gt_13" /><input name="in2" type="float" value="0.12" /></add>
<ifgreater name="gt_15" type="float"><input name="value1" type="float" nodename="gt_id" /><input name="value2" type="float" value="0.45" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="gt_r" type="float"><input name="in1" type="float" nodename="gt_14" /><input name="in2" type="float" nodename="gt_15" /></multiply>
<subtract name="gt_d" type="float"><input name="in1" type="float" nodename="gt_r" /><input name="in2" type="float" nodename="gt_f1" /></subtract>
<max name="gt_18" type="float"><input name="in1" type="float" nodename="gt_r" /><input name="in2" type="float" value="0.01" /></max>
<smoothstep name="gt_dome" type="float"><input name="in" type="float" nodename="gt_d" /><input name="low" type="float" value="0.0" /><input name="high" type="float" nodename="gt_18" /></smoothstep>
<multiply name="gt_20" type="float"><input name="in1" type="float" nodename="gt_r" /><input name="in2" type="float" value="0.35" /></multiply>
<max name="gt_21" type="float"><input name="in1" type="float" nodename="gt_20" /><input name="in2" type="float" value="0.004" /></max>
<smoothstep name="gt_m" type="float"><input name="in" type="float" nodename="gt_d" /><input name="low" type="float" value="0.0" /><input name="high" type="float" nodename="gt_21" /></smoothstep>
<multiply name="gt_23" type="float"><input name="in1" type="float" nodename="gt_id" /><input name="in2" type="float" value="11.9" /></multiply>
<add name="gt_24" type="float"><input name="in1" type="float" nodename="gt_23" /><input name="in2" type="float" value="0.3" /></add>
<fract name="gt_25" type="float"><input name="in" type="float" nodename="gt_24" /></fract>
<subtract name="gt_26" type="float"><input name="in1" type="float" nodename="gt_25" /><input name="in2" type="float" value="0.6" /></subtract>
<multiply name="gt_tone" type="float"><input name="in1" type="float" nodename="gt_m" /><input name="in2" type="float" nodename="gt_26" /></multiply>
<multiply name="h_grit" type="float"><input name="in1" type="float" nodename="gt_dome" /><input name="in2" type="float" value="0.00004" /></multiply>
```

### Rounded river pebbles

`max(1 − (F1/R)², 0) · smoothstep(F2 − F1, 0.04, 0.28)`: a paraboloid per stone, gated to 0 before the cell border so
per-stone R and height never jump. R comes from the stone id (0.24–0.46 cell), which gives the size variety. Keep the
gate short: a wider one (e.g. 0.04..0.4) reaches the kinks of F2−F1 inside the cell and creases the domes, and a stone
that crowds its neighbour gets a flattened side. Don't layer two worley grids for mixed sizes; where their stones
overlap they leave crescent slivers. Jitter 0.45 keeps feature points ≥ 0.55 cell apart, and the two-stage warp hides
the lattice. `rp_near` is a continuous signed distance (constant R and gap, so it doesn't jump at borders) for crevice
AO on the matrix. This replaces the [domed pebbles](cellular.md#domed-pebbles-smooth-min-plus-crown) when stones must
look water-worn at `detail`.

```xml
<!-- in: uv. out: rp_dome (0..1), rp_stone (0..1 stone mask), rp_near (0..1 on the matrix next to a stone: crevice AO), rp_id, rp_col, h_river (m). Rounded river pebbles 7..14 mm: a paraboloid dome max(1 - (F1/R)^2, 0) per stone, gated to 0 at the cell border by smoothstep(F2 - F1, 0.04, 0.28), with a per-stone R 0.24..0.46 cell for size variety (one worley grid; a second grid for mixed sizes leaves crescent slivers). 72 cells/m (13.9 mm), jitter 0.45, turned 23 deg, on a two-stage warp (30/m 4 mm, 110/m 0.8 mm; s 0.12 + 0.09). Heights 1..2.8 mm, bigger stones prouder; 5-colour palette with a per-stone brightness 0.8..1.15 -->
<multiply name="rp_1" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="30.0" /></multiply>
<add name="rp_2" type="vector2"><input name="in1" type="vector2" nodename="rp_1" /><input name="in2" type="vector2" value="3.1, 7.9" /></add>
<noise2d name="rp_3" type="vector3"><input name="texcoord" type="vector2" nodename="rp_2" /><input name="amplitude" type="vector3" value="0.004, 0.004, 0.0" /></noise2d>
<convert name="rp_4" type="vector2"><input name="in" type="vector3" nodename="rp_3" /></convert>
<multiply name="rp_5" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="110.0" /></multiply>
<add name="rp_6" type="vector2"><input name="in1" type="vector2" nodename="rp_5" /><input name="in2" type="vector2" value="41.3, 12.7" /></add>
<noise2d name="rp_7" type="vector3"><input name="texcoord" type="vector2" nodename="rp_6" /><input name="amplitude" type="vector3" value="0.0008, 0.0008, 0.0" /></noise2d>
<convert name="rp_8" type="vector2"><input name="in" type="vector3" nodename="rp_7" /></convert>
<add name="rp_9" type="vector2"><input name="in1" type="vector2" nodename="rp_4" /><input name="in2" type="vector2" nodename="rp_8" /></add>
<add name="rp_uvw" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" nodename="rp_9" /></add>
<rotate2d name="rp_11" type="vector2"><input name="in" type="vector2" nodename="rp_uvw" /><input name="amount" type="float" value="23.0" /></rotate2d>
<multiply name="rp_12" type="vector2"><input name="in1" type="vector2" nodename="rp_11" /><input name="in2" type="float" value="72.0" /></multiply>
<add name="rp_p" type="vector2"><input name="in1" type="vector2" nodename="rp_12" /><input name="in2" type="vector2" value="17.3, 5.1" /></add>
<worleynoise2d name="rp_w" type="vector2"><input name="texcoord" type="vector2" nodename="rp_p" /><input name="jitter" type="float" value="0.45" /></worleynoise2d>
<worleynoise2d name="rp_id" type="float"><input name="texcoord" type="vector2" nodename="rp_p" /><input name="jitter" type="float" value="0.45" /><input name="style" type="integer" value="1" /></worleynoise2d>
<extract name="rp_f1" type="float"><input name="in" type="vector2" nodename="rp_w" /><input name="index" type="integer" value="0" /></extract>
<dotproduct name="rp_e" type="float"><input name="in1" type="vector2" nodename="rp_w" /><input name="in2" type="vector2" value="-1.0, 1.0" /></dotproduct>
<multiply name="rp_18" type="float"><input name="in1" type="float" nodename="rp_id" /><input name="in2" type="float" value="7.31" /></multiply>
<add name="rp_19" type="float"><input name="in1" type="float" nodename="rp_18" /><input name="in2" type="float" value="0.13" /></add>
<fract name="rp_rr" type="float"><input name="in" type="float" nodename="rp_19" /></fract>
<multiply name="rp_21" type="float"><input name="in1" type="float" nodename="rp_rr" /><input name="in2" type="float" value="0.22" /></multiply>
<add name="rp_22" type="float"><input name="in1" type="float" nodename="rp_21" /><input name="in2" type="float" value="0.24" /></add>
<divide name="rp_q" type="float"><input name="in1" type="float" nodename="rp_f1" /><input name="in2" type="float" nodename="rp_22" /></divide>
<multiply name="rp_24" type="float"><input name="in1" type="float" nodename="rp_q" /><input name="in2" type="float" nodename="rp_q" /></multiply>
<subtract name="rp_25" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="rp_24" /></subtract>
<max name="rp_26" type="float"><input name="in1" type="float" nodename="rp_25" /><input name="in2" type="float" value="0.0" /></max>
<smoothstep name="rp_27" type="float"><input name="in" type="float" nodename="rp_e" /><input name="low" type="float" value="0.04" /><input name="high" type="float" value="0.28" /></smoothstep>
<multiply name="rp_dome" type="float"><input name="in1" type="float" nodename="rp_26" /><input name="in2" type="float" nodename="rp_27" /></multiply>
<multiply name="rp_29" type="float"><input name="in1" type="float" nodename="rp_rr" /><input name="in2" type="float" value="0.5" /></multiply>
<multiply name="rp_30" type="float"><input name="in1" type="float" nodename="rp_id" /><input name="in2" type="float" value="3.17" /></multiply>
<add name="rp_31" type="float"><input name="in1" type="float" nodename="rp_30" /><input name="in2" type="float" value="0.41" /></add>
<fract name="rp_32" type="float"><input name="in" type="float" nodename="rp_31" /></fract>
<multiply name="rp_33" type="float"><input name="in1" type="float" nodename="rp_32" /><input name="in2" type="float" value="0.5" /></multiply>
<add name="rp_34" type="float"><input name="in1" type="float" nodename="rp_29" /><input name="in2" type="float" nodename="rp_33" /></add>
<multiply name="rp_35" type="float"><input name="in1" type="float" nodename="rp_34" /><input name="in2" type="float" value="0.0018" /></multiply>
<add name="rp_36" type="float"><input name="in1" type="float" nodename="rp_35" /><input name="in2" type="float" value="0.001" /></add>
<multiply name="h_river" type="float"><input name="in1" type="float" nodename="rp_dome" /><input name="in2" type="float" nodename="rp_36" /></multiply>
<smoothstep name="rp_stone" type="float"><input name="in" type="float" nodename="rp_dome" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.12" /></smoothstep>
<subtract name="rp_39" type="float"><input name="in1" type="float" value="0.35" /><input name="in2" type="float" nodename="rp_f1" /></subtract>
<multiply name="rp_40" type="float"><input name="in1" type="float" nodename="rp_e" /><input name="in2" type="float" value="0.5" /></multiply>
<min name="rp_s" type="float"><input name="in1" type="float" nodename="rp_39" /><input name="in2" type="float" nodename="rp_40" /></min>
<smoothstep name="rp_near" type="float"><input name="in" type="float" nodename="rp_s" /><input name="low" type="float" value="-0.06" /><input name="high" type="float" value="0.0" /></smoothstep>
<multiply name="rp_43" type="float"><input name="in1" type="float" nodename="rp_id" /><input name="in2" type="float" value="13.7" /></multiply>
<add name="rp_44" type="float"><input name="in1" type="float" nodename="rp_43" /><input name="in2" type="float" value="0.05" /></add>
<fract name="rp_k" type="float"><input name="in" type="float" nodename="rp_44" /></fract>
<ifgreater name="rp_46" type="color3"><input name="value1" type="float" nodename="rp_k" /><input name="value2" type="float" value="0.9" /><input name="in1" type="color3" value="0.78, 0.77, 0.74" /><input name="in2" type="color3" value="0.2, 0.215, 0.23" /></ifgreater>
<ifgreater name="rp_47" type="color3"><input name="value1" type="float" nodename="rp_k" /><input name="value2" type="float" value="0.6" /><input name="in1" type="color3" nodename="rp_46" /><input name="in2" type="color3" value="0.27, 0.14, 0.08" /></ifgreater>
<ifgreater name="rp_48" type="color3"><input name="value1" type="float" nodename="rp_k" /><input name="value2" type="float" value="0.45" /><input name="in1" type="color3" nodename="rp_47" /><input name="in2" type="color3" value="0.62, 0.56, 0.44" /></ifgreater>
<ifgreater name="rp_49" type="color3"><input name="value1" type="float" nodename="rp_k" /><input name="value2" type="float" value="0.25" /><input name="in1" type="color3" nodename="rp_48" /><input name="in2" type="color3" value="0.4, 0.31, 0.21" /></ifgreater>
<multiply name="rp_50" type="float"><input name="in1" type="float" nodename="rp_id" /><input name="in2" type="float" value="5.37" /></multiply>
<add name="rp_51" type="float"><input name="in1" type="float" nodename="rp_50" /><input name="in2" type="float" value="0.71" /></add>
<fract name="rp_52" type="float"><input name="in" type="float" nodename="rp_51" /></fract>
<multiply name="rp_53" type="float"><input name="in1" type="float" nodename="rp_52" /><input name="in2" type="float" value="0.35" /></multiply>
<add name="rp_54" type="float"><input name="in1" type="float" nodename="rp_53" /><input name="in2" type="float" value="0.8" /></add>
<multiply name="rp_col" type="color3"><input name="in1" type="color3" nodename="rp_49" /><input name="in2" type="float" nodename="rp_54" /></multiply>
```

### Air voids and bug holes

Cast concrete has steep-walled voids with a flat floor: `1 − smoothstep(t, 0.6, 1)`, t = F1/r (the rim at 0.45–0.68 of
r; higher is crisper and steeper). A `(1 − t²)` bowl, as in the [pits](cellular.md#round-pits-and-specks-never-clipped)
recipe, reads as a soft dimple or a lunar crater. A warp at about the void scale (250/m, 0.5 mm) makes the outlines
ragged, and strong baked AO does most of the work: walls ×0.5, the core ×0.4 more. On dry-cast block the void read is
almost all albedo. `r ∝ rand²` makes most voids small. To find one to inspect, run `--channel h_void` over the region
(`plane:0.48 --center …`) and aim `--center` at the minimum UV it prints.

```xml
<!-- in: uv. out: av_m (0..1 void mask), av_ao (albedo factor 0.2..1), h_void (m). Air voids and bug holes with a flat floor, 1 - smoothstep(t, 0.6, 1), t = F1/r (a rim at 0.45..0.68 of r; higher is crisper), on a warped texcoord (250/m, 0.5 mm, s = 0.125) for ragged outlines, plus strong baked AO: walls x0.5, core x0.4. 12 cells/m, jitter 0.7, 30% of cells, r = 0.02 + 0.055*rand^2 cell (1.7..6 mm, mostly small), depth 0.25 r (~43 deg wall). A (1 - t^2) bowl reads as a soft dimple or a lunar crater -->
<multiply name="av_1" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="250.0" /></multiply>
<add name="av_2" type="vector2"><input name="in1" type="vector2" nodename="av_1" /><input name="in2" type="vector2" value="5.1, 9.7" /></add>
<noise2d name="av_3" type="vector3"><input name="texcoord" type="vector2" nodename="av_2" /><input name="amplitude" type="vector3" value="0.0005, 0.0005, 0.0" /></noise2d>
<convert name="av_4" type="vector2"><input name="in" type="vector3" nodename="av_3" /></convert>
<add name="av_5" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" nodename="av_4" /></add>
<multiply name="av_6" type="vector2"><input name="in1" type="vector2" nodename="av_5" /><input name="in2" type="float" value="12.0" /></multiply>
<add name="av_p" type="vector2"><input name="in1" type="vector2" nodename="av_6" /><input name="in2" type="vector2" value="3.7, 1.9" /></add>
<worleynoise2d name="av_f1" type="float"><input name="texcoord" type="vector2" nodename="av_p" /><input name="jitter" type="float" value="0.7" /></worleynoise2d>
<worleynoise2d name="av_id" type="float"><input name="texcoord" type="vector2" nodename="av_p" /><input name="jitter" type="float" value="0.7" /><input name="style" type="integer" value="1" /></worleynoise2d>
<ifgreater name="av_on" type="float"><input name="value1" type="float" nodename="av_id" /><input name="value2" type="float" value="0.7" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="av_11" type="float"><input name="in1" type="float" nodename="av_id" /><input name="in2" type="float" value="7.31" /></multiply>
<add name="av_12" type="float"><input name="in1" type="float" nodename="av_11" /><input name="in2" type="float" value="0.0" /></add>
<fract name="av_13" type="float"><input name="in" type="float" nodename="av_12" /></fract>
<multiply name="av_14" type="float"><input name="in1" type="float" nodename="av_13" /><input name="in2" type="float" nodename="av_13" /></multiply>
<multiply name="av_15" type="float"><input name="in1" type="float" nodename="av_14" /><input name="in2" type="float" value="0.055" /></multiply>
<multiply name="av_16" type="float"><input name="in1" type="float" nodename="av_15" /><input name="in2" type="float" nodename="av_on" /></multiply>
<add name="av_r" type="float"><input name="in1" type="float" nodename="av_16" /><input name="in2" type="float" value="0.02" /></add>
<divide name="av_t" type="float"><input name="in1" type="float" nodename="av_f1" /><input name="in2" type="float" nodename="av_r" /></divide>
<smoothstep name="av_19" type="float"><input name="in" type="float" nodename="av_t" /><input name="low" type="float" value="0.6" /><input name="high" type="float" value="1.0" /></smoothstep>
<subtract name="av_20" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="av_19" /></subtract>
<multiply name="av_m" type="float"><input name="in1" type="float" nodename="av_20" /><input name="in2" type="float" nodename="av_on" /></multiply>
<smoothstep name="av_22" type="float"><input name="in" type="float" nodename="av_t" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.8" /></smoothstep>
<subtract name="av_23" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="av_22" /></subtract>
<multiply name="av_core" type="float"><input name="in1" type="float" nodename="av_23" /><input name="in2" type="float" nodename="av_on" /></multiply>
<mix name="av_25" type="float"><input name="bg" type="float" value="1.0" /><input name="fg" type="float" value="0.5" /><input name="mix" type="float" nodename="av_m" /></mix>
<mix name="av_26" type="float"><input name="bg" type="float" value="1.0" /><input name="fg" type="float" value="0.4" /><input name="mix" type="float" nodename="av_core" /></mix>
<multiply name="av_ao" type="float"><input name="in1" type="float" nodename="av_25" /><input name="in2" type="float" nodename="av_26" /></multiply>
<multiply name="av_28" type="float"><input name="in1" type="float" nodename="av_r" /><input name="in2" type="float" value="-0.0208" /></multiply>
<multiply name="h_void" type="float"><input name="in1" type="float" nodename="av_m" /><input name="in2" type="float" nodename="av_28" /></multiply>
```

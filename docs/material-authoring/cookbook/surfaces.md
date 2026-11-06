# Surface recipes

Strokes, bands, veins, scuffs, scoops, polar features and dents: marks on top of a surface or tile. Part of the
[noise cookbook](../NOISE_COOKBOOK.md). Test materials: [`cookbook_misc`](../noise-lab/cookbook/cookbook_misc.mtlx),
[`cookbook_surface`](../noise-lab/cookbook/cookbook_surface.mtlx),
[`cookbook_surface2`](../noise-lab/cookbook/cookbook_surface2.mtlx) and [`cookbook_wood2`](../noise-lab/cookbook/cookbook_wood2.mtlx)
(kerf marks, whitewash and checks on the [pine rows](grain.md#pine-latewood-profile), bottom quadrants).

### Broom or brushed strokes

Stretched noise used directly as height: 30 cm strokes, 3 mm apart, ~4°. `sin` stripes read as machined corduroy, and
`smoothstep(noise)` grooves show only as edge hairlines.

```xml
<!-- in: uv. out: h_broom (m). Two stretched layers: strokes ~30 cm long, ~3 mm apart, ~4 deg slope -->
<multiply name="br_pa" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="3, 330" /></multiply>
<noise2d name="br_a" type="float"><input name="texcoord" type="vector2" nodename="br_pa" /><input name="amplitude" type="float" value="0.00016" /></noise2d>
<add name="br_pbo" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="0.37, 0.0021" /></add>
<multiply name="br_pb" type="vector2"><input name="in1" type="vector2" nodename="br_pbo" /><input name="in2" type="vector2" value="5, 462" /></multiply>
<noise2d name="br_b" type="float"><input name="texcoord" type="vector2" nodename="br_pb" /><input name="amplitude" type="float" value="0.00011" /></noise2d>
<add name="h_broom" type="float"><input name="in1" type="float" nodename="br_a" /><input name="in2" type="float" nodename="br_b" /></add>
```

### Per-band randoms

One random per band, with a distinct seed (the `combine2` constant) per parameter. The borders are height steps and
show dashed seams, so fade the height near borders. `bandbroom` rotates and presses the strokes per band. For bands
without seams or a faded stripe, use [cross-faded bands](weathering.md#cross-faded-bands).

```xml
<!-- in: uv, uv_sep (separate2 of uv). out: band (integer id), band_rand, band_rand2 (0..1 per band). 6 bands/m, wavy borders -->
<multiply name="bd_p" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="2.5" /></multiply>
<noise2d name="bd_wob" type="float"><input name="texcoord" type="vector2" nodename="bd_p" /><input name="amplitude" type="float" value="0.06" /></noise2d>
<add name="bd_v" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" nodename="bd_wob" /></add>
<multiply name="bd_v6" type="float"><input name="in1" type="float" nodename="bd_v" /><input name="in2" type="float" value="6" /></multiply>
<floor name="band" type="float"><input name="in" type="float" nodename="bd_v6" /></floor>
<combine2 name="bd_s1" type="vector2"><input name="in1" type="float" nodename="band" /><input name="in2" type="float" value="7.5" /></combine2>
<cellnoise2d name="band_rand" type="float"><input name="texcoord" type="vector2" nodename="bd_s1" /></cellnoise2d>
<combine2 name="bd_s2" type="vector2"><input name="in1" type="float" nodename="band" /><input name="in2" type="float" value="31.5" /></combine2>
<cellnoise2d name="band_rand2" type="float"><input name="texcoord" type="vector2" nodename="bd_s2" /></cellnoise2d>
```

```xml
<!-- in: uv, band_rand, band_rand2. out: h_band = broom strokes rotated +-15 deg and pressed 0.4..1.2x per band -->
<subtract name="bb_a0" type="float"><input name="in1" type="float" nodename="band_rand" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="bb_ang" type="float"><input name="in1" type="float" nodename="bb_a0" /><input name="in2" type="float" value="30" /></multiply>
<rotate2d name="bb_uv" type="vector2"><input name="in" type="vector2" nodename="uv" /><input name="amount" type="float" nodename="bb_ang" /></rotate2d>
<multiply name="bb_p" type="vector2"><input name="in1" type="vector2" nodename="bb_uv" /><input name="in2" type="vector2" value="3, 330" /></multiply>
<noise2d name="bb_n" type="float"><input name="texcoord" type="vector2" nodename="bb_p" /><input name="amplitude" type="float" value="0.00018" /></noise2d>
<multiply name="bb_pr0" type="float"><input name="in1" type="float" nodename="band_rand2" /><input name="in2" type="float" value="0.8" /></multiply>
<add name="bb_pr" type="float"><input name="in1" type="float" nodename="bb_pr0" /><input name="in2" type="float" value="0.4" /></add>
<multiply name="h_band" type="float"><input name="in1" type="float" nodename="bb_n" /><input name="in2" type="float" nodename="bb_pr" /></multiply>
```

### Marble veins

Core, halo and hairlines from `|fBm|` contours on warped slab coords. **Width vs octaves:** at a fixed t the core
`|fBm| < t/2` covers ≈ t of the area at any octave count (the density of fBm at 0 is ≈ 1.1), but each octave lengthens
the contour (≈ √N), so more octaves make veins thinner and busier, not sparser: t = 0.02 at 10/m across is ≈ 1 mm at
5–7 oct. Reads as drawn: uniform width, hard edges, dashes from a sharp taper, grain added to |v| (hatching), warp
s > 0.1 (squiggles). Instead: taper over ~35 cm, wobble t at 90/m, soften the core, vary pigment, patchy one-sided halo.

```xml
<!-- in: sl_p (slab coords, m). out: mv_vein (0..1: mix the vein colour by it), mv_core. Warp 4/m A 25 mm (s 0.1) then fBm 15/m A 6 mm (s 0.09). Main veins: |fBm| contours at (3, 10)/m, 5 oct; soft core t 0.008..0.032 (edge wobble at 90/m) swelling and fading over ~35 cm, pigment varying along the vein, halo offset to one side and broken by clouds. Hairline network: finer contours, t 0.005, in its own patches -->
<multiply name="mv_w1p0" type="vector2"><input name="in1" type="vector2" nodename="sl_p" /><input name="in2" type="float" value="4" /></multiply>
<add name="mv_w1p" type="vector2"><input name="in1" type="vector2" nodename="mv_w1p0" /><input name="in2" type="vector2" value="3.1, 7.9" /></add>
<noise2d name="mv_w1" type="vector3"><input name="texcoord" type="vector2" nodename="mv_w1p" /><input name="amplitude" type="vector3" value="0.025, 0.025, 0" /></noise2d>
<convert name="mv_w1v" type="vector2"><input name="in" type="vector3" nodename="mv_w1" /></convert>
<add name="mv_m1" type="vector2"><input name="in1" type="vector2" nodename="sl_p" /><input name="in2" type="vector2" nodename="mv_w1v" /></add>
<multiply name="mv_w2p0" type="vector2"><input name="in1" type="vector2" nodename="mv_m1" /><input name="in2" type="float" value="15" /></multiply>
<add name="mv_w2p" type="vector2"><input name="in1" type="vector2" nodename="mv_w2p0" /><input name="in2" type="vector2" value="11.3, 4.7" /></add>
<fractal2d name="mv_w2" type="vector3"><input name="texcoord" type="vector2" nodename="mv_w2p" /><input name="octaves" type="integer" value="3" /><input name="amplitude" type="vector3" value="0.006, 0.006, 0" /></fractal2d>
<convert name="mv_w2v" type="vector2"><input name="in" type="vector3" nodename="mv_w2" /></convert>
<add name="mv_m" type="vector2"><input name="in1" type="vector2" nodename="mv_m1" /><input name="in2" type="vector2" nodename="mv_w2v" /></add>
<multiply name="mv_vp0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="vector2" value="3, 10" /></multiply>
<add name="mv_vp" type="vector2"><input name="in1" type="vector2" nodename="mv_vp0" /><input name="in2" type="vector2" value="17.3, 5.8" /></add>
<fractal2d name="mv_v" type="float"><input name="texcoord" type="vector2" nodename="mv_vp" /><input name="octaves" type="integer" value="5" /></fractal2d>
<absval name="mv_va" type="float"><input name="in" type="float" nodename="mv_v" /></absval>
<multiply name="mv_tpp0" type="vector2"><input name="in1" type="vector2" nodename="sl_p" /><input name="in2" type="float" value="2" /></multiply>
<add name="mv_tpp" type="vector2"><input name="in1" type="vector2" nodename="mv_tpp0" /><input name="in2" type="vector2" value="29.6, 15.2" /></add>
<noise2d name="mv_tp" type="float"><input name="texcoord" type="vector2" nodename="mv_tpp" /><input name="amplitude" type="float" value="0.8" /><input name="pivot" type="float" value="0.5" /></noise2d>
<smoothstep name="mv_tap" type="float"><input name="in" type="float" nodename="mv_tp" /><input name="low" type="float" value="0.15" /><input name="high" type="float" value="0.85" /></smoothstep>
<multiply name="mv_ep0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="float" value="90" /></multiply>
<add name="mv_ep" type="vector2"><input name="in1" type="vector2" nodename="mv_ep0" /><input name="in2" type="vector2" value="41.3, 9.1" /></add>
<noise2d name="mv_en" type="float"><input name="texcoord" type="vector2" nodename="mv_ep" /><input name="amplitude" type="float" value="0.012" /><input name="pivot" type="float" value="0.02" /></noise2d>
<multiply name="mv_tc0" type="float"><input name="in1" type="float" nodename="mv_tap" /><input name="in2" type="float" nodename="mv_en" /></multiply>
<max name="mv_tc" type="float"><input name="in1" type="float" nodename="mv_tc0" /><input name="in2" type="float" value="0.0001" /></max>
<multiply name="mv_tl" type="float"><input name="in1" type="float" nodename="mv_tc" /><input name="in2" type="float" value="0.4" /></multiply>
<smoothstep name="mv_cs" type="float"><input name="in" type="float" nodename="mv_va" /><input name="low" type="float" nodename="mv_tl" /><input name="high" type="float" nodename="mv_tc" /></smoothstep>
<subtract name="mv_c0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="mv_cs" /></subtract>
<multiply name="mv_dp0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="float" value="60" /></multiply>
<add name="mv_dp" type="vector2"><input name="in1" type="vector2" nodename="mv_dp0" /><input name="in2" type="vector2" value="7.7, 2.3" /></add>
<noise2d name="mv_dn" type="float"><input name="texcoord" type="vector2" nodename="mv_dp" /><input name="amplitude" type="float" value="0.3" /><input name="pivot" type="float" value="0.75" /></noise2d>
<multiply name="mv_core" type="float"><input name="in1" type="float" nodename="mv_c0" /><input name="in2" type="float" nodename="mv_dn" /></multiply>
<subtract name="mv_vh" type="float"><input name="in1" type="float" nodename="mv_v" /><input name="in2" type="float" value="0.04" /></subtract>
<absval name="mv_vha" type="float"><input name="in" type="float" nodename="mv_vh" /></absval>
<multiply name="mv_th0" type="float"><input name="in1" type="float" nodename="mv_tap" /><input name="in2" type="float" value="0.1" /></multiply>
<max name="mv_th" type="float"><input name="in1" type="float" nodename="mv_th0" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="mv_hs" type="float"><input name="in" type="float" nodename="mv_vha" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="mv_th" /></smoothstep>
<multiply name="mv_cp0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="float" value="20" /></multiply>
<add name="mv_cp" type="vector2"><input name="in1" type="vector2" nodename="mv_cp0" /><input name="in2" type="vector2" value="3.3, 61.7" /></add>
<fractal2d name="mv_cl" type="float"><input name="texcoord" type="vector2" nodename="mv_cp" /><input name="octaves" type="integer" value="3" /><input name="amplitude" type="float" value="0.4" /></fractal2d>
<add name="mv_cl1" type="float"><input name="in1" type="float" nodename="mv_cl" /><input name="in2" type="float" value="0.3" /></add>
<clamp name="mv_cld" type="float"><input name="in" type="float" nodename="mv_cl1" /></clamp>
<subtract name="mv_h0" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="mv_hs" /></subtract>
<multiply name="mv_halo" type="float"><input name="in1" type="float" nodename="mv_h0" /><input name="in2" type="float" nodename="mv_cld" /></multiply>
<multiply name="mv_up0" type="vector2"><input name="in1" type="vector2" nodename="mv_m" /><input name="in2" type="vector2" value="6, 13" /></multiply>
<add name="mv_up" type="vector2"><input name="in1" type="vector2" nodename="mv_up0" /><input name="in2" type="vector2" value="71.9, 23.3" /></add>
<fractal2d name="mv_u" type="float"><input name="texcoord" type="vector2" nodename="mv_up" /><input name="octaves" type="integer" value="4" /></fractal2d>
<absval name="mv_ua" type="float"><input name="in" type="float" nodename="mv_u" /></absval>
<multiply name="mv_upp0" type="vector2"><input name="in1" type="vector2" nodename="sl_p" /><input name="in2" type="float" value="3" /></multiply>
<add name="mv_upp" type="vector2"><input name="in1" type="vector2" nodename="mv_upp0" /><input name="in2" type="vector2" value="5.5, 88.1" /></add>
<noise2d name="mv_upn" type="float"><input name="texcoord" type="vector2" nodename="mv_upp" /><input name="amplitude" type="float" value="0.8" /><input name="pivot" type="float" value="0.5" /></noise2d>
<smoothstep name="mv_utap" type="float"><input name="in" type="float" nodename="mv_upn" /><input name="low" type="float" value="0.3" /><input name="high" type="float" value="0.7" /></smoothstep>
<multiply name="mv_ut0" type="float"><input name="in1" type="float" nodename="mv_utap" /><input name="in2" type="float" value="0.005" /></multiply>
<max name="mv_ut" type="float"><input name="in1" type="float" nodename="mv_ut0" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="mv_us" type="float"><input name="in" type="float" nodename="mv_ua" /><input name="low" type="float" value="0" /><input name="high" type="float" nodename="mv_ut" /></smoothstep>
<subtract name="mv_u1" type="float"><input name="in1" type="float" value="1" /><input name="in2" type="float" nodename="mv_us" /></subtract>
<multiply name="mv_hair" type="float"><input name="in1" type="float" nodename="mv_u1" /><input name="in2" type="float" value="0.55" /></multiply>
<multiply name="mv_hw" type="float"><input name="in1" type="float" nodename="mv_halo" /><input name="in2" type="float" value="0.3" /></multiply>
<max name="mv_v2" type="float"><input name="in1" type="float" nodename="mv_core" /><input name="in2" type="float" nodename="mv_hw" /></max>
<max name="mv_vein" type="float"><input name="in1" type="float" nodename="mv_v2" /><input name="in2" type="float" nodename="mv_hair" /></max>
```

### Sparse scuffs and scratches

A high threshold (n > 0.55) gives separate marks, not a hatch. Each direction lives in its own presence patches, so
two directions rarely cross; a low threshold or no presence mask gives a regular crosshatch. Mostly roughness and colour.

```xml
<!-- in: uv. out: sc_mask (0..1 scuff/scratch mask for roughness and colour), h_scuff (m, -0.02 mm). Two stretched layers (20 deg and -50 deg, ~6 cm x 2 mm marks) thresholded high (n > 0.55), each in its own patchy presence field (4/m, ~25% of the area), so directions rarely cross -->
<rotate2d name="sc_ra" type="vector2"><input name="in" type="vector2" nodename="uv" /><input name="amount" type="float" value="20" /></rotate2d>
<multiply name="sc_pa0" type="vector2"><input name="in1" type="vector2" nodename="sc_ra" /><input name="in2" type="vector2" value="12, 350" /></multiply>
<add name="sc_pa" type="vector2"><input name="in1" type="vector2" nodename="sc_pa0" /><input name="in2" type="vector2" value="3.37, 8.61" /></add>
<noise2d name="sc_na" type="float"><input name="texcoord" type="vector2" nodename="sc_pa" /></noise2d>
<smoothstep name="sc_la" type="float"><input name="in" type="float" nodename="sc_na" /><input name="low" type="float" value="0.55" /><input name="high" type="float" value="0.7" /></smoothstep>
<multiply name="sc_qa0" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="4" /></multiply>
<add name="sc_qa" type="vector2"><input name="in1" type="vector2" nodename="sc_qa0" /><input name="in2" type="vector2" value="1.37, 6.61" /></add>
<noise2d name="sc_ma0" type="float"><input name="texcoord" type="vector2" nodename="sc_qa" /></noise2d>
<smoothstep name="sc_ma" type="float"><input name="in" type="float" nodename="sc_ma0" /><input name="low" type="float" value="0.25" /><input name="high" type="float" value="0.45" /></smoothstep>
<multiply name="sc_a" type="float"><input name="in1" type="float" nodename="sc_la" /><input name="in2" type="float" nodename="sc_ma" /></multiply>
<rotate2d name="sc_rb" type="vector2"><input name="in" type="vector2" nodename="uv" /><input name="amount" type="float" value="-50" /></rotate2d>
<multiply name="sc_pb0" type="vector2"><input name="in1" type="vector2" nodename="sc_rb" /><input name="in2" type="vector2" value="12, 350" /></multiply>
<add name="sc_pb" type="vector2"><input name="in1" type="vector2" nodename="sc_pb0" /><input name="in2" type="vector2" value="17.37, 2.61" /></add>
<noise2d name="sc_nb" type="float"><input name="texcoord" type="vector2" nodename="sc_pb" /></noise2d>
<smoothstep name="sc_lb" type="float"><input name="in" type="float" nodename="sc_nb" /><input name="low" type="float" value="0.55" /><input name="high" type="float" value="0.7" /></smoothstep>
<multiply name="sc_qb0" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="4" /></multiply>
<add name="sc_qb" type="vector2"><input name="in1" type="vector2" nodename="sc_qb0" /><input name="in2" type="vector2" value="9.37, 13.61" /></add>
<noise2d name="sc_mb0" type="float"><input name="texcoord" type="vector2" nodename="sc_qb" /></noise2d>
<smoothstep name="sc_mb" type="float"><input name="in" type="float" nodename="sc_mb0" /><input name="low" type="float" value="0.25" /><input name="high" type="float" value="0.45" /></smoothstep>
<multiply name="sc_b" type="float"><input name="in1" type="float" nodename="sc_lb" /><input name="in2" type="float" nodename="sc_mb" /></multiply>
<max name="sc_mask" type="float"><input name="in1" type="float" nodename="sc_a" /><input name="in2" type="float" nodename="sc_b" /></max>
<multiply name="h_scuff" type="float"><input name="in1" type="float" nodename="sc_mask" /><input name="in2" type="float" value="-2e-05" /></multiply>
```

### Paraboloid-dish scoops

Hand-scraped or adzed wood, and hammered metal: each worley cell is a dish D·(smin(F1², F2²)/R² − 1), so neighbours
meet in scalloped ridges and the smooth min rounds the crest. The depth D must come from a **continuous** field; a
per-cell depth steps at every border. Cells are stretched 2:1 across the grain (draw-knife scoops, 22 × 45 mm), with a
4° turn so rows don't line up. `sc_pool` darkens the hollows (finish pools there) and `sc_crest` roughens the ridges.
For **hammered metal** use isotropic cells (`uv·30`), D ≈ 0.1–0.2 mm and metalness 1, and leave out the crest mask: it
draws a bright Voronoi web on the sphere (checked in a scratch render). From [`hickory-handscraped`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/hickory-handscraped/gen.py).

```xml
<!-- in: uv. out: h_scoop (m), sc_pool (0..1 in the hollows), sc_crest (0..1 on the ridges). Paraboloid dishes D*(smin(F1^2, F2^2)/R^2 - 1): cells 22 mm along U x 45 mm across (draw-knife scoops across the grain), jitter 0.9, R^2 = 0.36, smooth-min k 0.06 rounds the crest. Depth D 0.33..0.77 mm from a smooth field, never per cell (steps) -->
<rotate2d name="sc_1" type="vector2"><input name="in" type="vector2" nodename="uv" /><input name="amount" type="float" value="4.0" /></rotate2d>
<multiply name="sc_2" type="vector2"><input name="in1" type="vector2" nodename="sc_1" /><input name="in2" type="vector2" value="45.0, 22.0" /></multiply>
<add name="sc_p" type="vector2"><input name="in1" type="vector2" nodename="sc_2" /><input name="in2" type="vector2" value="3.1, 7.9" /></add>
<worleynoise2d name="sc_w" type="vector2"><input name="texcoord" type="vector2" nodename="sc_p" /><input name="jitter" type="float" value="0.9" /></worleynoise2d>
<separate2 name="sc_ws" type="multioutput"><input name="in" type="vector2" nodename="sc_w" /></separate2>
<multiply name="sc_a2" type="float"><input name="in1" type="float" nodename="sc_ws" output="outx" /><input name="in2" type="float" nodename="sc_ws" output="outx" /></multiply>
<multiply name="sc_b2" type="float"><input name="in1" type="float" nodename="sc_ws" output="outy" /><input name="in2" type="float" nodename="sc_ws" output="outy" /></multiply>
<subtract name="sc_8" type="float"><input name="in1" type="float" nodename="sc_b2" /><input name="in2" type="float" nodename="sc_a2" /></subtract>
<subtract name="sc_9" type="float"><input name="in1" type="float" value="0.06" /><input name="in2" type="float" nodename="sc_8" /></subtract>
<max name="sc_10" type="float"><input name="in1" type="float" nodename="sc_9" /><input name="in2" type="float" value="0.0" /></max>
<divide name="sc_h" type="float"><input name="in1" type="float" nodename="sc_10" /><input name="in2" type="float" value="0.06" /></divide>
<multiply name="sc_12" type="float"><input name="in1" type="float" nodename="sc_h" /><input name="in2" type="float" nodename="sc_h" /></multiply>
<multiply name="sc_13" type="float"><input name="in1" type="float" nodename="sc_12" /><input name="in2" type="float" value="0.015" /></multiply>
<subtract name="sc_fs" type="float"><input name="in1" type="float" nodename="sc_a2" /><input name="in2" type="float" nodename="sc_13" /></subtract>
<divide name="sc_15" type="float"><input name="in1" type="float" nodename="sc_fs" /><input name="in2" type="float" value="0.36" /></divide>
<subtract name="sc_dish" type="float"><input name="in1" type="float" nodename="sc_15" /><input name="in2" type="float" value="1.0" /></subtract>
<multiply name="sc_17" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="14.0, 9.0" /></multiply>
<add name="sc_18" type="vector2"><input name="in1" type="vector2" nodename="sc_17" /><input name="in2" type="vector2" value="17.3, 5.1" /></add>
<noise2d name="sc_D" type="float"><input name="texcoord" type="vector2" nodename="sc_18" /><input name="amplitude" type="float" value="0.0004" /><input name="pivot" type="float" value="0.00055" /></noise2d>
<multiply name="h_scoop" type="float"><input name="in1" type="float" nodename="sc_dish" /><input name="in2" type="float" nodename="sc_D" /></multiply>
<multiply name="sc_21" type="float"><input name="in1" type="float" nodename="sc_dish" /><input name="in2" type="float" value="-1.0" /></multiply>
<smoothstep name="sc_pool" type="float"><input name="in" type="float" nodename="sc_21" /><input name="low" type="float" value="0.2" /><input name="high" type="float" value="0.9" /></smoothstep>
<subtract name="sc_23" type="float"><input name="in1" type="float" nodename="sc_b2" /><input name="in2" type="float" nodename="sc_a2" /></subtract>
<smoothstep name="sc_24" type="float"><input name="in" type="float" nodename="sc_23" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.25" /></smoothstep>
<subtract name="sc_crest" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="sc_24" /></subtract>
```

### Polar features: rays and radial checks

Features around a point come from `atan2` and r = |p − c|. Rays are noise across the angle (θ·40, so r/40 apart) and
stretched along r. Checks use angular sectors: `floor(θ·N/2π)` picks a sector, its randoms set an angle θc, a length and
a centre radius, and the width test uses the **perpendicular distance r·(θ − θc)**, not the angle, so checks don't
widen with r. The wobble is added to the signed offset before `absval` (after it, the check breaks into beads), and the
width taper is gated by `smoothstep(w, 2e-5, 6e-5)` so no hairline remains at the floor. The sector seam at θ = ±π is a
sector border, so nothing crosses it. `po_seed` must differ per centre (the end-grain test passes `rg_id·613`). From
[`end-grain-block`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/end-grain-block/gen.py).

```xml
<!-- in: po_rel (vector2, m from the centre), po_seed (per-centre random, e.g. id*613). out: po_th (angle, rad), po_r (m), po_ray (0..1 radial rays, r/40 apart), po_check (0..1 radial checks). 48 angular sectors; ~38% hold a check 8..30 mm long, <= 0.7 mm wide, tapered to both ends. Width is the perpendicular distance r*(theta - theta_c); the wobble goes on the signed offset BEFORE absval, and the gate smoothstep(w, 2e-5, 6e-5) removes the hairline where the width is at its floor -->
<separate2 name="po_s" type="multioutput"><input name="in" type="vector2" nodename="po_rel" /></separate2>
<atan2 name="po_th" type="float"><input name="iny" type="float" nodename="po_s" output="outy" /><input name="inx" type="float" nodename="po_s" output="outx" /></atan2>
<magnitude name="po_r" type="float"><input name="in" type="vector2" nodename="po_rel" /></magnitude>
<multiply name="po_4" type="float"><input name="in1" type="float" nodename="po_th" /><input name="in2" type="float" value="40.0" /></multiply>
<multiply name="po_5" type="float"><input name="in1" type="float" nodename="po_r" /><input name="in2" type="float" value="45.0" /></multiply>
<add name="po_6" type="float"><input name="in1" type="float" nodename="po_5" /><input name="in2" type="float" nodename="po_seed" /></add>
<combine2 name="po_7" type="vector2"><input name="in1" type="float" nodename="po_4" /><input name="in2" type="float" nodename="po_6" /></combine2>
<fractal2d name="po_rn" type="float"><input name="texcoord" type="vector2" nodename="po_7" /><input name="octaves" type="integer" value="1" /></fractal2d>
<smoothstep name="po_ray" type="float"><input name="in" type="float" nodename="po_rn" /><input name="low" type="float" value="0.3" /><input name="high" type="float" value="0.55" /></smoothstep>
<multiply name="po_10" type="float"><input name="in1" type="float" nodename="po_th" /><input name="in2" type="float" value="7.639438" /></multiply>
<floor name="po_sec" type="float"><input name="in" type="float" nodename="po_10" /></floor>
<combine2 name="po_cs" type="vector2"><input name="in1" type="float" nodename="po_sec" /><input name="in2" type="float" nodename="po_seed" /></combine2>
<cellnoise2d name="po_c1" type="float"><input name="texcoord" type="vector2" nodename="po_cs" /></cellnoise2d>
<add name="po_14" type="vector2"><input name="in1" type="vector2" nodename="po_cs" /><input name="in2" type="vector2" value="31.0, 17.0" /></add>
<cellnoise2d name="po_c2" type="float"><input name="texcoord" type="vector2" nodename="po_14" /></cellnoise2d>
<add name="po_16" type="vector2"><input name="in1" type="vector2" nodename="po_cs" /><input name="in2" type="vector2" value="71.0, 5.0" /></add>
<cellnoise2d name="po_c3" type="float"><input name="texcoord" type="vector2" nodename="po_16" /></cellnoise2d>
<multiply name="po_18" type="float"><input name="in1" type="float" nodename="po_c1" /><input name="in2" type="float" value="0.6" /></multiply>
<add name="po_19" type="float"><input name="in1" type="float" nodename="po_18" /><input name="in2" type="float" value="0.2" /></add>
<add name="po_20" type="float"><input name="in1" type="float" nodename="po_sec" /><input name="in2" type="float" nodename="po_19" /></add>
<multiply name="po_thc" type="float"><input name="in1" type="float" nodename="po_20" /><input name="in2" type="float" value="0.1309" /></multiply>
<multiply name="po_22" type="float"><input name="in1" type="float" nodename="po_r" /><input name="in2" type="float" value="350.0" /></multiply>
<multiply name="po_23" type="float"><input name="in1" type="float" nodename="po_c1" /><input name="in2" type="float" value="37.0" /></multiply>
<combine2 name="po_24" type="vector2"><input name="in1" type="float" nodename="po_22" /><input name="in2" type="float" nodename="po_23" /></combine2>
<fractal2d name="po_wob" type="float"><input name="texcoord" type="vector2" nodename="po_24" /><input name="amplitude" type="float" value="0.00015" /><input name="octaves" type="integer" value="1" /></fractal2d>
<subtract name="po_26" type="float"><input name="in1" type="float" nodename="po_th" /><input name="in2" type="float" nodename="po_thc" /></subtract>
<multiply name="po_27" type="float"><input name="in1" type="float" nodename="po_r" /><input name="in2" type="float" nodename="po_26" /></multiply>
<add name="po_28" type="float"><input name="in1" type="float" nodename="po_27" /><input name="in2" type="float" nodename="po_wob" /></add>
<absval name="po_dp" type="float"><input name="in" type="float" nodename="po_28" /></absval>
<multiply name="po_30" type="float"><input name="in1" type="float" nodename="po_c2" /><input name="in2" type="float" value="0.022" /></multiply>
<add name="po_len" type="float"><input name="in1" type="float" nodename="po_30" /><input name="in2" type="float" value="0.008" /></add>
<multiply name="po_32" type="float"><input name="in1" type="float" nodename="po_len" /><input name="in2" type="float" value="0.5" /></multiply>
<add name="po_33" type="float"><input name="in1" type="float" nodename="po_32" /><input name="in2" type="float" value="0.004" /></add>
<multiply name="po_34" type="float"><input name="in1" type="float" nodename="po_c1" /><input name="in2" type="float" value="0.05" /></multiply>
<add name="po_cen" type="float"><input name="in1" type="float" nodename="po_33" /><input name="in2" type="float" nodename="po_34" /></add>
<subtract name="po_36" type="float"><input name="in1" type="float" nodename="po_r" /><input name="in2" type="float" nodename="po_cen" /></subtract>
<multiply name="po_37" type="float"><input name="in1" type="float" nodename="po_len" /><input name="in2" type="float" value="0.5" /></multiply>
<divide name="po_cx" type="float"><input name="in1" type="float" nodename="po_36" /><input name="in2" type="float" nodename="po_37" /></divide>
<multiply name="po_39" type="float"><input name="in1" type="float" nodename="po_cx" /><input name="in2" type="float" nodename="po_cx" /></multiply>
<subtract name="po_40" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="po_39" /></subtract>
<max name="po_prof" type="float"><input name="in1" type="float" nodename="po_40" /><input name="in2" type="float" value="0.0" /></max>
<ifgreater name="po_42" type="float"><input name="value1" type="float" nodename="po_c3" /><input name="value2" type="float" value="0.62" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="po_43" type="float"><input name="in1" type="float" nodename="po_prof" /><input name="in2" type="float" nodename="po_42" /></multiply>
<multiply name="po_44" type="float"><input name="in1" type="float" nodename="po_43" /><input name="in2" type="float" value="0.00035" /></multiply>
<max name="po_w" type="float"><input name="in1" type="float" nodename="po_44" /><input name="in2" type="float" value="0.00001" /></max>
<smoothstep name="po_46" type="float"><input name="in" type="float" nodename="po_dp" /><input name="low" type="float" value="0.0" /><input name="high" type="float" nodename="po_w" /></smoothstep>
<subtract name="po_47" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="po_46" /></subtract>
<smoothstep name="po_48" type="float"><input name="in" type="float" nodename="po_w" /><input name="low" type="float" value="0.00002" /><input name="high" type="float" value="0.00006" /></smoothstep>
<multiply name="po_check" type="float"><input name="in1" type="float" nodename="po_47" /><input name="in2" type="float" nodename="po_48" /></multiply>
```

### Crisp-rim dents

Impact dents read as dents only with a sharp rim and a flatter floor: `1 − smoothstep(t, 0.45, 1)`, t = F1/r. A
(1 − t²) bowl (the pits profile) has no flat floor and a soft rim; at reclaimed-pine's scale it read as a raised dome under
bridge. The test's bottom-right quadrant renders the same dents as bowls for comparison; there the difference is small,
so flip the height sign once to check which reads as a dent at your scale. Darken and roughen the dent a little as
well. For air voids and bug holes in concrete, see [voids](aggregate.md#air-voids-and-bug-holes). From [`reclaimed-pine`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/reclaimed-pine/gen.py).

```xml
<!-- in: uv. out: h_dent (m), dn_dent (0..1). Impact dents with a crisp rim and a flat floor: 1 - smoothstep(t, 0.45, 1), t = F1/r. 18 cells/m, jitter 0.7, 40% of cells, r 0.05..0.15 cell (3..8 mm, never clips), depth r*3.5 mm (0.2..0.5 mm, rim ~10 deg) -->
<multiply name="dn_1" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="18.0" /></multiply>
<add name="dn_p" type="vector2"><input name="in1" type="vector2" nodename="dn_1" /><input name="in2" type="vector2" value="3.7, 1.9" /></add>
<worleynoise2d name="dn_f1" type="float"><input name="texcoord" type="vector2" nodename="dn_p" /><input name="jitter" type="float" value="0.7" /></worleynoise2d>
<worleynoise2d name="dn_id" type="float"><input name="texcoord" type="vector2" nodename="dn_p" /><input name="jitter" type="float" value="0.7" /><input name="style" type="integer" value="1" /></worleynoise2d>
<ifgreater name="dn_on" type="float"><input name="value1" type="float" nodename="dn_id" /><input name="value2" type="float" value="0.6" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="dn_6" type="float"><input name="in1" type="float" nodename="dn_id" /><input name="in2" type="float" value="7.3" /></multiply>
<fract name="dn_7" type="float"><input name="in" type="float" nodename="dn_6" /></fract>
<multiply name="dn_8" type="float"><input name="in1" type="float" nodename="dn_7" /><input name="in2" type="float" value="0.1" /></multiply>
<multiply name="dn_9" type="float"><input name="in1" type="float" nodename="dn_8" /><input name="in2" type="float" nodename="dn_on" /></multiply>
<add name="dn_r" type="float"><input name="in1" type="float" nodename="dn_9" /><input name="in2" type="float" value="0.05" /></add>
<divide name="dn_t" type="float"><input name="in1" type="float" nodename="dn_f1" /><input name="in2" type="float" nodename="dn_r" /></divide>
<smoothstep name="dn_12" type="float"><input name="in" type="float" nodename="dn_t" /><input name="low" type="float" value="0.45" /><input name="high" type="float" value="1.0" /></smoothstep>
<subtract name="dn_13" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="dn_12" /></subtract>
<multiply name="dn_dent" type="float"><input name="in1" type="float" nodename="dn_13" /><input name="in2" type="float" nodename="dn_on" /></multiply>
<multiply name="dn_15" type="float"><input name="in1" type="float" nodename="dn_r" /><input name="in2" type="float" value="-0.0035" /></multiply>
<multiply name="h_dent" type="float"><input name="in1" type="float" nodename="dn_dent" /><input name="in2" type="float" nodename="dn_15" /></multiply>
```

### Rough-sawn kerf marks

Band-saw marks are straight, irregular lines across the grain, 3–5 mm apart. Stretch noise along the kerf line
(texcoord x·200..300, y·5, in a frame turned ±4° per board) and use it directly as height (0.14 mm); the kerf grooves
are its **zero crossings, `1 − smoothstep(|n|, 0, 0.22)`**, about 1 mm wide (−0.06 mm). Put the wobble on the signed
noise, never after `absval` (gotcha 15). A presence field makes the marks patchy. Circular-saw arcs (barnwood) bend the
along coordinate by +k·across² instead. From [`shiplap-whitewash`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/shiplap-whitewash/gen.py).

```xml
<!-- in: pn_loc (m: along, across), pn_rid, uv. out: kf_saw (signed, ~+-0.5), kf_groove (0..1), h_kerf (m). Rough-sawn band-saw marks: noise stretched along the kerf line (texcoord x*200..300, y*5 in a frame turned +-4 deg per board) gives straight, irregular lines 3..5 mm apart; the kerf grooves are its zero crossings, 1 - smoothstep(|n|, 0, 0.22), about 1 mm wide. Relief 0.14 mm x n minus 0.06 mm grooves, in patches (35..100%) -->
<multiply name="kf_1" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="131.27" /></multiply>
<add name="kf_2" type="float"><input name="in1" type="float" nodename="kf_1" /><input name="in2" type="float" value="0.2" /></add>
<fract name="kf_3" type="float"><input name="in" type="float" nodename="kf_2" /></fract>
<subtract name="kf_4" type="float"><input name="in1" type="float" nodename="kf_3" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="kf_5" type="float"><input name="in1" type="float" nodename="kf_4" /><input name="in2" type="float" value="8.0" /></multiply>
<rotate2d name="kf_sl" type="vector2"><input name="in" type="vector2" nodename="pn_loc" /><input name="amount" type="float" nodename="kf_5" /></rotate2d>
<separate2 name="kf_ss" type="multioutput"><input name="in" type="vector2" nodename="kf_sl" /></separate2>
<multiply name="kf_8" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="173.89" /></multiply>
<add name="kf_9" type="float"><input name="in1" type="float" nodename="kf_8" /><input name="in2" type="float" value="0.4" /></add>
<fract name="kf_10" type="float"><input name="in" type="float" nodename="kf_9" /></fract>
<multiply name="kf_11" type="float"><input name="in1" type="float" nodename="kf_10" /><input name="in2" type="float" value="100.0" /></multiply>
<add name="kf_f" type="float"><input name="in1" type="float" nodename="kf_11" /><input name="in2" type="float" value="200.0" /></add>
<multiply name="kf_13" type="float"><input name="in1" type="float" nodename="kf_ss" output="outx" /><input name="in2" type="float" nodename="kf_f" /></multiply>
<multiply name="kf_14" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="11.0" /></multiply>
<add name="kf_15" type="float"><input name="in1" type="float" nodename="kf_ss" output="outy" /><input name="in2" type="float" nodename="kf_14" /></add>
<multiply name="kf_16" type="float"><input name="in1" type="float" nodename="kf_15" /><input name="in2" type="float" value="5.0" /></multiply>
<combine2 name="kf_17" type="vector2"><input name="in1" type="float" nodename="kf_13" /><input name="in2" type="float" nodename="kf_16" /></combine2>
<add name="kf_18" type="vector2"><input name="in1" type="vector2" nodename="kf_17" /><input name="in2" type="vector2" value="3.3, 0.4" /></add>
<fractal2d name="kf_n" type="float"><input name="texcoord" type="vector2" nodename="kf_18" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="kf_20" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="2.5, 9.0" /></multiply>
<add name="kf_21" type="vector2"><input name="in1" type="vector2" nodename="kf_20" /><input name="in2" type="vector2" value="1.3, 77.1" /></add>
<fractal2d name="kf_22" type="float"><input name="texcoord" type="vector2" nodename="kf_21" /><input name="amplitude" type="float" value="0.8" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="kf_23" type="float"><input name="in1" type="float" nodename="kf_22" /><input name="in2" type="float" value="0.5" /></add>
<clamp name="kf_24" type="float"><input name="in" type="float" nodename="kf_23" /></clamp>
<multiply name="kf_25" type="float"><input name="in1" type="float" nodename="kf_24" /><input name="in2" type="float" value="0.65" /></multiply>
<add name="kf_pres" type="float"><input name="in1" type="float" nodename="kf_25" /><input name="in2" type="float" value="0.35" /></add>
<multiply name="kf_saw" type="float"><input name="in1" type="float" nodename="kf_n" /><input name="in2" type="float" nodename="kf_pres" /></multiply>
<absval name="kf_28" type="float"><input name="in" type="float" nodename="kf_n" /></absval>
<smoothstep name="kf_29" type="float"><input name="in" type="float" nodename="kf_28" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.22" /></smoothstep>
<subtract name="kf_30" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="kf_29" /></subtract>
<multiply name="kf_groove" type="float"><input name="in1" type="float" nodename="kf_30" /><input name="in2" type="float" nodename="kf_pres" /></multiply>
<multiply name="kf_32" type="float"><input name="in1" type="float" nodename="kf_saw" /><input name="in2" type="float" value="0.00014" /></multiply>
<multiply name="kf_33" type="float"><input name="in1" type="float" nodename="kf_groove" /><input name="in2" type="float" value="0.00006" /></multiply>
<subtract name="h_kerf" type="float"><input name="in1" type="float" nodename="kf_32" /><input name="in2" type="float" nodename="kf_33" /></subtract>
```

### Translucent wash or stain pooling

Whitewash, liming and pickling stains are translucent: mix the wash colour over the wood by a **coverage built from the
same layers as the relief**, so it pools in the valleys and thins on the ridges. Coverage = per-board level + brushy
patches + valleys (earlywood, kerf grooves) − ridges (latewood, saw crests), clamped to 0.03..0.95 so the wood always
shows a little. The raw coverage reads as a stain; a constant mix reads as paint. Judge near-white finishes under
`--ibl neutral -e -1` (bridge and sun turn them yellow, overcast cool).

```xml
<!-- in: pn_col, pn_lw, pn_rid, kf_saw, kf_groove, uv. out: wa_cov (0.03..0.95 wash coverage), wa_col. Translucent whitewash (0.78, 0.775, 0.75) mixed over the wood by a coverage built from the same layers as the relief: per board 0.36..0.82, brushy 30 x 10 cm patches +-0.45, latewood sheds it (-0.55 x lw), saw valleys and kerf grooves hold it. The wood shows through where it is thin, so it reads as a stain, not paint -->
<multiply name="wa_1" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="71.33" /></multiply>
<add name="wa_2" type="float"><input name="in1" type="float" nodename="wa_1" /><input name="in2" type="float" value="0.9" /></add>
<fract name="wa_3" type="float"><input name="in" type="float" nodename="wa_2" /></fract>
<multiply name="wa_4" type="float"><input name="in1" type="float" nodename="wa_3" /><input name="in2" type="float" value="0.46" /></multiply>
<add name="wa_cb" type="float"><input name="in1" type="float" nodename="wa_4" /><input name="in2" type="float" value="0.36" /></add>
<multiply name="wa_6" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="2.5, 7.0" /></multiply>
<add name="wa_7" type="vector2"><input name="in1" type="vector2" nodename="wa_6" /><input name="in2" type="vector2" value="3.1, 9.7" /></add>
<fractal2d name="wa_patch" type="float"><input name="texcoord" type="vector2" nodename="wa_7" /><input name="amplitude" type="float" value="0.45" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="wa_9" type="float"><input name="in1" type="float" nodename="pn_lw" /><input name="in2" type="float" value="-0.55" /></multiply>
<add name="wa_grain" type="float"><input name="in1" type="float" nodename="wa_9" /><input name="in2" type="float" value="0.1" /></add>
<multiply name="wa_11" type="float"><input name="in1" type="float" nodename="kf_saw" /><input name="in2" type="float" value="-0.12" /></multiply>
<multiply name="wa_12" type="float"><input name="in1" type="float" nodename="kf_groove" /><input name="in2" type="float" value="0.05" /></multiply>
<add name="wa_saw" type="float"><input name="in1" type="float" nodename="wa_11" /><input name="in2" type="float" nodename="wa_12" /></add>
<add name="wa_14" type="float"><input name="in1" type="float" nodename="wa_cb" /><input name="in2" type="float" nodename="wa_patch" /></add>
<add name="wa_15" type="float"><input name="in1" type="float" nodename="wa_grain" /><input name="in2" type="float" nodename="wa_saw" /></add>
<add name="wa_16" type="float"><input name="in1" type="float" nodename="wa_14" /><input name="in2" type="float" nodename="wa_15" /></add>
<clamp name="wa_cov" type="float"><input name="in" type="float" nodename="wa_16" /><input name="low" type="float" value="0.03" /><input name="high" type="float" value="0.95" /></clamp>
<mix name="wa_col" type="color3"><input name="bg" type="color3" nodename="pn_col" /><input name="fg" type="color3" value="0.78, 0.775, 0.75" /><input name="mix" type="float" nodename="wa_cov" /></mix>
```

### Along-grain checks: per-band slits

Drying and weather checks run straight along the grain and taper to points. Contours of 2-D noise zigzag across the
lattice rows instead. Cut the across-grain coordinate into bands (9 mm here), wobble the band lines gently, and draw a
slit on each band's centre line whose half-width follows a per-band noise along the grain above a per-band threshold:
the width tapers to 0 at both ends, and the `smoothstep(w, 0.01, 0.03)` gate removes the hairline where the width is
at its floor (gotcha 16). For fine surface checking run a second, narrower band set (3.5 mm). Checks are 1.2 mm deep,
dark and rough. From [`barnwood-wall`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/barnwood-wall/gen.py).

```xml
<!-- in: pn_loc (m: along, across), pn_rid, uv_sep. out: ck_check (0..1), h_check (m). Along-grain checks from per-band slits: the across coordinate is cut into bands 9 mm apart, each band line wobbles gently (+-3 mm at 3 x 8 /m), and a check is a slit on the band centre line whose half-width 0..0.1 band (up to 1.8 mm wide) follows a per-band noise along U (3/m) above a per-band threshold, so checks run straight, taper to points and are 5..30 cm long. Contours of 2-D noise zigzag across lattice rows instead -->
<separate2 name="ck_ls" type="multioutput"><input name="in" type="vector2" nodename="pn_loc" /></separate2>
<multiply name="ck_2" type="vector2"><input name="in1" type="vector2" nodename="pn_loc" /><input name="in2" type="vector2" value="3.0, 8.0" /></multiply>
<add name="ck_3" type="vector2"><input name="in1" type="vector2" nodename="ck_2" /><input name="in2" type="vector2" value="7.7, 1.3" /></add>
<fractal2d name="ck_4" type="float"><input name="texcoord" type="vector2" nodename="ck_3" /><input name="amplitude" type="float" value="0.0031499999999999996" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="ck_5" type="float"><input name="in1" type="float" nodename="ck_ls" output="outy" /><input name="in2" type="float" nodename="ck_4" /></add>
<divide name="ck_6" type="float"><input name="in1" type="float" nodename="ck_5" /><input name="in2" type="float" value="0.009" /></divide>
<add name="ck_y" type="float"><input name="in1" type="float" nodename="ck_6" /><input name="in2" type="float" value="0.5" /></add>
<floor name="ck_bi" type="float"><input name="in" type="float" nodename="ck_y" /></floor>
<subtract name="ck_9" type="float"><input name="in1" type="float" nodename="ck_y" /><input name="in2" type="float" nodename="ck_bi" /></subtract>
<subtract name="ck_10" type="float"><input name="in1" type="float" nodename="ck_9" /><input name="in2" type="float" value="0.5" /></subtract>
<absval name="ck_fy" type="float"><input name="in" type="float" nodename="ck_10" /></absval>
<multiply name="ck_12" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="97.0" /></multiply>
<combine2 name="ck_13" type="vector2"><input name="in1" type="float" nodename="ck_bi" /><input name="in2" type="float" nodename="ck_12" /></combine2>
<add name="ck_14" type="vector2"><input name="in1" type="vector2" nodename="ck_13" /><input name="in2" type="vector2" value="7.7, 1.3" /></add>
<cellnoise2d name="ck_br" type="float"><input name="texcoord" type="vector2" nodename="ck_14" /></cellnoise2d>
<combine2 name="ck_16" type="vector2"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" nodename="ck_br" /></combine2>
<multiply name="ck_17" type="vector2"><input name="in1" type="vector2" nodename="ck_16" /><input name="in2" type="vector2" value="3.0, 53.0" /></multiply>
<add name="ck_18" type="vector2"><input name="in1" type="vector2" nodename="ck_17" /><input name="in2" type="vector2" value="7.7, 1.3" /></add>
<fractal2d name="ck_19" type="float"><input name="texcoord" type="vector2" nodename="ck_18" /><input name="amplitude" type="float" value="0.8" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="ck_20" type="float"><input name="in1" type="float" nodename="ck_19" /><input name="in2" type="float" value="0.5" /></add>
<clamp name="ck_pn" type="float"><input name="in" type="float" nodename="ck_20" /></clamp>
<multiply name="ck_22" type="float"><input name="in1" type="float" nodename="ck_br" /><input name="in2" type="float" value="0.3" /></multiply>
<add name="ck_23" type="float"><input name="in1" type="float" nodename="ck_22" /><input name="in2" type="float" value="0.55" /></add>
<smoothstep name="ck_pres" type="float"><input name="in" type="float" nodename="ck_pn" /><input name="low" type="float" nodename="ck_23" /><input name="high" type="float" value="1.0" /></smoothstep>
<multiply name="ck_25" type="float"><input name="in1" type="float" nodename="ck_pres" /><input name="in2" type="float" value="0.1" /></multiply>
<max name="ck_tw" type="float"><input name="in1" type="float" nodename="ck_25" /><input name="in2" type="float" value="0.0001" /></max>
<smoothstep name="ck_27" type="float"><input name="in" type="float" nodename="ck_fy" /><input name="low" type="float" value="0.0" /><input name="high" type="float" nodename="ck_tw" /></smoothstep>
<subtract name="ck_28" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="ck_27" /></subtract>
<smoothstep name="ck_29" type="float"><input name="in" type="float" nodename="ck_tw" /><input name="low" type="float" value="0.01" /><input name="high" type="float" value="0.03" /></smoothstep>
<multiply name="ck_check" type="float"><input name="in1" type="float" nodename="ck_28" /><input name="in2" type="float" nodename="ck_29" /></multiply>
<multiply name="h_check" type="float"><input name="in1" type="float" nodename="ck_check" /><input name="in2" type="float" value="-0.0012" /></multiply>
```

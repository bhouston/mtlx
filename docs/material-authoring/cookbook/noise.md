# Noise recipes

Smooth-noise building blocks: remapping, warps, stretch, ridges, terraces, layering with a slope budget, correlated
masks, smooth max and finite differences. Part of the [noise cookbook](../NOISE_COOKBOOK.md); read its cheat sheet and
gotchas first. Test materials: [`cookbook_smooth`](../noise-lab/cookbook/cookbook_smooth.mtlx) and
[`cookbook_misc`](../noise-lab/cookbook/cookbook_misc.mtlx).

### Height to normal (always last)

```xml
<!-- in: uv, height (m). out: n_world -> standard_surface.normal. Millimetre workaround for the heighttonormal threshold bug -->
<multiply name="uv_mm" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="1000" /></multiply>
<multiply name="height_mm" type="float"><input name="in1" type="float" nodename="height" /><input name="in2" type="float" value="1000" /></multiply>
<heighttonormal name="n_tangent" type="vector3"><input name="in" type="float" nodename="height_mm" /><input name="scale" type="float" value="16" /><input name="texcoord" type="vector2" nodename="uv_mm" /></heighttonormal>
<normalmap name="n_world" type="vector3"><input name="in" type="vector3" nodename="n_tangent" /></normalmap>
```

### Decorrelated layers

A private frequency **and** offset per layer (no shared zeros or grid).

```xml
<!-- in: uv. out: uv_n = 8/m coords with a private offset (no shared zeros at uv = 0) -->
<multiply name="uv_n0" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="8" /></multiply>
<add name="uv_n" type="vector2"><input name="in1" type="vector2" nodename="uv_n0" /><input name="in2" type="vector2" value="17.31, 5.77" /></add>
```

### Remap to 0..1

Measured p5..p95: `n01` 0.07..0.92, `fbm01` 0.12..0.86, and `u_fbm01` 0.25..0.75. Add `clamp` if an input must stay
in 0..1.

```xml
<!-- in: uv_n. out: n01 (noise2d 0..1, ~5% clipped), fbm (signed fractal, std 0.37), fbm01 (0..1, ~2% outside) -->
<noise2d name="n01" type="float"><input name="texcoord" type="vector2" nodename="uv_n" /><input name="amplitude" type="float" value="0.8" /><input name="pivot" type="float" value="0.5" /></noise2d>
<fractal2d name="fbm" type="float"><input name="texcoord" type="vector2" nodename="uv_n" /><input name="octaves" type="integer" value="4" /></fractal2d>
<multiply name="fbm_s" type="float"><input name="in1" type="float" nodename="fbm" /><input name="in2" type="float" value="0.6" /></multiply>
<add name="fbm01" type="float"><input name="in1" type="float" nodename="fbm_s" /><input name="in2" type="float" value="0.5" /></add>
```

```xml
<!-- in: uv. out: u_fbm01 = 0.5 + 0.5*fractal at 8/m, never clamped to black -->
<unifiednoise2d name="u_fbm01" type="float"><input name="texcoord" type="vector2" nodename="uv" /><input name="freq" type="vector2" value="8, 8" /><input name="offset" type="vector2" value="37.1, 91.7" /><input name="type" type="integer" value="3" /><input name="outmin" type="float" value="0.5" /><input name="outmax" type="float" value="1" /><input name="clampoutput" type="boolean" value="false" /></unifiednoise2d>
```

### True 2D domain warp (vector3)

Bends shapes without folding; here s = 0.03·6 = 0.18. For a fractal warp, halve A.

```xml
<!-- in: uv. out: uv_w = uv displaced in 2D, in metres. f = 6/m, A = 0.03 m, s = A*f = 0.18 (limit 0.2) -->
<multiply name="w_p0" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="6" /></multiply>
<add name="w_p" type="vector2"><input name="in1" type="vector2" nodename="w_p0" /><input name="in2" type="vector2" value="3.1, 7.9" /></add>
<noise2d name="w_n3" type="vector3"><input name="texcoord" type="vector2" nodename="w_p" /><input name="amplitude" type="vector3" value="0.03, 0.03, 0" /></noise2d>
<convert name="w_d" type="vector2"><input name="in" type="vector3" nodename="w_n3" /></convert>
<add name="uv_w" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" nodename="w_d" /></add>
```

### Anisotropic stretch

The size along each axis is 0.7/f, so `(3, 60)` gives streaks 23 cm × 1.2 cm. Add a `rotate2d` before the multiply for
other directions.

```xml
<!-- in: uv. out: n_an = streaks ~23 cm long (0.7/3) and ~1.2 cm wide (0.7/60) along u -->
<multiply name="uv_an" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="3, 60" /></multiply>
<noise2d name="n_an" type="float"><input name="texcoord" type="vector2" nodename="uv_an" /><input name="amplitude" type="float" value="0.8" /><input name="pivot" type="float" value="0.5" /></noise2d>
```

### Ridged and billow

Ridged gives sharp crests (0..0.5); billow gives puffs with V-creases (mean ≈ 0.29). Both have fBm slope (the test
uses ×4 mm at 8/m).

```xml
<!-- in: fbm (signed). out: ridged = 0.5 - |fbm| (crests on the zero contours), billow = |fbm| (puffs, V-creases) -->
<absval name="billow" type="float"><input name="in" type="float" nodename="fbm" /></absval>
<subtract name="ridged" type="float"><input name="in1" type="float" value="0.5" /><input name="in2" type="float" nodename="billow" /></subtract>
```

### Terraces

The riser spans the top half of each step. With the top 25% it rendered as hairlines on `plane`. The test uses ×0.6 mm.

```xml
<!-- in: fbm (signed). out: terraced = k steps per unit of fbm (k = 3), riser over the top half of each step (a narrower riser renders as hairlines on the 1 m view) -->
<multiply name="tr_k" type="float"><input name="in1" type="float" nodename="fbm" /><input name="in2" type="float" value="3" /></multiply>
<floor name="tr_fl" type="float"><input name="in" type="float" nodename="tr_k" /></floor>
<subtract name="tr_fr" type="float"><input name="in1" type="float" nodename="tr_k" /><input name="in2" type="float" nodename="tr_fl" /></subtract>
<smoothstep name="tr_ss" type="float"><input name="in" type="float" nodename="tr_fr" /><input name="low" type="float" value="0.5" /><input name="high" type="float" value="1" /></smoothstep>
<add name="terraced" type="float"><input name="in1" type="float" nodename="tr_fl" /><input name="in2" type="float" nodename="tr_ss" /></add>
```

### Height layering with a slope budget

Macro 3/m at 6.7 mm (~1.5°), meso fBm 40/m at 1 mm (~5°), micro 1500/m at 0.036 mm (~4°). The micro λ is 1.7 px on
`closeup`, where an over-budget layer turns into salt and pepper, so keep it ≤ 5° and move lost slope into roughness.

```xml
<!-- in: uv. out: h_layers (m). Slope budget: macro ~1.5 deg, meso ~5 deg, micro ~4 deg -->
<multiply name="l_p1" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="3" /></multiply>
<noise2d name="l_macro" type="float"><input name="texcoord" type="vector2" nodename="l_p1" /><input name="amplitude" type="float" value="0.0067" /></noise2d>
<multiply name="l_p2" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="40" /></multiply>
<add name="l_p2o" type="vector2"><input name="in1" type="vector2" nodename="l_p2" /><input name="in2" type="vector2" value="11.3, 4.7" /></add>
<fractal2d name="l_meso" type="float"><input name="texcoord" type="vector2" nodename="l_p2o" /><input name="octaves" type="integer" value="3" /><input name="amplitude" type="float" value="0.001" /></fractal2d>
<multiply name="l_p3" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="1500" /></multiply>
<add name="l_p3o" type="vector2"><input name="in1" type="vector2" nodename="l_p3" /><input name="in2" type="vector2" value="71.9, 23.3" /></add>
<noise2d name="l_micro" type="float"><input name="texcoord" type="vector2" nodename="l_p3o" /><input name="amplitude" type="float" value="0.000036" /></noise2d>
<add name="l_mm" type="float"><input name="in1" type="float" nodename="l_macro" /><input name="in2" type="float" nodename="l_meso" /></add>
<add name="h_layers" type="float"><input name="in1" type="float" nodename="l_mm" /><input name="in2" type="float" nodename="l_micro" /></add>
```

### Correlated cavity and wear masks

Colour and roughness from the height field read as a rock face; from an unrelated field they read as stains.
f5 − f2 is exactly octaves 3–5, so it gives convexity for free. Cavity: base ~0.16, roughness 0.95. Wear: base ~0.56,
roughness 0.45.

```xml
<!-- in: uv. out: h_rock (m, ~9 deg typical), cavity, wear (0..1 masks from the same field). Tint: mix colour/roughness by cavity, then by wear -->
<multiply name="cw_p0" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="8" /></multiply>
<add name="cw_p" type="vector2"><input name="in1" type="vector2" nodename="cw_p0" /><input name="in2" type="vector2" value="29.6, 15.2" /></add>
<fractal2d name="cw_f5" type="float"><input name="texcoord" type="vector2" nodename="cw_p" /><input name="octaves" type="integer" value="5" /></fractal2d>
<fractal2d name="cw_f2" type="float"><input name="texcoord" type="vector2" nodename="cw_p" /><input name="octaves" type="integer" value="2" /></fractal2d>
<subtract name="cw_cvx" type="float"><input name="in1" type="float" nodename="cw_f5" /><input name="in2" type="float" nodename="cw_f2" /></subtract>
<multiply name="h_rock" type="float"><input name="in1" type="float" nodename="cw_f5" /><input name="in2" type="float" value="0.008" /></multiply>
<multiply name="cw_ncvx" type="float"><input name="in1" type="float" nodename="cw_cvx" /><input name="in2" type="float" value="-1" /></multiply>
<multiply name="cw_nh" type="float"><input name="in1" type="float" nodename="cw_f5" /><input name="in2" type="float" value="-1" /></multiply>
<smoothstep name="cw_c1" type="float"><input name="in" type="float" nodename="cw_ncvx" /><input name="low" type="float" value="0.06" /><input name="high" type="float" value="0.16" /></smoothstep>
<smoothstep name="cw_c2" type="float"><input name="in" type="float" nodename="cw_nh" /><input name="low" type="float" value="0.25" /><input name="high" type="float" value="0.45" /></smoothstep>
<max name="cavity" type="float"><input name="in1" type="float" nodename="cw_c1" /><input name="in2" type="float" nodename="cw_c2" /></max>
<smoothstep name="cw_w1" type="float"><input name="in" type="float" nodename="cw_cvx" /><input name="low" type="float" value="0.06" /><input name="high" type="float" value="0.16" /></smoothstep>
<smoothstep name="cw_w2" type="float"><input name="in" type="float" nodename="cw_f5" /><input name="low" type="float" value="0" /><input name="high" type="float" value="0.15" /></smoothstep>
<multiply name="wear" type="float"><input name="in1" type="float" nodename="cw_w1" /><input name="in2" type="float" nodename="cw_w2" /></multiply>
```

### Smooth max

A union with a fillet instead of a crease. k ≈ 1/3 of the range, and 0.075 = k/4. For smooth min, negate the inputs and
the output.

```xml
<!-- in: sm_a, sm_b (floats), k = 0.3 (~1/3 of their range). out: smax = max(a,b) + h^2*k/4, h = max(k-|a-b|,0)/k -->
<subtract name="sm_d" type="float"><input name="in1" type="float" nodename="sm_a" /><input name="in2" type="float" nodename="sm_b" /></subtract>
<absval name="sm_ad" type="float"><input name="in" type="float" nodename="sm_d" /></absval>
<subtract name="sm_kd" type="float"><input name="in1" type="float" value="0.3" /><input name="in2" type="float" nodename="sm_ad" /></subtract>
<max name="sm_h0" type="float"><input name="in1" type="float" nodename="sm_kd" /><input name="in2" type="float" value="0" /></max>
<divide name="sm_h" type="float"><input name="in1" type="float" nodename="sm_h0" /><input name="in2" type="float" value="0.3" /></divide>
<multiply name="sm_h2" type="float"><input name="in1" type="float" nodename="sm_h" /><input name="in2" type="float" nodename="sm_h" /></multiply>
<multiply name="sm_c" type="float"><input name="in1" type="float" nodename="sm_h2" /><input name="in2" type="float" value="0.075" /></multiply>
<max name="sm_m" type="float"><input name="in1" type="float" nodename="sm_a" /><input name="in2" type="float" nodename="sm_b" /></max>
<add name="smax" type="float"><input name="in1" type="float" nodename="sm_m" /><input name="in2" type="float" nodename="sm_c" /></add>
```

### Finite-difference derivative

The gradient of any chain, from re-evaluations at +e in u and v (e = 1e-4 m). Measured mean 0.038 and max 0.09, against
a predicted 1.2·A·f = 0.038 and 3·A·f. For a warp fold test, use `det = (dx.x·dy.y − dx.y·dy.x)/e²` < 0 on the warped
coordinates.

```xml
<!-- in: uv. out: fd_slope = |grad h| (tan of slope) of h = 0.004*noise2d(uv*8), by finite differences, e = 1e-4 m -->
<multiply name="fd_p" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="8" /></multiply>
<add name="fd_px" type="vector2"><input name="in1" type="vector2" nodename="fd_p" /><input name="in2" type="vector2" value="0.0008, 0" /></add>
<add name="fd_py" type="vector2"><input name="in1" type="vector2" nodename="fd_p" /><input name="in2" type="vector2" value="0, 0.0008" /></add>
<noise2d name="fd_h0" type="float"><input name="texcoord" type="vector2" nodename="fd_p" /></noise2d>
<noise2d name="fd_hx" type="float"><input name="texcoord" type="vector2" nodename="fd_px" /></noise2d>
<noise2d name="fd_hy" type="float"><input name="texcoord" type="vector2" nodename="fd_py" /></noise2d>
<subtract name="fd_dx" type="float"><input name="in1" type="float" nodename="fd_hx" /><input name="in2" type="float" nodename="fd_h0" /></subtract>
<subtract name="fd_dy" type="float"><input name="in1" type="float" nodename="fd_hy" /><input name="in2" type="float" nodename="fd_h0" /></subtract>
<combine2 name="fd_g" type="vector2"><input name="in1" type="float" nodename="fd_dx" /><input name="in2" type="float" nodename="fd_dy" /></combine2>
<magnitude name="fd_gm" type="float"><input name="in" type="vector2" nodename="fd_g" /></magnitude>
<multiply name="fd_slope" type="float"><input name="in1" type="float" nodename="fd_gm" /><input name="in2" type="float" value="40" /></multiply>
```

# Profiles: mouldings, steps, battens and channels

Height profiles for wall panelling: a 1-D moulding (bead, quirk, cove), a recessed panel step, a large raised batten,
composing a raised element over a varying base, deep channels with baked AO, and per-board bows that vanish at the
joints. All heights are in metres, 0 at the face. Part of the [noise cookbook](../NOISE_COOKBOOK.md); harvested from
round 4 ([beadboard](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/beadboard/gen.py), [fluted-walnut](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/fluted-walnut/gen.py),
[shaker-panel](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/shaker-panel/gen.py), [board-batten](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/board-batten/gen.py), [acoustic-slat](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/acoustic-slat/gen.py)).
Test materials: [`cookbook_profiles`](../noise-lab/cookbook/cookbook_profiles.mtlx) (sheet `profiles.avif`) and
[`cookbook_wood2`](../noise-lab/cookbook/cookbook_wood2.mtlx) (the cove flutes).

**Slope rules for designed edges** (AUTHORING §4): noise relief stays under ~30°, but a designed edge may reach ~45°
with a ramp ≥ 4 px, and 60–65° when the ramp is **≥ ~10 px at the view you judge**. Narrow steep ramps give
sky-coloured patches and 2×2 blocks (bug 5). Every edge needs continuous curvature where it meets a flat: use a smooth
min for the arris and a smooth max for the fillet, never a bare min or max. The quadratic smooth max is
max(a, b) + h²k/4 and the cubic smooth min is min(a, b) − h³k/6, with h = max(k − |a − b|, 0)/k and k the blend width
in height units. Both read a and b twice, so keep their inputs small (a profile, not a textured surface; bug 7).

### 1-D moulding profile

One coordinate across the moulding, t = |s| from the bead centre, drives every piece:

- **bead:** a circular arc, `sqrt(max(R² − t², 0)) − R` (0 at the crown, −R beyond t = R);
- **V quirk:** a 45° wall `t − (TB + D)` that rises from the quirk floor −D at TB to the face at TB + D;
- **fillet:** `smax(bead, wall, k)` rounds the V where paint pools;
- **arris:** `smin(wall, 0, k)` rounds the top edge. Apply it to the wall _before_ the union, so the bead crown stays
  true (smin(profile, 0) would also dip the crown by k/4);
- **flat-slot floor:** `max(profile, −D)`. Shifting the wall out by a slot width (here on even beads, where the board
  joint opens) leaves a flat-bottomed slot instead of letting the bead arc run on down.

`mb_cav` marks the quirks for darker pooled paint. Beads flush with the face and 45 mm apart read as half-rounds under
sun and bridge. The same pieces make reeded glass (beads only) and wainscot. The test adds the bows below.

```xml
<!-- in: uv_sep. out: mb_s (m from the bead centre, across U), mb_k (bead index), h_mould (m, 0 = board face), mb_cav (0..1 in the quirks). Beadboard moulding across U: a half-round bead every 45 mm (circular arc sqrt(max(R^2 - t^2, 0)) - R, R 4.5 mm), meeting a 45 deg V quirk 1.5 mm deep at t = TB = 3.35 mm; smooth-max fillet k 0.6 mm in the V, cubic smooth-min arris k 0.5 mm where the quirk wall meets the face (applied to the wall before the union, so the bead crown stays true); even beads open a 0.6 mm slot on their right (the board joint) with a flat floor max(., -D) -->
<divide name="mb_1" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.045" /></divide>
<add name="mb_wb" type="float"><input name="in1" type="float" nodename="mb_1" /><input name="in2" type="float" value="0.574536" /></add>
<floor name="mb_k" type="float"><input name="in" type="float" nodename="mb_wb" /></floor>
<subtract name="mb_4" type="float"><input name="in1" type="float" nodename="mb_wb" /><input name="in2" type="float" nodename="mb_k" /></subtract>
<subtract name="mb_5" type="float"><input name="in1" type="float" nodename="mb_4" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="mb_s" type="float"><input name="in1" type="float" nodename="mb_5" /><input name="in2" type="float" value="0.045" /></multiply>
<absval name="mb_t" type="float"><input name="in" type="float" nodename="mb_s" /></absval>
<multiply name="mb_8" type="float"><input name="in1" type="float" nodename="mb_t" /><input name="in2" type="float" nodename="mb_t" /></multiply>
<subtract name="mb_9" type="float"><input name="in1" type="float" value="0.00002025" /><input name="in2" type="float" nodename="mb_8" /></subtract>
<max name="mb_10" type="float"><input name="in1" type="float" nodename="mb_9" /><input name="in2" type="float" value="0.0" /></max>
<sqrt name="mb_11" type="float"><input name="in" type="float" nodename="mb_10" /></sqrt>
<subtract name="mb_bead" type="float"><input name="in1" type="float" nodename="mb_11" /><input name="in2" type="float" value="0.0045" /></subtract>
<multiply name="mb_13" type="float"><input name="in1" type="float" nodename="mb_k" /><input name="in2" type="float" value="0.5" /></multiply>
<fract name="mb_14" type="float"><input name="in" type="float" nodename="mb_13" /></fract>
<ifgreater name="mb_even" type="float"><input name="value1" type="float" value="0.25" /><input name="value2" type="float" nodename="mb_14" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<ifgreater name="mb_16" type="float"><input name="value1" type="float" nodename="mb_s" /><input name="value2" type="float" value="0.0" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="mb_17" type="float"><input name="in1" type="float" nodename="mb_even" /><input name="in2" type="float" nodename="mb_16" /></multiply>
<multiply name="mb_slot" type="float"><input name="in1" type="float" nodename="mb_17" /><input name="in2" type="float" value="0.0006" /></multiply>
<subtract name="mb_19" type="float"><input name="in1" type="float" nodename="mb_t" /><input name="in2" type="float" nodename="mb_slot" /></subtract>
<subtract name="mb_wall" type="float"><input name="in1" type="float" nodename="mb_19" /><input name="in2" type="float" value="0.0048541" /></subtract>
<subtract name="mb_21" type="float"><input name="in1" type="float" nodename="mb_wall" /><input name="in2" type="float" value="0.0" /></subtract>
<absval name="mb_22" type="float"><input name="in" type="float" nodename="mb_21" /></absval>
<subtract name="mb_23" type="float"><input name="in1" type="float" value="0.0005" /><input name="in2" type="float" nodename="mb_22" /></subtract>
<max name="mb_24" type="float"><input name="in1" type="float" nodename="mb_23" /><input name="in2" type="float" value="0.0" /></max>
<divide name="mb_25" type="float"><input name="in1" type="float" nodename="mb_24" /><input name="in2" type="float" value="0.0005" /></divide>
<min name="mb_26" type="float"><input name="in1" type="float" nodename="mb_wall" /><input name="in2" type="float" value="0.0" /></min>
<multiply name="mb_27" type="float"><input name="in1" type="float" nodename="mb_25" /><input name="in2" type="float" nodename="mb_25" /></multiply>
<multiply name="mb_28" type="float"><input name="in1" type="float" nodename="mb_27" /><input name="in2" type="float" nodename="mb_25" /></multiply>
<multiply name="mb_29" type="float"><input name="in1" type="float" nodename="mb_28" /><input name="in2" type="float" value="0.00008333" /></multiply>
<subtract name="mb_arris" type="float"><input name="in1" type="float" nodename="mb_26" /><input name="in2" type="float" nodename="mb_29" /></subtract>
<subtract name="mb_31" type="float"><input name="in1" type="float" nodename="mb_bead" /><input name="in2" type="float" nodename="mb_arris" /></subtract>
<absval name="mb_32" type="float"><input name="in" type="float" nodename="mb_31" /></absval>
<subtract name="mb_33" type="float"><input name="in1" type="float" value="0.0006" /><input name="in2" type="float" nodename="mb_32" /></subtract>
<max name="mb_34" type="float"><input name="in1" type="float" nodename="mb_33" /><input name="in2" type="float" value="0.0" /></max>
<divide name="mb_35" type="float"><input name="in1" type="float" nodename="mb_34" /><input name="in2" type="float" value="0.0006" /></divide>
<max name="mb_36" type="float"><input name="in1" type="float" nodename="mb_bead" /><input name="in2" type="float" nodename="mb_arris" /></max>
<multiply name="mb_37" type="float"><input name="in1" type="float" nodename="mb_35" /><input name="in2" type="float" nodename="mb_35" /></multiply>
<multiply name="mb_38" type="float"><input name="in1" type="float" nodename="mb_37" /><input name="in2" type="float" value="0.00015" /></multiply>
<add name="mb_fil" type="float"><input name="in1" type="float" nodename="mb_36" /><input name="in2" type="float" nodename="mb_38" /></add>
<max name="h_mould" type="float"><input name="in1" type="float" nodename="mb_fil" /><input name="in2" type="float" value="-0.0015" /></max>
<multiply name="mb_41" type="float"><input name="in1" type="float" nodename="h_mould" /><input name="in2" type="float" value="-1.0" /></multiply>
<smoothstep name="mb_cav" type="float"><input name="in" type="float" nodename="mb_41" /><input name="low" type="float" value="0.0005" /><input name="high" type="float" value="0.0014" /></smoothstep>
```

**Cove flutes** are the concave version: a circular cove of half-width A and depth S has radius
RC = (A² + S²)/2S and h = (RC − S) − sqrt(RC² − min(x², A²)). Its wall at the arris is asin(A/RC): 43.6° for
20 × 4 mm, which renders cleanly with a ~6 px ramp at `closeup`. Make the panel width a whole number of pitches plus a
half, so panel edges land on a land. `fl_dh` (dh/dx) feeds the [relief-aware ring fade](grain.md#relief-aware-ring-frequency).
At room scale (`--uv-scale 4`) 22 mm flutes are ~4.4 px apart, near moiré; judge periodic relief at the farthest view
that must look clean.

```xml
<!-- in: uv_sep. out: fl_pid (panel index), fl_xc (m from the panel centre, across U), h_flute (m), fl_dh (dh/dx, for the ring-frequency fade). Fluted panel: 506 mm panels (23 flutes, so the panel edge falls on a land), circular cove flutes 20 mm wide x 4 mm deep on a 22 mm pitch (2 mm lands): cove radius RC = (A^2 + S^2)/2S = 14.5 mm, h = (RC - S) - sqrt(RC^2 - min(x^2, A^2)). The wall at the arris is asin(A/RC) = 43.6 deg; it renders cleanly with a ~6 px ramp at closeup -->
<divide name="fl_1" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.506" /></divide>
<floor name="fl_pid" type="float"><input name="in" type="float" nodename="fl_1" /></floor>
<add name="fl_3" type="float"><input name="in1" type="float" nodename="fl_pid" /><input name="in2" type="float" value="0.5" /></add>
<multiply name="fl_4" type="float"><input name="in1" type="float" nodename="fl_3" /><input name="in2" type="float" value="0.506" /></multiply>
<subtract name="fl_xc" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" nodename="fl_4" /></subtract>
<divide name="fl_6" type="float"><input name="in1" type="float" nodename="fl_xc" /><input name="in2" type="float" value="0.022" /></divide>
<add name="fl_7" type="float"><input name="in1" type="float" nodename="fl_6" /><input name="in2" type="float" value="0.5" /></add>
<fract name="fl_8" type="float"><input name="in" type="float" nodename="fl_7" /></fract>
<subtract name="fl_9" type="float"><input name="in1" type="float" nodename="fl_8" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="fl_x" type="float"><input name="in1" type="float" nodename="fl_9" /><input name="in2" type="float" value="0.022" /></multiply>
<multiply name="fl_x2" type="float"><input name="in1" type="float" nodename="fl_x" /><input name="in2" type="float" nodename="fl_x" /></multiply>
<min name="fl_12" type="float"><input name="in1" type="float" nodename="fl_x2" /><input name="in2" type="float" value="0.0001" /></min>
<subtract name="fl_13" type="float"><input name="in1" type="float" value="0.00021025" /><input name="in2" type="float" nodename="fl_12" /></subtract>
<sqrt name="fl_root" type="float"><input name="in" type="float" nodename="fl_13" /></sqrt>
<subtract name="h_flute" type="float"><input name="in1" type="float" value="0.0105" /><input name="in2" type="float" nodename="fl_root" /></subtract>
<divide name="fl_16" type="float"><input name="in1" type="float" nodename="fl_x" /><input name="in2" type="float" nodename="fl_root" /></divide>
<ifgreater name="fl_dh" type="float"><input name="value1" type="float" value="0.0001" /><input name="value2" type="float" nodename="fl_x2" /><input name="in1" type="float" nodename="fl_16" /><input name="in2" type="float" value="0.0" /></ifgreater>
```

### Recessed or raised panel step

Frame-and-panel: d = max(|x| − HX, |y| − HY) is the distance to the panel outline (square, mitred contours). The wall
is d·S, rounded at the top by a cubic smooth min with 0 (the arris) and at the bottom by a quadratic smooth max with −D
(the fillet). Here S = 2 (63°) over a 4 mm ramp: that is ~10 px at `closeup`, which is why it can be steeper than the
45° guideline and still render cleanly. For a **raised** panel, negate d (the field is proud, the frame is the floor).
`ps_corner` darkens the inside corner (thicker paint, occlusion).

**Seed per member, not per layout cell.** Stiles run the full height, and rails cross panel-cell edges, so a
per-cell random puts a tone step in the middle of a member. Key stiles on their column, `floor(u/PU + 0.5)`, rails on
(panel column, rail row `floor(v/PV + 0.5)`), and panels on the cell (`ps_tone`).

```xml
<!-- in: uv_sep. out: h_step (m, 0 = frame face), ps_d (m to the panel outline, + on the frame), ps_stile (1 on stiles), ps_tone (per-member random 0..1), ps_corner (1 in the inside corner). Recessed Shaker panel: 400 x 600 mm panels on a 470 x 670 mm pitch (70 mm stiles and rails), 8 mm step. The wall is d*2 (63 deg, 4 mm wide: ~10 px at closeup, which is what lets it be this steep), then a cubic smooth-min arris (k 2 mm) and a quadratic smooth-max fillet (k 1.2 mm) at the panel floor. Seeds are per member: stiles run through and are keyed on the stile column, rails on (column, rail row), panels on the cell, so no tone step lands mid-member -->
<divide name="ps_u" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.47" /></divide>
<divide name="ps_v" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" value="0.67" /></divide>
<fract name="ps_3" type="float"><input name="in" type="float" nodename="ps_u" /></fract>
<subtract name="ps_4" type="float"><input name="in1" type="float" nodename="ps_3" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="ps_lx" type="float"><input name="in1" type="float" nodename="ps_4" /><input name="in2" type="float" value="0.47" /></multiply>
<fract name="ps_6" type="float"><input name="in" type="float" nodename="ps_v" /></fract>
<subtract name="ps_7" type="float"><input name="in1" type="float" nodename="ps_6" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="ps_ly" type="float"><input name="in1" type="float" nodename="ps_7" /><input name="in2" type="float" value="0.67" /></multiply>
<absval name="ps_9" type="float"><input name="in" type="float" nodename="ps_lx" /></absval>
<subtract name="ps_ex" type="float"><input name="in1" type="float" nodename="ps_9" /><input name="in2" type="float" value="0.2" /></subtract>
<absval name="ps_11" type="float"><input name="in" type="float" nodename="ps_ly" /></absval>
<subtract name="ps_ey" type="float"><input name="in1" type="float" nodename="ps_11" /><input name="in2" type="float" value="0.3" /></subtract>
<max name="ps_d" type="float"><input name="in1" type="float" nodename="ps_ex" /><input name="in2" type="float" nodename="ps_ey" /></max>
<multiply name="ps_14" type="float"><input name="in1" type="float" nodename="ps_d" /><input name="in2" type="float" value="2.0" /></multiply>
<subtract name="ps_15" type="float"><input name="in1" type="float" nodename="ps_14" /><input name="in2" type="float" value="0.0" /></subtract>
<absval name="ps_16" type="float"><input name="in" type="float" nodename="ps_15" /></absval>
<subtract name="ps_17" type="float"><input name="in1" type="float" value="0.002" /><input name="in2" type="float" nodename="ps_16" /></subtract>
<max name="ps_18" type="float"><input name="in1" type="float" nodename="ps_17" /><input name="in2" type="float" value="0.0" /></max>
<divide name="ps_19" type="float"><input name="in1" type="float" nodename="ps_18" /><input name="in2" type="float" value="0.002" /></divide>
<min name="ps_20" type="float"><input name="in1" type="float" nodename="ps_14" /><input name="in2" type="float" value="0.0" /></min>
<multiply name="ps_21" type="float"><input name="in1" type="float" nodename="ps_19" /><input name="in2" type="float" nodename="ps_19" /></multiply>
<multiply name="ps_22" type="float"><input name="in1" type="float" nodename="ps_21" /><input name="in2" type="float" nodename="ps_19" /></multiply>
<multiply name="ps_23" type="float"><input name="in1" type="float" nodename="ps_22" /><input name="in2" type="float" value="0.0003333333333333333" /></multiply>
<subtract name="ps_top" type="float"><input name="in1" type="float" nodename="ps_20" /><input name="in2" type="float" nodename="ps_23" /></subtract>
<subtract name="ps_25" type="float"><input name="in1" type="float" nodename="ps_top" /><input name="in2" type="float" value="-0.008" /></subtract>
<absval name="ps_26" type="float"><input name="in" type="float" nodename="ps_25" /></absval>
<subtract name="ps_27" type="float"><input name="in1" type="float" value="0.0012" /><input name="in2" type="float" nodename="ps_26" /></subtract>
<max name="ps_28" type="float"><input name="in1" type="float" nodename="ps_27" /><input name="in2" type="float" value="0.0" /></max>
<divide name="ps_29" type="float"><input name="in1" type="float" nodename="ps_28" /><input name="in2" type="float" value="0.0012" /></divide>
<max name="ps_30" type="float"><input name="in1" type="float" nodename="ps_top" /><input name="in2" type="float" value="-0.008" /></max>
<multiply name="ps_31" type="float"><input name="in1" type="float" nodename="ps_29" /><input name="in2" type="float" nodename="ps_29" /></multiply>
<multiply name="ps_32" type="float"><input name="in1" type="float" nodename="ps_31" /><input name="in2" type="float" value="0.0003" /></multiply>
<add name="h_step" type="float"><input name="in1" type="float" nodename="ps_30" /><input name="in2" type="float" nodename="ps_32" /></add>
<multiply name="ps_34" type="float"><input name="in1" type="float" nodename="ps_d" /><input name="in2" type="float" value="-1.0" /></multiply>
<subtract name="ps_35" type="float"><input name="in1" type="float" nodename="ps_34" /><input name="in2" type="float" value="0.004" /></subtract>
<smoothstep name="ps_36" type="float"><input name="in" type="float" nodename="ps_35" /><input name="low" type="float" value="-0.001" /><input name="high" type="float" value="0.003" /></smoothstep>
<subtract name="ps_corner" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="ps_36" /></subtract>
<smoothstep name="ps_stile" type="float"><input name="in" type="float" nodename="ps_ex" /><input name="low" type="float" value="-0.0002" /><input name="high" type="float" value="0.0002" /></smoothstep>
<subtract name="ps_39" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="ps_stile" /></subtract>
<smoothstep name="ps_40" type="float"><input name="in" type="float" nodename="ps_ey" /><input name="low" type="float" value="-0.0002" /><input name="high" type="float" value="0.0002" /></smoothstep>
<multiply name="ps_rail" type="float"><input name="in1" type="float" nodename="ps_39" /><input name="in2" type="float" nodename="ps_40" /></multiply>
<floor name="ps_col" type="float"><input name="in" type="float" nodename="ps_u" /></floor>
<add name="ps_43" type="float"><input name="in1" type="float" nodename="ps_u" /><input name="in2" type="float" value="0.5" /></add>
<floor name="ps_44" type="float"><input name="in" type="float" nodename="ps_43" /></floor>
<combine2 name="ps_45" type="vector2"><input name="in1" type="float" nodename="ps_44" /><input name="in2" type="float" value="1.0" /></combine2>
<add name="ps_46" type="vector2"><input name="in1" type="vector2" nodename="ps_45" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="ps_sid" type="float"><input name="texcoord" type="vector2" nodename="ps_46" /></cellnoise2d>
<add name="ps_48" type="float"><input name="in1" type="float" nodename="ps_v" /><input name="in2" type="float" value="0.5" /></add>
<floor name="ps_49" type="float"><input name="in" type="float" nodename="ps_48" /></floor>
<combine2 name="ps_50" type="vector2"><input name="in1" type="float" nodename="ps_col" /><input name="in2" type="float" nodename="ps_49" /></combine2>
<add name="ps_51" type="vector2"><input name="in1" type="vector2" nodename="ps_50" /><input name="in2" type="vector2" value="41.37, 9.61" /></add>
<cellnoise2d name="ps_rid" type="float"><input name="texcoord" type="vector2" nodename="ps_51" /></cellnoise2d>
<floor name="ps_53" type="float"><input name="in" type="float" nodename="ps_v" /></floor>
<combine2 name="ps_54" type="vector2"><input name="in1" type="float" nodename="ps_col" /><input name="in2" type="float" nodename="ps_53" /></combine2>
<add name="ps_55" type="vector2"><input name="in1" type="vector2" nodename="ps_54" /><input name="in2" type="vector2" value="11.37, 5.61" /></add>
<cellnoise2d name="ps_pid" type="float"><input name="texcoord" type="vector2" nodename="ps_55" /></cellnoise2d>
<mix name="ps_57" type="float"><input name="bg" type="float" nodename="ps_pid" /><input name="fg" type="float" nodename="ps_rid" /><input name="mix" type="float" nodename="ps_rail" /></mix>
<mix name="ps_tone" type="float"><input name="bg" type="float" nodename="ps_57" /><input name="fg" type="float" nodename="ps_sid" /><input name="mix" type="float" nodename="ps_stile" /></mix>
```

### Large raised step: batten or trim

Steps of 10–20 mm need a face near 55° and must still have continuous curvature at the toe and the arris. Build the
side as the **integral of a smoothstep-shaped slope**: slope(x) = SMAX·smoothstep(x/C)·(1 − smoothstep((x − W + E)/E)),
whose integral is analytic with I(t) = tc³ − tc⁴/2 + max(t − 1, 0), tc = clamp(t). Normalised by its plateau,
W − C/2 − E/2, it gives `bt_m` (0 on the board, 1 on the batten top), so the height is H·m. The footprint is
**W ≈ H/tan(θ) + (fillet + ease)/2**: 16.8 mm for 19 mm at 55° with a 4.5 mm caulk fillet C and a 2.5 mm eased arris E.
A 50–60° face renders cleanly when the ramp is ≥ 4 px at the farthest view (~9 px at `plane` here). `bt_ao` darkens
the board beside the toe.

```xml
<!-- in: uv_sep. out: bt_m (0 board .. 1 batten top), bt_x (m up the side from the toe), bt_xb (m from the board centre, for the base), bt_ao (albedo factor, 0.65 at the toe). Board-and-batten: 250 mm boards, a 50 mm batten H = 19 mm proud over each seam. The side slope is SMAX*smoothstep(x/C)*(1 - smoothstep((x - W + E)/E)), integrated analytically: I(t) = tc^3 - tc^4/2 + max(t - 1, 0), tc = clamp(t), so curvature is continuous at the toe (fillet C = 4.5 mm) and the arris (ease E = 2.5 mm). Width W = H/SMAX + (C + E)/2 = 16.8 mm for a 55 deg face (SMAX = tan) -->
<divide name="bt_us" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.25" /></divide>
<floor name="bt_bk" type="float"><input name="in" type="float" nodename="bt_us" /></floor>
<subtract name="bt_3" type="float"><input name="in1" type="float" nodename="bt_us" /><input name="in2" type="float" nodename="bt_bk" /></subtract>
<subtract name="bt_4" type="float"><input name="in1" type="float" nodename="bt_3" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="bt_xb" type="float"><input name="in1" type="float" nodename="bt_4" /><input name="in2" type="float" value="0.25" /></multiply>
<add name="bt_6" type="float"><input name="in1" type="float" nodename="bt_us" /><input name="in2" type="float" value="0.5" /></add>
<floor name="bt_7" type="float"><input name="in" type="float" nodename="bt_6" /></floor>
<subtract name="bt_8" type="float"><input name="in1" type="float" nodename="bt_6" /><input name="in2" type="float" nodename="bt_7" /></subtract>
<subtract name="bt_9" type="float"><input name="in1" type="float" nodename="bt_8" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="bt_xs" type="float"><input name="in1" type="float" nodename="bt_9" /><input name="in2" type="float" value="0.25" /></multiply>
<absval name="bt_11" type="float"><input name="in" type="float" nodename="bt_xs" /></absval>
<subtract name="bt_x" type="float"><input name="in1" type="float" value="0.038287" /><input name="in2" type="float" nodename="bt_11" /></subtract>
<divide name="bt_13" type="float"><input name="in1" type="float" nodename="bt_x" /><input name="in2" type="float" value="0.0045" /></divide>
<clamp name="bt_14" type="float"><input name="in" type="float" nodename="bt_13" /></clamp>
<multiply name="bt_15" type="float"><input name="in1" type="float" nodename="bt_14" /><input name="in2" type="float" nodename="bt_14" /></multiply>
<multiply name="bt_16" type="float"><input name="in1" type="float" nodename="bt_15" /><input name="in2" type="float" nodename="bt_14" /></multiply>
<multiply name="bt_17" type="float"><input name="in1" type="float" nodename="bt_15" /><input name="in2" type="float" nodename="bt_15" /></multiply>
<multiply name="bt_18" type="float"><input name="in1" type="float" nodename="bt_17" /><input name="in2" type="float" value="0.5" /></multiply>
<subtract name="bt_19" type="float"><input name="in1" type="float" nodename="bt_16" /><input name="in2" type="float" nodename="bt_18" /></subtract>
<subtract name="bt_20" type="float"><input name="in1" type="float" nodename="bt_13" /><input name="in2" type="float" value="1.0" /></subtract>
<max name="bt_21" type="float"><input name="in1" type="float" nodename="bt_20" /><input name="in2" type="float" value="0.0" /></max>
<add name="bt_ic" type="float"><input name="in1" type="float" nodename="bt_19" /><input name="in2" type="float" nodename="bt_21" /></add>
<multiply name="bt_23" type="float"><input name="in1" type="float" nodename="bt_ic" /><input name="in2" type="float" value="0.0045" /></multiply>
<subtract name="bt_24" type="float"><input name="in1" type="float" nodename="bt_x" /><input name="in2" type="float" value="0.014287" /></subtract>
<divide name="bt_25" type="float"><input name="in1" type="float" nodename="bt_24" /><input name="in2" type="float" value="0.0025" /></divide>
<clamp name="bt_26" type="float"><input name="in" type="float" nodename="bt_25" /></clamp>
<multiply name="bt_27" type="float"><input name="in1" type="float" nodename="bt_26" /><input name="in2" type="float" nodename="bt_26" /></multiply>
<multiply name="bt_28" type="float"><input name="in1" type="float" nodename="bt_27" /><input name="in2" type="float" nodename="bt_26" /></multiply>
<multiply name="bt_29" type="float"><input name="in1" type="float" nodename="bt_27" /><input name="in2" type="float" nodename="bt_27" /></multiply>
<multiply name="bt_30" type="float"><input name="in1" type="float" nodename="bt_29" /><input name="in2" type="float" value="0.5" /></multiply>
<subtract name="bt_31" type="float"><input name="in1" type="float" nodename="bt_28" /><input name="in2" type="float" nodename="bt_30" /></subtract>
<subtract name="bt_32" type="float"><input name="in1" type="float" nodename="bt_25" /><input name="in2" type="float" value="1.0" /></subtract>
<max name="bt_33" type="float"><input name="in1" type="float" nodename="bt_32" /><input name="in2" type="float" value="0.0" /></max>
<add name="bt_ie" type="float"><input name="in1" type="float" nodename="bt_31" /><input name="in2" type="float" nodename="bt_33" /></add>
<multiply name="bt_35" type="float"><input name="in1" type="float" nodename="bt_ie" /><input name="in2" type="float" value="0.0025" /></multiply>
<subtract name="bt_raw" type="float"><input name="in1" type="float" nodename="bt_23" /><input name="in2" type="float" nodename="bt_35" /></subtract>
<divide name="bt_37" type="float"><input name="in1" type="float" nodename="bt_raw" /><input name="in2" type="float" value="0.013287" /></divide>
<clamp name="bt_m" type="float"><input name="in" type="float" nodename="bt_37" /></clamp>
<smoothstep name="bt_39" type="float"><input name="in" type="float" nodename="bt_x" /><input name="low" type="float" value="-0.004" /><input name="high" type="float" value="0.0045" /></smoothstep>
<subtract name="bt_40" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="bt_39" /></subtract>
<multiply name="bt_41" type="float"><input name="in1" type="float" nodename="bt_40" /><input name="in2" type="float" value="-0.35" /></multiply>
<add name="bt_ao" type="float"><input name="in1" type="float" nodename="bt_41" /><input name="in2" type="float" value="1.0" /></add>
```

### Raised element over a varying base

Compose with **h = H·m + h_base·(1 − m)**, not h_base + H·m. Added on top, the batten inherits the base's slope, which
changes sign under the batten side (a cupped board is lowest mid-board and 0 at the seam) and creases there. The mix
also hides base detail (grain, stipple) under the batten; add the batten's own texture times its mask.

```xml
<!-- in: bt_m, bt_xb. out: h_bat (m). A raised element over a varying base: h = H*m + h_base*(1 - m). The base here is a board cup 0.8 mm deep (0 at the seams, -0.8 mm mid-board). Adding H*m on top of the cup instead creases where the cup slope changes sign under the batten side -->
<divide name="ov_xq" type="float"><input name="in1" type="float" nodename="bt_xb" /><input name="in2" type="float" value="0.125" /></divide>
<multiply name="ov_2" type="float"><input name="in1" type="float" nodename="ov_xq" /><input name="in2" type="float" nodename="ov_xq" /></multiply>
<subtract name="ov_3" type="float"><input name="in1" type="float" nodename="ov_2" /><input name="in2" type="float" value="1.0" /></subtract>
<multiply name="ov_base" type="float"><input name="in1" type="float" nodename="ov_3" /><input name="in2" type="float" value="0.0008" /></multiply>
<multiply name="ov_5" type="float"><input name="in1" type="float" nodename="bt_m" /><input name="in2" type="float" value="0.019" /></multiply>
<subtract name="ov_6" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="bt_m" /></subtract>
<multiply name="ov_7" type="float"><input name="in1" type="float" nodename="ov_base" /><input name="in2" type="float" nodename="ov_6" /></multiply>
<add name="h_bat" type="float"><input name="in1" type="float" nodename="ov_5" /><input name="in2" type="float" nodename="ov_7" /></add>
```

### Deep channels and albedo AO

A reveal or slat gap deeper than it is wide has vertical walls that no slope budget can model. Keep the height a
ramped profile of a few millimetres (here 4 mm over 6.3 mm, ~43°) and put the depth into **albedo**: darken the channel
floor toward the walls (×0.4 at the wall to ×1 mid-channel), a baked ambient-occlusion term, and shade the side walls
darker than the face. Without it the channel reads as a painted stripe. Dark felt needs roughness 1 and `specular`
~0.2, or it shows a grey Fresnel sheen at grazing angles.

```xml
<!-- in: uv_sep. out: h_chan (m), ch_face (1 on the slat face), ch_floor (1 on the channel floor), ch_ao (albedo factor 0.4 at the walls .. 1 mid-channel). Slats 27 mm on a 40 mm pitch, 13 mm channels: the real channel is deeper than it is wide, which the slope budget cannot model, so the height is a 4 mm smoothstep ramp from 5.5 mm into the gap to 0.8 mm onto the face (max ~43 deg; 3 px at plane at -s 512, 5 px at the default 800 px, 16 px at closeup) and the depth goes into albedo: the floor darkens toward the walls (baked AO) -->
<divide name="ch_s" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.04" /></divide>
<floor name="ch_2" type="float"><input name="in" type="float" nodename="ch_s" /></floor>
<subtract name="ch_3" type="float"><input name="in1" type="float" nodename="ch_s" /><input name="in2" type="float" nodename="ch_2" /></subtract>
<subtract name="ch_4" type="float"><input name="in1" type="float" nodename="ch_3" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="ch_y" type="float"><input name="in1" type="float" nodename="ch_4" /><input name="in2" type="float" value="0.04" /></multiply>
<absval name="ch_6" type="float"><input name="in" type="float" nodename="ch_y" /></absval>
<subtract name="ch_d" type="float"><input name="in1" type="float" value="0.0135" /><input name="in2" type="float" nodename="ch_6" /></subtract>
<smoothstep name="ch_8" type="float"><input name="in" type="float" nodename="ch_d" /><input name="low" type="float" value="-0.0055" /><input name="high" type="float" value="0.0008" /></smoothstep>
<multiply name="h_chan" type="float"><input name="in1" type="float" nodename="ch_8" /><input name="in2" type="float" value="0.004" /></multiply>
<smoothstep name="ch_face" type="float"><input name="in" type="float" nodename="ch_d" /><input name="low" type="float" value="-0.0007" /><input name="high" type="float" value="0.0002" /></smoothstep>
<smoothstep name="ch_11" type="float"><input name="in" type="float" nodename="ch_d" /><input name="low" type="float" value="-0.0038" /><input name="high" type="float" value="-0.0018" /></smoothstep>
<subtract name="ch_floor" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="ch_11" /></subtract>
<multiply name="ch_13" type="float"><input name="in1" type="float" nodename="ch_d" /><input name="in2" type="float" value="-1.0" /></multiply>
<max name="ch_14" type="float"><input name="in1" type="float" nodename="ch_13" /><input name="in2" type="float" value="0.0" /></max>
<smoothstep name="ch_15" type="float"><input name="in" type="float" nodename="ch_14" /><input name="low" type="float" value="0.0015" /><input name="high" type="float" value="0.0065" /></smoothstep>
<multiply name="ch_16" type="float"><input name="in1" type="float" nodename="ch_15" /><input name="in2" type="float" value="0.6" /></multiply>
<add name="ch_ao" type="float"><input name="in1" type="float" nodename="ch_16" /><input name="in2" type="float" value="0.4" /></add>
```

### Bows that vanish at the joints

Per-board unevenness must not step at a joint, whatever the two boards' randoms are. Multiply each board's random
amplitude by a shape that is 0 at both edges: **sin(πx/L)** for a bow (or cup) and sin(2πx/L) for a twist, with x
from 0 to L across the board. Add slow noise along the board to the amplitude so boards also wind along their
length. Unlike the (x/L)² cup of [board-batten](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/board-batten/gen.py), the sine is not 0-slope at the joint, so
neighbours meet at a small crease, as real boards do.

```xml
<!-- in: uv_sep. out: bw_x (m across the board, 0 at its joint), bw_id, h_bow (m). Per-board unevenness that is 0 at both joints: bow a1*sin(pi*x/P) (a1 = +-0.15 mm per board plus 0.15 mm noise along V at 1.3/m) and twist a2*sin(2*pi*x/P) (+-0.06 mm), boards 90 mm across U. Neighbours never step at the joint, whatever their randoms -->
<divide name="bw_u" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.09" /></divide>
<floor name="bw_m" type="float"><input name="in" type="float" nodename="bw_u" /></floor>
<subtract name="bw_3" type="float"><input name="in1" type="float" nodename="bw_u" /><input name="in2" type="float" nodename="bw_m" /></subtract>
<multiply name="bw_x" type="float"><input name="in1" type="float" nodename="bw_3" /><input name="in2" type="float" value="0.09" /></multiply>
<combine2 name="bw_5" type="vector2"><input name="in1" type="float" nodename="bw_m" /><input name="in2" type="float" value="7.0" /></combine2>
<add name="bw_6" type="vector2"><input name="in1" type="vector2" nodename="bw_5" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="bw_id" type="float"><input name="texcoord" type="vector2" nodename="bw_6" /></cellnoise2d>
<multiply name="bw_8" type="float"><input name="in1" type="float" nodename="bw_x" /><input name="in2" type="float" value="34.906585" /></multiply>
<sin name="bw_bow" type="float"><input name="in" type="float" nodename="bw_8" /></sin>
<multiply name="bw_10" type="float"><input name="in1" type="float" nodename="bw_x" /><input name="in2" type="float" value="69.81317" /></multiply>
<sin name="bw_tw" type="float"><input name="in" type="float" nodename="bw_10" /></sin>
<subtract name="bw_12" type="float"><input name="in1" type="float" nodename="bw_id" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="bw_13" type="float"><input name="in1" type="float" nodename="bw_12" /><input name="in2" type="float" value="0.0003" /></multiply>
<combine2 name="bw_14" type="vector2"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" nodename="bw_m" /></combine2>
<multiply name="bw_15" type="vector2"><input name="in1" type="vector2" nodename="bw_14" /><input name="in2" type="vector2" value="1.3, 7.7" /></multiply>
<add name="bw_16" type="vector2"><input name="in1" type="vector2" nodename="bw_15" /><input name="in2" type="vector2" value="3.1, 0.4" /></add>
<fractal2d name="bw_17" type="float"><input name="texcoord" type="vector2" nodename="bw_16" /><input name="amplitude" type="float" value="0.00015" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="bw_a1" type="float"><input name="in1" type="float" nodename="bw_13" /><input name="in2" type="float" nodename="bw_17" /></add>
<multiply name="bw_19" type="float"><input name="in1" type="float" nodename="bw_id" /><input name="in2" type="float" value="29.17" /></multiply>
<add name="bw_20" type="float"><input name="in1" type="float" nodename="bw_19" /><input name="in2" type="float" value="0.3" /></add>
<fract name="bw_21" type="float"><input name="in" type="float" nodename="bw_20" /></fract>
<subtract name="bw_22" type="float"><input name="in1" type="float" nodename="bw_21" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="bw_a2" type="float"><input name="in1" type="float" nodename="bw_22" /><input name="in2" type="float" value="0.00012" /></multiply>
<multiply name="bw_24" type="float"><input name="in1" type="float" nodename="bw_a1" /><input name="in2" type="float" nodename="bw_bow" /></multiply>
<multiply name="bw_25" type="float"><input name="in1" type="float" nodename="bw_a2" /><input name="in2" type="float" nodename="bw_tw" /></multiply>
<add name="h_bow" type="float"><input name="in1" type="float" nodename="bw_24" /><input name="in2" type="float" nodename="bw_25" /></add>
```

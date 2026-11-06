# Wood recipes

Growth rings, figure, pores, ray fleck, knots and relief (end grain is in [endgrain.md](endgrain.md)) for wood floors and furniture. Part of the
[noise cookbook](../NOISE_COOKBOOK.md); layouts that feed these are in [planks.md](planks.md) and
[layouts.md](layouts.md). Test materials: [`cookbook_wood`](../noise-lab/cookbook/cookbook_wood.mtlx) (white oak on
guaranteed-stagger planks, sheet `wood.avif`) and [`cookbook_wood_end`](../noise-lab/cookbook/cookbook_wood_end.mtlx)
(end-grain blocks, sheet `wood_end.avif`; recipe in [endgrain.md](endgrain.md)). Harvested from round 3; [`oak-plank`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/oak-plank/gen.py) is the best
complete example. Straight and rift grain, relief-aware rings, pine latewood, weathered erosion, book-matched figure and
lacquered layering are in [grain.md](grain.md).

**How the pieces chain.** A plank layout gives `pk_loc` (m from the board centre, x along the grain) and `pk_id`. The
knot deflects the frame (`wk_loc`), the rings turn it into a ring phase and masks (`wr_*`), pores and fleck read those,
and colour and height combine everything. Every board gets its own randoms as `fract(pk_id·k + c)` and its own patch of
the shared noises (`wr_lp`), so figure breaks at every joint. For another layout, rename `pk_loc`/`pk_id` to its frame;
without knots, feed `pk_loc` as `wk_loc` and 0 as `wk_bump`.

| Feature                  | Size                                            | Relief                       | Colour / roughness                               |
| ------------------------ | ----------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| rings                    | 4–7 mm pitch, figure faded above 65–130 lines/m | earlywood −0.07 mm (brushed) | earlywood ×(0.74, 0.66, 0.58), up to +0.06 rough |
| ring groups              | ~2–5 cm bands along the rings                   | –                            | ±15% tone                                        |
| pores                    | ~2 × 0.15 mm dashes along the grain             | −0.02 mm                     | ×0.5 dark, +0.07 rough                           |
| ray fleck (quarter-sawn) | flakes 1–4 cm × 2–5 mm                          | +5 µm                        | ×1.18 light, −0.1 rough                          |
| knot                     | r 4–9 mm, grain deflected over ~3r              | −0.06 mm                     | near black core, darker rim                      |
| brush scratches          | 1800/m across                                   | 12 µm (~2°)                  | –                                                |

Colour and relief are **correlated**: the porous earlywood is darker, rougher and lower. For softwoods (pine, fir) the
latewood is the dark, hard band: darken by `1 − wr_ew` instead and keep eroding the earlywood. Pale species (maple,
birch, ash) have base_color R ≈ 0.5–0.65, above the AUTHORING §7 wood range; judge colour under `--ibl neutral -e -1`.

### Knots with deflected grain

A knot is a dark core plus rings that flow around it. Contours of a bump added to the ring phase read as a bullseye;
instead deflect the across-grain coordinate, y' = y − qy·1.6r²/(ρe² + r²), with q the offset from the knot and
ρe = |q·(0.4, 1)| stretched along the grain, and add a small bump r²/(ρ² + r²)·4 mm to the ring radius. `wk_core` and
`wk_rim` mask the core and its dark rim. About 20% of boards get one; with `wk_on` = 0 everything passes through. The
position along the board scales with the board length `pk_lm` (up to 12.5 cm from either end), so every length can
carry a knot anywhere. For boards over ~0.5 m use [per-cell knots](grain.md#knots-along-long-boards-per-cell-knots-and-swirl-rings)
(every 0.4 m, with swirl rings), a drop-in replacement.

```xml
<!-- in: pk_loc, pk_id, pk_lm. out: wk_loc (board-local m with the across-grain coordinate deflected round the knot), wk_bump (m added to the ring radius), wk_core, wk_rim (0..1). ~20% of boards, radius 4..9 mm, anywhere along the board up to 12.5 cm from its ends (offset scaled by the board length pk_lm), +-4 cm across. y' = y - qy*1.6*r^2/(rho_e^2 + r^2), rho_e = |q*(0.4, 1)| (stretched along the grain) -->
<multiply name="wk_1" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="18.81" /></multiply>
<add name="wk_2" type="float"><input name="in1" type="float" nodename="wk_1" /><input name="in2" type="float" value="0.37" /></add>
<fract name="wk_3" type="float"><input name="in" type="float" nodename="wk_2" /></fract>
<multiply name="wk_4" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="39.963" /></multiply>
<add name="wk_5" type="float"><input name="in1" type="float" nodename="wk_4" /><input name="in2" type="float" value="0.37" /></add>
<fract name="wk_6" type="float"><input name="in" type="float" nodename="wk_5" /></fract>
<multiply name="wk_7" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="65.637" /></multiply>
<add name="wk_8" type="float"><input name="in1" type="float" nodename="wk_7" /><input name="in2" type="float" value="0.37" /></add>
<fract name="wk_9" type="float"><input name="in" type="float" nodename="wk_8" /></fract>
<multiply name="wk_10" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="97.722" /></multiply>
<add name="wk_11" type="float"><input name="in1" type="float" nodename="wk_10" /><input name="in2" type="float" value="0.37" /></add>
<fract name="wk_12" type="float"><input name="in" type="float" nodename="wk_11" /></fract>
<ifgreater name="wk_on" type="float"><input name="value1" type="float" nodename="wk_3" /><input name="value2" type="float" value="0.8" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="wk_14" type="float"><input name="in1" type="float" nodename="wk_6" /><input name="in2" type="float" value="0.005" /></multiply>
<add name="wk_r" type="float"><input name="in1" type="float" nodename="wk_14" /><input name="in2" type="float" value="0.004" /></add>
<subtract name="wk_16" type="float"><input name="in1" type="float" nodename="wk_9" /><input name="in2" type="float" value="0.5" /></subtract>
<subtract name="wk_17" type="float"><input name="in1" type="float" nodename="pk_lm" /><input name="in2" type="float" value="0.25" /></subtract>
<multiply name="wk_px" type="float"><input name="in1" type="float" nodename="wk_16" /><input name="in2" type="float" nodename="wk_17" /></multiply>
<subtract name="wk_19" type="float"><input name="in1" type="float" nodename="wk_12" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="wk_20" type="float"><input name="in1" type="float" nodename="wk_19" /><input name="in2" type="float" value="0.08" /></multiply>
<combine2 name="wk_p" type="vector2"><input name="in1" type="float" nodename="wk_px" /><input name="in2" type="float" nodename="wk_20" /></combine2>
<subtract name="wk_q" type="vector2"><input name="in1" type="vector2" nodename="pk_loc" /><input name="in2" type="vector2" nodename="wk_p" /></subtract>
<multiply name="wk_r2" type="float"><input name="in1" type="float" nodename="wk_r" /><input name="in2" type="float" nodename="wk_r" /></multiply>
<multiply name="wk_24" type="vector2"><input name="in1" type="vector2" nodename="wk_q" /><input name="in2" type="vector2" value="0.7, 1.0" /></multiply>
<magnitude name="wk_rho" type="float"><input name="in" type="vector2" nodename="wk_24" /></magnitude>
<multiply name="wk_26" type="float"><input name="in1" type="float" nodename="wk_rho" /><input name="in2" type="float" nodename="wk_rho" /></multiply>
<add name="wk_27" type="float"><input name="in1" type="float" nodename="wk_26" /><input name="in2" type="float" nodename="wk_r2" /></add>
<divide name="wk_28" type="float"><input name="in1" type="float" nodename="wk_r2" /><input name="in2" type="float" nodename="wk_27" /></divide>
<multiply name="wk_29" type="float"><input name="in1" type="float" nodename="wk_on" /><input name="in2" type="float" value="0.004" /></multiply>
<multiply name="wk_bump" type="float"><input name="in1" type="float" nodename="wk_28" /><input name="in2" type="float" nodename="wk_29" /></multiply>
<multiply name="wk_31" type="vector2"><input name="in1" type="vector2" nodename="wk_q" /><input name="in2" type="vector2" value="0.4, 1.0" /></multiply>
<magnitude name="wk_rhoe" type="float"><input name="in" type="vector2" nodename="wk_31" /></magnitude>
<multiply name="wk_33" type="float"><input name="in1" type="float" nodename="wk_r2" /><input name="in2" type="float" value="1.6" /></multiply>
<multiply name="wk_34" type="float"><input name="in1" type="float" nodename="wk_rhoe" /><input name="in2" type="float" nodename="wk_rhoe" /></multiply>
<add name="wk_35" type="float"><input name="in1" type="float" nodename="wk_34" /><input name="in2" type="float" nodename="wk_r2" /></add>
<divide name="wk_36" type="float"><input name="in1" type="float" nodename="wk_33" /><input name="in2" type="float" nodename="wk_35" /></divide>
<multiply name="wk_def" type="float"><input name="in1" type="float" nodename="wk_36" /><input name="in2" type="float" nodename="wk_on" /></multiply>
<separate2 name="wk_qs" type="multioutput"><input name="in" type="vector2" nodename="wk_q" /></separate2>
<multiply name="wk_39" type="float"><input name="in1" type="float" nodename="wk_qs" output="outy" /><input name="in2" type="float" nodename="wk_def" /></multiply>
<combine2 name="wk_40" type="vector2"><input name="in1" type="float" value="0.0" /><input name="in2" type="float" nodename="wk_39" /></combine2>
<subtract name="wk_loc" type="vector2"><input name="in1" type="vector2" nodename="pk_loc" /><input name="in2" type="vector2" nodename="wk_40" /></subtract>
<multiply name="wk_42" type="float"><input name="in1" type="float" nodename="wk_r" /><input name="in2" type="float" value="0.85" /></multiply>
<smoothstep name="wk_43" type="float"><input name="in" type="float" nodename="wk_rho" /><input name="low" type="float" nodename="wk_42" /><input name="high" type="float" nodename="wk_r" /></smoothstep>
<subtract name="wk_44" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="wk_43" /></subtract>
<multiply name="wk_core" type="float"><input name="in1" type="float" nodename="wk_44" /><input name="in2" type="float" nodename="wk_on" /></multiply>
<multiply name="wk_46" type="float"><input name="in1" type="float" nodename="wk_r" /><input name="in2" type="float" value="0.8" /></multiply>
<multiply name="wk_47" type="float"><input name="in1" type="float" nodename="wk_r" /><input name="in2" type="float" value="0.95" /></multiply>
<smoothstep name="wk_48" type="float"><input name="in" type="float" nodename="wk_rho" /><input name="low" type="float" nodename="wk_46" /><input name="high" type="float" nodename="wk_47" /></smoothstep>
<multiply name="wk_49" type="float"><input name="in1" type="float" nodename="wk_r" /><input name="in2" type="float" value="1.2" /></multiply>
<smoothstep name="wk_50" type="float"><input name="in" type="float" nodename="wk_rho" /><input name="low" type="float" nodename="wk_r" /><input name="high" type="float" nodename="wk_49" /></smoothstep>
<subtract name="wk_51" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="wk_50" /></subtract>
<multiply name="wk_52" type="float"><input name="in1" type="float" nodename="wk_48" /><input name="in2" type="float" nodename="wk_51" /></multiply>
<multiply name="wk_rim" type="float"><input name="in1" type="float" nodename="wk_52" /><input name="in2" type="float" nodename="wk_on" /></multiply>
```

### Growth rings: plain-sawn and quarter-sawn

Rings are cylinders round the pith, cut by the board face. With y across, x along, the **cone model**
R = √((y + o)² + D²) + taper·x gives both cuts from one formula:

- **plain-sawn (flat-sawn):** the pith is D = 4–14 cm below the face and o = ±11 cm off the board centre, and the log axis
  tilts against the face (taper ±4%). Rings cross the face in **cathedral arches** above the pith and run as **straight
  flanks** at the sides;
- **quarter-sawn:** D ≈ 0 and o = 0.2–0.3 m, so the rings meet the face at right angles and read as straight parallel
  lines, with slight runout from the taper.

The ring phase is R/λ (λ = 4–7 mm per board) plus a slow wobble along the grain. `wr_flank` = |y + o|/R is 1 where rings
stand perpendicular to the face; the fleck reads it. The [basketweave-parquet](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/basketweave-parquet/gen.py) generator
introduced the model; its render was painterly because the ring detail aliased, which the fade below fixes.
**Taper sets the cathedral spire spacing:** arches repeat about every **λ/taper** along the board (5 mm rings at 4% →
~12 cm), so a large taper reads as a row of beads; use ≤ 5% with more wobble on veneer and panels. Where relief cuts the
face (flutes, scoops), use the [relief-aware](grain.md#relief-aware-ring-frequency) frequency.

```xml
<!-- in: wk_loc, wk_bump, pk_id. out: wr_t (ring phase 0..1), wr_ew (earlywood band), wr_fade, wr_fig (ew faded to its mean 0.35 where rings alias), wr_band (ring-group tone, safe at any view), wr_flank (1 where rings stand perpendicular to the face), wr_lp (board coords in a private patch), wr_q (1 quarter-sawn). Cone model R = sqrt((y + o)^2 + D^2) + taper*x: plain-sawn (65%) pith o = +-11 cm off-centre, D = 4..14 cm deep, taper +-4%; quarter-sawn o = 0.2..0.3 m, D ~ 0. Rings 4..7 mm, widths uneven +-30%. Local ring frequency f = 1.3*|grad R|/lambda lines/m; the figure fades between FMAX/2 and FMAX = 130/m (6 px at `plane` at the default 800 px; 85 at -s 512) -->
<multiply name="wr_1" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="22.105" /></multiply>
<add name="wr_2" type="float"><input name="in1" type="float" nodename="wr_1" /><input name="in2" type="float" value="0.61" /></add>
<fract name="wr_3" type="float"><input name="in" type="float" nodename="wr_2" /></fract>
<multiply name="wr_4" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="46.964" /></multiply>
<add name="wr_5" type="float"><input name="in1" type="float" nodename="wr_4" /><input name="in2" type="float" value="0.61" /></add>
<fract name="wr_6" type="float"><input name="in" type="float" nodename="wr_5" /></fract>
<multiply name="wr_7" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="77.135" /></multiply>
<add name="wr_8" type="float"><input name="in1" type="float" nodename="wr_7" /><input name="in2" type="float" value="0.61" /></add>
<fract name="wr_9" type="float"><input name="in" type="float" nodename="wr_8" /></fract>
<multiply name="wr_10" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="114.841" /></multiply>
<add name="wr_11" type="float"><input name="in1" type="float" nodename="wr_10" /><input name="in2" type="float" value="0.61" /></add>
<fract name="wr_12" type="float"><input name="in" type="float" nodename="wr_11" /></fract>
<multiply name="wr_13" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="157.152" /></multiply>
<add name="wr_14" type="float"><input name="in1" type="float" nodename="wr_13" /><input name="in2" type="float" value="0.61" /></add>
<fract name="wr_15" type="float"><input name="in" type="float" nodename="wr_14" /></fract>
<multiply name="wr_16" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="211.345" /></multiply>
<add name="wr_17" type="float"><input name="in1" type="float" nodename="wr_16" /><input name="in2" type="float" value="0.61" /></add>
<fract name="wr_18" type="float"><input name="in" type="float" nodename="wr_17" /></fract>
<multiply name="wr_19" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="279.963" /></multiply>
<add name="wr_20" type="float"><input name="in1" type="float" nodename="wr_19" /><input name="in2" type="float" value="0.61" /></add>
<fract name="wr_21" type="float"><input name="in" type="float" nodename="wr_20" /></fract>
<ifgreater name="wr_q" type="float"><input name="value1" type="float" nodename="wr_3" /><input name="value2" type="float" value="0.65" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<subtract name="wr_23" type="float"><input name="in1" type="float" nodename="wr_6" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="wr_24" type="float"><input name="in1" type="float" nodename="wr_23" /><input name="in2" type="float" value="0.22" /></multiply>
<multiply name="wr_25" type="float"><input name="in1" type="float" nodename="wr_6" /><input name="in2" type="float" value="0.1" /></multiply>
<add name="wr_26" type="float"><input name="in1" type="float" nodename="wr_25" /><input name="in2" type="float" value="0.2" /></add>
<mix name="wr_o" type="float"><input name="bg" type="float" nodename="wr_24" /><input name="fg" type="float" nodename="wr_26" /><input name="mix" type="float" nodename="wr_q" /></mix>
<multiply name="wr_28" type="float"><input name="in1" type="float" nodename="wr_9" /><input name="in2" type="float" value="0.1" /></multiply>
<add name="wr_29" type="float"><input name="in1" type="float" nodename="wr_28" /><input name="in2" type="float" value="0.04" /></add>
<mix name="wr_D" type="float"><input name="bg" type="float" nodename="wr_29" /><input name="fg" type="float" value="0.002" /><input name="mix" type="float" nodename="wr_q" /></mix>
<subtract name="wr_31" type="float"><input name="in1" type="float" nodename="wr_12" /><input name="in2" type="float" value="0.5" /></subtract>
<mix name="wr_32" type="float"><input name="bg" type="float" value="0.08" /><input name="fg" type="float" value="0.03" /><input name="mix" type="float" nodename="wr_q" /></mix>
<multiply name="wr_tap" type="float"><input name="in1" type="float" nodename="wr_31" /><input name="in2" type="float" nodename="wr_32" /></multiply>
<multiply name="wr_34" type="float"><input name="in1" type="float" nodename="wr_15" /><input name="in2" type="float" value="0.003" /></multiply>
<add name="wr_lam" type="float"><input name="in1" type="float" nodename="wr_34" /><input name="in2" type="float" value="0.004" /></add>
<combine2 name="wr_36" type="vector2"><input name="in1" type="float" nodename="wr_18" /><input name="in2" type="float" nodename="wr_21" /></combine2>
<multiply name="wr_37" type="vector2"><input name="in1" type="vector2" nodename="wr_36" /><input name="in2" type="vector2" value="97.3, 61.7" /></multiply>
<add name="wr_lp" type="vector2"><input name="in1" type="vector2" nodename="wk_loc" /><input name="in2" type="vector2" nodename="wr_37" /></add>
<separate2 name="wr_ls" type="multioutput"><input name="in" type="vector2" nodename="wk_loc" /></separate2>
<add name="wr_yo" type="float"><input name="in1" type="float" nodename="wr_ls" output="outy" /><input name="in2" type="float" nodename="wr_o" /></add>
<combine2 name="wr_41" type="vector2"><input name="in1" type="float" nodename="wr_yo" /><input name="in2" type="float" nodename="wr_D" /></combine2>
<magnitude name="wr_R0" type="float"><input name="in" type="vector2" nodename="wr_41" /></magnitude>
<multiply name="wr_43" type="vector2"><input name="in1" type="vector2" nodename="wr_lp" /><input name="in2" type="vector2" value="3.0, 12.0" /></multiply>
<add name="wr_44" type="vector2"><input name="in1" type="vector2" nodename="wr_43" /><input name="in2" type="vector2" value="4.1, 9.3" /></add>
<fractal2d name="wr_wob" type="float"><input name="texcoord" type="vector2" nodename="wr_44" /><input name="amplitude" type="float" value="0.002" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="wr_46" type="float"><input name="in1" type="float" nodename="wr_tap" /><input name="in2" type="float" nodename="wr_ls" output="outx" /></multiply>
<add name="wr_47" type="float"><input name="in1" type="float" nodename="wr_R0" /><input name="in2" type="float" nodename="wr_46" /></add>
<add name="wr_48" type="float"><input name="in1" type="float" nodename="wr_47" /><input name="in2" type="float" nodename="wr_wob" /></add>
<add name="wr_R" type="float"><input name="in1" type="float" nodename="wr_48" /><input name="in2" type="float" nodename="wk_bump" /></add>
<multiply name="wr_50" type="float"><input name="in1" type="float" nodename="wr_R" /><input name="in2" type="float" value="35.0" /></multiply>
<multiply name="wr_51" type="float"><input name="in1" type="float" nodename="wr_18" /><input name="in2" type="float" value="71.0" /></multiply>
<combine2 name="wr_52" type="vector2"><input name="in1" type="float" nodename="wr_50" /><input name="in2" type="float" nodename="wr_51" /></combine2>
<fractal2d name="wr_yr" type="float"><input name="texcoord" type="vector2" nodename="wr_52" /><input name="amplitude" type="float" value="1.2" /><input name="octaves" type="integer" value="1" /></fractal2d>
<divide name="wr_54" type="float"><input name="in1" type="float" nodename="wr_R" /><input name="in2" type="float" nodename="wr_lam" /></divide>
<add name="wr_55" type="float"><input name="in1" type="float" nodename="wr_54" /><input name="in2" type="float" nodename="wr_yr" /></add>
<multiply name="wr_56" type="float"><input name="in1" type="float" nodename="wr_21" /><input name="in2" type="float" value="13.0" /></multiply>
<add name="wr_ph" type="float"><input name="in1" type="float" nodename="wr_55" /><input name="in2" type="float" nodename="wr_56" /></add>
<fract name="wr_t" type="float"><input name="in" type="float" nodename="wr_ph" /></fract>
<divide name="wr_59" type="float"><input name="in1" type="float" nodename="wr_yo" /><input name="in2" type="float" nodename="wr_R0" /></divide>
<combine2 name="wr_60" type="vector2"><input name="in1" type="float" nodename="wr_59" /><input name="in2" type="float" nodename="wr_tap" /></combine2>
<magnitude name="wr_grad" type="float"><input name="in" type="vector2" nodename="wr_60" /></magnitude>
<multiply name="wr_62" type="float"><input name="in1" type="float" nodename="wr_grad" /><input name="in2" type="float" value="1.3" /></multiply>
<divide name="wr_f" type="float"><input name="in1" type="float" nodename="wr_62" /><input name="in2" type="float" nodename="wr_lam" /></divide>
<smoothstep name="wr_64" type="float"><input name="in" type="float" nodename="wr_f" /><input name="low" type="float" value="65.0" /><input name="high" type="float" value="130.0" /></smoothstep>
<subtract name="wr_fade" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="wr_64" /></subtract>
<smoothstep name="wr_66" type="float"><input name="in" type="float" nodename="wr_t" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.1" /></smoothstep>
<smoothstep name="wr_67" type="float"><input name="in" type="float" nodename="wr_t" /><input name="low" type="float" value="0.25" /><input name="high" type="float" value="0.55" /></smoothstep>
<subtract name="wr_68" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="wr_67" /></subtract>
<multiply name="wr_ew" type="float"><input name="in1" type="float" nodename="wr_66" /><input name="in2" type="float" nodename="wr_68" /></multiply>
<mix name="wr_fig" type="float"><input name="bg" type="float" value="0.35" /><input name="fg" type="float" nodename="wr_ew" /><input name="mix" type="float" nodename="wr_fade" /></mix>
<multiply name="wr_71" type="float"><input name="in1" type="float" nodename="wr_R" /><input name="in2" type="float" value="40.0" /></multiply>
<multiply name="wr_72" type="float"><input name="in1" type="float" nodename="wr_ls" output="outx" /><input name="in2" type="float" value="2.0" /></multiply>
<combine2 name="wr_73" type="vector2"><input name="in1" type="float" nodename="wr_71" /><input name="in2" type="float" nodename="wr_72" /></combine2>
<multiply name="wr_74" type="float"><input name="in1" type="float" nodename="wr_15" /><input name="in2" type="float" value="37.0" /></multiply>
<add name="wr_75" type="vector2"><input name="in1" type="vector2" nodename="wr_73" /><input name="in2" type="float" nodename="wr_74" /></add>
<fractal2d name="wr_band" type="float"><input name="texcoord" type="vector2" nodename="wr_75" /><input name="octaves" type="integer" value="2" /></fractal2d>
<absval name="wr_77" type="float"><input name="in" type="float" nodename="wr_yo" /></absval>
<divide name="wr_flank" type="float"><input name="in1" type="float" nodename="wr_77" /><input name="in2" type="float" nodename="wr_R0" /></divide>
```

### Earlywood and latewood profile

Within each ring (t = fract(phase), 0 at the ring boundary), `wr_ew = smoothstep(t, 0, 0.1)·(1 − smoothstep(t, 0.25,
0.55))` rises sharply where growth restarts in spring and fades slowly into the dense latewood; its mean is 0.35. Use
the same mask for colour, roughness and relief. A symmetric sine or a hard step reads as printed or machined.

### Uneven ring widths

Real years differ. `wr_yr` adds `fractal2d(R·35, seed)·1.2` to the phase: a slow function of the radius, so whole rings
widen and narrow together (±30%) and ring lines never cross. Keep its derivative below 1/λ so the phase stays monotonic.
The end-grain recipe does the same in ring units (`eg_qn`).

### Local-frequency fade (moiré cap)

Parallel rings finer than ~6 px alias into moiré (strongest on the totem); noise only speckles. There is no derivative
node, so compute the frequency analytically: the ring lines per metre on the face are **f = |∇R|/λ**, and for the cone
|∇R| = |((y + o)/R, taper)|. `wr_f` adds 30% for the wobble and uneven widths. Fade the figure to its mean where it
would alias: `wr_fig = mix(0.35, wr_ew, 1 − smoothstep(f, FMAX/2, FMAX))`, with **FMAX = (pixels per metre at the
farthest view)/6**: 130 for `plane` at the default 800 px, 85 at `-s 512`, ~430 if nothing is judged beyond `closeup`.
**`docs/material-authoring/render.sh` renders `-s 512 --supersample`**, i.e. 1024 px across the 1 m `plane` before downsampling, so its
aliasing limit is **FMAX ≈ 170** (fade 85..170): lines between 85 and 170/m are averaged to grey by the downsample
rather than aliasing. The snippet below uses 130; the round-4 recipes use 170. There is no view input, so one FMAX
trades `closeup` detail against `plane` aliasing. The fade can't help constant-frequency straight grain; see
[straight and rift grain](grain.md#straight-and-rift-grain).
Everything periodic (colour, roughness, relief) uses `wr_fig`, not `wr_ew`. On the test plane 66% of the area is fully
faded (flanks and quarter-sawn boards) and 16% shows full figure (arch tips); the totem shows no moiré. Fine grain
survives through things that only speckle: pores that follow the earlywood (`wr_t`), stretched fibre noise, and ring
groups (`wr_band`, noise of R·40, so they follow the rings at a safe frequency).

### Pore dashes

Oak and ash have open pores: short dashes along the grain, dense in the earlywood band. Worley on stretched board
coordinates (cells 5.6 × 0.38 mm) with `F1 < 0.1..0.22` gives the dashes; presence is 1 in the earlywood (using the raw
`wr_t`, since pores are sub-pixel at `plane` and only speckle) and 20% in the latewood. At `closeup` the pores draw the
ring lines that the fade removed. Jitter 1: for features this small, clipping is invisible and lower jitter shows grid
rows.

```xml
<!-- in: wr_lp, wr_t. out: wp_pore (0..1). Open pores as dashes along the grain: worley cells 5.6 x 0.38 mm (180 x 2600 /m), dash F1 < 0.1..0.22 (~2 x 0.15 mm); every cell in the earlywood band, ~20% of cells at half strength in the latewood (pores then draw the ring lines at closeup, where the figure is faded). Jitter 1: tiny features look best fully random (clips are invisible under ~4 px) -->
<multiply name="wp_1" type="vector2"><input name="in1" type="vector2" nodename="wr_lp" /><input name="in2" type="vector2" value="180.0, 2600.0" /></multiply>
<add name="wp_p" type="vector2"><input name="in1" type="vector2" nodename="wp_1" /><input name="in2" type="vector2" value="0.37, 0.61" /></add>
<worleynoise2d name="wp_f1" type="float"><input name="texcoord" type="vector2" nodename="wp_p" /><input name="jitter" type="float" value="1.0" /></worleynoise2d>
<worleynoise2d name="wp_id" type="float"><input name="texcoord" type="vector2" nodename="wp_p" /><input name="jitter" type="float" value="1.0" /><input name="style" type="integer" value="1" /></worleynoise2d>
<smoothstep name="wp_5" type="float"><input name="in" type="float" nodename="wr_t" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.04" /></smoothstep>
<smoothstep name="wp_6" type="float"><input name="in" type="float" nodename="wr_t" /><input name="low" type="float" value="0.18" /><input name="high" type="float" value="0.3" /></smoothstep>
<subtract name="wp_7" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="wp_6" /></subtract>
<multiply name="wp_ew" type="float"><input name="in1" type="float" nodename="wp_5" /><input name="in2" type="float" nodename="wp_7" /></multiply>
<ifgreater name="wp_9" type="float"><input name="value1" type="float" nodename="wp_id" /><input name="value2" type="float" value="0.8" /><input name="in1" type="float" value="0.5" /><input name="in2" type="float" value="0.0" /></ifgreater>
<max name="wp_on" type="float"><input name="in1" type="float" nodename="wp_ew" /><input name="in2" type="float" nodename="wp_9" /></max>
<smoothstep name="wp_11" type="float"><input name="in" type="float" nodename="wp_f1" /><input name="low" type="float" value="0.1" /><input name="high" type="float" value="0.22" /></smoothstep>
<subtract name="wp_12" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="wp_11" /></subtract>
<multiply name="wp_pore" type="float"><input name="in1" type="float" nodename="wp_12" /><input name="in2" type="float" nodename="wp_on" /></multiply>
```

### Quarter-sawn ray fleck

Medullary rays cut lengthwise show as lighter, glossier flakes on quarter-sawn oak: irregular, a few centimetres long,
a few millimetres wide, tilted slightly to the grain. Thresholded stretched fBm gives the ragged shapes (thresholded
noise makes worms, and flecks are worms); a jittered worley lens read as polka dots. The mask is gated by `wr_flank`, so
flecks appear on quarter-sawn boards and on the rift edges of plain-sawn ones. On flat-sawn faces rays show only as
tiny spindles ~3 × 0.3 mm; `oak-plank` adds those as sparse worley dashes.

```xml
<!-- in: wr_lp, wr_flank, pk_id. out: wf_fleck (0..1). Quarter-sawn ray fleck: thresholded stretched fBm (35 x 180 /m, 3 oct) gives ragged flakes ~1..4 cm x 2..5 mm along the grain, tilted +-10 deg per board. Thresholded noise makes worms, which is what flecks are. Only where rings stand perpendicular to the face (wr_flank > 0.85: quarter-sawn boards and rift edges); a slow presence field breaks them into patches -->
<multiply name="wf_1" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="178.626" /></multiply>
<add name="wf_2" type="float"><input name="in1" type="float" nodename="wf_1" /><input name="in2" type="float" value="0.83" /></add>
<fract name="wf_3" type="float"><input name="in" type="float" nodename="wf_2" /></fract>
<subtract name="wf_4" type="float"><input name="in1" type="float" nodename="wf_3" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="wf_ang" type="float"><input name="in1" type="float" nodename="wf_4" /><input name="in2" type="float" value="20.0" /></multiply>
<rotate2d name="wf_6" type="vector2"><input name="in" type="vector2" nodename="wr_lp" /><input name="amount" type="float" nodename="wf_ang" /></rotate2d>
<multiply name="wf_7" type="vector2"><input name="in1" type="vector2" nodename="wf_6" /><input name="in2" type="vector2" value="35.0, 180.0" /></multiply>
<add name="wf_p" type="vector2"><input name="in1" type="vector2" nodename="wf_7" /><input name="in2" type="vector2" value="3.7, 1.3" /></add>
<fractal2d name="wf_n" type="float"><input name="texcoord" type="vector2" nodename="wf_p" /><input name="octaves" type="integer" value="3" /></fractal2d>
<multiply name="wf_10" type="vector2"><input name="in1" type="vector2" nodename="wr_lp" /><input name="in2" type="vector2" value="4.0, 10.0" /></multiply>
<add name="wf_11" type="vector2"><input name="in1" type="vector2" nodename="wf_10" /><input name="in2" type="vector2" value="8.3, 2.1" /></add>
<fractal2d name="wf_pres" type="float"><input name="texcoord" type="vector2" nodename="wf_11" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="wf_13" type="float"><input name="in1" type="float" nodename="wf_pres" /><input name="in2" type="float" value="0.3" /></multiply>
<subtract name="wf_thr" type="float"><input name="in1" type="float" value="0.52" /><input name="in2" type="float" nodename="wf_13" /></subtract>
<subtract name="wf_15" type="float"><input name="in1" type="float" nodename="wf_n" /><input name="in2" type="float" nodename="wf_thr" /></subtract>
<smoothstep name="wf_shape" type="float"><input name="in" type="float" nodename="wf_15" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.12" /></smoothstep>
<smoothstep name="wf_17" type="float"><input name="in" type="float" nodename="wr_flank" /><input name="low" type="float" value="0.85" /><input name="high" type="float" value="0.97" /></smoothstep>
<multiply name="wf_fleck" type="float"><input name="in1" type="float" nodename="wf_shape" /><input name="in2" type="float" nodename="wf_17" /></multiply>
```

### Wood colour and roughness

White oak under matte oil: per-board honey to light tan with ±14% level, streaks along the grain, mottle, fibre
speckle, a 70 cm drift and ring groups, then the figure, fleck, pores and knot. Tints are written `c·mix(1, k, m)`: the
`mix(c, c·k, m)` form reads c twice per step and made this graph take 37 s to compile (gotcha 14).

```xml
<!-- in: uv, pk_id, wr_lp, wr_fig, wr_band, wp_pore, wf_fleck, wk_core, wk_rim. out: wd_col, wd_rough. White oak, matte oil (linear): honey..light tan per board, +-14% level; streaks along the grain (3 x 60 /m), mottle, fibre (60 x 1400 /m, speckle only), 70 cm drift, ring groups; earlywood darker and rougher, flecks lighter and smoother, pores dark, knot core and rim near black -->
<multiply name="wc_1" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="169.338" /></multiply>
<add name="wc_2" type="float"><input name="in1" type="float" nodename="wc_1" /><input name="in2" type="float" value="0.29" /></add>
<fract name="wc_r1" type="float"><input name="in" type="float" nodename="wc_2" /></fract>
<mix name="wc_bc" type="color3"><input name="bg" type="color3" value="0.5, 0.28, 0.11" /><input name="fg" type="color3" value="0.58, 0.36, 0.17" /><input name="mix" type="float" nodename="pk_id" /></mix>
<multiply name="wc_5" type="vector2"><input name="in1" type="vector2" nodename="wr_lp" /><input name="in2" type="vector2" value="3.0, 60.0" /></multiply>
<add name="wc_6" type="vector2"><input name="in1" type="vector2" nodename="wc_5" /><input name="in2" type="vector2" value="1.7, 8.3" /></add>
<fractal2d name="wc_st" type="float"><input name="texcoord" type="vector2" nodename="wc_6" /><input name="amplitude" type="float" value="0.16" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="wc_8" type="vector2"><input name="in1" type="vector2" nodename="wr_lp" /><input name="in2" type="vector2" value="4.0, 12.0" /></multiply>
<add name="wc_9" type="vector2"><input name="in1" type="vector2" nodename="wc_8" /><input name="in2" type="vector2" value="6.1, 2.9" /></add>
<fractal2d name="wc_mo" type="float"><input name="texcoord" type="vector2" nodename="wc_9" /><input name="amplitude" type="float" value="0.1" /><input name="octaves" type="integer" value="3" /></fractal2d>
<multiply name="wc_11" type="vector2"><input name="in1" type="vector2" nodename="wr_lp" /><input name="in2" type="vector2" value="60.0, 1400.0" /></multiply>
<add name="wc_12" type="vector2"><input name="in1" type="vector2" nodename="wc_11" /><input name="in2" type="vector2" value="2.3, 4.1" /></add>
<fractal2d name="wc_fib" type="float"><input name="texcoord" type="vector2" nodename="wc_12" /><input name="amplitude" type="float" value="0.1" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="wc_14" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="1.5" /></multiply>
<add name="wc_15" type="vector2"><input name="in1" type="vector2" nodename="wc_14" /><input name="in2" type="vector2" value="4.4, 7.7" /></add>
<noise2d name="wc_dr" type="float"><input name="texcoord" type="vector2" nodename="wc_15" /><input name="amplitude" type="float" value="0.08" /></noise2d>
<add name="wc_17" type="float"><input name="in1" type="float" nodename="wc_st" /><input name="in2" type="float" nodename="wc_mo" /></add>
<add name="wc_18" type="float"><input name="in1" type="float" nodename="wc_fib" /><input name="in2" type="float" nodename="wc_dr" /></add>
<add name="wc_19" type="float"><input name="in1" type="float" nodename="wc_17" /><input name="in2" type="float" nodename="wc_18" /></add>
<subtract name="wc_20" type="float"><input name="in1" type="float" nodename="wc_r1" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="wc_21" type="float"><input name="in1" type="float" nodename="wc_20" /><input name="in2" type="float" value="0.28" /></multiply>
<add name="wc_22" type="float"><input name="in1" type="float" nodename="wc_19" /><input name="in2" type="float" nodename="wc_21" /></add>
<multiply name="wc_23" type="float"><input name="in1" type="float" nodename="wr_band" /><input name="in2" type="float" value="0.15" /></multiply>
<add name="wc_24" type="float"><input name="in1" type="float" nodename="wc_23" /><input name="in2" type="float" value="1.0" /></add>
<add name="wc_tone" type="float"><input name="in1" type="float" nodename="wc_22" /><input name="in2" type="float" nodename="wc_24" /></add>
<multiply name="wc_c0" type="color3"><input name="in1" type="color3" nodename="wc_bc" /><input name="in2" type="float" nodename="wc_tone" /></multiply>
<multiply name="wc_27" type="float"><input name="in1" type="float" nodename="wr_fig" /><input name="in2" type="float" value="0.75" /></multiply>
<mix name="wc_28" type="color3"><input name="bg" type="color3" value="1.0, 1.0, 1.0" /><input name="fg" type="color3" value="0.74, 0.66, 0.58" /><input name="mix" type="float" nodename="wc_27" /></mix>
<multiply name="wc_c1" type="color3"><input name="in1" type="color3" nodename="wc_c0" /><input name="in2" type="color3" nodename="wc_28" /></multiply>
<multiply name="wc_30" type="float"><input name="in1" type="float" nodename="wf_fleck" /><input name="in2" type="float" value="0.7" /></multiply>
<mix name="wc_31" type="color3"><input name="bg" type="color3" value="1.0, 1.0, 1.0" /><input name="fg" type="color3" value="1.18, 1.14, 1.08" /><input name="mix" type="float" nodename="wc_30" /></mix>
<multiply name="wc_c2" type="color3"><input name="in1" type="color3" nodename="wc_c1" /><input name="in2" type="color3" nodename="wc_31" /></multiply>
<multiply name="wc_33" type="float"><input name="in1" type="float" nodename="wp_pore" /><input name="in2" type="float" value="0.65" /></multiply>
<mix name="wc_34" type="color3"><input name="bg" type="color3" value="1.0, 1.0, 1.0" /><input name="fg" type="color3" value="0.5, 0.44, 0.38" /><input name="mix" type="float" nodename="wc_33" /></mix>
<multiply name="wc_c3" type="color3"><input name="in1" type="color3" nodename="wc_c2" /><input name="in2" type="color3" nodename="wc_34" /></multiply>
<multiply name="wc_36" type="float"><input name="in1" type="float" nodename="wk_core" /><input name="in2" type="float" value="0.9" /></multiply>
<mix name="wc_c4" type="color3"><input name="bg" type="color3" nodename="wc_c3" /><input name="fg" type="color3" value="0.17, 0.085, 0.038" /><input name="mix" type="float" nodename="wc_36" /></mix>
<multiply name="wc_38" type="float"><input name="in1" type="float" nodename="wk_rim" /><input name="in2" type="float" value="0.8" /></multiply>
<mix name="wd_col" type="color3"><input name="bg" type="color3" nodename="wc_c4" /><input name="fg" type="color3" value="0.06, 0.032, 0.015" /><input name="mix" type="float" nodename="wc_38" /></mix>
<subtract name="wc_40" type="float"><input name="in1" type="float" nodename="wr_fig" /><input name="in2" type="float" value="0.35" /></subtract>
<multiply name="wc_41" type="float"><input name="in1" type="float" nodename="wc_40" /><input name="in2" type="float" value="0.09" /></multiply>
<add name="wc_42" type="float"><input name="in1" type="float" nodename="wc_41" /><input name="in2" type="float" value="0.6" /></add>
<multiply name="wc_43" type="float"><input name="in1" type="float" nodename="wp_pore" /><input name="in2" type="float" value="0.07" /></multiply>
<multiply name="wc_44" type="float"><input name="in1" type="float" nodename="wf_fleck" /><input name="in2" type="float" value="0.1" /></multiply>
<subtract name="wc_45" type="float"><input name="in1" type="float" nodename="wc_43" /><input name="in2" type="float" nodename="wc_44" /></subtract>
<add name="wc_rg" type="float"><input name="in1" type="float" nodename="wc_42" /><input name="in2" type="float" nodename="wc_45" /></add>
<mix name="wd_rough" type="float"><input name="bg" type="float" nodename="wc_rg" /><input name="fg" type="float" value="0.56" /><input name="mix" type="float" nodename="wk_core" /></mix>
```

### Wire-brushed and eroded earlywood

Wire brushing and wear remove the soft earlywood and leave the latewood proud: relief is −0.07 mm × `wr_fig` (faded,
so it can't alias either), plus shallow pores, brush scratches along the grain, and a sunk knot core. For sanded
floors scale the earlywood term to ~0.01 mm; chevron-oak's brushed look uses 0.07 mm. Add the joint profile to this
(`cookbook_wood` uses a 1.6 mm cubic micro-bevel, 0.35 mm deep); don't multiply it in.

```xml
<!-- in: wr_lp, wr_fig, wp_pore, wf_fleck, wk_core. out: h_wood (m). Wire-brushed: soft earlywood eroded 0.07 mm (faded with the figure), pores -0.02 mm, flecks +5 um, knot core -0.06 mm, brush scratches along the grain 12 um at 1800 /m across (~2 deg). For a plain sanded face scale the earlywood term to ~0.01 mm -->
<multiply name="wh_1" type="vector2"><input name="in1" type="vector2" nodename="wr_lp" /><input name="in2" type="vector2" value="12.0, 1800.0" /></multiply>
<add name="wh_2" type="vector2"><input name="in1" type="vector2" nodename="wh_1" /><input name="in2" type="vector2" value="29.6, 15.2" /></add>
<fractal2d name="wh_brush" type="float"><input name="texcoord" type="vector2" nodename="wh_2" /><input name="amplitude" type="float" value="0.000012" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="wh_4" type="float"><input name="in1" type="float" nodename="wr_fig" /><input name="in2" type="float" value="-0.00007" /></multiply>
<multiply name="wh_5" type="float"><input name="in1" type="float" nodename="wp_pore" /><input name="in2" type="float" value="-0.00002" /></multiply>
<add name="wh_a" type="float"><input name="in1" type="float" nodename="wh_4" /><input name="in2" type="float" nodename="wh_5" /></add>
<multiply name="wh_7" type="float"><input name="in1" type="float" nodename="wf_fleck" /><input name="in2" type="float" value="0.000005" /></multiply>
<multiply name="wh_8" type="float"><input name="in1" type="float" nodename="wk_core" /><input name="in2" type="float" value="-0.00006" /></multiply>
<add name="wh_b" type="float"><input name="in1" type="float" nodename="wh_7" /><input name="in2" type="float" nodename="wh_8" /></add>
<add name="wh_10" type="float"><input name="in1" type="float" nodename="wh_a" /><input name="in2" type="float" nodename="wh_b" /></add>
<add name="h_wood" type="float"><input name="in1" type="float" nodename="wh_10" /><input name="in2" type="float" nodename="wh_brush" /></add>
```

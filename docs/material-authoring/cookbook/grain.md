# More wood grain: panels, softwood and finishes

Grain recipes for wall panelling: relief-aware ring frequency, straight and rift grain, pine latewood, eroded earlywood,
book-matched figure, lacquered layering and per-cell knots with swirl rings. The base wood recipes (cone ring model, moiré cap, pores, fleck, colour) are
in [wood.md](wood.md); read that first. Part of the [noise cookbook](../NOISE_COOKBOOK.md). Test materials:
[`cookbook_wood2`](../noise-lab/cookbook/cookbook_wood2.mtlx) (flutes, rift oak, whitewashed and weathered pine; sheet
`wood2.avif`) and [`cookbook_veneer`](../noise-lab/cookbook/cookbook_veneer.mtlx) (book-match and lacquer; sheet
`veneer.avif`); the per-cell knots are tested in [`cookbook_boards`](../noise-lab/cookbook/cookbook_boards.mtlx) (see the
[board-formed imprint](weathering.md#board-formed-imprint)). Harvested from round 4 ([fluted-walnut](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/fluted-walnut/gen.py),
[acoustic-slat](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/acoustic-slat/gen.py), [shiplap-whitewash](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/shiplap-whitewash/gen.py),
[barnwood-wall](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/barnwood-wall/gen.py), [bookmatched-veneer](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/bookmatched-veneer/gen.py)).

The fades here use **FMAX = 170 lines/m**, for `docs/material-authoring/render.sh` (`-s 512 --supersample`, effectively 1024 px across
the 1 m `plane`); see the [moiré cap](wood.md#local-frequency-fade-moiré-cap).

### Relief-aware ring frequency

Where a flute, scoop or bevel cuts into the board, the face dips toward the pith and rings cross it faster. Feed the
cut depth into the pith depth, D + h (so the figure shifts where the cutter went deeper), and add the relief slope to
the ring gradient: **∂R/∂x = (yo + (D + h)·∂h/∂x)/R0**, so f = 1.3·|(∂R/∂x, taper)|/λ. On the test panels the ring frequency is ~20–100 lines/m on the
lands and 280–390 on the flute walls, so the walls fade while the lands keep their figure; the flat-face formula would
let the walls alias.
The slope comes from the profile analytically (`fl_dh` in the [cove flute](profiles.md#1-d-moulding-profile)).

**Taper sets the cathedral spire spacing:** along the board the ring radius grows by taper·x, so arches repeat every
**≈ λ/taper**. ±4% with 5 mm rings gives spires ~12 cm apart that read as beads on a 1 m panel; veneer and panels want
±5% or less plus more wobble, or a smaller taper for longer arches.

```xml
<!-- in: fl_xc, fl_pid, h_flute, fl_dh, uv_sep. out: fz_t (ring phase), fz_f (ring lines/m on the face), fz_fig (earlywood faded to 0.35 where rings alias). One plain-sawn flitch per panel, grain along V (cone model). The cut depth h enters the pith depth, D + h, so the figure shifts where the cutter went deeper, and the relief slope enters the ring frequency: dR/dx = (yo + (D + h)*dh/dx)/R0, so flute walls fade first. Pith +-15 cm, 6..20 cm deep, taper +-5% (spires ~lambda/taper = 6..30 cm apart), rings 3..6 mm; fade FMAX/2..FMAX = 85..170/m (render.sh) -->
<combine2 name="fz_1" type="vector2"><input name="in1" type="float" nodename="fl_pid" /><input name="in2" type="float" value="0.0" /></combine2>
<add name="fz_2" type="vector2"><input name="in1" type="vector2" nodename="fz_1" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="fz_id" type="float"><input name="texcoord" type="vector2" nodename="fz_2" /></cellnoise2d>
<multiply name="fz_4" type="float"><input name="in1" type="float" nodename="fz_id" /><input name="in2" type="float" value="18.81" /></multiply>
<add name="fz_5" type="float"><input name="in1" type="float" nodename="fz_4" /><input name="in2" type="float" value="0.37" /></add>
<fract name="fz_6" type="float"><input name="in" type="float" nodename="fz_5" /></fract>
<multiply name="fz_7" type="float"><input name="in1" type="float" nodename="fz_id" /><input name="in2" type="float" value="39.963" /></multiply>
<add name="fz_8" type="float"><input name="in1" type="float" nodename="fz_7" /><input name="in2" type="float" value="0.37" /></add>
<fract name="fz_9" type="float"><input name="in" type="float" nodename="fz_8" /></fract>
<multiply name="fz_10" type="float"><input name="in1" type="float" nodename="fz_id" /><input name="in2" type="float" value="65.637" /></multiply>
<add name="fz_11" type="float"><input name="in1" type="float" nodename="fz_10" /><input name="in2" type="float" value="0.37" /></add>
<fract name="fz_12" type="float"><input name="in" type="float" nodename="fz_11" /></fract>
<multiply name="fz_13" type="float"><input name="in1" type="float" nodename="fz_id" /><input name="in2" type="float" value="97.722" /></multiply>
<add name="fz_14" type="float"><input name="in1" type="float" nodename="fz_13" /><input name="in2" type="float" value="0.37" /></add>
<fract name="fz_15" type="float"><input name="in" type="float" nodename="fz_14" /></fract>
<multiply name="fz_16" type="float"><input name="in1" type="float" nodename="fz_id" /><input name="in2" type="float" value="22.105" /></multiply>
<add name="fz_17" type="float"><input name="in1" type="float" nodename="fz_16" /><input name="in2" type="float" value="0.37" /></add>
<fract name="fz_18" type="float"><input name="in" type="float" nodename="fz_17" /></fract>
<multiply name="fz_19" type="float"><input name="in1" type="float" nodename="fz_id" /><input name="in2" type="float" value="46.964" /></multiply>
<add name="fz_20" type="float"><input name="in1" type="float" nodename="fz_19" /><input name="in2" type="float" value="0.37" /></add>
<fract name="fz_21" type="float"><input name="in" type="float" nodename="fz_20" /></fract>
<multiply name="fz_22" type="float"><input name="in1" type="float" nodename="fz_id" /><input name="in2" type="float" value="77.135" /></multiply>
<add name="fz_23" type="float"><input name="in1" type="float" nodename="fz_22" /><input name="in2" type="float" value="0.37" /></add>
<fract name="fz_24" type="float"><input name="in" type="float" nodename="fz_23" /></fract>
<subtract name="fz_25" type="float"><input name="in1" type="float" nodename="fz_6" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="fz_26" type="float"><input name="in1" type="float" nodename="fz_25" /><input name="in2" type="float" value="0.3" /></multiply>
<add name="fz_yo" type="float"><input name="in1" type="float" nodename="fl_xc" /><input name="in2" type="float" nodename="fz_26" /></add>
<multiply name="fz_28" type="float"><input name="in1" type="float" nodename="fz_9" /><input name="in2" type="float" value="0.14" /></multiply>
<add name="fz_29" type="float"><input name="in1" type="float" nodename="fz_28" /><input name="in2" type="float" value="0.06" /></add>
<add name="fz_D" type="float"><input name="in1" type="float" nodename="fz_29" /><input name="in2" type="float" nodename="h_flute" /></add>
<combine2 name="fz_31" type="vector2"><input name="in1" type="float" nodename="fz_yo" /><input name="in2" type="float" nodename="fz_D" /></combine2>
<magnitude name="fz_R0" type="float"><input name="in" type="vector2" nodename="fz_31" /></magnitude>
<subtract name="fz_33" type="float"><input name="in1" type="float" nodename="fz_12" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="fz_tap" type="float"><input name="in1" type="float" nodename="fz_33" /><input name="in2" type="float" value="0.1" /></multiply>
<combine2 name="fz_35" type="vector2"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" nodename="fl_xc" /></combine2>
<combine2 name="fz_36" type="vector2"><input name="in1" type="float" nodename="fz_21" /><input name="in2" type="float" nodename="fz_24" /></combine2>
<multiply name="fz_37" type="vector2"><input name="in1" type="vector2" nodename="fz_36" /><input name="in2" type="vector2" value="97.3, 61.7" /></multiply>
<add name="fz_lp" type="vector2"><input name="in1" type="vector2" nodename="fz_35" /><input name="in2" type="vector2" nodename="fz_37" /></add>
<multiply name="fz_39" type="float"><input name="in1" type="float" nodename="fz_tap" /><input name="in2" type="float" nodename="uv_sep" output="outy" /></multiply>
<add name="fz_40" type="float"><input name="in1" type="float" nodename="fz_R0" /><input name="in2" type="float" nodename="fz_39" /></add>
<multiply name="fz_41" type="vector2"><input name="in1" type="vector2" nodename="fz_lp" /><input name="in2" type="vector2" value="1.5, 6.0" /></multiply>
<add name="fz_42" type="vector2"><input name="in1" type="vector2" nodename="fz_41" /><input name="in2" type="vector2" value="4.1, 9.3" /></add>
<fractal2d name="fz_43" type="float"><input name="texcoord" type="vector2" nodename="fz_42" /><input name="amplitude" type="float" value="0.006" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="fz_R" type="float"><input name="in1" type="float" nodename="fz_40" /><input name="in2" type="float" nodename="fz_43" /></add>
<multiply name="fz_45" type="float"><input name="in1" type="float" nodename="fz_15" /><input name="in2" type="float" value="0.003" /></multiply>
<add name="fz_lam" type="float"><input name="in1" type="float" nodename="fz_45" /><input name="in2" type="float" value="0.003" /></add>
<multiply name="fz_47" type="float"><input name="in1" type="float" nodename="fz_R" /><input name="in2" type="float" value="35.0" /></multiply>
<multiply name="fz_48" type="float"><input name="in1" type="float" nodename="fz_18" /><input name="in2" type="float" value="71.0" /></multiply>
<combine2 name="fz_49" type="vector2"><input name="in1" type="float" nodename="fz_47" /><input name="in2" type="float" nodename="fz_48" /></combine2>
<fractal2d name="fz_yr" type="float"><input name="texcoord" type="vector2" nodename="fz_49" /><input name="amplitude" type="float" value="1.2" /><input name="octaves" type="integer" value="1" /></fractal2d>
<divide name="fz_51" type="float"><input name="in1" type="float" nodename="fz_R" /><input name="in2" type="float" nodename="fz_lam" /></divide>
<add name="fz_52" type="float"><input name="in1" type="float" nodename="fz_51" /><input name="in2" type="float" nodename="fz_yr" /></add>
<multiply name="fz_53" type="float"><input name="in1" type="float" nodename="fz_18" /><input name="in2" type="float" value="13.0" /></multiply>
<add name="fz_54" type="float"><input name="in1" type="float" nodename="fz_52" /><input name="in2" type="float" nodename="fz_53" /></add>
<fract name="fz_t" type="float"><input name="in" type="float" nodename="fz_54" /></fract>
<multiply name="fz_56" type="float"><input name="in1" type="float" nodename="fz_D" /><input name="in2" type="float" nodename="fl_dh" /></multiply>
<add name="fz_57" type="float"><input name="in1" type="float" nodename="fz_yo" /><input name="in2" type="float" nodename="fz_56" /></add>
<divide name="fz_gx" type="float"><input name="in1" type="float" nodename="fz_57" /><input name="in2" type="float" nodename="fz_R0" /></divide>
<combine2 name="fz_59" type="vector2"><input name="in1" type="float" nodename="fz_gx" /><input name="in2" type="float" nodename="fz_tap" /></combine2>
<magnitude name="fz_60" type="float"><input name="in" type="vector2" nodename="fz_59" /></magnitude>
<multiply name="fz_61" type="float"><input name="in1" type="float" nodename="fz_60" /><input name="in2" type="float" value="1.3" /></multiply>
<divide name="fz_f" type="float"><input name="in1" type="float" nodename="fz_61" /><input name="in2" type="float" nodename="fz_lam" /></divide>
<smoothstep name="fz_63" type="float"><input name="in" type="float" nodename="fz_t" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.1" /></smoothstep>
<smoothstep name="fz_64" type="float"><input name="in" type="float" nodename="fz_t" /><input name="low" type="float" value="0.25" /><input name="high" type="float" value="0.55" /></smoothstep>
<subtract name="fz_65" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="fz_64" /></subtract>
<multiply name="fz_ew" type="float"><input name="in1" type="float" nodename="fz_63" /><input name="in2" type="float" nodename="fz_65" /></multiply>
<smoothstep name="fz_67" type="float"><input name="in" type="float" nodename="fz_f" /><input name="low" type="float" value="85.0" /><input name="high" type="float" value="170.0" /></smoothstep>
<subtract name="fz_68" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="fz_67" /></subtract>
<mix name="fz_fig" type="float"><input name="bg" type="float" value="0.35" /><input name="fg" type="float" nodename="fz_ew" /><input name="mix" type="float" nodename="fz_68" /></mix>
```

### Straight and rift grain

Quarter-sawn and rift boards show straight parallel lines. The analytic [moiré cap](wood.md#local-frequency-fade-moiré-cap)
cannot help here: the ring frequency is constant, so it fades the figure everywhere (or nowhere). Draw the lines with
**noise stretched ~380:1** instead (`fractal2d` at 380 × 1 /m): thresholded, it gives straight, irregular latewood lines
1–3 mm apart, grouped by a slower field. Noise that is too fine only speckles, it never moirés, so no fade is needed.
Add streaks and pore dashes; feed board-local coordinates, shifted per board, for a private patch per board or slat.

```xml
<!-- in: uv (x across the grain, y along; feed board-local coords for per-board patches). out: ws_late (0..1 latewood lines), ws_pore (0..1), ws_str (signed streaks). Straight or rift grain: fractal lines stretched ~380:1 (380 x 1 /m, lines ~1..3 mm apart), grouped by a slower 110 x 0.8 /m field, plus 60 x 1.5 /m streaks and oak pore dashes (cells 0.38 x 5.6 mm). Noise lines only speckle when sub-pixel; they never moire, so no fade is needed. The analytic ring fade does not work here: a quarter-sawn ring frequency is constant, so it fades everywhere or nowhere -->
<multiply name="ws_1" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="60.0, 1.5" /></multiply>
<add name="ws_2" type="vector2"><input name="in1" type="vector2" nodename="ws_1" /><input name="in2" type="vector2" value="3.1, 7.9" /></add>
<fractal2d name="ws_str" type="float"><input name="texcoord" type="vector2" nodename="ws_2" /><input name="amplitude" type="float" value="1.0" /><input name="octaves" type="integer" value="2" /></fractal2d>
<multiply name="ws_4" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="380.0, 1.0" /></multiply>
<add name="ws_5" type="vector2"><input name="in1" type="vector2" nodename="ws_4" /><input name="in2" type="vector2" value="29.6, 15.2" /></add>
<fractal2d name="ws_bnd" type="float"><input name="texcoord" type="vector2" nodename="ws_5" /><input name="amplitude" type="float" value="1.0" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="ws_7" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="110.0, 0.8" /></multiply>
<add name="ws_8" type="vector2"><input name="in1" type="vector2" nodename="ws_7" /><input name="in2" type="vector2" value="5.2, 19.4" /></add>
<fractal2d name="ws_grp" type="float"><input name="texcoord" type="vector2" nodename="ws_8" /><input name="amplitude" type="float" value="1.0" /><input name="octaves" type="integer" value="1" /></fractal2d>
<smoothstep name="ws_10" type="float"><input name="in" type="float" nodename="ws_bnd" /><input name="low" type="float" value="0.0" /><input name="high" type="float" value="0.22" /></smoothstep>
<smoothstep name="ws_11" type="float"><input name="in" type="float" nodename="ws_grp" /><input name="low" type="float" value="-0.5" /><input name="high" type="float" value="0.1" /></smoothstep>
<multiply name="ws_late" type="float"><input name="in1" type="float" nodename="ws_10" /><input name="in2" type="float" nodename="ws_11" /></multiply>
<multiply name="ws_13" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="vector2" value="2600.0, 180.0" /></multiply>
<add name="ws_14" type="vector2"><input name="in1" type="vector2" nodename="ws_13" /><input name="in2" type="vector2" value="0.37, 0.61" /></add>
<worleynoise2d name="ws_f1" type="float"><input name="texcoord" type="vector2" nodename="ws_14" /><input name="jitter" type="float" value="1.0" /></worleynoise2d>
<smoothstep name="ws_16" type="float"><input name="in" type="float" nodename="ws_f1" /><input name="low" type="float" value="0.1" /><input name="high" type="float" value="0.22" /></smoothstep>
<subtract name="ws_17" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="ws_16" /></subtract>
<multiply name="ws_18" type="float"><input name="in1" type="float" nodename="ws_late" /><input name="in2" type="float" value="0.8" /></multiply>
<subtract name="ws_19" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="ws_18" /></subtract>
<multiply name="ws_pore" type="float"><input name="in1" type="float" nodename="ws_17" /><input name="in2" type="float" nodename="ws_19" /></multiply>
```

### Pine latewood profile

Softwoods are the reverse of oak: pale straw earlywood, then an abrupt dark, hard latewood band that ends sharply at the
ring boundary, `smoothstep(t, 0.56, 0.61)·(1 − smoothstep(t, 0.92, 1))`. Fade it to its mean (0.28) where the rings
alias: the latewood line frequency |dR/dy|/pitch fades between **150 and 230 lines/m** (round 5: the older 85–170
with a 1.4 safety factor erased visible 7–11 mm rings, and 150–230 stayed moiré-free under `render.sh`, totem included).
Plantation pine has wide rings (6–11 mm). The recipe carries its own flat-sawn cone and row frame (150 mm rows
along V, grain along U), and exports the phase, pitch and fade for the eroded profile below.

```xml
<!-- in: uv_sep. out: pn_loc (m: along U, across from the row centre), pn_rid (per-row random), pn_ph (ring phase), pn_sp (ring pitch, m), pn_fade, pn_lw (latewood, faded to its mean 0.28), pn_col (wood colour). Flat-sawn pine rows 150 mm along V, grain along U. Softwood rings are the reverse of oak: pale straw earlywood, then an abrupt dark, hard latewood band, t 0.56..0.61 up and 0.92..1 down (smoothstep). Cone model: pith +-12 cm off the row centre, 4..12 cm deep, taper +-2%, pitch 6..11 mm; the latewood fades to its mean between 150 and 230 lines/m (|dR/dy|/pitch; moire-free under render.sh) -->
<divide name="pn_v" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" value="0.15" /></divide>
<floor name="pn_row" type="float"><input name="in" type="float" nodename="pn_v" /></floor>
<subtract name="pn_3" type="float"><input name="in1" type="float" nodename="pn_v" /><input name="in2" type="float" nodename="pn_row" /></subtract>
<subtract name="pn_4" type="float"><input name="in1" type="float" nodename="pn_3" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="pn_c" type="float"><input name="in1" type="float" nodename="pn_4" /><input name="in2" type="float" value="0.15" /></multiply>
<combine2 name="pn_loc" type="vector2"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" nodename="pn_c" /></combine2>
<combine2 name="pn_7" type="vector2"><input name="in1" type="float" nodename="pn_row" /><input name="in2" type="float" value="5.0" /></combine2>
<add name="pn_8" type="vector2"><input name="in1" type="vector2" nodename="pn_7" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="pn_rid" type="float"><input name="texcoord" type="vector2" nodename="pn_8" /></cellnoise2d>
<multiply name="pn_10" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="13.73" /></multiply>
<add name="pn_11" type="float"><input name="in1" type="float" nodename="pn_10" /><input name="in2" type="float" value="0.61" /></add>
<fract name="pn_12" type="float"><input name="in" type="float" nodename="pn_11" /></fract>
<multiply name="pn_13" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="29.17" /></multiply>
<add name="pn_14" type="float"><input name="in1" type="float" nodename="pn_13" /><input name="in2" type="float" value="0.61" /></add>
<fract name="pn_15" type="float"><input name="in" type="float" nodename="pn_14" /></fract>
<multiply name="pn_16" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="47.91" /></multiply>
<add name="pn_17" type="float"><input name="in1" type="float" nodename="pn_16" /><input name="in2" type="float" value="0.61" /></add>
<fract name="pn_18" type="float"><input name="in" type="float" nodename="pn_17" /></fract>
<multiply name="pn_19" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="71.33" /></multiply>
<add name="pn_20" type="float"><input name="in1" type="float" nodename="pn_19" /><input name="in2" type="float" value="0.61" /></add>
<fract name="pn_21" type="float"><input name="in" type="float" nodename="pn_20" /></fract>
<multiply name="pn_22" type="float"><input name="in1" type="float" nodename="pn_rid" /><input name="in2" type="float" value="97.61" /></multiply>
<add name="pn_23" type="float"><input name="in1" type="float" nodename="pn_22" /><input name="in2" type="float" value="0.61" /></add>
<fract name="pn_24" type="float"><input name="in" type="float" nodename="pn_23" /></fract>
<multiply name="pn_25" type="float"><input name="in1" type="float" nodename="pn_15" /><input name="in2" type="float" value="0.08" /></multiply>
<add name="pn_26" type="float"><input name="in1" type="float" nodename="pn_25" /><input name="in2" type="float" value="0.04" /></add>
<subtract name="pn_27" type="float"><input name="in1" type="float" nodename="pn_18" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="pn_28" type="float"><input name="in1" type="float" nodename="pn_27" /><input name="in2" type="float" value="0.04" /></multiply>
<multiply name="pn_29" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" nodename="pn_28" /></multiply>
<add name="pn_zc" type="float"><input name="in1" type="float" nodename="pn_26" /><input name="in2" type="float" nodename="pn_29" /></add>
<subtract name="pn_31" type="float"><input name="in1" type="float" nodename="pn_12" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="pn_32" type="float"><input name="in1" type="float" nodename="pn_31" /><input name="in2" type="float" value="0.24" /></multiply>
<subtract name="pn_33" type="float"><input name="in1" type="float" nodename="pn_c" /><input name="in2" type="float" nodename="pn_32" /></subtract>
<multiply name="pn_34" type="vector2"><input name="in1" type="vector2" nodename="pn_loc" /><input name="in2" type="vector2" value="2.2, 6.0" /></multiply>
<add name="pn_35" type="vector2"><input name="in1" type="vector2" nodename="pn_34" /><input name="in2" type="vector2" value="13.1, 2.9" /></add>
<fractal2d name="pn_36" type="float"><input name="texcoord" type="vector2" nodename="pn_35" /><input name="amplitude" type="float" value="0.005" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="pn_dy" type="float"><input name="in1" type="float" nodename="pn_33" /><input name="in2" type="float" nodename="pn_36" /></add>
<combine2 name="pn_38" type="vector2"><input name="in1" type="float" nodename="pn_dy" /><input name="in2" type="float" nodename="pn_zc" /></combine2>
<magnitude name="pn_R" type="float"><input name="in" type="vector2" nodename="pn_38" /></magnitude>
<multiply name="pn_40" type="float"><input name="in1" type="float" nodename="pn_21" /><input name="in2" type="float" value="0.005" /></multiply>
<add name="pn_sp" type="float"><input name="in1" type="float" nodename="pn_40" /><input name="in2" type="float" value="0.006" /></add>
<divide name="pn_42" type="float"><input name="in1" type="float" nodename="pn_R" /><input name="in2" type="float" nodename="pn_sp" /></divide>
<multiply name="pn_43" type="float"><input name="in1" type="float" nodename="pn_R" /><input name="in2" type="float" value="25.0" /></multiply>
<multiply name="pn_44" type="float"><input name="in1" type="float" nodename="pn_24" /><input name="in2" type="float" value="53.0" /></multiply>
<combine2 name="pn_45" type="vector2"><input name="in1" type="float" nodename="pn_43" /><input name="in2" type="float" nodename="pn_44" /></combine2>
<fractal2d name="pn_46" type="float"><input name="texcoord" type="vector2" nodename="pn_45" /><input name="amplitude" type="float" value="1.3" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="pn_ph" type="float"><input name="in1" type="float" nodename="pn_42" /><input name="in2" type="float" nodename="pn_46" /></add>
<fract name="pn_t" type="float"><input name="in" type="float" nodename="pn_ph" /></fract>
<smoothstep name="pn_49" type="float"><input name="in" type="float" nodename="pn_t" /><input name="low" type="float" value="0.56" /><input name="high" type="float" value="0.61" /></smoothstep>
<smoothstep name="pn_50" type="float"><input name="in" type="float" nodename="pn_t" /><input name="low" type="float" value="0.92" /><input name="high" type="float" value="1.0" /></smoothstep>
<subtract name="pn_51" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="pn_50" /></subtract>
<multiply name="pn_lw0" type="float"><input name="in1" type="float" nodename="pn_49" /><input name="in2" type="float" nodename="pn_51" /></multiply>
<divide name="pn_53" type="float"><input name="in1" type="float" nodename="pn_dy" /><input name="in2" type="float" nodename="pn_R" /></divide>
<absval name="pn_54" type="float"><input name="in" type="float" nodename="pn_53" /></absval>
<divide name="pn_55" type="float"><input name="in1" type="float" nodename="pn_54" /><input name="in2" type="float" nodename="pn_sp" /></divide>
<smoothstep name="pn_56" type="float"><input name="in" type="float" nodename="pn_55" /><input name="low" type="float" value="150.0" /><input name="high" type="float" value="230.0" /></smoothstep>
<subtract name="pn_fade" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="pn_56" /></subtract>
<mix name="pn_lw" type="float"><input name="bg" type="float" value="0.28" /><input name="fg" type="float" nodename="pn_lw0" /><input name="mix" type="float" nodename="pn_fade" /></mix>
<mix name="pn_ewc" type="color3"><input name="bg" type="color3" value="0.56, 0.41, 0.24" /><input name="fg" type="color3" value="0.64, 0.48, 0.3" /><input name="mix" type="float" nodename="pn_12" /></mix>
<mix name="pn_60" type="color3"><input name="bg" type="color3" nodename="pn_ewc" /><input name="fg" type="color3" value="0.34, 0.2, 0.1" /><input name="mix" type="float" nodename="pn_lw" /></mix>
<multiply name="pn_61" type="float"><input name="in1" type="float" nodename="pn_21" /><input name="in2" type="float" value="0.3" /></multiply>
<add name="pn_62" type="float"><input name="in1" type="float" nodename="pn_61" /><input name="in2" type="float" value="0.85" /></add>
<multiply name="pn_col" type="color3"><input name="in1" type="color3" nodename="pn_60" /><input name="in2" type="float" nodename="pn_62" /></multiply>
```

### Eroded earlywood (weathered)

Weathering removes the soft earlywood deeply and leaves the latewood as narrow rounded ridges. Re-centre the phase on the
latewood, `er_t = fract(phase + 0.24)`, and use `1 − smoothstep(|er_t − 0.5|, 0.15, 0.4)`: a wide trough and a narrow
ridge, 0.15 × ring pitch deep (~1–1.6 mm), faded like the figure. Read the phase once: barnwood's first graph read it
three times and took minutes to compile (bug 7). Lighten the ridges and darken the troughs with the same mask. For a
brushed or sanded floor use the shallower [wire-brushed](wood.md#wire-brushed-and-eroded-earlywood) recipe.

```xml
<!-- in: pn_ph, pn_sp, pn_fade. out: er_fig (1 soft earlywood trough .. 0 latewood ridge, faded to 0.5), h_erode (m). Weathered, eroded earlywood (barnwood): er_t = fract(phase + 0.24) is 0 at the pine latewood centre, and the profile 1 - smoothstep(|er_t - 0.5|, 0.15, 0.4) leaves a narrow rounded ridge and a wide trough. Depth 0.15 x ring pitch (~1..1.6 mm); the ring phase is read once -->
<add name="er_1" type="float"><input name="in1" type="float" nodename="pn_ph" /><input name="in2" type="float" value="0.24" /></add>
<fract name="er_2" type="float"><input name="in" type="float" nodename="er_1" /></fract>
<subtract name="er_3" type="float"><input name="in1" type="float" nodename="er_2" /><input name="in2" type="float" value="0.5" /></subtract>
<absval name="er_tw" type="float"><input name="in" type="float" nodename="er_3" /></absval>
<smoothstep name="er_5" type="float"><input name="in" type="float" nodename="er_tw" /><input name="low" type="float" value="0.15" /><input name="high" type="float" value="0.4" /></smoothstep>
<subtract name="er_6" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="er_5" /></subtract>
<mix name="er_fig" type="float"><input name="bg" type="float" value="0.5" /><input name="fg" type="float" nodename="er_6" /><input name="mix" type="float" nodename="pn_fade" /></mix>
<subtract name="er_8" type="float"><input name="in1" type="float" nodename="er_fig" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="er_9" type="float"><input name="in1" type="float" nodename="pn_sp" /><input name="in2" type="float" value="-0.15" /></multiply>
<multiply name="h_erode" type="float"><input name="in1" type="float" nodename="er_8" /><input name="in2" type="float" nodename="er_9" /></multiply>
```

### Book-matched figure

Veneer leaves are sliced in sequence and opened like a book, so each seam is a mirror line. The
[flitch coordinate](layouts.md#book-match-mirror-flitch-coordinate) `a = L − |mod(u, 2L) − L|` makes any function of
(a, along) exactly symmetric. Fiddleback is noise at 75/m along the grain on a slanted, warped coordinate, so the bands
meet each seam as chevrons, in patches; ribbon stripes are noise across at 22/m. `lq_fib` turns the figure into a fibre
pseudo-height for the lacquer recipe below. The test measured the pseudo-height against its mirror at a seam: at most 1
grey level apart, mean 0.0002.

```xml
<!-- in: bm_q, bm_a. out: lq_fig (signed fiddleback figure, ~+-0.5), lq_rb (ribbon, signed), lq_fib (fibre pseudo-height, m). Figured veneer on flitch coords: fiddleback cross-bands ~13 mm apart (75/m along the grain) slanted ~20 deg so they meet the seams as chevrons, curved by a 6 mm warp and in patches; ribbon stripes ~3 cm across (22/m). The fibre tilt becomes a pseudo-height: fiddleback 2.5 mm x figure (~+-12 deg), ribbon 3.5 mm x ribbon, whole-leaf tilt 0.035 m/m x a. All are functions of the flitch coords and the leaf tilt uses a itself (a triangle wave: continuous, its slope flips at the seam), so seams stay invisible; a per-leaf +-1 sign times a constant steps at every seam -->
<separate2 name="lq_qs" type="multioutput"><input name="in" type="vector2" nodename="bm_q" /></separate2>
<multiply name="lq_2" type="vector2"><input name="in1" type="vector2" nodename="bm_q" /><input name="in2" type="vector2" value="10.0, 2.0" /></multiply>
<add name="lq_3" type="vector2"><input name="in1" type="vector2" nodename="lq_2" /><input name="in2" type="vector2" value="7.7, 1.9" /></add>
<fractal2d name="lq_bw" type="float"><input name="texcoord" type="vector2" nodename="lq_3" /><input name="amplitude" type="float" value="0.006" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="lq_5" type="vector2"><input name="in1" type="vector2" nodename="bm_q" /><input name="in2" type="vector2" value="1.0, 0.8" /></multiply>
<add name="lq_6" type="vector2"><input name="in1" type="vector2" nodename="lq_5" /><input name="in2" type="vector2" value="3.9, 12.7" /></add>
<fractal2d name="lq_7" type="float"><input name="texcoord" type="vector2" nodename="lq_6" /><input name="amplitude" type="float" value="0.8" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="lq_slant" type="float"><input name="in1" type="float" nodename="lq_7" /><input name="in2" type="float" value="0.35" /></add>
<add name="lq_9" type="float"><input name="in1" type="float" nodename="lq_qs" output="outy" /><input name="in2" type="float" nodename="lq_bw" /></add>
<multiply name="lq_10" type="float"><input name="in1" type="float" nodename="lq_qs" output="outx" /><input name="in2" type="float" nodename="lq_slant" /></multiply>
<add name="lq_11" type="float"><input name="in1" type="float" nodename="lq_9" /><input name="in2" type="float" nodename="lq_10" /></add>
<combine2 name="lq_fq" type="vector2"><input name="in1" type="float" nodename="lq_qs" output="outx" /><input name="in2" type="float" nodename="lq_11" /></combine2>
<multiply name="lq_13" type="vector2"><input name="in1" type="vector2" nodename="lq_fq" /><input name="in2" type="vector2" value="4.0, 75.0" /></multiply>
<add name="lq_14" type="vector2"><input name="in1" type="vector2" nodename="lq_13" /><input name="in2" type="vector2" value="13.3, 5.1" /></add>
<fractal2d name="lq_fb" type="float"><input name="texcoord" type="vector2" nodename="lq_14" /><input name="amplitude" type="float" value="1.0" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="lq_16" type="vector2"><input name="in1" type="vector2" nodename="bm_q" /><input name="in2" type="vector2" value="5.0, 1.6" /></multiply>
<add name="lq_17" type="vector2"><input name="in1" type="vector2" nodename="lq_16" /><input name="in2" type="vector2" value="21.7, 3.3" /></add>
<fractal2d name="lq_18" type="float"><input name="texcoord" type="vector2" nodename="lq_17" /><input name="amplitude" type="float" value="1.0" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="lq_19" type="float"><input name="in1" type="float" nodename="lq_18" /><input name="in2" type="float" value="1.4" /></multiply>
<add name="lq_20" type="float"><input name="in1" type="float" nodename="lq_19" /><input name="in2" type="float" value="0.55" /></add>
<clamp name="lq_pres" type="float"><input name="in" type="float" nodename="lq_20" /></clamp>
<multiply name="lq_fig" type="float"><input name="in1" type="float" nodename="lq_fb" /><input name="in2" type="float" nodename="lq_pres" /></multiply>
<multiply name="lq_23" type="vector2"><input name="in1" type="vector2" nodename="bm_q" /><input name="in2" type="vector2" value="22.0, 0.8" /></multiply>
<add name="lq_24" type="vector2"><input name="in1" type="vector2" nodename="lq_23" /><input name="in2" type="vector2" value="31.1, 17.9" /></add>
<fractal2d name="lq_rb" type="float"><input name="texcoord" type="vector2" nodename="lq_24" /><input name="amplitude" type="float" value="1.0" /><input name="octaves" type="integer" value="1" /></fractal2d>
<multiply name="lq_26" type="float"><input name="in1" type="float" nodename="lq_fig" /><input name="in2" type="float" value="0.0025" /></multiply>
<multiply name="lq_27" type="float"><input name="in1" type="float" nodename="lq_rb" /><input name="in2" type="float" value="0.0035" /></multiply>
<add name="lq_28" type="float"><input name="in1" type="float" nodename="lq_26" /><input name="in2" type="float" nodename="lq_27" /></add>
<multiply name="lq_29" type="float"><input name="in1" type="float" nodename="bm_a" /><input name="in2" type="float" value="0.035" /></multiply>
<add name="lq_fib" type="float"><input name="in1" type="float" nodename="lq_28" /><input name="in2" type="float" nodename="lq_29" /></add>
```

### Lacquered wood: two normals

Figured wood under a clear coat shimmers (chatoyance): the highlight rolls across the fiddleback as you move, because
the fibres below the coat are tilted while the coat is flat. Give the layers different normals:

- **base** (`normal`): the true height plus the fibre pseudo-height (`lq_fib`, ±12° of fibre tilt);
- **coat** (`coat_normal`): the true height only, the usual `n_world`. Set `coat 1`, `coat_IOR 1.5`, coat roughness
  ~0.3, base roughness a little higher and varied with the figure.

Every per-leaf term must be continuous at the seams. A leaf tilt written as `a·k` is continuous (its slope flips, which
is what makes alternate leaves light and dark); `sign(leaf)·k` steps and draws a seam line. Without `coat_normal` the
coat is a perfect mirror; `specular_rotation` has a units bug (bug 8), so avoid anisotropy for this.

```xml
<!-- in: height (true surface, m), lq_fib, uv. out: n_base -> standard_surface.normal. Paste after the normal snippet, whose n_world goes to coat_normal. Lacquered wood has two normals: the base layer (the fibres) sees height + the fibre pseudo-height, so its highlight rolls across the figure as the view changes (chatoyance, fiddleback shimmer), while the coat sees only the true, near-flat surface. Set coat 1, coat_IOR 1.5, coat_roughness ~0.3; without coat_normal the coat is a flat mirror -->
<add name="ln_1" type="float"><input name="in1" type="float" nodename="height" /><input name="in2" type="float" nodename="lq_fib" /></add>
<multiply name="ln_mm" type="float"><input name="in1" type="float" nodename="ln_1" /><input name="in2" type="float" value="1000.0" /></multiply>
<multiply name="ln_3" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="1000.0" /></multiply>
<heighttonormal name="ln_nt" type="vector3"><input name="in" type="float" nodename="ln_mm" /><input name="scale" type="float" value="16" /><input name="texcoord" type="vector2" nodename="ln_3" /></heighttonormal>
<normalmap name="n_base" type="vector3"><input name="in" type="vector3" nodename="ln_nt" /></normalmap>
```

### Knots along long boards: per-cell knots and swirl rings

One knot per board (the [wood.md knot](wood.md#knots-with-deflected-grain)) is too sparse on boards over ~0.5 m: a 1 m
tile of long boards can show none. Cut each board into 0.4 m cells along the grain, keyed on (board id, cell), and let
40% hold a knot. The deflection and bump are **windowed** by `1 − smoothstep(|x_cell|, 0.33, 0.5)` so they reach 0 at
the cell ends, and the grain stays continuous from cell to cell. Deflection plus a dark core alone reads as a stain, so
add **explicit swirl rings** round the knot (4 mm apart, 0.9r to ~2.6r) and mix them into the figure,
`fig = mix(wr_fig, kc_ring, kc_swirl)`. Wobble the ring radius with noise (±1.2 mm): perfect rings read as a bullseye.
It outputs the same `wk_*` as the one-knot recipe, so it drops in before [growth rings](wood.md#growth-rings-plain-sawn-and-quarter-sawn).
Squared radii use `dotproduct` so `wk_loc` stays small: the ring recipe reads it ~8 times, and a first version with
`magnitude`·`magnitude` and a board-length term made the test tree 3.7× larger (144k vs 39k) and the first view 8× slower (25 s vs 3 s; bug 7).

```xml
<!-- in: pk_loc, pk_id, uv_sep. out: wk_loc, wk_bump, wk_core, wk_rim (the knot recipe's outputs, so it drops in for it), kc_swirl (0..1 swirl zone), kc_ring (0..1 swirl-ring profile). Knots along long boards: 400 mm cells along U, keyed on (board id, cell), 40% hold a knot r 5..11 mm, +-8 cm along the cell and +-4 cm across (a knot a butt joint cuts is simply cut, as in real boards). The deflection and bump are windowed by 1 - smoothstep(|x_cell|, 0.33, 0.5), so they are 0 at the cell ends and the grain stays continuous. Swirl: explicit rings 4 mm apart from 0.9r out to ~2.6r, wobbled +-1.2 mm by 2-oct noise (perfect rings read as a bullseye; deflection plus a core alone reads as a stain). Mix it into the figure: fig = mix(wr_fig, kc_ring, kc_swirl). Squared radii use dotproduct, so wk_loc stays small: the ring recipe reads it ~8 times (bug 7) -->
<divide name="kc_x" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.4" /></divide>
<fract name="kc_2" type="float"><input name="in" type="float" nodename="kc_x" /></fract>
<subtract name="kc_f" type="float"><input name="in1" type="float" nodename="kc_2" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="kc_4" type="float"><input name="in1" type="float" nodename="pk_id" /><input name="in2" type="float" value="97.0" /></multiply>
<floor name="kc_5" type="float"><input name="in" type="float" nodename="kc_x" /></floor>
<combine2 name="kc_6" type="vector2"><input name="in1" type="float" nodename="kc_4" /><input name="in2" type="float" nodename="kc_5" /></combine2>
<add name="kc_7" type="vector2"><input name="in1" type="vector2" nodename="kc_6" /><input name="in2" type="vector2" value="5.3, 71.9" /></add>
<cellnoise2d name="kc_id" type="float"><input name="texcoord" type="vector2" nodename="kc_7" /></cellnoise2d>
<multiply name="kc_9" type="float"><input name="in1" type="float" nodename="kc_id" /><input name="in2" type="float" value="18.81" /></multiply>
<add name="kc_10" type="float"><input name="in1" type="float" nodename="kc_9" /><input name="in2" type="float" value="0.37" /></add>
<fract name="kc_11" type="float"><input name="in" type="float" nodename="kc_10" /></fract>
<ifgreater name="kc_on" type="float"><input name="value1" type="float" nodename="kc_11" /><input name="value2" type="float" value="0.6" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<absval name="kc_13" type="float"><input name="in" type="float" nodename="kc_f" /></absval>
<smoothstep name="kc_14" type="float"><input name="in" type="float" nodename="kc_13" /><input name="low" type="float" value="0.33" /><input name="high" type="float" value="0.5" /></smoothstep>
<subtract name="kc_15" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="kc_14" /></subtract>
<multiply name="kc_onw" type="float"><input name="in1" type="float" nodename="kc_on" /><input name="in2" type="float" nodename="kc_15" /></multiply>
<multiply name="kc_17" type="float"><input name="in1" type="float" nodename="kc_id" /><input name="in2" type="float" value="39.963" /></multiply>
<add name="kc_18" type="float"><input name="in1" type="float" nodename="kc_17" /><input name="in2" type="float" value="0.37" /></add>
<fract name="kc_19" type="float"><input name="in" type="float" nodename="kc_18" /></fract>
<multiply name="kc_20" type="float"><input name="in1" type="float" nodename="kc_19" /><input name="in2" type="float" value="0.006" /></multiply>
<add name="kc_r" type="float"><input name="in1" type="float" nodename="kc_20" /><input name="in2" type="float" value="0.005" /></add>
<multiply name="kc_r2" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" nodename="kc_r" /></multiply>
<separate2 name="kc_ls" type="multioutput"><input name="in" type="vector2" nodename="pk_loc" /></separate2>
<multiply name="kc_24" type="float"><input name="in1" type="float" nodename="kc_id" /><input name="in2" type="float" value="65.637" /></multiply>
<add name="kc_25" type="float"><input name="in1" type="float" nodename="kc_24" /><input name="in2" type="float" value="0.37" /></add>
<fract name="kc_26" type="float"><input name="in" type="float" nodename="kc_25" /></fract>
<subtract name="kc_27" type="float"><input name="in1" type="float" nodename="kc_26" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="kc_28" type="float"><input name="in1" type="float" nodename="kc_27" /><input name="in2" type="float" value="0.4" /></multiply>
<subtract name="kc_29" type="float"><input name="in1" type="float" nodename="kc_f" /><input name="in2" type="float" nodename="kc_28" /></subtract>
<multiply name="kc_30" type="float"><input name="in1" type="float" nodename="kc_29" /><input name="in2" type="float" value="0.4" /></multiply>
<multiply name="kc_31" type="float"><input name="in1" type="float" nodename="kc_id" /><input name="in2" type="float" value="97.722" /></multiply>
<add name="kc_32" type="float"><input name="in1" type="float" nodename="kc_31" /><input name="in2" type="float" value="0.37" /></add>
<fract name="kc_33" type="float"><input name="in" type="float" nodename="kc_32" /></fract>
<subtract name="kc_34" type="float"><input name="in1" type="float" nodename="kc_33" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="kc_35" type="float"><input name="in1" type="float" nodename="kc_34" /><input name="in2" type="float" value="0.08" /></multiply>
<subtract name="kc_qy" type="float"><input name="in1" type="float" nodename="kc_ls" output="outy" /><input name="in2" type="float" nodename="kc_35" /></subtract>
<combine2 name="kc_q" type="vector2"><input name="in1" type="float" nodename="kc_30" /><input name="in2" type="float" nodename="kc_qy" /></combine2>
<multiply name="kc_qa" type="vector2"><input name="in1" type="vector2" nodename="kc_q" /><input name="in2" type="vector2" value="0.7, 1.0" /></multiply>
<dotproduct name="kc_39" type="float"><input name="in1" type="vector2" nodename="kc_qa" /><input name="in2" type="vector2" nodename="kc_qa" /></dotproduct>
<add name="kc_40" type="float"><input name="in1" type="float" nodename="kc_39" /><input name="in2" type="float" nodename="kc_r2" /></add>
<divide name="kc_41" type="float"><input name="in1" type="float" nodename="kc_r2" /><input name="in2" type="float" nodename="kc_40" /></divide>
<multiply name="kc_42" type="float"><input name="in1" type="float" nodename="kc_onw" /><input name="in2" type="float" value="0.004" /></multiply>
<multiply name="wk_bump" type="float"><input name="in1" type="float" nodename="kc_41" /><input name="in2" type="float" nodename="kc_42" /></multiply>
<multiply name="kc_qe" type="vector2"><input name="in1" type="vector2" nodename="kc_q" /><input name="in2" type="vector2" value="0.4, 1.0" /></multiply>
<multiply name="kc_45" type="float"><input name="in1" type="float" nodename="kc_r2" /><input name="in2" type="float" value="1.6" /></multiply>
<dotproduct name="kc_46" type="float"><input name="in1" type="vector2" nodename="kc_qe" /><input name="in2" type="vector2" nodename="kc_qe" /></dotproduct>
<add name="kc_47" type="float"><input name="in1" type="float" nodename="kc_46" /><input name="in2" type="float" nodename="kc_r2" /></add>
<divide name="kc_48" type="float"><input name="in1" type="float" nodename="kc_45" /><input name="in2" type="float" nodename="kc_47" /></divide>
<multiply name="kc_def" type="float"><input name="in1" type="float" nodename="kc_48" /><input name="in2" type="float" nodename="kc_onw" /></multiply>
<multiply name="kc_50" type="float"><input name="in1" type="float" nodename="kc_qy" /><input name="in2" type="float" nodename="kc_def" /></multiply>
<combine2 name="kc_51" type="vector2"><input name="in1" type="float" value="0.0" /><input name="in2" type="float" nodename="kc_50" /></combine2>
<subtract name="wk_loc" type="vector2"><input name="in1" type="vector2" nodename="pk_loc" /><input name="in2" type="vector2" nodename="kc_51" /></subtract>
<magnitude name="kc_rho" type="float"><input name="in" type="vector2" nodename="kc_qa" /></magnitude>
<multiply name="kc_54" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" value="0.85" /></multiply>
<smoothstep name="kc_55" type="float"><input name="in" type="float" nodename="kc_rho" /><input name="low" type="float" nodename="kc_54" /><input name="high" type="float" nodename="kc_r" /></smoothstep>
<subtract name="kc_56" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="kc_55" /></subtract>
<multiply name="wk_core" type="float"><input name="in1" type="float" nodename="kc_56" /><input name="in2" type="float" nodename="kc_on" /></multiply>
<multiply name="kc_58" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" value="0.8" /></multiply>
<multiply name="kc_59" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" value="0.95" /></multiply>
<smoothstep name="kc_60" type="float"><input name="in" type="float" nodename="kc_rho" /><input name="low" type="float" nodename="kc_58" /><input name="high" type="float" nodename="kc_59" /></smoothstep>
<multiply name="kc_61" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" value="1.2" /></multiply>
<smoothstep name="kc_62" type="float"><input name="in" type="float" nodename="kc_rho" /><input name="low" type="float" nodename="kc_r" /><input name="high" type="float" nodename="kc_61" /></smoothstep>
<subtract name="kc_63" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="kc_62" /></subtract>
<multiply name="kc_64" type="float"><input name="in1" type="float" nodename="kc_60" /><input name="in2" type="float" nodename="kc_63" /></multiply>
<multiply name="wk_rim" type="float"><input name="in1" type="float" nodename="kc_64" /><input name="in2" type="float" nodename="kc_on" /></multiply>
<multiply name="kc_66" type="vector2"><input name="in1" type="vector2" nodename="pk_loc" /><input name="in2" type="vector2" value="90.0, 140.0" /></multiply>
<add name="kc_67" type="vector2"><input name="in1" type="vector2" nodename="kc_66" /><input name="in2" type="vector2" value="8.8, 3.1" /></add>
<fractal2d name="kc_wob" type="float"><input name="texcoord" type="vector2" nodename="kc_67" /><input name="amplitude" type="float" value="0.0012" /><input name="octaves" type="integer" value="2" /></fractal2d>
<add name="kc_69" type="float"><input name="in1" type="float" nodename="kc_rho" /><input name="in2" type="float" nodename="kc_wob" /></add>
<divide name="kc_70" type="float"><input name="in1" type="float" nodename="kc_69" /><input name="in2" type="float" value="0.004" /></divide>
<fract name="kc_71" type="float"><input name="in" type="float" nodename="kc_70" /></fract>
<subtract name="kc_72" type="float"><input name="in1" type="float" nodename="kc_71" /><input name="in2" type="float" value="0.5" /></subtract>
<absval name="kc_73" type="float"><input name="in" type="float" nodename="kc_72" /></absval>
<smoothstep name="kc_74" type="float"><input name="in" type="float" nodename="kc_73" /><input name="low" type="float" value="0.22" /><input name="high" type="float" value="0.42" /></smoothstep>
<subtract name="kc_ring" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="kc_74" /></subtract>
<multiply name="kc_76" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" value="0.9" /></multiply>
<multiply name="kc_77" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" value="1.1" /></multiply>
<smoothstep name="kc_78" type="float"><input name="in" type="float" nodename="kc_rho" /><input name="low" type="float" nodename="kc_76" /><input name="high" type="float" nodename="kc_77" /></smoothstep>
<multiply name="kc_79" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" value="1.4" /></multiply>
<multiply name="kc_80" type="float"><input name="in1" type="float" nodename="kc_r" /><input name="in2" type="float" value="2.6" /></multiply>
<smoothstep name="kc_81" type="float"><input name="in" type="float" nodename="kc_rho" /><input name="low" type="float" nodename="kc_79" /><input name="high" type="float" nodename="kc_80" /></smoothstep>
<subtract name="kc_82" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="kc_81" /></subtract>
<multiply name="kc_83" type="float"><input name="in1" type="float" nodename="kc_78" /><input name="in2" type="float" nodename="kc_82" /></multiply>
<multiply name="kc_swirl" type="float"><input name="in1" type="float" nodename="kc_83" /><input name="in2" type="float" nodename="kc_onw" /></multiply>
```

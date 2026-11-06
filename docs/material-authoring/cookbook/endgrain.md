# End-grain wood

End-grain blocks and log slices: ring arcs round an off-block pith, with rays and radial checks. Part of the
[noise cookbook](../NOISE_COOKBOOK.md); the ring profile, uneven widths and colour rules are in [wood.md](wood.md).
Test material: [`cookbook_wood_end`](../noise-lab/cookbook/cookbook_wood_end.mtlx) on the
[running bond](layouts.md#rectangular-grid-and-running-bond) layout, with the
[polar recipe](surfaces.md#polar-features-rays-and-radial-checks) for rays and checks. Its test glue colours oiled oak:
latewood ×(0.55, 0.46, 0.40), earlywood −12%, rays +12%, checks near black and 0.2 mm deep,
latewood 8 µm proud, filler joints 0.4 mm down.

### End-grain ring arcs

On end grain the rings are circles round the pith. Put each block's pith 6–28 cm outside the block (arcs) or, for 15% of
blocks, inside it (full rings and heart checks), warp the radius slightly, and use ring units for everything: phase =
r/spacing + noise(ring index), `floor` for a per-ring random that varies latewood width and strength. Spacing is 1.5–5.5
mm per block. These rings are 1–4 px at `plane`, but arcs of every orientation alias into low-contrast noise rather
than moiré; the test's totem and plane stay clean, so no fade is applied. Rays and radial checks come from the
[polar recipe](surfaces.md#polar-features-rays-and-radial-checks) with `po_rel = eg_rel`. From
[`end-grain-block`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/end-grain-block/gen.py).

```xml
<!-- in: rg_loc, rg_cell (any tile layout). out: eg_rel (m from the pith: feed the polar recipe), eg_fr (ring phase 0..1), eg_lw (latewood, strength varies per ring), eg_ew (earlywood). End grain: 85% of blocks have the pith 6..28 cm away (arcs), 15% inside (full rings); rings warped 2.5 mm at 10 /m, spacing 1.5..5.5 mm per block, +-20% ring to ring -->
<add name="eg_1" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="eg_2" type="float"><input name="texcoord" type="vector2" nodename="eg_1" /></cellnoise2d>
<add name="eg_3" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="213.47, 307.91" /></add>
<cellnoise2d name="eg_4" type="float"><input name="texcoord" type="vector2" nodename="eg_3" /></cellnoise2d>
<add name="eg_5" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="226.57, 315.21000000000004" /></add>
<cellnoise2d name="eg_6" type="float"><input name="texcoord" type="vector2" nodename="eg_5" /></cellnoise2d>
<add name="eg_7" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="239.67000000000002, 322.51" /></add>
<cellnoise2d name="eg_8" type="float"><input name="texcoord" type="vector2" nodename="eg_7" /></cellnoise2d>
<add name="eg_9" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="252.77, 329.81" /></add>
<cellnoise2d name="eg_10" type="float"><input name="texcoord" type="vector2" nodename="eg_9" /></cellnoise2d>
<add name="eg_11" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="265.87, 337.11" /></add>
<cellnoise2d name="eg_12" type="float"><input name="texcoord" type="vector2" nodename="eg_11" /></cellnoise2d>
<add name="eg_13" type="vector2"><input name="in1" type="vector2" nodename="rg_cell" /><input name="in2" type="vector2" value="278.97, 344.41" /></add>
<cellnoise2d name="eg_14" type="float"><input name="texcoord" type="vector2" nodename="eg_13" /></cellnoise2d>
<ifgreater name="eg_far" type="float"><input name="value1" type="float" nodename="eg_4" /><input name="value2" type="float" value="0.15" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="eg_16" type="float"><input name="in1" type="float" nodename="eg_6" /><input name="in2" type="float" value="0.018" /></multiply>
<multiply name="eg_17" type="float"><input name="in1" type="float" nodename="eg_6" /><input name="in2" type="float" value="0.22" /></multiply>
<add name="eg_18" type="float"><input name="in1" type="float" nodename="eg_17" /><input name="in2" type="float" value="0.06" /></add>
<mix name="eg_dist" type="float"><input name="bg" type="float" nodename="eg_16" /><input name="fg" type="float" nodename="eg_18" /><input name="mix" type="float" nodename="eg_far" /></mix>
<multiply name="eg_20" type="float"><input name="in1" type="float" nodename="eg_2" /><input name="in2" type="float" value="360.0" /></multiply>
<rotate2d name="eg_dir" type="vector2"><input name="in" type="vector2" value="1.0, 0.0" /><input name="amount" type="float" nodename="eg_20" /></rotate2d>
<multiply name="eg_22" type="vector2"><input name="in1" type="vector2" nodename="eg_dir" /><input name="in2" type="float" nodename="eg_dist" /></multiply>
<subtract name="eg_rel" type="vector2"><input name="in1" type="vector2" nodename="rg_loc" /><input name="in2" type="vector2" nodename="eg_22" /></subtract>
<combine2 name="eg_24" type="vector2"><input name="in1" type="float" nodename="eg_12" /><input name="in2" type="float" nodename="eg_14" /></combine2>
<multiply name="eg_seed" type="vector2"><input name="in1" type="vector2" nodename="eg_24" /><input name="in2" type="vector2" value="97.0, 61.0" /></multiply>
<multiply name="eg_26" type="vector2"><input name="in1" type="vector2" nodename="eg_rel" /><input name="in2" type="float" value="10.0" /></multiply>
<add name="eg_27" type="vector2"><input name="in1" type="vector2" nodename="eg_26" /><input name="in2" type="vector2" nodename="eg_seed" /></add>
<fractal2d name="eg_wa" type="vector3"><input name="texcoord" type="vector2" nodename="eg_27" /><input name="amplitude" type="vector3" value="0.0025, 0.0025, 0.0" /><input name="octaves" type="integer" value="2" /></fractal2d>
<convert name="eg_29" type="vector2"><input name="in" type="vector3" nodename="eg_wa" /></convert>
<add name="eg_30" type="vector2"><input name="in1" type="vector2" nodename="eg_rel" /><input name="in2" type="vector2" nodename="eg_29" /></add>
<magnitude name="eg_rad" type="float"><input name="in" type="vector2" nodename="eg_30" /></magnitude>
<multiply name="eg_32" type="float"><input name="in1" type="float" nodename="eg_8" /><input name="in2" type="float" nodename="eg_8" /></multiply>
<multiply name="eg_33" type="float"><input name="in1" type="float" nodename="eg_32" /><input name="in2" type="float" value="0.004" /></multiply>
<add name="eg_sp" type="float"><input name="in1" type="float" nodename="eg_33" /><input name="in2" type="float" value="0.0015" /></add>
<divide name="eg_q" type="float"><input name="in1" type="float" nodename="eg_rad" /><input name="in2" type="float" nodename="eg_sp" /></divide>
<multiply name="eg_36" type="float"><input name="in1" type="float" nodename="eg_q" /><input name="in2" type="float" value="0.25" /></multiply>
<multiply name="eg_37" type="float"><input name="in1" type="float" nodename="eg_10" /><input name="in2" type="float" value="71.0" /></multiply>
<combine2 name="eg_38" type="vector2"><input name="in1" type="float" nodename="eg_36" /><input name="in2" type="float" nodename="eg_37" /></combine2>
<fractal2d name="eg_qn" type="float"><input name="texcoord" type="vector2" nodename="eg_38" /><input name="amplitude" type="float" value="0.8" /><input name="octaves" type="integer" value="1" /></fractal2d>
<add name="eg_ph" type="float"><input name="in1" type="float" nodename="eg_q" /><input name="in2" type="float" nodename="eg_qn" /></add>
<floor name="eg_k" type="float"><input name="in" type="float" nodename="eg_ph" /></floor>
<subtract name="eg_fr" type="float"><input name="in1" type="float" nodename="eg_ph" /><input name="in2" type="float" nodename="eg_k" /></subtract>
<multiply name="eg_43" type="float"><input name="in1" type="float" nodename="eg_10" /><input name="in2" type="float" value="500.0" /></multiply>
<add name="eg_44" type="float"><input name="in1" type="float" nodename="eg_43" /><input name="in2" type="float" value="0.37" /></add>
<combine2 name="eg_45" type="vector2"><input name="in1" type="float" nodename="eg_k" /><input name="in2" type="float" nodename="eg_44" /></combine2>
<cellnoise2d name="eg_rr" type="float"><input name="texcoord" type="vector2" nodename="eg_45" /></cellnoise2d>
<multiply name="eg_47" type="float"><input name="in1" type="float" nodename="eg_rr" /><input name="in2" type="float" value="0.25" /></multiply>
<add name="eg_lw0" type="float"><input name="in1" type="float" nodename="eg_47" /><input name="in2" type="float" value="0.42" /></add>
<add name="eg_49" type="float"><input name="in1" type="float" nodename="eg_lw0" /><input name="in2" type="float" value="0.4" /></add>
<smoothstep name="eg_50" type="float"><input name="in" type="float" nodename="eg_fr" /><input name="low" type="float" nodename="eg_lw0" /><input name="high" type="float" nodename="eg_49" /></smoothstep>
<smoothstep name="eg_51" type="float"><input name="in" type="float" nodename="eg_fr" /><input name="low" type="float" value="0.93" /><input name="high" type="float" value="1.0" /></smoothstep>
<subtract name="eg_52" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="eg_51" /></subtract>
<multiply name="eg_53" type="float"><input name="in1" type="float" nodename="eg_50" /><input name="in2" type="float" nodename="eg_52" /></multiply>
<multiply name="eg_54" type="float"><input name="in1" type="float" nodename="eg_rr" /><input name="in2" type="float" value="0.5" /></multiply>
<add name="eg_55" type="float"><input name="in1" type="float" nodename="eg_54" /><input name="in2" type="float" value="0.5" /></add>
<multiply name="eg_lw" type="float"><input name="in1" type="float" nodename="eg_53" /><input name="in2" type="float" nodename="eg_55" /></multiply>
<smoothstep name="eg_57" type="float"><input name="in" type="float" nodename="eg_fr" /><input name="low" type="float" value="0.02" /><input name="high" type="float" value="0.3" /></smoothstep>
<subtract name="eg_ew" type="float"><input name="in1" type="float" value="1.0" /><input name="in2" type="float" nodename="eg_57" /></subtract>
```

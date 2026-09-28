# Plank layouts

Wood-floor layouts: random-length boards, a guaranteed-stagger variant, and variable-width rows. All give the usual
tile-local frame (`*_loc` m from the board centre, x along the grain; `*_id`; `*_d` m to the edge; `*_tile`), which the
[wood recipes](wood.md) read. Part of the [noise cookbook](../NOISE_COOKBOOK.md); see [layouts.md](layouts.md) for the
frame conventions and edge profiles. Test materials: [`cookbook_layouts`](../noise-lab/cookbook/cookbook_layouts.mtlx),
[`cookbook_layouts2`](../noise-lab/cookbook/cookbook_layouts2.mtlx) and [`cookbook_wood`](../noise-lab/cookbook/cookbook_wood.mtlx).
Judge layouts over several metres with `render --view plane --uv-scale 4`.

**Read each joint once** (bug 7). A board spans from its own segment's joint j to the neighbour's n (on either side),
so the board's centre and length are **(j + n)/2 and |n − j|**. Writing them as min/max of the pair reads each joint
twice, and everything downstream (the board frame, knots, rings) copies the whole joint graph again; barnwood-wall went
from 320 s to 13 s of compile with this change. All three layouts here use it: the expanded size of `pk_d` fell from 571
to 311 nodes (random-length), 983 to 529 (stagger) and `vw_d` 571 to 357 (rows), and `cookbook_wood` from 229k to 173k (scaling knots by board length, below, brought it back to 216k),
with pixel-identical `--channel` output for every layout frame.

### Random-length planks

Wood flooring: fixed rows, and one butt joint per segment S = (Lmin+Lmax)/2 at a random 0.25..0.75 of it, so
consecutive joints are Lmin..Lmax apart (triangular, mean S). Each pixel reads two hashes: its segment's joint and the
neighbour on the far side. Measured over 302 boards: 0.43..1.08 m (p0..p95), median 0.79 m. Adjacent-row joints can
land close together (real floors keep ≥ 15 cm); for a guarantee use the [stagger](#guaranteed-stagger-planks) variant.

```xml
<!-- in: uv_sep. out: pk_loc (board-local m, centred; x along, y across), pk_id (0..1 per board), pk_lm (board length, m), pk_d (m to the board edge), pk_tile. Rows 125 mm, boards 0.4..1.2 m (triangular, mean 0.8), 1 mm joints. One butt joint per 0.8 m segment at 0.25..0.75 of it, so lengths = SEG + j(k+1) - j(k) stay in Lmin..Lmax; joints are random per row, and each row shifts its segment grid by fract(row*0.618) (pk_sh) so joints spread evenly. Each joint is read once: centre (j+n)/2 and length |n-j|, not min/max (bug 7) -->
<divide name="pk_v" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" value="0.125" /></divide>
<floor name="pk_row" type="float"><input name="in" type="float" nodename="pk_v" /></floor>
<subtract name="pk_fv" type="float"><input name="in1" type="float" nodename="pk_v" /><input name="in2" type="float" nodename="pk_row" /></subtract>
<multiply name="pk_sh0" type="float"><input name="in1" type="float" nodename="pk_row" /><input name="in2" type="float" value="0.618" /></multiply>
<fract name="pk_sh" type="float"><input name="in" type="float" nodename="pk_sh0" /></fract>
<divide name="pk_x0" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="0.8" /></divide>
<add name="pk_x" type="float"><input name="in1" type="float" nodename="pk_x0" /><input name="in2" type="float" nodename="pk_sh" /></add>
<floor name="pk_k" type="float"><input name="in" type="float" nodename="pk_x" /></floor>
<subtract name="pk_fx" type="float"><input name="in1" type="float" nodename="pk_x" /><input name="in2" type="float" nodename="pk_k" /></subtract>
<combine2 name="pk_kr" type="vector2"><input name="in1" type="float" nodename="pk_k" /><input name="in2" type="float" nodename="pk_row" /></combine2>
<add name="pk_js" type="vector2"><input name="in1" type="vector2" nodename="pk_kr" /><input name="in2" type="vector2" value="11.37, 5.61" /></add>
<cellnoise2d name="pk_jr" type="float"><input name="texcoord" type="vector2" nodename="pk_js" /></cellnoise2d>
<multiply name="pk_j0" type="float"><input name="in1" type="float" nodename="pk_jr" /><input name="in2" type="float" value="0.5" /></multiply>
<add name="pk_j" type="float"><input name="in1" type="float" nodename="pk_j0" /><input name="in2" type="float" value="0.25" /></add>
<ifgreater name="pk_right" type="float"><input name="value1" type="float" nodename="pk_fx" /><input name="value2" type="float" nodename="pk_j" /><input name="in1" type="float" value="1" /><input name="in2" type="float" value="0" /></ifgreater>
<multiply name="pk_s2" type="float"><input name="in1" type="float" nodename="pk_right" /><input name="in2" type="float" value="2" /></multiply>
<subtract name="pk_sg" type="float"><input name="in1" type="float" nodename="pk_s2" /><input name="in2" type="float" value="1" /></subtract>
<add name="pk_kn" type="float"><input name="in1" type="float" nodename="pk_k" /><input name="in2" type="float" nodename="pk_sg" /></add>
<combine2 name="pk_knr" type="vector2"><input name="in1" type="float" nodename="pk_kn" /><input name="in2" type="float" nodename="pk_row" /></combine2>
<add name="pk_ns" type="vector2"><input name="in1" type="vector2" nodename="pk_knr" /><input name="in2" type="vector2" value="11.37, 5.61" /></add>
<cellnoise2d name="pk_nr" type="float"><input name="texcoord" type="vector2" nodename="pk_ns" /></cellnoise2d>
<multiply name="pk_n0" type="float"><input name="in1" type="float" nodename="pk_nr" /><input name="in2" type="float" value="0.5" /></multiply>
<add name="pk_n1" type="float"><input name="in1" type="float" nodename="pk_n0" /><input name="in2" type="float" nodename="pk_sg" /></add>
<add name="pk_n" type="float"><input name="in1" type="float" nodename="pk_n1" /><input name="in2" type="float" value="0.25" /></add>
<add name="pk_m2" type="float"><input name="in1" type="float" nodename="pk_j" /><input name="in2" type="float" nodename="pk_n" /></add>
<multiply name="pk_mid" type="float"><input name="in1" type="float" nodename="pk_m2" /><input name="in2" type="float" value="0.5" /></multiply>
<subtract name="pk_dj" type="float"><input name="in1" type="float" nodename="pk_n" /><input name="in2" type="float" nodename="pk_j" /></subtract>
<absval name="pk_len" type="float"><input name="in" type="float" nodename="pk_dj" /></absval>
<multiply name="pk_lm" type="float"><input name="in1" type="float" nodename="pk_len" /><input name="in2" type="float" value="0.8" /></multiply>
<subtract name="pk_a0" type="float"><input name="in1" type="float" nodename="pk_fx" /><input name="in2" type="float" nodename="pk_mid" /></subtract>
<subtract name="pk_c0" type="float"><input name="in1" type="float" nodename="pk_fv" /><input name="in2" type="float" value="0.5" /></subtract>
<combine2 name="pk_ac" type="vector2"><input name="in1" type="float" nodename="pk_a0" /><input name="in2" type="float" nodename="pk_c0" /></combine2>
<multiply name="pk_loc" type="vector2"><input name="in1" type="vector2" nodename="pk_ac" /><input name="in2" type="vector2" value="0.8, 0.125" /></multiply>
<multiply name="pk_hl0" type="float"><input name="in1" type="float" nodename="pk_lm" /><input name="in2" type="float" value="0.5" /></multiply>
<combine2 name="pk_half" type="vector2"><input name="in1" type="float" nodename="pk_hl0" /><input name="in2" type="float" value="0.0625" /></combine2>
<absval name="pk_abs" type="vector2"><input name="in" type="vector2" nodename="pk_loc" /></absval>
<subtract name="pk_e0" type="vector2"><input name="in1" type="vector2" nodename="pk_half" /><input name="in2" type="vector2" nodename="pk_abs" /></subtract>
<subtract name="pk_e" type="vector2"><input name="in1" type="vector2" nodename="pk_e0" /><input name="in2" type="float" value="0.0005" /></subtract>
<separate2 name="pk_es" type="multioutput"><input name="in" type="vector2" nodename="pk_e" /></separate2>
<min name="pk_d" type="float"><input name="in1" type="float" nodename="pk_es" output="outx" /><input name="in2" type="float" nodename="pk_es" output="outy" /></min>
<add name="pk_b" type="float"><input name="in1" type="float" nodename="pk_k" /><input name="in2" type="float" nodename="pk_right" /></add>
<combine2 name="pk_cell" type="vector2"><input name="in1" type="float" nodename="pk_b" /><input name="in2" type="float" nodename="pk_row" /></combine2>
<add name="pk_seed" type="vector2"><input name="in1" type="vector2" nodename="pk_cell" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="pk_id" type="float"><input name="texcoord" type="vector2" nodename="pk_seed" /></cellnoise2d>
<smoothstep name="pk_tile" type="float"><input name="in" type="float" nodename="pk_d" /><input name="low" type="float" value="-0.00025" /><input name="high" type="float" value="0.00025" /></smoothstep>
```

**Any length range Lmin..Lmax:** segment S = (Lmin + Lmax)/2 and joint window JW = (Lmax − Lmin)/(2S), with JW ≤ 1.
The joint sits at `0.5 − JW/2 + JW·rand` of its segment (`pk_j0`/`pk_n0` multiply by JW, `pk_j`/`pk_n1` add
0.5 − JW/2), and lengths are S(1 ± JW). In the snippet S = 0.8 appears in `pk_x0`, `pk_loc` and `pk_lm`, JW = 0.5
in `pk_j0` and `pk_n0`, 0.25 in `pk_j` and `pk_n`, and the row pitch in `pk_v`, `pk_loc` and `pk_half`. `pk_lm` is the
board length in metres (S·|n − j|).

**Per-row shift:** `pk_sh = fract(row·0.618)` offsets each row's segment grid by the golden ratio, so joints in
neighbouring rows spread evenly along the floor instead of clustering where the random joints of two rows happen to
line up. It doesn't guarantee a stagger (rows k and k + 13 nearly coincide); use the [stagger](#guaranteed-stagger-planks)
variant for that. The joint hashes are keyed on (segment, row), so the shift changes nothing else.

### Guaranteed-stagger planks

A drop-in replacement with the same outputs (plus `pk_lm`, the board length in m). Odd rows shift the segment grid by
half a segment and the joint window is w < 0.5 centred in the segment, so joints in neighbouring rows are always at
least **S(0.5 − w)** apart, and lengths are **S(1 ± w)**. The cost is range: here S = 1.2, w = 0.42 gives 0.70–1.70 m
boards with ≥ 96 mm stagger; the 0.6–1.8 m that a random layout allows needs w = 0.5, which gives zero stagger. Pick w
from the stagger you need, then S from the mean length. From [`oak-plank`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/oak-plank/gen.py).

```xml
<!-- in: uv_sep. out: pk_loc (board-local m, centred; x along, y across), pk_cell, pk_id, pk_lm (board length, m), pk_d (m to the board edge), pk_tile. Same outputs as the random-length planks, so it drops in. Rows 180 mm; segment S = 1.2 m, joint window w = 0.42: lengths S(1 +- w) = 0.70..1.70 m; odd rows shift half a segment, so neighbouring joints are always >= S(0.5 - w) = 96 mm apart; 1 mm joints -->
<divide name="pk_v" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" value="0.18" /></divide>
<floor name="pk_row" type="float"><input name="in" type="float" nodename="pk_v" /></floor>
<subtract name="pk_fv" type="float"><input name="in1" type="float" nodename="pk_v" /><input name="in2" type="float" nodename="pk_row" /></subtract>
<modulo name="pk_par" type="float"><input name="in1" type="float" nodename="pk_row" /><input name="in2" type="float" value="2.0" /></modulo>
<divide name="pk_5" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="1.2" /></divide>
<multiply name="pk_6" type="float"><input name="in1" type="float" nodename="pk_par" /><input name="in2" type="float" value="0.5" /></multiply>
<add name="pk_x" type="float"><input name="in1" type="float" nodename="pk_5" /><input name="in2" type="float" nodename="pk_6" /></add>
<floor name="pk_k" type="float"><input name="in" type="float" nodename="pk_x" /></floor>
<subtract name="pk_fx" type="float"><input name="in1" type="float" nodename="pk_x" /><input name="in2" type="float" nodename="pk_k" /></subtract>
<combine2 name="pk_10" type="vector2"><input name="in1" type="float" nodename="pk_k" /><input name="in2" type="float" nodename="pk_row" /></combine2>
<add name="pk_11" type="vector2"><input name="in1" type="vector2" nodename="pk_10" /><input name="in2" type="vector2" value="11.37, 5.61" /></add>
<cellnoise2d name="pk_12" type="float"><input name="texcoord" type="vector2" nodename="pk_11" /></cellnoise2d>
<multiply name="pk_13" type="float"><input name="in1" type="float" nodename="pk_12" /><input name="in2" type="float" value="0.42" /></multiply>
<add name="pk_j" type="float"><input name="in1" type="float" nodename="pk_13" /><input name="in2" type="float" value="0.29" /></add>
<ifgreater name="pk_right" type="float"><input name="value1" type="float" nodename="pk_fx" /><input name="value2" type="float" nodename="pk_j" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="pk_16" type="float"><input name="in1" type="float" nodename="pk_right" /><input name="in2" type="float" value="2.0" /></multiply>
<subtract name="pk_sg" type="float"><input name="in1" type="float" nodename="pk_16" /><input name="in2" type="float" value="1.0" /></subtract>
<add name="pk_18" type="float"><input name="in1" type="float" nodename="pk_k" /><input name="in2" type="float" nodename="pk_sg" /></add>
<combine2 name="pk_19" type="vector2"><input name="in1" type="float" nodename="pk_18" /><input name="in2" type="float" nodename="pk_row" /></combine2>
<add name="pk_20" type="vector2"><input name="in1" type="vector2" nodename="pk_19" /><input name="in2" type="vector2" value="11.37, 5.61" /></add>
<cellnoise2d name="pk_21" type="float"><input name="texcoord" type="vector2" nodename="pk_20" /></cellnoise2d>
<multiply name="pk_22" type="float"><input name="in1" type="float" nodename="pk_21" /><input name="in2" type="float" value="0.42" /></multiply>
<add name="pk_n0" type="float"><input name="in1" type="float" nodename="pk_22" /><input name="in2" type="float" value="0.29" /></add>
<add name="pk_n" type="float"><input name="in1" type="float" nodename="pk_n0" /><input name="in2" type="float" nodename="pk_sg" /></add>
<add name="pk_25" type="float"><input name="in1" type="float" nodename="pk_j" /><input name="in2" type="float" nodename="pk_n" /></add>
<multiply name="pk_mid" type="float"><input name="in1" type="float" nodename="pk_25" /><input name="in2" type="float" value="0.5" /></multiply>
<subtract name="pk_27" type="float"><input name="in1" type="float" nodename="pk_n" /><input name="in2" type="float" nodename="pk_j" /></subtract>
<absval name="pk_28" type="float"><input name="in" type="float" nodename="pk_27" /></absval>
<multiply name="pk_lm" type="float"><input name="in1" type="float" nodename="pk_28" /><input name="in2" type="float" value="1.2" /></multiply>
<subtract name="pk_30" type="float"><input name="in1" type="float" nodename="pk_fx" /><input name="in2" type="float" nodename="pk_mid" /></subtract>
<multiply name="pk_31" type="float"><input name="in1" type="float" nodename="pk_30" /><input name="in2" type="float" value="1.2" /></multiply>
<subtract name="pk_32" type="float"><input name="in1" type="float" nodename="pk_fv" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="pk_33" type="float"><input name="in1" type="float" nodename="pk_32" /><input name="in2" type="float" value="0.18" /></multiply>
<combine2 name="pk_loc" type="vector2"><input name="in1" type="float" nodename="pk_31" /><input name="in2" type="float" nodename="pk_33" /></combine2>
<multiply name="pk_35" type="float"><input name="in1" type="float" nodename="pk_lm" /><input name="in2" type="float" value="0.5" /></multiply>
<combine2 name="pk_half" type="vector2"><input name="in1" type="float" nodename="pk_35" /><input name="in2" type="float" value="0.09" /></combine2>
<absval name="pk_37" type="vector2"><input name="in" type="vector2" nodename="pk_loc" /></absval>
<subtract name="pk_38" type="vector2"><input name="in1" type="vector2" nodename="pk_half" /><input name="in2" type="vector2" nodename="pk_37" /></subtract>
<subtract name="pk_e" type="vector2"><input name="in1" type="vector2" nodename="pk_38" /><input name="in2" type="float" value="0.0005" /></subtract>
<separate2 name="pk_es" type="multioutput"><input name="in" type="vector2" nodename="pk_e" /></separate2>
<min name="pk_d" type="float"><input name="in1" type="float" nodename="pk_es" output="outx" /><input name="in2" type="float" nodename="pk_es" output="outy" /></min>
<add name="pk_42" type="float"><input name="in1" type="float" nodename="pk_k" /><input name="in2" type="float" nodename="pk_right" /></add>
<combine2 name="pk_cell" type="vector2"><input name="in1" type="float" nodename="pk_42" /><input name="in2" type="float" nodename="pk_row" /></combine2>
<add name="pk_44" type="vector2"><input name="in1" type="vector2" nodename="pk_cell" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="pk_id" type="float"><input name="texcoord" type="vector2" nodename="pk_44" /></cellnoise2d>
<smoothstep name="pk_tile" type="float"><input name="in" type="float" nodename="pk_d" /><input name="low" type="float" value="-0.00025" /><input name="high" type="float" value="0.00025" /></smoothstep>
```

### Variable-width rows

The plank trick along V: one row joint per segment S at a random 0.5 ± JW/2 of it, so each row is S(1 ± JW) wide, here
150–250 mm. `vw_c` is metres across from the row centre and `vw_w` the row width, so a cup or crown profile uses
`vw_c/(vw_w/2)`. Boards along each row are 1.2 m, shifted by a random per row; for random lengths run the plank logic
with `vw_row` as its row index. From [`reclaimed-pine`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/reclaimed-pine/gen.py).

```xml
<!-- in: uv_sep. out: vw_loc (board-local m, centred), vw_w (row width, m), vw_row, vw_cell, vw_id, vw_d, vw_tile. Variable-width rows: the plank trick along V, one row joint per S = 0.2 m segment at 0.375..0.625 of it, so widths are S(1 +- JW) = 150..250 mm. Boards 1.2 m long along U, shifted by a random per row. 1 mm joints -->
<divide name="vw_v" type="float"><input name="in1" type="float" nodename="uv_sep" output="outy" /><input name="in2" type="float" value="0.2" /></divide>
<floor name="vw_rk" type="float"><input name="in" type="float" nodename="vw_v" /></floor>
<subtract name="vw_fv" type="float"><input name="in1" type="float" nodename="vw_v" /><input name="in2" type="float" nodename="vw_rk" /></subtract>
<combine2 name="vw_4" type="vector2"><input name="in1" type="float" nodename="vw_rk" /><input name="in2" type="float" value="3.0" /></combine2>
<add name="vw_5" type="vector2"><input name="in1" type="vector2" nodename="vw_4" /><input name="in2" type="vector2" value="11.37, 5.61" /></add>
<cellnoise2d name="vw_6" type="float"><input name="texcoord" type="vector2" nodename="vw_5" /></cellnoise2d>
<multiply name="vw_7" type="float"><input name="in1" type="float" nodename="vw_6" /><input name="in2" type="float" value="0.25" /></multiply>
<add name="vw_j" type="float"><input name="in1" type="float" nodename="vw_7" /><input name="in2" type="float" value="0.375" /></add>
<ifgreater name="vw_up" type="float"><input name="value1" type="float" nodename="vw_fv" /><input name="value2" type="float" nodename="vw_j" /><input name="in1" type="float" value="1.0" /><input name="in2" type="float" value="0.0" /></ifgreater>
<multiply name="vw_10" type="float"><input name="in1" type="float" nodename="vw_up" /><input name="in2" type="float" value="2.0" /></multiply>
<subtract name="vw_sg" type="float"><input name="in1" type="float" nodename="vw_10" /><input name="in2" type="float" value="1.0" /></subtract>
<add name="vw_12" type="float"><input name="in1" type="float" nodename="vw_rk" /><input name="in2" type="float" nodename="vw_sg" /></add>
<combine2 name="vw_13" type="vector2"><input name="in1" type="float" nodename="vw_12" /><input name="in2" type="float" value="3.0" /></combine2>
<add name="vw_14" type="vector2"><input name="in1" type="vector2" nodename="vw_13" /><input name="in2" type="vector2" value="11.37, 5.61" /></add>
<cellnoise2d name="vw_15" type="float"><input name="texcoord" type="vector2" nodename="vw_14" /></cellnoise2d>
<multiply name="vw_16" type="float"><input name="in1" type="float" nodename="vw_15" /><input name="in2" type="float" value="0.25" /></multiply>
<add name="vw_n0" type="float"><input name="in1" type="float" nodename="vw_16" /><input name="in2" type="float" value="0.375" /></add>
<add name="vw_n" type="float"><input name="in1" type="float" nodename="vw_n0" /><input name="in2" type="float" nodename="vw_sg" /></add>
<subtract name="vw_19" type="float"><input name="in1" type="float" nodename="vw_n" /><input name="in2" type="float" nodename="vw_j" /></subtract>
<absval name="vw_20" type="float"><input name="in" type="float" nodename="vw_19" /></absval>
<multiply name="vw_w" type="float"><input name="in1" type="float" nodename="vw_20" /><input name="in2" type="float" value="0.2" /></multiply>
<add name="vw_row" type="float"><input name="in1" type="float" nodename="vw_rk" /><input name="in2" type="float" nodename="vw_up" /></add>
<add name="vw_23" type="float"><input name="in1" type="float" nodename="vw_j" /><input name="in2" type="float" nodename="vw_n" /></add>
<multiply name="vw_24" type="float"><input name="in1" type="float" nodename="vw_23" /><input name="in2" type="float" value="0.5" /></multiply>
<subtract name="vw_25" type="float"><input name="in1" type="float" nodename="vw_fv" /><input name="in2" type="float" nodename="vw_24" /></subtract>
<multiply name="vw_c" type="float"><input name="in1" type="float" nodename="vw_25" /><input name="in2" type="float" value="0.2" /></multiply>
<divide name="vw_27" type="float"><input name="in1" type="float" nodename="uv_sep" output="outx" /><input name="in2" type="float" value="1.2" /></divide>
<combine2 name="vw_28" type="vector2"><input name="in1" type="float" nodename="vw_row" /><input name="in2" type="float" value="7.0" /></combine2>
<add name="vw_29" type="vector2"><input name="in1" type="vector2" nodename="vw_28" /><input name="in2" type="vector2" value="3.37, 1.61" /></add>
<cellnoise2d name="vw_30" type="float"><input name="texcoord" type="vector2" nodename="vw_29" /></cellnoise2d>
<add name="vw_bx" type="float"><input name="in1" type="float" nodename="vw_27" /><input name="in2" type="float" nodename="vw_30" /></add>
<floor name="vw_bk" type="float"><input name="in" type="float" nodename="vw_bx" /></floor>
<subtract name="vw_33" type="float"><input name="in1" type="float" nodename="vw_bx" /><input name="in2" type="float" nodename="vw_bk" /></subtract>
<subtract name="vw_34" type="float"><input name="in1" type="float" nodename="vw_33" /><input name="in2" type="float" value="0.5" /></subtract>
<multiply name="vw_35" type="float"><input name="in1" type="float" nodename="vw_34" /><input name="in2" type="float" value="1.2" /></multiply>
<combine2 name="vw_loc" type="vector2"><input name="in1" type="float" nodename="vw_35" /><input name="in2" type="float" nodename="vw_c" /></combine2>
<multiply name="vw_37" type="float"><input name="in1" type="float" nodename="vw_w" /><input name="in2" type="float" value="0.5" /></multiply>
<combine2 name="vw_half" type="vector2"><input name="in1" type="float" value="0.6" /><input name="in2" type="float" nodename="vw_37" /></combine2>
<absval name="vw_39" type="vector2"><input name="in" type="vector2" nodename="vw_loc" /></absval>
<subtract name="vw_40" type="vector2"><input name="in1" type="vector2" nodename="vw_half" /><input name="in2" type="vector2" nodename="vw_39" /></subtract>
<subtract name="vw_e" type="vector2"><input name="in1" type="vector2" nodename="vw_40" /><input name="in2" type="float" value="0.0005" /></subtract>
<separate2 name="vw_es" type="multioutput"><input name="in" type="vector2" nodename="vw_e" /></separate2>
<min name="vw_d" type="float"><input name="in1" type="float" nodename="vw_es" output="outx" /><input name="in2" type="float" nodename="vw_es" output="outy" /></min>
<combine2 name="vw_cell" type="vector2"><input name="in1" type="float" nodename="vw_bk" /><input name="in2" type="float" nodename="vw_row" /></combine2>
<add name="vw_45" type="vector2"><input name="in1" type="vector2" nodename="vw_cell" /><input name="in2" type="vector2" value="200.37, 300.61" /></add>
<cellnoise2d name="vw_id" type="float"><input name="texcoord" type="vector2" nodename="vw_45" /></cellnoise2d>
<smoothstep name="vw_tile" type="float"><input name="in" type="float" nodename="vw_d" /><input name="low" type="float" value="-0.00025" /><input name="high" type="float" value="0.00025" /></smoothstep>
```

**Knots scale with the board.** A fixed knot window (±15 cm) leaves long boards knot-free at the ends and pushes knots
off short ones. The [knot recipe](wood.md#knots-with-deflected-grain) places a knot at (rand − 0.5)·(`pk_lm` − 0.25) along
the board, so knots can sit anywhere but the last 12.5 cm of each end on any length; feed `pk_lm` from whichever layout
you use.

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
@@lay_plank@@

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
@@lay_stagger@@

### Variable-width rows

The plank trick along V: one row joint per segment S at a random 0.5 ± JW/2 of it, so each row is S(1 ± JW) wide, here
150–250 mm. `vw_c` is metres across from the row centre and `vw_w` the row width, so a cup or crown profile uses
`vw_c/(vw_w/2)`. Boards along each row are 1.2 m, shifted by a random per row; for random lengths run the plank logic
with `vw_row` as its row index. From [`reclaimed-pine`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/reclaimed-pine/gen.py).
@@lay_rows@@

**Knots scale with the board.** A fixed knot window (±15 cm) leaves long boards knot-free at the ends and pushes knots
off short ones. The [knot recipe](wood.md#knots-with-deflected-grain) places a knot at (rand − 0.5)·(`pk_lm` − 0.25) along
the board, so knots can sit anywhere but the last 12.5 cm of each end on any length; feed `pk_lm` from whichever layout
you use.

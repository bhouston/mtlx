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
@@prof_mould@@

**Cove flutes** are the concave version: a circular cove of half-width A and depth S has radius
RC = (A² + S²)/2S and h = (RC − S) − sqrt(RC² − min(x², A²)). Its wall at the arris is asin(A/RC): 43.6° for
20 × 4 mm, which renders cleanly with a ~6 px ramp at `closeup`. Make the panel width a whole number of pitches plus a
half, so panel edges land on a land. `fl_dh` (dh/dx) feeds the [relief-aware ring fade](grain.md#relief-aware-ring-frequency).
At room scale (`--uv-scale 4`) 22 mm flutes are ~4.4 px apart, near moiré; judge periodic relief at the farthest view
that must look clean.
@@prof_cove@@

### Recessed or raised panel step

Frame-and-panel: d = max(|x| − HX, |y| − HY) is the distance to the panel outline (square, mitred contours). The wall
is d·S, rounded at the top by a cubic smooth min with 0 (the arris) and at the bottom by a quadratic smooth max with −D
(the fillet). Here S = 2 (63°) over a 4 mm ramp: that is ~10 px at `closeup`, which is why it can be steeper than the
45° guideline and still render cleanly. For a **raised** panel, negate d (the field is proud, the frame is the floor).
`ps_corner` darkens the inside corner (thicker paint, occlusion).

**Seed per member, not per layout cell.** Stiles run the full height, and rails cross panel-cell edges, so a
per-cell random puts a tone step in the middle of a member. Key stiles on their column, `floor(u/PU + 0.5)`, rails on
(panel column, rail row `floor(v/PV + 0.5)`), and panels on the cell (`ps_tone`).
@@prof_step@@

### Large raised step: batten or trim

Steps of 10–20 mm need a face near 55° and must still have continuous curvature at the toe and the arris. Build the
side as the **integral of a smoothstep-shaped slope**: slope(x) = SMAX·smoothstep(x/C)·(1 − smoothstep((x − W + E)/E)),
whose integral is analytic with I(t) = tc³ − tc⁴/2 + max(t − 1, 0), tc = clamp(t). Normalised by its plateau,
W − C/2 − E/2, it gives `bt_m` (0 on the board, 1 on the batten top), so the height is H·m. The footprint is
**W ≈ H/tan(θ) + (fillet + ease)/2**: 16.8 mm for 19 mm at 55° with a 4.5 mm caulk fillet C and a 2.5 mm eased arris E.
A 50–60° face renders cleanly when the ramp is ≥ 4 px at the farthest view (~9 px at `plane` here). `bt_ao` darkens
the board beside the toe.
@@prof_batten@@

### Raised element over a varying base

Compose with **h = H·m + h_base·(1 − m)**, not h_base + H·m. Added on top, the batten inherits the base's slope, which
changes sign under the batten side (a cupped board is lowest mid-board and 0 at the seam) and creases there. The mix
also hides base detail (grain, stipple) under the batten; add the batten's own texture times its mask.
@@prof_over@@

### Deep channels and albedo AO

A reveal or slat gap deeper than it is wide has vertical walls that no slope budget can model. Keep the height a
ramped profile of a few millimetres (here 4 mm over 6.3 mm, ~43°) and put the depth into **albedo**: darken the channel
floor toward the walls (×0.4 at the wall to ×1 mid-channel), a baked ambient-occlusion term, and shade the side walls
darker than the face. Without it the channel reads as a painted stripe. Dark felt needs roughness 1 and `specular`
~0.2, or it shows a grey Fresnel sheen at grazing angles.
@@prof_channel@@

### Bows that vanish at the joints

Per-board unevenness must not step at a joint, whatever the two boards' randoms are. Multiply each board's random
amplitude by a shape that is 0 at both edges: **sin(πx/L)** for a bow (or cup) and sin(2πx/L) for a twist, with x
from 0 to L across the board. Add slow noise along the board to the amplitude so boards also wind along their
length. Unlike the (x/L)² cup of [board-batten](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/board-batten/gen.py), the sine is not 0-slope at the joint, so
neighbours meet at a small crease, as real boards do.
@@prof_bow@@

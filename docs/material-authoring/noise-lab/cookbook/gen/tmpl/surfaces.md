# Surface recipes

Strokes, bands, veins, scuffs, scoops, polar features and dents: marks on top of a surface or tile. Part of the
[noise cookbook](../NOISE_COOKBOOK.md). Test materials: [`cookbook_misc`](../noise-lab/cookbook/cookbook_misc.mtlx),
[`cookbook_surface`](../noise-lab/cookbook/cookbook_surface.mtlx),
[`cookbook_surface2`](../noise-lab/cookbook/cookbook_surface2.mtlx) and [`cookbook_wood2`](../noise-lab/cookbook/cookbook_wood2.mtlx)
(kerf marks, whitewash and checks on the [pine rows](grain.md#pine-latewood-profile), bottom quadrants).

### Broom or brushed strokes

Stretched noise used directly as height: 30 cm strokes, 3 mm apart, ~4°. `sin` stripes read as machined corduroy, and
`smoothstep(noise)` grooves show only as edge hairlines.
@@broom@@

### Per-band randoms

One random per band, with a distinct seed (the `combine2` constant) per parameter. The borders are height steps and
show dashed seams, so fade the height near borders. `bandbroom` rotates and presses the strokes per band. For bands
without seams or a faded stripe, use [cross-faded bands](weathering.md#cross-faded-bands).
@@bands@@
@@bandbroom@@

### Marble veins

Core, halo and hairlines from `|fBm|` contours on warped slab coords. **Width vs octaves:** at a fixed t the core
`|fBm| < t/2` covers ≈ t of the area at any octave count (the density of fBm at 0 is ≈ 1.1), but each octave lengthens
the contour (≈ √N), so more octaves make veins thinner and busier, not sparser: t = 0.02 at 10/m across is ≈ 1 mm at
5–7 oct. Reads as drawn: uniform width, hard edges, dashes from a sharp taper, grain added to |v| (hatching), warp
s > 0.1 (squiggles). Instead: taper over ~35 cm, wobble t at 90/m, soften the core, vary pigment, patchy one-sided halo.
@@veins@@

### Sparse scuffs and scratches

A high threshold (n > 0.55) gives separate marks, not a hatch. Each direction lives in its own presence patches, so
two directions rarely cross; a low threshold or no presence mask gives a regular crosshatch. Mostly roughness and colour.
@@scuffs@@

### Paraboloid-dish scoops

Hand-scraped or adzed wood, and hammered metal: each worley cell is a dish D·(smin(F1², F2²)/R² − 1), so neighbours
meet in scalloped ridges and the smooth min rounds the crest. The depth D must come from a **continuous** field; a
per-cell depth steps at every border. Cells are stretched 2:1 across the grain (draw-knife scoops, 22 × 45 mm), with a
4° turn so rows don't line up. `sc_pool` darkens the hollows (finish pools there) and `sc_crest` roughens the ridges.
For **hammered metal** use isotropic cells (`uv·30`), D ≈ 0.1–0.2 mm and metalness 1, and leave out the crest mask: it
draws a bright Voronoi web on the sphere (checked in a scratch render). From [`hickory-handscraped`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/hickory-handscraped/gen.py).
@@scoops@@

### Polar features: rays and radial checks

Features around a point come from `atan2` and r = |p − c|. Rays are noise across the angle (θ·40, so r/40 apart) and
stretched along r. Checks use angular sectors: `floor(θ·N/2π)` picks a sector, its randoms set an angle θc, a length and
a centre radius, and the width test uses the **perpendicular distance r·(θ − θc)**, not the angle, so checks don't
widen with r. The wobble is added to the signed offset before `absval` (after it, the check breaks into beads), and the
width taper is gated by `smoothstep(w, 2e-5, 6e-5)` so no hairline remains at the floor. The sector seam at θ = ±π is a
sector border, so nothing crosses it. `po_seed` must differ per centre (the end-grain test passes `rg_id·613`). From
[`end-grain-block`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/end-grain-block/gen.py).
@@polar@@

### Crisp-rim dents

Impact dents read as dents only with a sharp rim and a flatter floor: `1 − smoothstep(t, 0.45, 1)`, t = F1/r. A
(1 − t²) bowl (the pits profile) has no flat floor and a soft rim; at reclaimed-pine's scale it read as a raised dome under
bridge. The test's bottom-right quadrant renders the same dents as bowls for comparison; there the difference is small,
so flip the height sign once to check which reads as a dent at your scale. Darken and roughen the dent a little as
well. For air voids and bug holes in concrete, see [voids](aggregate.md#air-voids-and-bug-holes). From [`reclaimed-pine`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/reclaimed-pine/gen.py).
@@dents@@

### Rough-sawn kerf marks

Band-saw marks are straight, irregular lines across the grain, 3–5 mm apart. Stretch noise along the kerf line
(texcoord x·200..300, y·5, in a frame turned ±4° per board) and use it directly as height (0.14 mm); the kerf grooves
are its **zero crossings, `1 − smoothstep(|n|, 0, 0.22)`**, about 1 mm wide (−0.06 mm). Put the wobble on the signed
noise, never after `absval` (gotcha 15). A presence field makes the marks patchy. Circular-saw arcs (barnwood) bend the
along coordinate by +k·across² instead. From [`shiplap-whitewash`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/shiplap-whitewash/gen.py).
@@surf_kerf@@

### Translucent wash or stain pooling

Whitewash, liming and pickling stains are translucent: mix the wash colour over the wood by a **coverage built from the
same layers as the relief**, so it pools in the valleys and thins on the ridges. Coverage = per-board level + brushy
patches + valleys (earlywood, kerf grooves) − ridges (latewood, saw crests), clamped to 0.03..0.95 so the wood always
shows a little. The raw coverage reads as a stain; a constant mix reads as paint. Judge near-white finishes under
`--ibl neutral -e -1` (bridge and sun turn them yellow, overcast cool).
@@surf_wash@@

### Along-grain checks: per-band slits

Drying and weather checks run straight along the grain and taper to points. Contours of 2-D noise zigzag across the
lattice rows instead. Cut the across-grain coordinate into bands (9 mm here), wobble the band lines gently, and draw a
slit on each band's centre line whose half-width follows a per-band noise along the grain above a per-band threshold:
the width tapers to 0 at both ends, and the `smoothstep(w, 0.01, 0.03)` gate removes the hairline where the width is
at its floor (gotcha 16). For fine surface checking run a second, narrower band set (3.5 mm). Checks are 1.2 mm deep,
dark and rough. From [`barnwood-wall`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/barnwood-wall/gen.py).
@@surf_checks@@

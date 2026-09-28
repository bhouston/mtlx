# Noise recipes

Smooth-noise building blocks: remapping, warps, stretch, ridges, terraces, layering with a slope budget, correlated
masks, smooth max and finite differences. Part of the [noise cookbook](../NOISE_COOKBOOK.md); read its cheat sheet and
gotchas first. Test materials: [`cookbook_smooth`](../noise-lab/cookbook/cookbook_smooth.mtlx) and
[`cookbook_misc`](../noise-lab/cookbook/cookbook_misc.mtlx).

### Height to normal (always last)

@@normal@@

### Decorrelated layers

A private frequency **and** offset per layer (no shared zeros or grid).
@@decorrelate@@

### Remap to 0..1

Measured p5..p95: `n01` 0.07..0.92, `fbm01` 0.12..0.86, and `u_fbm01` 0.25..0.75. Add `clamp` if an input must stay
in 0..1.
@@remap@@
@@unified@@

### True 2D domain warp (vector3)

Bends shapes without folding; here s = 0.03·6 = 0.18. For a fractal warp, halve A.
@@warp@@

### Anisotropic stretch

The size along each axis is 0.7/f, so `(3, 60)` gives streaks 23 cm × 1.2 cm. Add a `rotate2d` before the multiply for
other directions.
@@aniso@@

### Ridged and billow

Ridged gives sharp crests (0..0.5); billow gives puffs with V-creases (mean ≈ 0.29). Both have fBm slope (the test
uses ×4 mm at 8/m).
@@ridged@@

### Terraces

The riser spans the top half of each step. With the top 25% it rendered as hairlines on `plane`. The test uses ×0.6 mm.
@@terraces@@

### Height layering with a slope budget

Macro 3/m at 6.7 mm (~1.5°), meso fBm 40/m at 1 mm (~5°), micro 1500/m at 0.036 mm (~4°). The micro λ is 1.7 px on
`closeup`, where an over-budget layer turns into salt and pepper, so keep it ≤ 5° and move lost slope into roughness.
@@layers@@

### Correlated cavity and wear masks

Colour and roughness from the height field read as a rock face; from an unrelated field they read as stains.
f5 − f2 is exactly octaves 3–5, so it gives convexity for free. Cavity: base ~0.16, roughness 0.95. Wear: base ~0.56,
roughness 0.45.
@@cavity@@

### Smooth max

A union with a fillet instead of a crease. k ≈ 1/3 of the range, and 0.075 = k/4. For smooth min, negate the inputs and
the output.
@@smax@@

### Finite-difference derivative

The gradient of any chain, from re-evaluations at +e in u and v (e = 1e-4 m). Measured mean 0.038 and max 0.09, against
a predicted 1.2·A·f = 0.038 and 3·A·f. For a warp fold test, use `det = (dx.x·dy.y − dx.y·dy.x)/e²` < 0 on the warped
coordinates.
@@fd@@

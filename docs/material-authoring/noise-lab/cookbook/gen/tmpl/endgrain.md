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
@@wood_end@@

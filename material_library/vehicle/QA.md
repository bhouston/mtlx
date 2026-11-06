# Vehicle material authoring and verification

## Coverage

The library contains exactly 1,404 individually named presets from the source catalog,
organized into 31 material families. Every preset is a standalone MaterialX 1.39 document
with one multi-output nodegraph, a standard_surface shader, and a surfacematerial.
There are no external texture dependencies.

Three authoring agents produced the related families using the authoring guide and
mtlx MCP node-definition lookup. Their reproducible generators cover sections 1–11
(567 presets), 12–20 (494 presets), and 21–31 (343 presets). The user-requested local
`material_library/vehicle` destination overrides the guide's sample-library destination.

All 1,404 pass strict `check_material` through the local `mtlx mcp` stdio server with
`basic`, `structure`, `types`, and `unused`. The full-library validator also checks
catalog uniqueness, entry counts, missing/extra preset directories, and graph/shader/material
names. See [validation.json](validation.json).

## Real-world scale

UV 0–1 = exactly one meter. The asset supplies UVs at that density. Heights and absorption
distances use meters. The UV/height ×1000 normal workaround preserves their ratio and physical
slope; it does not resize patterns. Per-file XML comments record feature frequencies and relief.
Representative recipes include:

| Recipe                       | Physical feature scale                                 | Relief or optical depth                                                  |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Automotive coating           | 3.125 mm orange-peel wavelength                        | 8 µm height amplitude                                                    |
| Metallic pigment             | Fine ~0.56 mm; coarse ~1.54 mm                         | Tilted reflective substrate with a separate smooth coating normal        |
| Pebbled leather              | ~2.9 mm grain cells, ~0.6 mm fine pores                | ~0.1 mm raised grain, 6 µm pore depth                                    |
| Woven and knitted upholstery | Typically ~1 mm yarn spacing                           | Tens of µm surface relief; no modeled fabric thickness                   |
| Wood grain                   | Millimeter grain with decimeter longitudinal variation | ~45 µm open-pore relief; gloss figure ~3 µm                              |
| Bouclé                       | ~2.38 mm loop spacing, ~0.7 mm rounded yarn            | ~90 µm loop relief                                                       |
| Open-cell foam               | ~1.4 mm cells                                          | ~50 µm surface pore relief                                               |
| Tinted operating fluids      | Smooth bulk liquid                                     | Usually 30 mm reference attenuation distance; depends on asset thickness |

## CLI rendering

All previews use the built-in `mtlx render` command. The same CLI browser launch configuration
was probed before rendering. WebGL reports `ANGLE (Apple, ANGLE Metal Renderer: Apple M3,
Unspecified Version)`; WebGPU reports vendor `apple`, architecture `metal-3`, with
`isFallbackAdapter: false`. No software rasterizer was used.

[The gallery](GALLERY.md) contains 46 representatives spanning every catalog family. Each
neutral-light sheet includes a 1 m plane, 20 cm close-up, 5 cm detail, sphere, and totem,
at 384 px per view with 2× supersampling. These verify shared family recipes; individual
colorways are structurally validated, and have not all been visually reviewed.

The revised pebbled leather, figured wood, marble, and bouclé received a second render review.
The final recipes replace circular leather pits with recessed grain boundaries and fine pores,
replace periodic burl rings with warped figure, and add variable marble veins and millimeter
bouclé loops.

Additional 512 px supersampled renders inspect metallic paint, brushed aluminum, and gloss
burl under strip lighting; pebbled leather, wrinkle coating, foam, and bouclé under bridge
lighting; and directional knit under sunlight. Height-channel checks sample paint, wrinkle
coating, leather, wood, and bouclé using explicitly specified meter ranges.

The five sampled height fields stayed within their requested display ranges:

| Preset                 | Sampled minimum | Sampled maximum |
| ---------------------- | --------------- | --------------- |
| Gloss red paint        | −9.02 µm        | 8.86 µm         |
| Wrinkle powder coating | −132.9 µm       | 125.9 µm        |
| Pebbled leather        | −49.41 µm       | 49.41 µm        |
| Open-pore walnut       | −29.02 µm       | 22.75 µm        |
| Bouclé                 | 0.59 µm         | 101.8 µm        |

These are image-sampled diagnostic values, with the channel view's finite quantization,
not analytical extrema over the infinite procedural domain. The final artifacts contain
230 neutral views plus 22 additional lighting/channel views. Every render check completed.

The reproducible commands, timings, diagnostic output, and GPU metadata are recorded in
[render-results.json](tools/render-results.json) and [detail-results.json](tools/detail-results.json).
Use `node material_library/vehicle/tools/render-previews.mjs <catalogName> ...` to rerender neutral
sheets, followed by `node material_library/vehicle/tools/render-detail-checks.mjs` for the
additional checks. Render sequentially, as the scripts do.

## Repository checks

- `pnpm install --frozen-lockfile`: passed.
- `pnpm build`: passed; website build emits its existing source-map token and bundle-size notices.
- `pnpm tsc`: passed.
- `pnpm lint`: passed; existing repository warnings remain, with no new library errors.
- `pnpm test`: 72 test files and 490 tests passed.

## Practical limits

Colors and finish parameters are authored appearance targets, not measured OEM matches.
Microprism retroreflection, fluorescence, interference, anisotropy, subsurface response, and
layer/volume optics depend on the target renderer; the affected XML presets document their
approximations. Fluorescent/reflective materials do not gain emission automatically. Display
and lamp emission uses editable operating states and scene-linear relative radiance, with no
claim of calibrated luminance. Geometry supplies thickness and component form. Surface normal
fields approximate fibers and pores; they do not create true open cavities, fur volume, or
engineered optical microgeometry. No sustained rendering-performance benchmark was run.

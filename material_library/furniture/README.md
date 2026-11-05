# Furniture MaterialX library

2,667 independent procedural MaterialX materials covering all 23 families in
`FURNITURE_MATERIALS.md`. Browse [the full catalog](CATALOG.md), or use
[catalog.json](catalog.json) to find a material by its exact lower camel case name.
Each file contains one `M_<name>` material, `SR_<name>` standard surface, and
`NG_<name>` graph. No image textures or external asset downloads are required.

**Real world scale: UV 0–1 spans one meter in every material.** Assign mesh UVs
accordingly: a two-meter surface spans two UV units. Every graph's `height` output
is in meters. Multiplication by 1,000 inside the normal chain is the authoring
guide's millimeter workaround for `heighttonormal`, and does not change material
scale. Plane previews show 1 m, 20 cm, and 5 cm samples; sphere and totem UVs are
not metric.

All materials describe new, clean surfaces. Grain, pores, fibers, mineral veins,
metal processing textures, and deliberate decorative patterns are procedural.
Wood finishes retain substrate structure; bare metals use metallic reflection;
paint and polymers use dielectric reflection. Transparent tints use
`transmission_color` with `transmission_depth` and `thin_walled=false`, so their
intended absorption depends on optical path length. Use closed geometry with
physical thickness to evaluate transmission. Colors are authored in linear
Rec.709 under neutral illumination.

## Authoring and regeneration

The implementation follows [the authoring guide](../../docs/material-authoring/AUTHORING.md)
and its noise cookbook. Related entries share reproducible family recipes while
remaining independent files. Run from the repository root:

```sh
node material_library/furniture/tools/wood-finishes.mjs
node material_library/furniture/generators/textiles.mjs
node material_library/furniture/tools/hard-surfaces.mjs
```

The generators can read their saved catalogs/manifests if the original Markdown
catalog is unavailable. Regeneration overwrites the corresponding material files.
Physical pitches, relief amplitudes, and recipe choices are documented in the
family manifests and authoring reports beside the generators. Examples include
0.3 mm silk yarn pitch, 0.55 mm plain cloth yarn pitch, 1.2 mm canvas yarn pitch,
3 mm boucle structure, and 8 mm basket fiber spacing.

After installing dependencies and building the CLI with `pnpm build`, validate
through the local stdio MCP server:

```sh
node material_library/furniture/tools/validate-wood-finishes.mjs
node material_library/furniture/generators/check-textiles.mjs
node material_library/furniture/tools/hard-surfaces.mjs --validate
# Validate the whole saved catalog without regenerating:
node material_library/furniture/tools/validate-all.mjs
```

These use strict `basic`, `structure`, `types`, and `unused` checks. The hard-surface
command also regenerates its materials. Set `MTLX_REPO` to a built
checkout when running these tools in a worktree without installed dependencies.

## Preview verification

The [preview contact sheets](previews/) are generated with the built-in CLI:

```sh
node material_library/furniture/tools/render-previews.mjs
# Optional: render selected names instead of one example per family.
node material_library/furniture/tools/render-previews.mjs whiteOakClearSatin cottonCanvasNavy
# Directional light for relief verification:
MTLX_IBL=bridge node material_library/furniture/tools/render-previews.mjs whiteOakClearSatin
```

Each sheet includes plane, closeup, detail, sphere, and totem views under neutral
lighting, at 384 pixels per view with 2× supersampling. The recorded render run
used Chrome on a hardware Apple M3 GPU: WebGL reported ANGLE Metal / Apple M3;
WebGPU reported Apple / metal-3 with `isFallbackAdapter=false`.

Every material passed structural validation. Preview review samples families and
distinct recipes; it does not establish visual approval of every color variant.
These are procedural appearance approximations rather than measured product
BSDFs. Fabric pile uses sheen and relief rather than individual fiber geometry;
fine real-scale yarns may alias at distant views. Motifs are original procedural
patterns. Transmission, scattering, anisotropy, and thin film depend on support
in the target MaterialX renderer. Mirrors approximate the visible reflective
surface rather than modeling a separate glass and silver assembly.

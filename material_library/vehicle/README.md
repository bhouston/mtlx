# Vehicle MaterialX library

Factory-new vehicle materials corresponding one-for-one to
[VEHICLE_MATERIAL_CATALOG.md](../../VEHICLE_MATERIAL_CATALOG.md).
Browse the [complete material index](INDEX.md), [machine-readable catalog](catalog.json),
and [representative preview gallery](GALLERY.md).

Each preset lives at `<catalogName>/<catalogName>.mtlx`. Its nodegraph, shader,
and material are named `NG_<catalogName>`, `SR_<catalogName>`, and
`M_<catalogName>` respectively. The catalog specification is retained in each file. A companion `<catalogName>.txt`
describes its appearance and typical uses in vehicle renders.

**Real-world scale: UV 0–1 spans exactly one meter.** Apply metric UVs to the asset:
a two-meter panel spans two UV units. All graph frequencies are features per meter,
and height fields are in meters. The normal chain rescales UVs and heights together
to millimeters to work around the documented preview-renderer derivative threshold;
this preserves physical slopes and does not change the material scale. Sphere and
totem preview UVs are illustrative; the CLI's plane views provide metric inspection.

The library uses procedural MaterialX `standard_surface` graphs without external
texture dependencies. Related colorways share reproducible recipes in `tools/`.
These are appearance presets, with approximate color and optical parameters;
they are not measured OEM pigment, optical, or engineering data.

## Reproduce and validate

From the repository root, install and build the CLI using the pinned Node and pnpm
versions described in [CONTRIBUTING.md](../../CONTRIBUTING.md).
The family generators and full-library validator are in `tools/`:

```sh
python3 material_library/vehicle/tools/coatings.py
python3 material_library/vehicle/tools/interiors.py
node material_library/vehicle/tools/technical.mjs
python3 material_library/vehicle/tools/descriptions.py
```

The validator connects to `mtlx mcp` using the MCP stdio client and runs all four
rule groups in strict mode for every catalog entry:

```sh
node material_library/vehicle/tools/verify.mjs
python3 material_library/vehicle/tools/descriptions.py --check
```

Render with the CLI following [the authoring guide](../../docs/material-authoring/AUTHORING.md):

```sh
node packages/cli/bin/cli.js render material_library/vehicle/paintSolidGlossBrightRed/paintSolidGlossBrightRed.mtlx \
  -o /tmp/vehicle-paint.avif --view plane closeup detail sphere totem --ibl bridge --supersample
```

Use `--ibl neutral` for color, `--ibl strips` for reflection character, and
`--channel height --range=-0.001,0.001` for a numerical height inspection.
Transparent materials require closed, correctly scaled geometry for bulk absorption;
film presets depend on the supplied substrate and thickness. Emission values describe
an operating appearance and require scene exposure calibration. Procedural relief
models surface finish, not component geometry such as holes, tread, or stitching.

## Rendering limits

The catalog names appearance targets. Pigment colors, roughness, and optical coefficients
are authored approximations rather than measured OEM matches. A shallow normal field
represents fibers and foam pores; their full depth requires asset geometry or an appropriate
volume/fiber renderer. Portable standard_surface cannot reproduce directional microprism
retroreflection or spectral fluorescence exactly; those presets state their approximation in
the XML. Metallic pigments use a separate reflective substrate and dielectric coating;
interference and pearl effects use approximate thin-film responses.

Transparent-film and bulk-absorption behavior depends on renderer support and asset thickness.
Displays provide an editable image signal; emission has an explicit operating state and
relative scene-linear intensity, requiring scene luminance/exposure calibration.

Representative preview sheets verify family recipes, not every individual colorway.
See [QA.md](QA.md) for the precise coverage, GPU, numerical checks, and repository checks.

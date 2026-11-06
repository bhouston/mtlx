# Architectural MaterialX library

1,277 separately selectable procedural materials in 24 families, matching the architectural catalog. Each `.mtlx` is self-contained and names its material with the catalog's lower camel case identifier. [catalog.json](catalog.json) maps every identifier to its file and specification.

Each material has a matching `<materialName>.txt` file beside its `.mtlx` file, with a short appearance description and suggested rendering uses. These notes describe visual applications rather than construction or product performance requirements.

**Real-world scale: UV 0–1 is exactly 1 metre in both directions.** Set the consuming mesh UVs accordingly: a 4 m wide surface spans U=0–4. Keep the texture scale when moving the material between objects. No graph normalizes coordinates to object bounds. Texture frequencies are features per metre, surface heights and optical absorption distances are metres, and thin-film thicknesses are nanometres. Shapes, seams, tile/brick/board arrangements, pile silhouettes and particle geometry belong to the consumer.

Colors are authored in linear Rec.709 (`lin_rec709`), with art-directed values rather than measured manufacturer swatches. There are no external images, baked lighting, shadows or ambient occlusion. Original specifications and feature scales are included in the XML comments. Similar variants share recipes; pigment, finish, relief and optical parameters vary by specification.

![One representative sphere from each of the 24 families, under bridge lighting](previews/overview.avif)

## Families

| Family                                                                                                                                               | Materials | Example                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| [Paint and interior coatings](paint-and-interior-coatings/)                                                                                          |        97 | [paintPureWhiteMatte](paint-and-interior-coatings/paintPureWhiteMatte.mtlx)                                                             |
| [Plaster, gypsum, stucco, and mineral renders](plaster-gypsum-stucco-and-mineral-renders/)                                                           |        49 | [gypsumPlasterWhiteSmooth](plaster-gypsum-stucco-and-mineral-renders/gypsumPlasterWhiteSmooth.mtlx)                                     |
| [Concrete and cementitious surfaces](concrete-and-cementitious-surfaces/)                                                                            |        51 | [concreteNaturalGrayAsCast](concrete-and-cementitious-surfaces/concreteNaturalGrayAsCast.mtlx)                                          |
| [Brick, fired clay, mortar, and masonry finishes](brick-fired-clay-mortar-and-masonry-finishes/)                                                     |        45 | [brickClayRed](brick-fired-clay-mortar-and-masonry-finishes/brickClayRed.mtlx)                                                          |
| [Natural stone](natural-stone/)                                                                                                                      |       109 | [marbleCarraraWhiteHoned](natural-stone/marbleCarraraWhiteHoned.mtlx)                                                                   |
| [Engineered stone, ceramic, porcelain, and glass-derived finishes](engineered-stone-ceramic-porcelain-and-glass-derived-finishes/)                   |        97 | [quartzCompositePureWhitePolished](engineered-stone-ceramic-porcelain-and-glass-derived-finishes/quartzCompositePureWhitePolished.mtlx) |
| [Natural wood and clear wood finishes](natural-wood-and-clear-wood-finishes/)                                                                        |        90 | [whiteOakRaw](natural-wood-and-clear-wood-finishes/whiteOakRaw.mtlx)                                                                    |
| [Engineered wood, laminates, lacquers, and composites](engineered-wood-laminates-lacquers-and-composites/)                                           |        69 | [plywoodBirchFaceRaw](engineered-wood-laminates-lacquers-and-composites/plywoodBirchFaceRaw.mtlx)                                       |
| [Transparent protective coatings and surface treatments](transparent-protective-coatings-and-surface-treatments/)                                    |        18 | [clearPolyurethaneMatte](transparent-protective-coatings-and-surface-treatments/clearPolyurethaneMatte.mtlx)                            |
| [Bare metals, plated metals, and patinas](bare-metals-plated-metals-and-patinas/)                                                                    |        46 | [stainlessSteelPolished](bare-metals-plated-metals-and-patinas/stainlessSteelPolished.mtlx)                                             |
| [Metal coatings and factory finishes](metal-coatings-and-factory-finishes/)                                                                          |        65 | [aluminumAnodizedNatural](metal-coatings-and-factory-finishes/aluminumAnodizedNatural.mtlx)                                             |
| [Architectural glass, mirrors, and optical films](architectural-glass-mirrors-and-optical-films/)                                                    |        47 | [glassClearFloat](architectural-glass-mirrors-and-optical-films/glassClearFloat.mtlx)                                                   |
| [Roofing, waterproofing, and weather membranes](roofing-waterproofing-and-weather-membranes/)                                                        |        32 | [asphaltShingleGranulesBlack](roofing-waterproofing-and-weather-membranes/asphaltShingleGranulesBlack.mtlx)                             |
| [Resilient flooring, resin coatings, and safety finishes](resilient-flooring-resin-coatings-and-safety-finishes/)                                    |        63 | [vinylSheetWhiteMatte](resilient-flooring-resin-coatings-and-safety-finishes/vinylSheetWhiteMatte.mtlx)                                 |
| [Carpet, felt, and textile surface finishes](carpet-felt-and-textile-surface-finishes/)                                                              |        58 | [carpetWoolIvoryCutPile](carpet-felt-and-textile-surface-finishes/carpetWoolIvoryCutPile.mtlx)                                          |
| [Upholstery, drapery, bedding, and woven fibers](upholstery-drapery-bedding-and-woven-fibers/)                                                       |        75 | [linenNatural](upholstery-drapery-bedding-and-woven-fibers/linenNatural.mtlx)                                                           |
| [Leather, hide, and synthetic upholstery](leather-hide-and-synthetic-upholstery/)                                                                    |        37 | [leatherIvorySemiAniline](leather-hide-and-synthetic-upholstery/leatherIvorySemiAniline.mtlx)                                           |
| [Plastics, elastomers, sealants, and adhesives](plastics-elastomers-sealants-and-adhesives/)                                                         |        57 | [pvcRigidWhite](plastics-elastomers-sealants-and-adhesives/pvcRigidWhite.mtlx)                                                          |
| [Sanitary ceramics, enamel, and utility composites](sanitary-ceramics-enamel-and-utility-composites/)                                                |        26 | [vitreousChinaWhite](sanitary-ceramics-enamel-and-utility-composites/vitreousChinaWhite.mtlx)                                           |
| [Insulation, exposed service materials, and construction substrates](insulation-exposed-service-materials-and-construction-substrates/)              |        37 | [mineralWoolYellowBrown](insulation-exposed-service-materials-and-construction-substrates/mineralWoolYellowBrown.mtlx)                  |
| [Paper, wallcoverings, natural fiber finishes, and decorative coatings](paper-wallcoverings-natural-fiber-finishes-and-decorative-coatings/)         |        29 | [wallcoveringPaperWhite](paper-wallcoverings-natural-fiber-finishes-and-decorative-coatings/wallcoveringPaperWhite.mtlx)                |
| [Exterior paving media, earth, aggregates, and landscape surface materials](exterior-paving-media-earth-aggregates-and-landscape-surface-materials/) |        46 | [asphaltFreshBlack](exterior-paving-media-earth-aggregates-and-landscape-surface-materials/asphaltFreshBlack.mtlx)                      |
| [Water, frozen water, moisture, and deposited matter](water-frozen-water-moisture-and-deposited-matter/)                                             |        19 | [waterClear](water-frozen-water-moisture-and-deposited-matter/waterClear.mtlx)                                                          |
| [Luminous, display, and technical optical materials](luminous-display-and-technical-optical-materials/)                                              |        15 | [emissiveDiffuserWarmWhite](luminous-display-and-technical-optical-materials/emissiveDiffuserWarmWhite.mtlx)                            |

## Use and regenerate

Open any material directly with the editor, viewer or CLI. From the repository root:

```sh
node packages/cli/bin/cli.js view material_library/architectural/natural-stone/marbleCarraraWhiteHoned.mtlx
node packages/cli/bin/cli.js render material_library/architectural/natural-stone/marbleCarraraWhiteHoned.mtlx -o /tmp/marble.avif --view plane closeup detail sphere totem --ibl bridge --supersample
```

The generators use Python's standard library. Each owns eight complete catalog families. Regeneration uses the root `ARCHITECTURAL_MATERIALS.md` when present, otherwise the included [catalog source](authoring/catalog-source.md).

```sh
python3 material_library/architectural/authoring/generate-mineral-wood.py
python3 material_library/architectural/authoring/generate-optical-metal-textile.py
python3 material_library/architectural/authoring/generate-organic-technical.py
node material_library/architectural/authoring/verify.mjs
```

After rendering, `node material_library/architectural/authoring/verify.mjs --previews` also checks saved-image integrity, current material hashes, and preview coverage of all 24 families.

The verifier checks exact catalog coverage and runs **mtlx MCP** `check_material` with strict `basic`, `structure`, `types`, and `unused` rules on every file. It writes content hashes to the manifest and [validation results](authoring/validation.json). Dependencies and built CLI are required (`pnpm install --frozen-lockfile && pnpm build`).

Rebuild the overview from saved previews with `node material_library/architectural/authoring/make-gallery.mjs`.

To reproduce a material's preview set with the **built-in CLI renderer**:

```sh
node material_library/architectural/authoring/render-previews.mjs stainlessSteelBrushed
```

This checks the hardware renderer before rendering and saves AVIF contact sheets under `previews/`. It follows the [authoring guide](../../docs/material-authoring/AUTHORING.md): five bridge views, neutral plane/sphere for color, sun closeup for directional relief, and strips sphere for gloss. The [render log](authoring/renders.json) records material hashes, views, settings and results. Render previews cover representatives; strict validation covers all 1,277 entries. See [authoring report](authoring/REPORT.md) for physical scales, verification coverage and limitations.

## Rendering considerations

Every file uses one multi-output nodegraph and `standard_surface`. Bare conductors use metalness; opaque binders use dielectric reflection. Clear coatings are substrate-free media to layer over a separately assigned substrate or apply to a coating shell. Water and tinted glass use transmission and reference absorption depths, not alpha tint. Closed geometry and renderer optical support determine their final appearance. Reference absorption distance does not prescribe geometry thickness.

The documented millimetre `heighttonormal` workaround (`UV × 1000`, `height × 1000`, scale 16) is used to avoid flat normals in this preview renderer. Relief is a surface shading effect. Consumers with different derivative conventions may need to adapt this chain. Tiny yarns and grains are intended for closeup/detail views; filtering and camera distance affect their visibility.

Subsurface scattering, volume scatter, anisotropic sheen, thin-film interference, retroreflection, display excitation and photoluminescent decay depend on renderer support. Standard surface approximations and per-entry caveats are recorded in the XML. In particular, a valid file or successful preview compilation does not certify full physical optics. Natural stones and woods are procedural visual families rather than scans of individual specimens. Emission uses authored renderer-relative strengths and requires scene calibration.

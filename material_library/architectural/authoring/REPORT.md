# Architectural library authoring report

The library implements all 1,277 catalog identifiers as standalone MaterialX 1.39 files in 24 families. Three authoring agents divided the work by related families; cross-review and hardware CLI previews informed corrections. Every file includes the source specification and procedural scale notes. Materials describe continuous surface appearances; component layouts and geometry remain the consumer's responsibility.

## Real-world scale and color

**UV 0–1 spans exactly one metre along each axis.** A four-metre surface therefore spans four UV units. All procedural coordinates start with the mesh's metric `texcoord`; there is no object-bounds or tile normalization. All surface heights and absorption reference distances are metres. Normal generation uses the guide's millimetre workaround, scaling both coordinates and heights by 1,000 before `heighttonormal(scale=16)`. Film thickness is in nanometres.

Colors are authored linear Rec.709 art-direction targets. They are neither measured manufacturer swatches nor scanned stone/wood specimens. Fine patterns require suitable filtering at distance. Surface normals do not create silhouettes, volume inclusions or actual displacement.

| Feature family          | Authored physical scales                                                              | Appearance                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Architectural paint     | 1.5–3 mm application texture; 30–60 mm gloss ripple                                   | Finish-specific roughness, weak roller stipple                                 |
| Limewash/mineral render | 0.2–0.4 m pigment drift; stucco grains about 1–3 mm                                   | Brush/trowel coloration, continuous mineral relief                             |
| Cast/broom concrete     | Cast pores about 5 mm; broom strokes about 3 mm apart                                 | Correlated pores, exposed grain, directional strokes                           |
| Terrazzo/stone          | Terrazzo chips about 8–18 mm; travertine cavities about 14 × 4 mm                     | Mineral palettes, continuous veins, pores and finish variation                 |
| Wood/composites         | Softwood knot cores 12–24 mm; plywood plies 1.5 mm                                    | Grain deflection, growth rings, pores, ray fleck, carbon checking              |
| Bare metals/oxides      | Brushing 3 × 440 features/m, 9 µm relief; oxide crowns/pits around 1.7–3.3 mm         | Anisotropic abrasion, zinc spangle, spatial dielectric oxide                   |
| Coatings/glass          | Coating absorption reference 1 mm; tinted glass reference 10 mm                       | Dielectric coatings, colored conductor layers, path-dependent transmission     |
| Roofing                 | Granulation 600 features/m, 90 µm relief                                              | Granular binder, membrane texture, foil and fiber skins                        |
| Textiles                | Linen 280 × 350 yarn features/m, 35 µm relief; loop pile 400 features/m, 90 µm relief | Woven yarn, directional nap, sheen and thin coverage                           |
| Leather                 | Hide grain 3.5–4.3 mm; 45–65 µm relief                                                | Grain boundaries, pores, suede nap, hide coloration                            |
| Ceramics/enamel         | About 8 mm glaze ripple at submicrometre relief                                       | Dielectric glaze, colored enamel, resin-bound minerals                         |
| Insulation/foil         | Foam/beads 2.5–5.9 mm, 0.08–0.16 mm relief; foil wrinkles 14–28 mm                    | Fiber bundles, pores, fused beads, metallic crinkle                            |
| Landscape/deposits      | Mineral skin grains about 1–2 mm, 8–120 µm relief                                     | Mineral/organic coloration; individual stone, leaf and fiber geometry excluded |
| Water/optical media     | Oil absorption reference 4 mm; pool water 2 m                                         | Flat liquid surface; refraction, absorption and scatter parameters             |
| Luminous/technical      | Silicon color domains about 20 mm; explicit emission strengths                        | Effective optical films, silicon and excitation-dependent coatings             |

Exact settings are in each material's XML and its generator. These are procedural surface feature dimensions, not mesh/component dimensions.

## Validation and rendering

[validation.json](validation.json) records strict MCP `check_material` results for every entry, using all four rule groups: `basic`, `structure`, `types`, and `unused`. The verifier also checks catalog coverage, unique identifiers, nodegraphs, shaders and absence of external image dependencies. [catalog.json](../catalog.json) records file hashes and specifications. Deterministic regeneration was checked by comparing all 1,277 file hashes before and after running all three generators.

The built-in `mtlx render` command produces the saved AVIF previews. Each representative gets the guide's plane (1 m), closeup (200 mm), detail (50 mm), sphere and totem views under bridge lighting; neutral plane/sphere for color; sun closeup for directional relief; and strips sphere for gloss. Images use 384 px views with 2× supersampling. The preview script serializes rendering. These are quality checks, not throughput benchmarks.

[hardware.json](hardware.json) records the confirmed Apple M3 hardware WebGL renderer and Apple Metal WebGPU adapter (`isFallbackAdapter=false`). No software rasterizer was used. [renders.json](renders.json) records the exact settings, material hashes and outcomes for saved previews.

Final render coverage is **72 representative materials across all 24 families**, with **288 saved lighting sets containing 648 artistic views**, plus ten height/normal channel images. The final saved artistic calls total 1199.6 seconds of recorded wall time; this sum excludes superseded iterations. Four artistic preview batches made 352 CLI render calls, including two initial output-name collision failures that were corrected; ten additional calls checked channels. All saved final artifacts pass their checks.

Full visual review of every color variant was not performed. Representative recipe checks complement validation of every material; successful compilation does not establish full renderer support for all physical optics.

The repository's required install, build, type check, lint and test commands passed; the suite contained 72 test files and 490 tests. Existing workspace lint warnings remain. New authoring scripts also passed focused lint and Python syntax checks.

[channel-checks.json](channel-checks.json) records the CLI commands and numerical samples. At the selected closeup regions, stucco relief ranges about −247 to +278 µm, broom-finished concrete −216 to +208 µm, pine −12 to +35 µm and leather −12 to +67 µm. Clear water is authored flat. These values are sampled from 8-bit diagnostic images (about 8 µm precision at the chosen range), so the nominal zero water field reads about −4 µm after quantization. Normal-channel checks confirm non-flat relief and a flat water surface.

## Iteration and limitations

Authoring and cross-review corrected graph output/node name collisions, warm neutral projection colors, pale aerated concrete, special ceramic and plywood colors, missing softwood knots/ray fleck, angular multiscale terrazzo inclusions, sparse birch lenticels, strand-oriented OSB grain, dielectric versus conductor behavior, coating coverage between grains, neutral anodized aluminum, galvanized zinc reflection, and loss of density in gray glass absorption. Preview review added oxide microrelief and a documented mixed diffuse/transmission approximation for milky glass.

The installed Three.js `MaterialXSurfaceMappings.js` ignores `transmission_scatter`, `transmission_scatter_anisotropy` and `transmission_extra_roughness`; it maps `transmission_depth` to preview thickness rather than a faithful absorption reference distance. Subsurface inputs are also unsupported. Consequently, volume-scattering and bulk-absorption parameters are authored for supporting renderers but are not physically verified by these previews. Milk/opal glass uses a disclosed diffuse/transmission approximation to maintain its intended surface appearance in the preview.

Retroreflection needs a renderer-specific replacement shader. Spectral multilayer optics, polarization, anisotropic nap, internal bubbles, pearl pigments and silicon use documented effective approximations. Clear protective treatments require a separately supplied substrate/layer or shell. Phosphor excitation and photoluminescent decay require runtime controls; emission is in renderer-relative units and needs scene calibration. White materials are not made emissive unless the catalog explicitly calls for emission.

Procedural noise and grain are surface shading, not physical particle layouts. The library intentionally excludes brick bonds, tile grids, board seams, leaf outlines, pile silhouettes, openings and assembled products. On spheres and totems, UVs are not metrically uniform; the guide's plane views establish real-world feature sizes.

Tool friction included initial output/node name collisions and the guide's `treesize.py` failing on some multiline generated XML. Strict MCP validation exposed collisions before final verification. No renderer implementation changes are included.

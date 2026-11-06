# Vehicle material catalog

1404 individually named material presets for preparing factory-new passenger cars, luxury cars,
economy cars, pickups, vans, commercial trucks, buses, agricultural vehicles, and associated vehicle
equipment for rendering. The catalog covers visible surfaces and materials exposed in CAD cutaways
or service views. It is a material inventory, not a component or geometry inventory.

## Scope and naming

- Every listed preset has a unique lower camel case material name followed by its appearance specification.
- Each listed solid color is a separate preset. Multi-color textiles, wood grain, camouflage, and other
  integral patterns are single patterned materials, with their colorways named separately.
- Shared materials are reused across vehicle classes. A different vehicle, part shape, tread design,
  hole pattern, or stitch arrangement does not by itself require a different material.
- All presets describe clean factory-new condition. Natural grain, casting texture, coating texture,
  and intentional industrial finishes are included; use wear, rust, dirt, fading, scratches, and patina are excluded.
- This is a broad production-library baseline. Bespoke pigments, proprietary finishes, and measured OEM
  color matches can extend it indefinitely; the named colors are appearance targets, not OEM paint codes.
- Specifications describe renderable appearance, not engineering qualification, safety compliance,
  chemistry compatibility, or manufacturing recipes. Similar-looking materials may share shader graphs
  while retaining separate names for composition or finish.

## Specification conventions

- Color words describe the final visible appearance. Calibrate base color from references in a defined
  color space; do not treat display RGB values as physical reflectance measurements.
- Opaque paints, resins, leather, rubber, ceramics, and textiles have dielectric outer surfaces.
  Exposed metals use conductor reflectance. Metallic paint and coated metal need distinct coating
  and substrate responses rather than a single indiscriminate metalness setting.
- Gloss, satin, and matte specify reflection character. Choose renderer-specific roughness values
  from reference swatches; there is no universal numeric roughness that reproduces every finish.
- Fine grain, pores, weave, nap, flakes, and other material textures need consistent physical scale.
  Surface patterns belong to material maps or scattering models; no entry specifies geometry.
- Transparent tints use absorption and transmission. Translucency uses scattering; opacity and
  emission are separate properties. Optical depth depends on the thickness supplied by the asset.
- Clearcoats, protection films, inks, adhesives, and tint films can be layer materials. Their appearance
  depends on the substrate. A coated preset already specifying a clear finish should not receive a
  second identical clearcoat by default.
- Emissive presets require an explicit intensity and operating state. A colored lens, reflector,
  fluorescent film, or unpowered display is not automatically self-emissive.
- Material names do not imply a vehicle-specific assignment. The descriptions specify materials only.

## Material index

1. [Solid-color exterior coatings](#solid-color-exterior-coatings) — 64 materials.
2. [Metallic, pearl, and specialty exterior coatings](#metallic-pearl-and-specialty-exterior-coatings) — 73 materials.
3. [Protective, textured, and functional coatings](#protective-textured-and-functional-coatings) — 63 materials.
4. [Decorative films, wraps, and laminates](#decorative-films-wraps-and-laminates) — 42 materials.
5. [Exposed metals and metallic finishes](#exposed-metals-and-metallic-finishes) — 69 materials.
6. [Rigid molded plastics and polymer finishes](#rigid-molded-plastics-and-polymer-finishes) — 105 materials.
7. [Transparent, translucent, and optical polymers](#transparent-translucent-and-optical-polymers) — 31 materials.
8. [Automotive and machinery glazing](#automotive-and-machinery-glazing) — 43 materials.
9. [Mirrored and reflective optical finishes](#mirrored-and-reflective-optical-finishes) — 8 materials.
10. [Elastomers, seals, and flexible polymers](#elastomers-seals-and-flexible-polymers) — 45 materials.
11. [Tire, track, and belt rubber compounds](#tire-track-and-belt-rubber-compounds) — 24 materials.
12. [Natural leather](#natural-leather) — 78 materials.
13. [Synthetic leather and coated upholstery](#synthetic-leather-and-coated-upholstery) — 71 materials.
14. [Woven, knitted, and technical upholstery textiles](#woven-knitted-and-technical-upholstery-textiles) — 70 materials.
15. [Carpet, felt, flock, and textile linings](#carpet-felt-flock-and-textile-linings) — 51 materials.
16. [Webbing, yarn, thread, and fabric tapes](#webbing-yarn-thread-and-fabric-tapes) — 57 materials.
17. [Natural wood, veneer, and decorative wood effects](#natural-wood-veneer-and-decorative-wood-effects) — 47 materials.
18. [Fiber composites and decorative composite surfaces](#fiber-composites-and-decorative-composite-surfaces) — 29 materials.
19. [Foams, insulation, absorbers, and filter media](#foams-insulation-absorbers-and-filter-media) — 31 materials.
20. [Commercial, utility, and agricultural interior and cargo finishes](#commercial-utility-and-agricultural-interior-and-cargo-finishes) — 60 materials.
21. [Powertrain, friction, and technical ceramic materials](#powertrain-friction-and-technical-ceramic-materials) — 21 materials.
22. [Electrical insulation, wiring polymers, and battery materials](#electrical-insulation-wiring-polymers-and-battery-materials) — 64 materials.
23. [Hydraulic, pneumatic, and reinforced flexible materials](#hydraulic-pneumatic-and-reinforced-flexible-materials) — 23 materials.
24. [Adhesives, bonding compounds, and functional films](#adhesives-bonding-compounds-and-functional-films) — 23 materials.
25. [Labels, inks, transfers, and safety films](#labels-inks-transfers-and-safety-films) — 52 materials.
26. [Display, emissive, and luminescent materials](#display-emissive-and-luminescent-materials) — 28 materials.
27. [Clean operating fluids and assembly lubricants](#clean-operating-fluids-and-assembly-lubricants) — 34 materials.
28. [Factory-fresh specialty mineral and decorative materials](#factory-fresh-specialty-mineral-and-decorative-materials) — 12 materials.
29. [Clear finishes, hardcoats, and transparent surface treatments](#clear-finishes-hardcoats-and-transparent-surface-treatments) — 17 materials.
30. [Weatherproof textiles and specialist decorative fabrics](#weatherproof-textiles-and-specialist-decorative-fabrics) — 44 materials.
31. [Specialty energy, sensor, and chemical-resistant materials](#specialty-energy-sensor-and-chemical-resistant-materials) — 25 materials.

## Solid-color exterior coatings

- `paintSolidGlossPureWhite` — Opaque pure white pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossWarmWhite` — Opaque warm white pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossIvory` — Opaque ivory pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossCream` — Opaque cream pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossLightGray` — Opaque light gray pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossMediumGray` — Opaque medium gray pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossCharcoal` — Opaque charcoal pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossJetBlack` — Opaque jet black pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossBrightRed` — Opaque bright red pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossDarkRed` — Opaque dark red pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossBurgundy` — Opaque burgundy pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossOrange` — Opaque orange pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossSafetyOrange` — Opaque safety orange pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossYellow` — Opaque yellow pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossSafetyYellow` — Opaque safety yellow pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossLimeGreen` — Opaque lime green pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossGrassGreen` — Opaque grass green pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossForestGreen` — Opaque forest green pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossOliveGreen` — Opaque olive green pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossTeal` — Opaque teal pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossCyan` — Opaque cyan pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossSkyBlue` — Opaque sky blue pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossRoyalBlue` — Opaque royal blue pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossNavyBlue` — Opaque navy blue pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossViolet` — Opaque violet pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossPlum` — Opaque plum pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossPink` — Opaque pink pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossBeige` — Opaque beige pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossSand` — Opaque sand pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossTan` — Opaque tan pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidGlossChocolateBrown` — Opaque chocolate brown pigmented basecoat beneath a clear dielectric gloss coat; fine factory orange-peel microtexture, deep reflections, no metallic flakes or pearlescence.
- `paintSolidSatinWhite` — Opaque white automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinLightGray` — Opaque light gray automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinCharcoal` — Opaque charcoal automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinBlack` — Opaque black automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinRed` — Opaque red automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinOrange` — Opaque orange automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinOliveGreen` — Opaque olive green automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinNavyBlue` — Opaque navy blue automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinSand` — Opaque sand automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidSatinBrown` — Opaque brown automotive coating with a satin clear finish; broad controlled highlights, fine uniform microtexture, no metallic sparkle.
- `paintSolidMatteWhite` — Opaque white automotive coating with matte clear finish; soft diffuse highlights and fine coating texture, retaining dielectric reflections at grazing angles.
- `paintSolidMatteGray` — Opaque gray automotive coating with matte clear finish; soft diffuse highlights and fine coating texture, retaining dielectric reflections at grazing angles.
- `paintSolidMatteBlack` — Opaque black automotive coating with matte clear finish; soft diffuse highlights and fine coating texture, retaining dielectric reflections at grazing angles.
- `paintSolidMatteRed` — Opaque red automotive coating with matte clear finish; soft diffuse highlights and fine coating texture, retaining dielectric reflections at grazing angles.
- `paintSolidMatteOliveGreen` — Opaque olive green automotive coating with matte clear finish; soft diffuse highlights and fine coating texture, retaining dielectric reflections at grazing angles.
- `paintSolidMatteBlue` — Opaque blue automotive coating with matte clear finish; soft diffuse highlights and fine coating texture, retaining dielectric reflections at grazing angles.
- `paintSolidMatteSand` — Opaque sand automotive coating with matte clear finish; soft diffuse highlights and fine coating texture, retaining dielectric reflections at grazing angles.
- `paintSingleStageGlossWhite` — Factory-new white single-stage industrial enamel or polyurethane finish; pigmentation and gloss in one coating, subtle application texture, no separate clearcoat appearance.
- `paintSingleStageGlossCream` — Factory-new cream single-stage industrial enamel or polyurethane finish; pigmentation and gloss in one coating, subtle application texture, no separate clearcoat appearance.
- `paintSingleStageGlossBlack` — Factory-new black single-stage industrial enamel or polyurethane finish; pigmentation and gloss in one coating, subtle application texture, no separate clearcoat appearance.
- `paintSingleStageGlossRed` — Factory-new red single-stage industrial enamel or polyurethane finish; pigmentation and gloss in one coating, subtle application texture, no separate clearcoat appearance.
- `paintSingleStageGlossOrange` — Factory-new orange single-stage industrial enamel or polyurethane finish; pigmentation and gloss in one coating, subtle application texture, no separate clearcoat appearance.
- `paintSingleStageGlossYellow` — Factory-new yellow single-stage industrial enamel or polyurethane finish; pigmentation and gloss in one coating, subtle application texture, no separate clearcoat appearance.
- `paintSingleStageGlossGreen` — Factory-new green single-stage industrial enamel or polyurethane finish; pigmentation and gloss in one coating, subtle application texture, no separate clearcoat appearance.
- `paintSingleStageGlossBlue` — Factory-new blue single-stage industrial enamel or polyurethane finish; pigmentation and gloss in one coating, subtle application texture, no separate clearcoat appearance.
- `paintUtilitySatinBlack` — Factory-new black industrial machinery coating; semi-gloss dielectric surface with slightly stronger application texture than passenger-car paint.
- `paintUtilitySatinGray` — Factory-new gray industrial machinery coating; semi-gloss dielectric surface with slightly stronger application texture than passenger-car paint.
- `paintUtilitySatinRed` — Factory-new red industrial machinery coating; semi-gloss dielectric surface with slightly stronger application texture than passenger-car paint.
- `paintUtilitySatinOrange` — Factory-new orange industrial machinery coating; semi-gloss dielectric surface with slightly stronger application texture than passenger-car paint.
- `paintUtilitySatinYellow` — Factory-new yellow industrial machinery coating; semi-gloss dielectric surface with slightly stronger application texture than passenger-car paint.
- `paintUtilitySatinGreen` — Factory-new green industrial machinery coating; semi-gloss dielectric surface with slightly stronger application texture than passenger-car paint.
- `paintUtilitySatinBlue` — Factory-new blue industrial machinery coating; semi-gloss dielectric surface with slightly stronger application texture than passenger-car paint.
- `paintUtilitySatinBeige` — Factory-new beige industrial machinery coating; semi-gloss dielectric surface with slightly stronger application texture than passenger-car paint.

## Metallic, pearl, and specialty exterior coatings

- `paintMetallicGlossSilver` — silver metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossLightSilver` — light silver metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossDarkSilver` — dark silver metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossGunmetal` — gunmetal metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossGraphite` — graphite metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossBlack` — black metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossWhite` — white metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossChampagne` — champagne metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossGold` — gold metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossBronze` — bronze metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossCopper` — copper metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossRed` — red metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossBurgundy` — burgundy metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossOrange` — orange metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossYellow` — yellow metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossOliveGreen` — olive green metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossEmeraldGreen` — emerald green metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossTeal` — teal metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossIceBlue` — ice blue metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossBlue` — blue metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossNavyBlue` — navy blue metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossViolet` — violet metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicGlossBrown` — brown metallic automotive basecoat with fine reflective flakes beneath a smooth gloss clearcoat; directional flake response and view-dependent brightness, not a uniformly metallic outer surface.
- `paintMetallicSatinSilver` — silver fine-flake metallic basecoat beneath satin clearcoat; muted flake glints and broad highlights with subdued reflection clarity.
- `paintMetallicSatinGunmetal` — gunmetal fine-flake metallic basecoat beneath satin clearcoat; muted flake glints and broad highlights with subdued reflection clarity.
- `paintMetallicSatinBlack` — black fine-flake metallic basecoat beneath satin clearcoat; muted flake glints and broad highlights with subdued reflection clarity.
- `paintMetallicSatinBronze` — bronze fine-flake metallic basecoat beneath satin clearcoat; muted flake glints and broad highlights with subdued reflection clarity.
- `paintMetallicSatinRed` — red fine-flake metallic basecoat beneath satin clearcoat; muted flake glints and broad highlights with subdued reflection clarity.
- `paintMetallicSatinGreen` — green fine-flake metallic basecoat beneath satin clearcoat; muted flake glints and broad highlights with subdued reflection clarity.
- `paintMetallicSatinBlue` — blue fine-flake metallic basecoat beneath satin clearcoat; muted flake glints and broad highlights with subdued reflection clarity.
- `paintMetallicMatteSilver` — silver fine-flake metallic paint beneath matte clearcoat; low-gloss dielectric top surface with restrained metallic depth.
- `paintMetallicMatteGraphite` — graphite fine-flake metallic paint beneath matte clearcoat; low-gloss dielectric top surface with restrained metallic depth.
- `paintMetallicMatteBlack` — black fine-flake metallic paint beneath matte clearcoat; low-gloss dielectric top surface with restrained metallic depth.
- `paintMetallicMatteBronze` — bronze fine-flake metallic paint beneath matte clearcoat; low-gloss dielectric top surface with restrained metallic depth.
- `paintMetallicMatteGreen` — green fine-flake metallic paint beneath matte clearcoat; low-gloss dielectric top surface with restrained metallic depth.
- `paintMetallicMatteBlue` — blue fine-flake metallic paint beneath matte clearcoat; low-gloss dielectric top surface with restrained metallic depth.
- `paintPearlGlossWhite` — white pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossIvory` — ivory pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossSilver` — silver pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossBlack` — black pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossRed` — red pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossBurgundy` — burgundy pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossOrange` — orange pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossGold` — gold pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossGreen` — green pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossTeal` — teal pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossBlue` — blue pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossViolet` — violet pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlGlossPink` — pink pearlescent automotive coating with interference-pigment response beneath clear gloss; soft angle-dependent luster, without coarse metal sparkle.
- `paintPearlSatinWhite` — white pearlescent base with satin clearcoat; subtle interference luster visible through broad, low-contrast highlights.
- `paintPearlSatinBlack` — black pearlescent base with satin clearcoat; subtle interference luster visible through broad, low-contrast highlights.
- `paintPearlSatinRed` — red pearlescent base with satin clearcoat; subtle interference luster visible through broad, low-contrast highlights.
- `paintPearlSatinBlue` — blue pearlescent base with satin clearcoat; subtle interference luster visible through broad, low-contrast highlights.
- `paintPearlSatinViolet` — violet pearlescent base with satin clearcoat; subtle interference luster visible through broad, low-contrast highlights.
- `paintTriCoatPearlWhite` — white opaque ground coat, translucent pearl midcoat, and gloss clearcoat; layered optical depth with mild angular color variation.
- `paintTriCoatPearlCream` — cream opaque ground coat, translucent pearl midcoat, and gloss clearcoat; layered optical depth with mild angular color variation.
- `paintTriCoatPearlRed` — red opaque ground coat, translucent pearl midcoat, and gloss clearcoat; layered optical depth with mild angular color variation.
- `paintTriCoatPearlBlue` — blue opaque ground coat, translucent pearl midcoat, and gloss clearcoat; layered optical depth with mild angular color variation.
- `paintCandyGlossRed` — Transparent red tinted paint over a reflective metallic ground and under clear gloss; saturated depth and angle-dependent brightness.
- `paintCandyGlossOrange` — Transparent orange tinted paint over a reflective metallic ground and under clear gloss; saturated depth and angle-dependent brightness.
- `paintCandyGlossGold` — Transparent gold tinted paint over a reflective metallic ground and under clear gloss; saturated depth and angle-dependent brightness.
- `paintCandyGlossGreen` — Transparent green tinted paint over a reflective metallic ground and under clear gloss; saturated depth and angle-dependent brightness.
- `paintCandyGlossBlue` — Transparent blue tinted paint over a reflective metallic ground and under clear gloss; saturated depth and angle-dependent brightness.
- `paintCandyGlossViolet` — Transparent violet tinted paint over a reflective metallic ground and under clear gloss; saturated depth and angle-dependent brightness.
- `paintInterferenceBlueViolet` — Clear-coated interference-pigment finish shifting between blue and violet with viewing angle; smooth gloss and controlled microflake luster.
- `paintInterferenceGreenPurple` — Clear-coated interference-pigment finish shifting between green and purple; smooth dielectric topcoat and subdued flake texture.
- `paintInterferenceCopperGreen` — Clear-coated interference-pigment finish shifting from copper to green; layered gloss response and fine pigment scale.
- `paintInterferenceSilverRose` — Pale silver-to-rose interference coating with fine pearl sheen beneath gloss clearcoat.
- `paintCoarseMetalFlakeSilver` — silver specialty factory or coachbuilt finish with visibly coarser reflective flakes under clear gloss; sparkle scale stays fixed in physical units.
- `paintCoarseMetalFlakeGold` — gold specialty factory or coachbuilt finish with visibly coarser reflective flakes under clear gloss; sparkle scale stays fixed in physical units.
- `paintCoarseMetalFlakeRed` — red specialty factory or coachbuilt finish with visibly coarser reflective flakes under clear gloss; sparkle scale stays fixed in physical units.
- `paintCoarseMetalFlakeBlue` — blue specialty factory or coachbuilt finish with visibly coarser reflective flakes under clear gloss; sparkle scale stays fixed in physical units.
- `paintCoarseMetalFlakeGreen` — green specialty factory or coachbuilt finish with visibly coarser reflective flakes under clear gloss; sparkle scale stays fixed in physical units.

## Protective, textured, and functional coatings

- `powderCoatSmoothGlossWhite` — white opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossLightGray` — light gray opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossDarkGray` — dark gray opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossBlack` — black opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossRed` — red opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossOrange` — orange opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossYellow` — yellow opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossGreen` — green opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossBlue` — blue opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothGlossSilver` — silver opaque powder coating with glossy dielectric surface and restrained orange peel; silver uses metallic pigment beneath the resin surface.
- `powderCoatSmoothSatinWhite` — white satin powder coat; dense uniform coverage, broad highlights, and slight application microtexture.
- `powderCoatSmoothSatinGray` — gray satin powder coat; dense uniform coverage, broad highlights, and slight application microtexture.
- `powderCoatSmoothSatinBlack` — black satin powder coat; dense uniform coverage, broad highlights, and slight application microtexture.
- `powderCoatSmoothSatinRed` — red satin powder coat; dense uniform coverage, broad highlights, and slight application microtexture.
- `powderCoatSmoothSatinYellow` — yellow satin powder coat; dense uniform coverage, broad highlights, and slight application microtexture.
- `powderCoatSmoothSatinGreen` — green satin powder coat; dense uniform coverage, broad highlights, and slight application microtexture.
- `powderCoatSmoothSatinBlue` — blue satin powder coat; dense uniform coverage, broad highlights, and slight application microtexture.
- `powderCoatFineTextureWhite` — white fine-textured powder coat with low sheen and evenly distributed rounded microrelief.
- `powderCoatFineTextureGray` — gray fine-textured powder coat with low sheen and evenly distributed rounded microrelief.
- `powderCoatFineTextureBlack` — black fine-textured powder coat with low sheen and evenly distributed rounded microrelief.
- `powderCoatFineTextureRed` — red fine-textured powder coat with low sheen and evenly distributed rounded microrelief.
- `powderCoatFineTextureOrange` — orange fine-textured powder coat with low sheen and evenly distributed rounded microrelief.
- `powderCoatFineTextureGreen` — green fine-textured powder coat with low sheen and evenly distributed rounded microrelief.
- `powderCoatWrinkleBlack` — black wrinkle-finish powder coating; fine interconnected raised texture and matte-to-satin reflectance.
- `powderCoatWrinkleGray` — gray wrinkle-finish powder coating; fine interconnected raised texture and matte-to-satin reflectance.
- `powderCoatWrinkleRed` — red wrinkle-finish powder coating; fine interconnected raised texture and matte-to-satin reflectance.
- `powderCoatWrinkleBlue` — blue wrinkle-finish powder coating; fine interconnected raised texture and matte-to-satin reflectance.
- `polyurethaneBedLinerBlack` — black spray-applied polyurethane or polyurea protective coating; dense granular elastomer texture and low satin sheen.
- `polyurethaneBedLinerCharcoal` — charcoal spray-applied polyurethane or polyurea protective coating; dense granular elastomer texture and low satin sheen.
- `polyurethaneBedLinerGray` — gray spray-applied polyurethane or polyurea protective coating; dense granular elastomer texture and low satin sheen.
- `polyurethaneBedLinerTan` — tan spray-applied polyurethane or polyurea protective coating; dense granular elastomer texture and low satin sheen.
- `rubberizedStoneGuardBlack` — black flexible stone-chip-resistant coating; coarse sprayed stipple, opaque dielectric response, low-to-medium sheen.
- `rubberizedStoneGuardGray` — gray flexible stone-chip-resistant coating; coarse sprayed stipple, opaque dielectric response, low-to-medium sheen.
- `rubberizedStoneGuardWhite` — white flexible stone-chip-resistant coating; coarse sprayed stipple, opaque dielectric response, low-to-medium sheen.
- `rubberizedStoneGuardBeige` — beige flexible stone-chip-resistant coating; coarse sprayed stipple, opaque dielectric response, low-to-medium sheen.
- `underbodyProtectiveCoatingBlack` — Clean, factory-applied black underbody protection; thick stippled or waxy finish with restrained satin highlights and no road contamination.
- `underbodyProtectiveCoatingDarkBrown` — Clean, factory-applied dark brown underbody protection; thick stippled or waxy finish with restrained satin highlights and no road contamination.
- `underbodyProtectiveCoatingGray` — Clean, factory-applied gray underbody protection; thick stippled or waxy finish with restrained satin highlights and no road contamination.
- `cavityWaxPaleAmber` — Fresh pale amber anti-corrosion wax; translucent thin-film appearance with waxy low gloss and thickness-dependent absorption.
- `cavityWaxAmber` — Fresh amber anti-corrosion wax; translucent thin-film appearance with waxy low gloss and thickness-dependent absorption.
- `cavityWaxBrown` — Fresh brown anti-corrosion wax; translucent thin-film appearance with waxy low gloss and thickness-dependent absorption.
- `electrocoatPrimerGray` — Clean gray electrophoretic corrosion-protection primer; smooth low-sheen opaque coating without topcoat depth.
- `electrocoatPrimerDarkGray` — Clean dark gray electrophoretic corrosion-protection primer; smooth low-sheen opaque coating without topcoat depth.
- `electrocoatPrimerBlack` — Clean black electrophoretic corrosion-protection primer; smooth low-sheen opaque coating without topcoat depth.
- `electrocoatPrimerBrown` — Clean brown electrophoretic corrosion-protection primer; smooth low-sheen opaque coating without topcoat depth.
- `surfacerPrimerWhite` — New white primer-surfacer; opaque matte fine-grained coating for intentionally visible unfinished manufacturing surfaces.
- `surfacerPrimerGray` — New gray primer-surfacer; opaque matte fine-grained coating for intentionally visible unfinished manufacturing surfaces.
- `surfacerPrimerBeige` — New beige primer-surfacer; opaque matte fine-grained coating for intentionally visible unfinished manufacturing surfaces.
- `surfacerPrimerRedBrown` — New red brown primer-surfacer; opaque matte fine-grained coating for intentionally visible unfinished manufacturing surfaces.
- `seamSealerWhite` — white cured polymer seam-sealing compound; opaque, slightly irregular skin and matte-to-satin elastomer reflectance.
- `seamSealerGray` — gray cured polymer seam-sealing compound; opaque, slightly irregular skin and matte-to-satin elastomer reflectance.
- `seamSealerBlack` — black cured polymer seam-sealing compound; opaque, slightly irregular skin and matte-to-satin elastomer reflectance.
- `seamSealerBeige` — beige cured polymer seam-sealing compound; opaque, slightly irregular skin and matte-to-satin elastomer reflectance.
- `highTemperatureCeramicCoatingBlack` — black factory-applied ceramic thermal coating; fine ceramic texture and matte-to-satin dielectric appearance; metallic-looking variants require a measured coated response.
- `highTemperatureCeramicCoatingGray` — gray factory-applied ceramic thermal coating; fine ceramic texture and matte-to-satin dielectric appearance; metallic-looking variants require a measured coated response.
- `highTemperatureCeramicCoatingSilver` — silver factory-applied ceramic thermal coating; fine ceramic texture and matte-to-satin dielectric appearance; metallic-looking variants require a measured coated response.
- `highTemperatureCeramicCoatingWhite` — white factory-applied ceramic thermal coating; fine ceramic texture and matte-to-satin dielectric appearance; metallic-looking variants require a measured coated response.
- `highTemperatureCeramicCoatingBronze` — bronze factory-applied ceramic thermal coating; fine ceramic texture and matte-to-satin dielectric appearance; metallic-looking variants require a measured coated response.
- `antiSlipCoatingBlack` — black resin coating containing coarse anti-slip aggregate; opaque low gloss and strong granular surface texture.
- `antiSlipCoatingGray` — gray resin coating containing coarse anti-slip aggregate; opaque low gloss and strong granular surface texture.
- `antiSlipCoatingYellow` — yellow resin coating containing coarse anti-slip aggregate; opaque low gloss and strong granular surface texture.
- `phosphateCoatingDarkGray` — Fresh dark-gray conversion-coated steel appearance; very fine crystalline matte texture with weak diffuse metallic reflections.
- `blackOxideCoating` — New black oxide conversion finish over steel; nearly black, subtle metallic sheen, fine substrate texture, optional thin factory oil film.

## Decorative films, wraps, and laminates

- `vinylWrapGlossWhite` — white opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossGray` — gray opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossBlack` — black opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossRed` — red opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossOrange` — orange opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossYellow` — yellow opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossGreen` — green opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossBlue` — blue opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossPurple` — purple opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossPink` — pink opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapGlossBeige` — beige opaque automotive vinyl film; smooth glossy dielectric surface with slight film texture and no metal flakes.
- `vinylWrapSatinWhite` — white opaque vinyl film with satin finish and fine uniform surface texture.
- `vinylWrapSatinGray` — gray opaque vinyl film with satin finish and fine uniform surface texture.
- `vinylWrapSatinBlack` — black opaque vinyl film with satin finish and fine uniform surface texture.
- `vinylWrapSatinRed` — red opaque vinyl film with satin finish and fine uniform surface texture.
- `vinylWrapSatinGreen` — green opaque vinyl film with satin finish and fine uniform surface texture.
- `vinylWrapSatinBlue` — blue opaque vinyl film with satin finish and fine uniform surface texture.
- `vinylWrapSatinSand` — sand opaque vinyl film with satin finish and fine uniform surface texture.
- `vinylWrapMatteWhite` — white matte vinyl film; diffuse low-gloss highlights, fine surface grain, no weathering.
- `vinylWrapMatteGray` — gray matte vinyl film; diffuse low-gloss highlights, fine surface grain, no weathering.
- `vinylWrapMatteBlack` — black matte vinyl film; diffuse low-gloss highlights, fine surface grain, no weathering.
- `vinylWrapMatteOliveGreen` — olive green matte vinyl film; diffuse low-gloss highlights, fine surface grain, no weathering.
- `vinylWrapMatteBlue` — blue matte vinyl film; diffuse low-gloss highlights, fine surface grain, no weathering.
- `vinylWrapMatteSand` — sand matte vinyl film; diffuse low-gloss highlights, fine surface grain, no weathering.
- `vinylWrapMetallicSilver` — silver metallic-effect vinyl film with fine embedded reflective pigment beneath a smooth gloss polymer surface.
- `vinylWrapMetallicGunmetal` — gunmetal metallic-effect vinyl film with fine embedded reflective pigment beneath a smooth gloss polymer surface.
- `vinylWrapMetallicGold` — gold metallic-effect vinyl film with fine embedded reflective pigment beneath a smooth gloss polymer surface.
- `vinylWrapMetallicBronze` — bronze metallic-effect vinyl film with fine embedded reflective pigment beneath a smooth gloss polymer surface.
- `vinylWrapMetallicBlue` — blue metallic-effect vinyl film with fine embedded reflective pigment beneath a smooth gloss polymer surface.
- `vinylWrapMetallicRed` — red metallic-effect vinyl film with fine embedded reflective pigment beneath a smooth gloss polymer surface.
- `vinylWrapBrushedMetalSilver` — silver brushed-metal-effect film; directional fine-line pattern beneath a satin polymer surface, with less conductive reflectance than exposed metal.
- `vinylWrapBrushedMetalBlack` — black brushed-metal-effect film; directional fine-line pattern beneath a satin polymer surface, with less conductive reflectance than exposed metal.
- `vinylWrapBrushedMetalGold` — gold brushed-metal-effect film; directional fine-line pattern beneath a satin polymer surface, with less conductive reflectance than exposed metal.
- `vinylWrapCarbonFiberBlack` — Black carbon-weave printed or embossed vinyl; repeated two-tone weave pattern with polymer reflections, without the optical depth of real carbon composite.
- `vinylWrapForgedCarbonBlack` — Black chopped-carbon-effect printed vinyl; irregular dark fleck pattern beneath a smooth polymer surface.
- `clearPaintProtectionFilmGloss` — Colorless transparent polyurethane protection film; glossy dielectric surface, faint fine-scale film texture, negligible color shift at nominal thickness.
- `clearPaintProtectionFilmSatin` — Colorless transparent protection film with satin outer surface; broadens underlying paint reflections while retaining its color.
- `clearPaintProtectionFilmMatte` — Colorless transparent protection film with matte outer surface; strong reflection diffusion while retaining transmitted paint color.
- `transparentProtectiveFilmAmber` — Pale amber transparent protective polymer film; smooth glossy dielectric surface and mild absorption tint.
- `printedCamouflageFilmWoodlandGreen` — woodland green factory-applied printed camouflage vinyl; matte dielectric film with a multi-color printed albedo pattern; colors form a single patterned material.
- `printedCamouflageFilmDesertTan` — desert tan factory-applied printed camouflage vinyl; matte dielectric film with a multi-color printed albedo pattern; colors form a single patterned material.
- `printedCamouflageFilmSnowGray` — snow gray factory-applied printed camouflage vinyl; matte dielectric film with a multi-color printed albedo pattern; colors form a single patterned material.

## Exposed metals and metallic finishes

- `aluminumPolished` — Clean neutral-silver aluminum with bright conductor reflections, fine polishing texture, and very low roughness.
- `aluminumBrushed` — Clean silver aluminum with fine directional brushing and anisotropic conductor highlights.
- `aluminumSatin` — Silver aluminum with uniform fine abrasion, soft metallic highlights, and modest anisotropy.
- `aluminumBeadBlasted` — Clean aluminum with fine isotropic bead-blast texture and broad gray-silver metallic reflections.
- `aluminumCast` — New cast aluminum; light silver-gray conductor response with fine casting grain and restrained gloss.
- `aluminumDieCast` — New die-cast aluminum; dense smooth gray-silver surface with subtle flow texture and no oxidation stains.
- `aluminumMachined` — Fresh machined aluminum; directional tool-finish microtexture and bright silver conductor reflectance.
- `aluminumDiamondTurned` — Bright diamond-turned aluminum finish with extremely fine directional cutting texture and strong anisotropic highlights.
- `aluminumClearCoated` — Clean satin silver aluminum beneath a transparent dielectric protective coating; preserve the underlying metal response.
- `aluminumRolled` — Mill-finish rolled aluminum; silver conductor appearance with fine parallel rolling texture.
- `stainlessSteelPolished` — Clean polished stainless steel; neutral-to-slightly-warm conductor reflections and fine polishing microtexture.
- `stainlessSteelBrushed` — Clean brushed stainless steel; directional linear grain, medium roughness, and anisotropic highlights.
- `stainlessSteelSatin` — Clean stainless steel with uniform satin abrasion and subdued metallic reflections.
- `stainlessSteelBeadBlasted` — Clean stainless steel with fine isotropic blast texture and broad metallic highlights.
- `stainlessSteelMachined` — Freshly machined stainless steel; directional machining microtexture and moderately bright conductor reflections.
- `stainlessSteelRolled` — New mill-finish stainless steel; subdued rolling texture and low-to-medium metallic sheen.
- `steelColdRolled` — Clean cold-rolled steel with fine linear mill texture and neutral gray conductor response; no rust or handling marks.
- `steelMachined` — Freshly machined steel; neutral gray metallic response with directional tool texture.
- `steelForged` — New forged steel finish; fine subdued process texture and dark gray metallic reflectance, without corrosion.
- `castIronFresh` — Clean new cast iron; dark charcoal conductor response, granular casting texture, and subdued reflections.
- `castIronMachined` — Freshly machined cast iron; fine directional cutting texture and moderately reflective gray metallic surface.
- `magnesiumCast` — Clean new magnesium-alloy casting; pale gray metallic appearance with fine casting grain.
- `titaniumBrushed` — Clean titanium with subdued warm gray metallic reflectance and fine directional brushing.
- `titaniumPolished` — Clean polished titanium; slightly dark warm gray conductor reflections and low roughness.
- `copperBare` — Fresh clean copper; reddish-orange conductor reflectance, fine manufacturing texture, no tarnish or patina.
- `copperTinned` — Tin-coated copper appearance; pale silver metallic surface with fine plating texture.
- `brassBare` — Fresh clean brass; yellow-gold conductor reflectance with fine manufacturing texture and no tarnish.
- `brassBrushed` — New yellow-gold brass with directional brushed grain and anisotropic metallic highlights.
- `bronzeBare` — Fresh clean bronze; warm brown-gold conductor reflectance and fine satin manufacturing texture.
- `zincDieCast` — Clean zinc-alloy casting; pale cool-gray metallic reflectance and fine casting texture.
- `leadAlloyClean` — Clean new lead-alloy surface; dull gray metallic response and fine soft manufacturing texture.
- `chromePlatedBrightSilver` — bright silver decorative chromium-based plated finish; smooth conductive reflections with roughness appropriate to the named finish, no corrosion.
- `chromePlatedSatinSilver` — satin silver decorative chromium-based plated finish; smooth conductive reflections with roughness appropriate to the named finish, no corrosion.
- `chromePlatedSmokedGray` — smoked gray decorative chromium-based plated finish; smooth conductive reflections with roughness appropriate to the named finish, no corrosion.
- `chromePlatedBlack` — black decorative chromium-based plated finish; smooth conductive reflections with roughness appropriate to the named finish, no corrosion.
- `nickelPlatedBrightSilver` — bright silver nickel-plated finish; subtly warm metallic reflections and fine plating texture.
- `nickelPlatedSatinSilver` — satin silver nickel-plated finish; subtly warm metallic reflections and fine plating texture.
- `nickelPlatedWarmSilver` — warm silver nickel-plated finish; subtly warm metallic reflections and fine plating texture.
- `zincPlatedClearSilver` — New clear silver zinc-plated steel appearance; fine metallic plating texture, with mild angular interference only for the iridescent conversion finish.
- `zincPlatedYellowIridescent` — New yellow iridescent zinc-plated steel appearance; fine metallic plating texture, with mild angular interference only for the iridescent conversion finish.
- `zincPlatedBlack` — New black zinc-plated steel appearance; fine metallic plating texture, with mild angular interference only for the iridescent conversion finish.
- `galvanizedSteelFineSpangle` — Clean new hot-dip galvanized steel with fine zinc crystal pattern, silver-gray reflectance, and subtle patchwise roughness variation.
- `galvanizedSteelLargeSpangle` — Clean new galvanized steel with larger zinc crystal domains and varying metallic reflection direction; no white corrosion.
- `galvanizedSteelSpangleFree` — Clean smooth galvanized steel with visually minimal crystal pattern and soft silver-gray metallic reflections.
- `aluminumZincCoatedSteel` — New aluminum-zinc-coated steel; fine crystalline silver pattern with modest metallic roughness and no corrosion.
- `anodizedAluminumSatinNaturalSilver` — natural silver anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinBlack` — black anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinGray` — gray anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinRed` — red anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinOrange` — orange anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinGold` — gold anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinBronze` — bronze anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinGreen` — green anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinBlue` — blue anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumSatinPurple` — purple anodized aluminum; tinted oxide over metallic aluminum, satin directional substrate texture, and metallic depth rather than opaque paint.
- `anodizedAluminumBrushedNaturalSilver` — natural silver anodized aluminum with fine directional brushing visible through the oxide layer and anisotropic highlights.
- `anodizedAluminumBrushedBlack` — black anodized aluminum with fine directional brushing visible through the oxide layer and anisotropic highlights.
- `anodizedAluminumBrushedBronze` — bronze anodized aluminum with fine directional brushing visible through the oxide layer and anisotropic highlights.
- `anodizedAluminumBrushedBlue` — blue anodized aluminum with fine directional brushing visible through the oxide layer and anisotropic highlights.
- `pvdMetalFinishSilver` — silver decorative physical-vapor-deposited metallic finish; smooth thin coating with conductor-like tinted reflections over a finely finished substrate.
- `pvdMetalFinishBlack` — black decorative physical-vapor-deposited metallic finish; smooth thin coating with conductor-like tinted reflections over a finely finished substrate.
- `pvdMetalFinishGraphite` — graphite decorative physical-vapor-deposited metallic finish; smooth thin coating with conductor-like tinted reflections over a finely finished substrate.
- `pvdMetalFinishGold` — gold decorative physical-vapor-deposited metallic finish; smooth thin coating with conductor-like tinted reflections over a finely finished substrate.
- `pvdMetalFinishRoseGold` — rose gold decorative physical-vapor-deposited metallic finish; smooth thin coating with conductor-like tinted reflections over a finely finished substrate.
- `pvdMetalFinishBronze` — bronze decorative physical-vapor-deposited metallic finish; smooth thin coating with conductor-like tinted reflections over a finely finished substrate.
- `pvdMetalFinishBlue` — blue decorative physical-vapor-deposited metallic finish; smooth thin coating with conductor-like tinted reflections over a finely finished substrate.
- `titaniumNitrideGold` — Clean gold-toned titanium nitride hard coating; saturated metallic reflections and smooth fine-grained surface.
- `diamondLikeCarbonBlack` — Clean dark charcoal diamond-like-carbon coating; smooth low-friction finish with restrained glossy reflections; calibrate the optical response to the coating.
- `electrolessNickelSatin` — New electroless nickel finish; pale warm silver with uniform satin microtexture and moderate metallic reflection.

## Rigid molded plastics and polymer finishes

- `absFineGrainBlack` — black opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absFineGrainCharcoal` — charcoal opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absFineGrainGray` — gray opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absFineGrainLightGray` — light gray opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absFineGrainBeige` — beige opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absFineGrainTan` — tan opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absFineGrainBrown` — brown opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absFineGrainIvory` — ivory opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absFineGrainWhite` — white opaque ABS with fine molded leather-like grain; satin dielectric reflections and consistent texture scale.
- `absSmoothSatinBlack` — black opaque ABS; smooth satin surface with subtle molding microtexture, no metal response.
- `absSmoothSatinCharcoal` — charcoal opaque ABS; smooth satin surface with subtle molding microtexture, no metal response.
- `absSmoothSatinGray` — gray opaque ABS; smooth satin surface with subtle molding microtexture, no metal response.
- `absSmoothSatinBeige` — beige opaque ABS; smooth satin surface with subtle molding microtexture, no metal response.
- `absSmoothSatinWhite` — white opaque ABS; smooth satin surface with subtle molding microtexture, no metal response.
- `absSmoothSatinRed` — red opaque ABS; smooth satin surface with subtle molding microtexture, no metal response.
- `absSmoothSatinBlue` — blue opaque ABS; smooth satin surface with subtle molding microtexture, no metal response.
- `absGlossBlack` — black opaque glossy ABS; smooth dielectric reflections; silver denotes metallic-effect pigmentation beneath the polymer surface.
- `absGlossWhite` — white opaque glossy ABS; smooth dielectric reflections; silver denotes metallic-effect pigmentation beneath the polymer surface.
- `absGlossRed` — red opaque glossy ABS; smooth dielectric reflections; silver denotes metallic-effect pigmentation beneath the polymer surface.
- `absGlossBlue` — blue opaque glossy ABS; smooth dielectric reflections; silver denotes metallic-effect pigmentation beneath the polymer surface.
- `absGlossSilver` — silver opaque glossy ABS; smooth dielectric reflections; silver denotes metallic-effect pigmentation beneath the polymer surface.
- `polypropyleneCoarseGrainBlack` — black opaque polypropylene with coarse molded grain; low-sheen dielectric surface and slightly waxy highlights.
- `polypropyleneCoarseGrainCharcoal` — charcoal opaque polypropylene with coarse molded grain; low-sheen dielectric surface and slightly waxy highlights.
- `polypropyleneCoarseGrainGray` — gray opaque polypropylene with coarse molded grain; low-sheen dielectric surface and slightly waxy highlights.
- `polypropyleneCoarseGrainLightGray` — light gray opaque polypropylene with coarse molded grain; low-sheen dielectric surface and slightly waxy highlights.
- `polypropyleneCoarseGrainBeige` — beige opaque polypropylene with coarse molded grain; low-sheen dielectric surface and slightly waxy highlights.
- `polypropyleneCoarseGrainTan` — tan opaque polypropylene with coarse molded grain; low-sheen dielectric surface and slightly waxy highlights.
- `polypropyleneCoarseGrainBrown` — brown opaque polypropylene with coarse molded grain; low-sheen dielectric surface and slightly waxy highlights.
- `polypropyleneFineGrainBlack` — black opaque polypropylene with fine molded texture and matte-to-satin reflectance.
- `polypropyleneFineGrainCharcoal` — charcoal opaque polypropylene with fine molded texture and matte-to-satin reflectance.
- `polypropyleneFineGrainGray` — gray opaque polypropylene with fine molded texture and matte-to-satin reflectance.
- `polypropyleneFineGrainBeige` — beige opaque polypropylene with fine molded texture and matte-to-satin reflectance.
- `polypropyleneFineGrainWhite` — white opaque polypropylene with fine molded texture and matte-to-satin reflectance.
- `polypropyleneSmoothBlack` — black smooth molded polypropylene; low-to-medium gloss dielectric response with faint manufacturing flow variation.
- `polypropyleneSmoothGray` — gray smooth molded polypropylene; low-to-medium gloss dielectric response with faint manufacturing flow variation.
- `polypropyleneSmoothWhite` — white smooth molded polypropylene; low-to-medium gloss dielectric response with faint manufacturing flow variation.
- `polypropyleneSmoothRed` — red smooth molded polypropylene; low-to-medium gloss dielectric response with faint manufacturing flow variation.
- `polypropyleneSmoothOrange` — orange smooth molded polypropylene; low-to-medium gloss dielectric response with faint manufacturing flow variation.
- `polypropyleneSmoothYellow` — yellow smooth molded polypropylene; low-to-medium gloss dielectric response with faint manufacturing flow variation.
- `polypropyleneSmoothGreen` — green smooth molded polypropylene; low-to-medium gloss dielectric response with faint manufacturing flow variation.
- `polypropyleneSmoothBlue` — blue smooth molded polypropylene; low-to-medium gloss dielectric response with faint manufacturing flow variation.
- `polycarbonateOpaqueBlack` — black opaque polycarbonate; smooth hard dielectric surface with medium gloss and very fine molded texture.
- `polycarbonateOpaqueWhite` — white opaque polycarbonate; smooth hard dielectric surface with medium gloss and very fine molded texture.
- `polycarbonateOpaqueGray` — gray opaque polycarbonate; smooth hard dielectric surface with medium gloss and very fine molded texture.
- `pcAbsSatinBlack` — black PC/ABS blend; smooth satin engineering plastic with fine uniform grain.
- `pcAbsSatinCharcoal` — charcoal PC/ABS blend; smooth satin engineering plastic with fine uniform grain.
- `pcAbsSatinGray` — gray PC/ABS blend; smooth satin engineering plastic with fine uniform grain.
- `pcAbsSatinBeige` — beige PC/ABS blend; smooth satin engineering plastic with fine uniform grain.
- `pcAbsSatinIvory` — ivory PC/ABS blend; smooth satin engineering plastic with fine uniform grain.
- `nylonMoldedBlack` — black opaque molded nylon; fine satin microtexture with slight waxy dielectric sheen.
- `nylonMoldedDarkGray` — dark gray opaque molded nylon; fine satin microtexture with slight waxy dielectric sheen.
- `nylonMoldedNaturalIvory` — natural ivory opaque molded nylon; fine satin microtexture with slight waxy dielectric sheen.
- `glassFilledNylonBlack` — black glass-filled nylon; matte fine fibrous surface texture, subtle flow mottling, opaque dielectric response.
- `glassFilledNylonGray` — gray glass-filled nylon; matte fine fibrous surface texture, subtle flow mottling, opaque dielectric response.
- `glassFilledNylonNaturalBeige` — natural beige glass-filled nylon; matte fine fibrous surface texture, subtle flow mottling, opaque dielectric response.
- `acetalMoldedBlack` — black molded acetal; dense smooth engineering polymer with a mild waxy satin sheen.
- `acetalMoldedWhite` — white molded acetal; dense smooth engineering polymer with a mild waxy satin sheen.
- `acetalMoldedNaturalIvory` — natural ivory molded acetal; dense smooth engineering polymer with a mild waxy satin sheen.
- `ptfeWhite` — white PTFE-based polymer; soft matte dielectric response with very fine texture; black represents a filled formulation.
- `ptfeCream` — cream PTFE-based polymer; soft matte dielectric response with very fine texture; black represents a filled formulation.
- `ptfeBlack` — black PTFE-based polymer; soft matte dielectric response with very fine texture; black represents a filled formulation.
- `peekNaturalTan` — natural tan PEEK engineering polymer; smooth low-sheen opaque surface, fine molding texture.
- `peekBlack` — black PEEK engineering polymer; smooth low-sheen opaque surface, fine molding texture.
- `polyurethaneRigidBlack` — black rigid polyurethane; opaque molded dielectric material with fine skin texture and satin highlights.
- `polyurethaneRigidGray` — gray rigid polyurethane; opaque molded dielectric material with fine skin texture and satin highlights.
- `polyurethaneRigidWhite` — white rigid polyurethane; opaque molded dielectric material with fine skin texture and satin highlights.
- `polyurethaneRigidYellow` — yellow rigid polyurethane; opaque molded dielectric material with fine skin texture and satin highlights.
- `hdpeRotomoldedBlack` — black rotationally molded high-density polyethylene; rounded fine surface grain and waxy low gloss; the natural version has thickness-dependent milky transmission.
- `hdpeRotomoldedWhite` — white rotationally molded high-density polyethylene; rounded fine surface grain and waxy low gloss; the natural version has thickness-dependent milky transmission.
- `hdpeRotomoldedNaturalTranslucent` — natural translucent rotationally molded high-density polyethylene; rounded fine surface grain and waxy low gloss; the natural version has thickness-dependent milky transmission.
- `hdpeRotomoldedYellow` — yellow rotationally molded high-density polyethylene; rounded fine surface grain and waxy low gloss; the natural version has thickness-dependent milky transmission.
- `hdpeRotomoldedOrange` — orange rotationally molded high-density polyethylene; rounded fine surface grain and waxy low gloss; the natural version has thickness-dependent milky transmission.
- `hdpeRotomoldedGreen` — green rotationally molded high-density polyethylene; rounded fine surface grain and waxy low gloss; the natural version has thickness-dependent milky transmission.
- `hdpeRotomoldedBlue` — blue rotationally molded high-density polyethylene; rounded fine surface grain and waxy low gloss; the natural version has thickness-dependent milky transmission.
- `ldpeFlexibleBlack` — black flexible polyethylene; soft waxy surface with fine texture; the natural version has diffuse milky transmission.
- `ldpeFlexibleNaturalTranslucent` — natural translucent flexible polyethylene; soft waxy surface with fine texture; the natural version has diffuse milky transmission.
- `ldpeFlexibleWhite` — white flexible polyethylene; soft waxy surface with fine texture; the natural version has diffuse milky transmission.
- `polyamideFlexibleFinishBlack` — black flexible polyamide polymer; fine semi-matte molding texture and subdued dielectric reflections.
- `polyamideFlexibleFinishGray` — gray flexible polyamide polymer; fine semi-matte molding texture and subdued dielectric reflections.
- `polyamideFlexibleFinishOrange` — orange flexible polyamide polymer; fine semi-matte molding texture and subdued dielectric reflections.
- `phenolicResinBlack` — black cured phenolic resin; dense opaque material with fine molded texture and subdued satin reflectance.
- `phenolicResinDarkBrown` — dark brown cured phenolic resin; dense opaque material with fine molded texture and subdued satin reflectance.
- `phenolicResinReddishBrown` — reddish brown cured phenolic resin; dense opaque material with fine molded texture and subdued satin reflectance.
- `softTouchPolyurethaneBlack` — black soft-touch polyurethane coating; very fine matte velvet-like microtexture, broad highlights, and slight tactile-looking softness.
- `softTouchPolyurethaneCharcoal` — charcoal soft-touch polyurethane coating; very fine matte velvet-like microtexture, broad highlights, and slight tactile-looking softness.
- `softTouchPolyurethaneGray` — gray soft-touch polyurethane coating; very fine matte velvet-like microtexture, broad highlights, and slight tactile-looking softness.
- `softTouchPolyurethaneBeige` — beige soft-touch polyurethane coating; very fine matte velvet-like microtexture, broad highlights, and slight tactile-looking softness.
- `softTouchPolyurethaneBrown` — brown soft-touch polyurethane coating; very fine matte velvet-like microtexture, broad highlights, and slight tactile-looking softness.
- `paintedPlasticSatinBlack` — black decorative paint over plastic; satin dielectric top surface with fine sprayed texture; metal-effect colors use embedded reflective pigment.
- `paintedPlasticSatinGray` — gray decorative paint over plastic; satin dielectric top surface with fine sprayed texture; metal-effect colors use embedded reflective pigment.
- `paintedPlasticSatinSilver` — silver decorative paint over plastic; satin dielectric top surface with fine sprayed texture; metal-effect colors use embedded reflective pigment.
- `paintedPlasticSatinChampagne` — champagne decorative paint over plastic; satin dielectric top surface with fine sprayed texture; metal-effect colors use embedded reflective pigment.
- `paintedPlasticSatinBronze` — bronze decorative paint over plastic; satin dielectric top surface with fine sprayed texture; metal-effect colors use embedded reflective pigment.
- `paintedPlasticSatinWhite` — white decorative paint over plastic; satin dielectric top surface with fine sprayed texture; metal-effect colors use embedded reflective pigment.
- `paintedPlasticGlossPianoBlack` — piano black decorative paint over plastic with glossy clear finish; smooth reflections, fine paint microtexture, opaque substrate.
- `paintedPlasticGlossWhite` — white decorative paint over plastic with glossy clear finish; smooth reflections, fine paint microtexture, opaque substrate.
- `paintedPlasticGlossRed` — red decorative paint over plastic with glossy clear finish; smooth reflections, fine paint microtexture, opaque substrate.
- `paintedPlasticGlossBlue` — blue decorative paint over plastic with glossy clear finish; smooth reflections, fine paint microtexture, opaque substrate.
- `paintedPlasticGlossSilver` — silver decorative paint over plastic with glossy clear finish; smooth reflections, fine paint microtexture, opaque substrate.
- `recycledPlasticMottledBlack` — black recycled-content molded polymer with intentional subtle flecks and low-gloss grain; clean new appearance without contamination.
- `recycledPlasticMottledGray` — gray recycled-content molded polymer with intentional subtle flecks and low-gloss grain; clean new appearance without contamination.
- `recycledPlasticMottledBeige` — beige recycled-content molded polymer with intentional subtle flecks and low-gloss grain; clean new appearance without contamination.
- `bioFilledPolymerNaturalBeige` — natural beige plant-fiber-filled polymer; fine visible fiber flecks in a matte opaque resin surface.
- `bioFilledPolymerGray` — gray plant-fiber-filled polymer; fine visible fiber flecks in a matte opaque resin surface.
- `bioFilledPolymerBlack` — black plant-fiber-filled polymer; fine visible fiber flecks in a matte opaque resin surface.

## Transparent, translucent, and optical polymers

- `polycarbonateClearColorless` — colorless transparent polycarbonate; smooth glossy dielectric surface with thickness-dependent absorption and refraction; no emission.
- `polycarbonateClearLightSmoke` — light smoke transparent polycarbonate; smooth glossy dielectric surface with thickness-dependent absorption and refraction; no emission.
- `polycarbonateClearDarkSmoke` — dark smoke transparent polycarbonate; smooth glossy dielectric surface with thickness-dependent absorption and refraction; no emission.
- `polycarbonateClearAmber` — amber transparent polycarbonate; smooth glossy dielectric surface with thickness-dependent absorption and refraction; no emission.
- `polycarbonateClearRed` — red transparent polycarbonate; smooth glossy dielectric surface with thickness-dependent absorption and refraction; no emission.
- `polycarbonateClearBlue` — blue transparent polycarbonate; smooth glossy dielectric surface with thickness-dependent absorption and refraction; no emission.
- `polycarbonateClearGreen` — green transparent polycarbonate; smooth glossy dielectric surface with thickness-dependent absorption and refraction; no emission.
- `acrylicClearColorless` — colorless transparent PMMA acrylic; smooth high-clarity dielectric transmission and glossy reflections; tint comes from absorption.
- `acrylicClearLightSmoke` — light smoke transparent PMMA acrylic; smooth high-clarity dielectric transmission and glossy reflections; tint comes from absorption.
- `acrylicClearDarkSmoke` — dark smoke transparent PMMA acrylic; smooth high-clarity dielectric transmission and glossy reflections; tint comes from absorption.
- `acrylicClearAmber` — amber transparent PMMA acrylic; smooth high-clarity dielectric transmission and glossy reflections; tint comes from absorption.
- `acrylicClearRed` — red transparent PMMA acrylic; smooth high-clarity dielectric transmission and glossy reflections; tint comes from absorption.
- `acrylicClearBlue` — blue transparent PMMA acrylic; smooth high-clarity dielectric transmission and glossy reflections; tint comes from absorption.
- `acrylicClearGreen` — green transparent PMMA acrylic; smooth high-clarity dielectric transmission and glossy reflections; tint comes from absorption.
- `polycarbonateFrostedColorless` — colorless translucent polycarbonate; diffuse transmission from a fine frosted surface or bulk scattering, with broad dielectric highlights.
- `polycarbonateFrostedWhite` — white translucent polycarbonate; diffuse transmission from a fine frosted surface or bulk scattering, with broad dielectric highlights.
- `polycarbonateFrostedSmoke` — smoke translucent polycarbonate; diffuse transmission from a fine frosted surface or bulk scattering, with broad dielectric highlights.
- `acrylicDiffuserOpalWhite` — opal white translucent acrylic diffuser; soft bulk scattering and low-to-medium gloss, with no self-emission.
- `acrylicDiffuserWarmWhite` — warm white translucent acrylic diffuser; soft bulk scattering and low-to-medium gloss, with no self-emission.
- `acrylicDiffuserCoolWhite` — cool white translucent acrylic diffuser; soft bulk scattering and low-to-medium gloss, with no self-emission.
- `opticalSiliconeClear` — Colorless optical silicone; transparent soft dielectric with smooth glossy reflections and very low haze.
- `opticalSiliconeDiffusingWhite` — White translucent optical silicone with strong diffuse transmission and smooth soft-satin surface.
- `retroreflectiveMicroprismClear` — Colorless microstructured optical polymer; directional return toward the illumination source, smooth protective outer film, no self-emission; use a retroreflective scattering response.
- `retroreflectiveMicroprismWhite` — white retroreflective optical polymer; tinted directional return toward the light source with glossy protective surface, no emission.
- `retroreflectiveMicroprismRed` — red retroreflective optical polymer; tinted directional return toward the light source with glossy protective surface, no emission.
- `retroreflectiveMicroprismAmber` — amber retroreflective optical polymer; tinted directional return toward the light source with glossy protective surface, no emission.
- `retroreflectiveMicroprismYellow` — yellow retroreflective optical polymer; tinted directional return toward the light source with glossy protective surface, no emission.
- `nearInfraredTransparentPolymerBlack` — Visibly black optical polymer with a smooth gloss surface; near-infrared transmission is a spectral property, while visible rendering remains dark and non-emissive.
- `radarTransparentPolymerBlack` — Opaque black low-loss polymer finish; fine satin dielectric surface. Radio-frequency transparency does not imply visible transparency.
- `radarTransparentPolymerGray` — Opaque gray low-loss polymer finish; smooth satin dielectric surface and no visible transmission.
- `antiReflectiveOpticalPolymerClear` — Colorless optical polymer with anti-reflective surface treatment; clear transmission and reduced front-surface glare, possibly faint residual angular tint.

## Automotive and machinery glazing

- `glassLaminatedClear` — clear laminated safety glazing; transparent glass plies with a clear bonding interlayer, glossy surface reflections, refraction, and thickness-dependent absorption.
- `glassLaminatedLightGreen` — light green laminated safety glazing; transparent glass plies with a clear bonding interlayer, glossy surface reflections, refraction, and thickness-dependent absorption.
- `glassLaminatedLightBlue` — light blue laminated safety glazing; transparent glass plies with a clear bonding interlayer, glossy surface reflections, refraction, and thickness-dependent absorption.
- `glassLaminatedLightGray` — light gray laminated safety glazing; transparent glass plies with a clear bonding interlayer, glossy surface reflections, refraction, and thickness-dependent absorption.
- `glassLaminatedBronze` — bronze laminated safety glazing; transparent glass plies with a clear bonding interlayer, glossy surface reflections, refraction, and thickness-dependent absorption.
- `glassLaminatedDarkGray` — dark gray laminated safety glazing; transparent glass plies with a clear bonding interlayer, glossy surface reflections, refraction, and thickness-dependent absorption.
- `glassTemperedClear` — clear tempered safety glass; glossy dielectric reflections, clear refraction, and absorption tint without artificial opacity.
- `glassTemperedLightGreen` — light green tempered safety glass; glossy dielectric reflections, clear refraction, and absorption tint without artificial opacity.
- `glassTemperedLightBlue` — light blue tempered safety glass; glossy dielectric reflections, clear refraction, and absorption tint without artificial opacity.
- `glassTemperedLightGray` — light gray tempered safety glass; glossy dielectric reflections, clear refraction, and absorption tint without artificial opacity.
- `glassTemperedBronze` — bronze tempered safety glass; glossy dielectric reflections, clear refraction, and absorption tint without artificial opacity.
- `glassTemperedDarkGray` — dark gray tempered safety glass; glossy dielectric reflections, clear refraction, and absorption tint without artificial opacity.
- `glassTemperedDeepPrivacyGray` — deep privacy gray tempered safety glass; glossy dielectric reflections, clear refraction, and absorption tint without artificial opacity.
- `glassAcousticLaminatedClear` — clear laminated glass with acoustically damping interlayer; visually clear glossy transmission with mild absorption tint; acoustics add no visible pattern.
- `glassAcousticLaminatedLightGreen` — light green laminated glass with acoustically damping interlayer; visually clear glossy transmission with mild absorption tint; acoustics add no visible pattern.
- `glassAcousticLaminatedLightGray` — light gray laminated glass with acoustically damping interlayer; visually clear glossy transmission with mild absorption tint; acoustics add no visible pattern.
- `glassSolarControlNeutralGray` — neutral gray solar-control coated glazing; transparent glass with slightly tinted, angle-dependent coated reflections and thickness-dependent absorption.
- `glassSolarControlBlueGray` — blue gray solar-control coated glazing; transparent glass with slightly tinted, angle-dependent coated reflections and thickness-dependent absorption.
- `glassSolarControlGreenGray` — green gray solar-control coated glazing; transparent glass with slightly tinted, angle-dependent coated reflections and thickness-dependent absorption.
- `glassSolarControlBronze` — bronze solar-control coated glazing; transparent glass with slightly tinted, angle-dependent coated reflections and thickness-dependent absorption.
- `glassInfraredReflectiveNeutral` — neutral heat-reflective coated glazing; clear-to-tinted transmission and a restrained colored reflection from the optical coating.
- `glassInfraredReflectivePaleViolet` — pale violet heat-reflective coated glazing; clear-to-tinted transmission and a restrained colored reflection from the optical coating.
- `glassInfraredReflectivePaleBlue` — pale blue heat-reflective coated glazing; clear-to-tinted transmission and a restrained colored reflection from the optical coating.
- `glassPrivacyLaminatedSmokeGray` — smoke gray privacy laminated glass; strong absorption through the volume, glossy reflections, and nonzero transmitted light appropriate to the reference.
- `glassPrivacyLaminatedDeepBlack` — deep black privacy laminated glass; strong absorption through the volume, glossy reflections, and nonzero transmitted light appropriate to the reference.
- `glassPrivacyLaminatedBronze` — bronze privacy laminated glass; strong absorption through the volume, glossy reflections, and nonzero transmitted light appropriate to the reference.
- `glassElectrochromicClear` — Electrochromic glazing in its clear material state; transparent layered glass with a slight residual tint and glossy dielectric reflections.
- `glassElectrochromicDarkBlue` — Electrochromic glazing in its dark blue material state; strong blue absorption, glossy reflections, and reduced transparent transmission.
- `glassElectrochromicDarkGray` — Electrochromic glazing in its dark gray material state; strong neutral absorption with glossy reflections and reduced transmission.
- `glassSwitchablePrivacyClear` — Switchable privacy glazing in its clear state; transparent laminate with slight residual haze and glossy glass reflections.
- `glassSwitchablePrivacyFrosted` — Switchable privacy glazing in its scattering state; milky diffuse transmission through the laminate while outer glass reflections remain glossy.
- `glassHeatedTransparentCoating` — Clear glazing with a transparent conductive heating coating; subtle film tint and glossy reflections, without any discrete heater pattern.
- `glassAntiReflectiveClear` — Clear anti-reflective coated glazing; low front-surface reflection, high transmission, and faint residual coating tint at grazing angles.
- `glassBulletResistantClear` — Clear multi-layer ballistic glazing appearance; glass/polymer laminate with depth-dependent mild green or neutral absorption and glossy reflections.
- `glassBulletResistantGray` — Gray-tinted multi-layer ballistic glazing appearance; transparent absorbing laminate and glossy glass reflections.
- `glassCeramicFritBlack` — Opaque black fired ceramic enamel on glass; very fine matte-to-satin surface, nonmetallic and non-emissive.
- `glassCeramicFritDarkGray` — Opaque dark-gray fired ceramic enamel on glass; fine low-sheen ceramic texture.
- `glassTintFilmLightSmoke` — Transparent light smoke tint film; absorption-based tint with smooth dielectric outer reflections, intended as an optical layer rather than opaque paint.
- `glassTintFilmMediumSmoke` — Transparent medium smoke tint film; absorption-based tint with smooth dielectric outer reflections, intended as an optical layer rather than opaque paint.
- `glassTintFilmDarkSmoke` — Transparent dark smoke tint film; absorption-based tint with smooth dielectric outer reflections, intended as an optical layer rather than opaque paint.
- `glassTintFilmBronze` — Transparent bronze tint film; absorption-based tint with smooth dielectric outer reflections, intended as an optical layer rather than opaque paint.
- `glassTintFilmBlue` — Transparent blue tint film; absorption-based tint with smooth dielectric outer reflections, intended as an optical layer rather than opaque paint.
- `glassBondingInterlayerClear` — Clear transparent glazing interlayer polymer; subtle bulk absorption and smooth dielectric transmission, without scattering unless the reference shows it.

## Mirrored and reflective optical finishes

- `mirrorSilverNeutral` — Neutral silver mirror coating beneath a transparent protective dielectric; sharp high-reflectance conductor response, without emission.
- `mirrorAluminumNeutral` — Aluminum mirror coating; bright neutral conductor reflections beneath any specified protective dielectric.
- `mirrorBlueTint` — Blue-tinted anti-glare mirror finish; slightly blue reflected spectrum, smooth high clarity, and coated dielectric front surface.
- `mirrorElectrochromicClear` — Electrochromic mirror in its bright state; neutral sharp reflections through a clear electrochromic optical stack.
- `mirrorElectrochromicDimmed` — Electrochromic mirror in its dimmed state; darkened slightly tinted reflections through an absorbing optical stack.
- `opticalReflectorAluminizedGloss` — Vacuum-aluminized optical finish; smooth bright silver conductor response with a transparent protective lacquer.
- `opticalReflectorAluminizedSatin` — Vacuum-aluminized finish with fine satin microtexture; broad silver metallic reflections beneath protective lacquer.
- `opticalReflectorWhiteDiffuse` — Opaque bright white optical polymer coating; high diffuse reflectance, fine matte surface, non-emissive.

## Elastomers, seals, and flexible polymers

- `epdmRubberMatteBlack` — black EPDM elastomer; fine matte microtexture, broad weak dielectric highlights, and no grime or blooming from age.
- `epdmRubberMatteDarkGray` — dark gray EPDM elastomer; fine matte microtexture, broad weak dielectric highlights, and no grime or blooming from age.
- `epdmRubberMatteGray` — gray EPDM elastomer; fine matte microtexture, broad weak dielectric highlights, and no grime or blooming from age.
- `epdmRubberSmoothBlack` — black smooth EPDM rubber; low satin sheen and subtle skin microtexture.
- `epdmRubberSmoothGray` — gray smooth EPDM rubber; low satin sheen and subtle skin microtexture.
- `epdmRubberFlockedBlack` — Black EPDM with short dense fiber flock; soft velvet-like sheen, fine directional fiber response, and low diffuse brightness.
- `epdmRubberFlockedGray` — Gray EPDM with fine short fiber flock; low gloss and soft directional fiber sheen.
- `siliconeRubberBlack` — black silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `siliconeRubberGray` — gray silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `siliconeRubberWhite` — white silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `siliconeRubberTranslucent` — translucent silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `siliconeRubberRed` — red silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `siliconeRubberOrange` — orange silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `siliconeRubberYellow` — yellow silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `siliconeRubberBlue` — blue silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `siliconeRubberGreen` — green silicone elastomer; fine smooth satin skin, soft dielectric reflection; translucent variant uses diffuse transmission and mild bulk scattering.
- `nitrileRubberBlack` — black nitrile elastomer; opaque fine-grained surface and low satin reflectance.
- `nitrileRubberBrown` — brown nitrile elastomer; opaque fine-grained surface and low satin reflectance.
- `nitrileRubberBlue` — blue nitrile elastomer; opaque fine-grained surface and low satin reflectance.
- `fluoroelastomerBlack` — black fluoroelastomer; dense smooth skin with subdued satin dielectric highlights.
- `fluoroelastomerBrown` — brown fluoroelastomer; dense smooth skin with subdued satin dielectric highlights.
- `fluoroelastomerGreen` — green fluoroelastomer; dense smooth skin with subdued satin dielectric highlights.
- `chloropreneRubberBlack` — black chloroprene elastomer; fine opaque grain, matte-to-satin sheen.
- `chloropreneRubberGray` — gray chloroprene elastomer; fine opaque grain, matte-to-satin sheen.
- `naturalRubberBlack` — black natural-rubber compound; fine soft skin and low satin sheen; amber can show slight diffuse transmission when thin.
- `naturalRubberAmber` — amber natural-rubber compound; fine soft skin and low satin sheen; amber can show slight diffuse transmission when thin.
- `naturalRubberTan` — tan natural-rubber compound; fine soft skin and low satin sheen; amber can show slight diffuse transmission when thin.
- `thermoplasticElastomerBlack` — black molded TPE; fine soft-touch grain and broad low-gloss dielectric highlights.
- `thermoplasticElastomerGray` — gray molded TPE; fine soft-touch grain and broad low-gloss dielectric highlights.
- `thermoplasticElastomerBeige` — beige molded TPE; fine soft-touch grain and broad low-gloss dielectric highlights.
- `thermoplasticElastomerRed` — red molded TPE; fine soft-touch grain and broad low-gloss dielectric highlights.
- `thermoplasticElastomerBlue` — blue molded TPE; fine soft-touch grain and broad low-gloss dielectric highlights.
- `thermoplasticPolyurethaneBlack` — black TPU; smooth elastic polymer with satin-to-gloss reflections; clear variant transmits light with thickness-dependent absorption.
- `thermoplasticPolyurethaneGray` — gray TPU; smooth elastic polymer with satin-to-gloss reflections; clear variant transmits light with thickness-dependent absorption.
- `thermoplasticPolyurethaneClear` — clear TPU; smooth elastic polymer with satin-to-gloss reflections; clear variant transmits light with thickness-dependent absorption.
- `thermoplasticPolyurethaneYellow` — yellow TPU; smooth elastic polymer with satin-to-gloss reflections; clear variant transmits light with thickness-dependent absorption.
- `thermoplasticPolyurethaneOrange` — orange TPU; smooth elastic polymer with satin-to-gloss reflections; clear variant transmits light with thickness-dependent absorption.
- `polyurethaneElastomerBlack` — black cast polyurethane elastomer; smooth satin skin; amber formulation may have slight translucent depth.
- `polyurethaneElastomerRed` — red cast polyurethane elastomer; smooth satin skin; amber formulation may have slight translucent depth.
- `polyurethaneElastomerYellow` — yellow cast polyurethane elastomer; smooth satin skin; amber formulation may have slight translucent depth.
- `polyurethaneElastomerAmber` — amber cast polyurethane elastomer; smooth satin skin; amber formulation may have slight translucent depth.
- `polyurethaneElastomerBlue` — blue cast polyurethane elastomer; smooth satin skin; amber formulation may have slight translucent depth.
- `butylRubberBlack` — Black butyl elastomer; smooth low-sheen surface with slight tacky-looking reflection, no contamination.
- `rubberFoamClosedCellBlack` — Black closed-cell rubber foam; fine cellular skin, low gloss, and soft diffuse highlights.
- `rubberFoamClosedCellGray` — Gray closed-cell rubber foam; dense fine cellular texture and matte diffuse response.

## Tire, track, and belt rubber compounds

- `tireTreadRubberBlack` — New carbon-black-filled tread compound; very dark gray diffuse response, fine granular rubber texture, and broad restrained dielectric highlights; no wear polish.
- `tireSidewallRubberBlack` — New carbon-black-filled sidewall compound; deep charcoal surface with a slightly smoother satin skin than tread rubber, no aged bloom.
- `tireSidewallRubberSatinBlack` — New sidewall rubber with a restrained factory satin finish; dark charcoal albedo, broad clean highlights, no wet dressing effect.
- `tireWhitewallRubber` — Fresh white pigmented tire-sidewall compound; slightly warm opaque white, fine rubber texture, low satin sheen.
- `tireLetteringRubberWhite` — White pigmented vulcanized rubber; opaque neutral white with fine rubber microtexture and low sheen.
- `tireLetteringInkWhite` — White flexible tire-printing ink; opaque matte pigment film over rubber with a fine printed surface.
- `tireLetteringInkYellow` — Yellow flexible tire-printing ink; saturated opaque matte pigment film and fine rubber-compatible texture.
- `tireLetteringInkRed` — Red flexible tire-printing ink; saturated opaque matte pigment film and low sheen.
- `tireIdentificationInkBlue` — Blue factory identification ink on rubber; thin matte opaque color layer, clean new appearance.
- `tireIdentificationInkGreen` — Green factory identification ink on rubber; thin matte opaque color layer, clean new appearance.
- `tireIdentificationInkYellow` — Yellow factory identification ink on rubber; thin matte opaque color layer, clean new appearance.
- `tireIdentificationInkRed` — Red factory identification ink on rubber; thin matte opaque color layer, clean new appearance.
- `tireInnerLinerRubberBlack` — Clean black halobutyl inner-liner compound; smooth low-sheen rubber surface, no road-use residue.
- `agriculturalTireRubberBlack` — Factory-new heavy-duty agricultural tire compound; dark charcoal opaque rubber, fine molding skin, restrained satin sheen, no field dirt.
- `industrialSolidTireRubberBlack` — New solid industrial tire compound; dense opaque charcoal rubber with fine low-gloss skin.
- `industrialNonMarkingRubberGray` — New non-marking industrial rubber compound; opaque medium gray with fine matte-to-satin skin.
- `industrialNonMarkingRubberCream` — New non-marking industrial rubber compound; warm cream with fine low-gloss skin.
- `rubberTrackCompoundBlack` — New reinforced track rubber compound; dark charcoal elastic surface with fine molded texture and subdued sheen, no abrasion.
- `rubberConveyorCompoundBlack` — New black conveyor-grade rubber; fine matte granular skin and low dielectric gloss.
- `rubberConveyorCompoundTan` — New tan abrasion-resistant rubber compound; fine opaque rubber texture and low sheen.
- `rubberBeltCompoundBlack` — New black power-transmission rubber compound; fine satin rubber skin with subtle textile imprint where present as surface texture.
- `rubberBeltFabricFacingBlack` — Black rubber-impregnated textile facing; fine woven albedo/normal texture, low gloss, and muted fiber sheen.
- `polyurethaneBeltCompoundClear` — Clear-to-milky polyurethane belt compound; smooth satin surface and thickness-dependent diffuse transmission.
- `polyurethaneBeltCompoundBlue` — Blue polyurethane belt compound; opaque-to-translucent polymer with smooth low-satin skin.

## Natural leather

- `leatherPigmentedSmoothBlack` — black pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothCharcoal` — charcoal pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothGray` — gray pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothLightGray` — light gray pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothWhite` — white pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothIvory` — ivory pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothCream` — cream pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothBeige` — beige pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothSand` — sand pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothTan` — tan pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothCamel` — camel pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothCognac` — cognac pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothSaddleBrown` — saddle brown pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothDarkBrown` — dark brown pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothBurgundy` — burgundy pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothRed` — red pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothOrange` — orange pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothYellow` — yellow pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothOliveGreen` — olive green pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothForestGreen` — forest green pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothNavyBlue` — navy blue pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothBlue` — blue pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedSmoothPurple` — purple pigmented automotive leather; fine corrected grain, opaque protective finish, soft satin highlights, subtle pore normal texture, factory-new without creases from use.
- `leatherPigmentedPebbledBlack` — black pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledCharcoal` — charcoal pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledGray` — gray pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledBeige` — beige pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledTan` — tan pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledCognac` — cognac pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledBrown` — brown pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledBurgundy` — burgundy pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledRed` — red pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherPigmentedPebbledNavyBlue` — navy blue pigmented leather with pronounced pebbled grain; soft satin protective finish, fine pores, and low-contrast grain color variation.
- `leatherNappaBlack` — black premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaCharcoal` — charcoal premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaGray` — gray premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaWhite` — white premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaIvory` — ivory premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaCream` — cream premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaBeige` — beige premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaTan` — tan premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaCognac` — cognac premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaBrown` — brown premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaBurgundy` — burgundy premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaRed` — red premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaNavyBlue` — navy blue premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherNappaGreen` — green premium soft nappa leather; fine natural-looking grain, restrained satin sheen, subtle pore variation, uniform new dye finish.
- `leatherSemiAnilineBlack` — black semi-aniline leather; translucent-looking dye depth beneath a light protective finish, fine natural grain, and soft low-gloss highlights.
- `leatherSemiAnilineIvory` — ivory semi-aniline leather; translucent-looking dye depth beneath a light protective finish, fine natural grain, and soft low-gloss highlights.
- `leatherSemiAnilineTan` — tan semi-aniline leather; translucent-looking dye depth beneath a light protective finish, fine natural grain, and soft low-gloss highlights.
- `leatherSemiAnilineCognac` — cognac semi-aniline leather; translucent-looking dye depth beneath a light protective finish, fine natural grain, and soft low-gloss highlights.
- `leatherSemiAnilineSaddleBrown` — saddle brown semi-aniline leather; translucent-looking dye depth beneath a light protective finish, fine natural grain, and soft low-gloss highlights.
- `leatherSemiAnilineDarkBrown` — dark brown semi-aniline leather; translucent-looking dye depth beneath a light protective finish, fine natural grain, and soft low-gloss highlights.
- `leatherSemiAnilineBurgundy` — burgundy semi-aniline leather; translucent-looking dye depth beneath a light protective finish, fine natural grain, and soft low-gloss highlights.
- `leatherSemiAnilineNavyBlue` — navy blue semi-aniline leather; translucent-looking dye depth beneath a light protective finish, fine natural grain, and soft low-gloss highlights.
- `leatherAnilineTan` — tan aniline-dyed leather; visible natural grain and subtle dye variation, restrained waxy sheen, no patina or use wear.
- `leatherAnilineCognac` — cognac aniline-dyed leather; visible natural grain and subtle dye variation, restrained waxy sheen, no patina or use wear.
- `leatherAnilineSaddleBrown` — saddle brown aniline-dyed leather; visible natural grain and subtle dye variation, restrained waxy sheen, no patina or use wear.
- `leatherAnilineDarkBrown` — dark brown aniline-dyed leather; visible natural grain and subtle dye variation, restrained waxy sheen, no patina or use wear.
- `leatherAnilineBurgundy` — burgundy aniline-dyed leather; visible natural grain and subtle dye variation, restrained waxy sheen, no patina or use wear.
- `leatherSuedeBlack` — black natural suede; dense short nap, directional color shading, broad fiber sheen, and nearly matte frontal response.
- `leatherSuedeGray` — gray natural suede; dense short nap, directional color shading, broad fiber sheen, and nearly matte frontal response.
- `leatherSuedeBeige` — beige natural suede; dense short nap, directional color shading, broad fiber sheen, and nearly matte frontal response.
- `leatherSuedeTan` — tan natural suede; dense short nap, directional color shading, broad fiber sheen, and nearly matte frontal response.
- `leatherSuedeBrown` — brown natural suede; dense short nap, directional color shading, broad fiber sheen, and nearly matte frontal response.
- `leatherSuedeBurgundy` — burgundy natural suede; dense short nap, directional color shading, broad fiber sheen, and nearly matte frontal response.
- `leatherSuedeRed` — red natural suede; dense short nap, directional color shading, broad fiber sheen, and nearly matte frontal response.
- `leatherSuedeNavyBlue` — navy blue natural suede; dense short nap, directional color shading, broad fiber sheen, and nearly matte frontal response.
- `leatherNubuckBlack` — black nubuck leather; extremely fine sanded nap with soft directional shading and muted diffuse fiber sheen.
- `leatherNubuckGray` — gray nubuck leather; extremely fine sanded nap with soft directional shading and muted diffuse fiber sheen.
- `leatherNubuckBeige` — beige nubuck leather; extremely fine sanded nap with soft directional shading and muted diffuse fiber sheen.
- `leatherNubuckTan` — tan nubuck leather; extremely fine sanded nap with soft directional shading and muted diffuse fiber sheen.
- `leatherNubuckBrown` — brown nubuck leather; extremely fine sanded nap with soft directional shading and muted diffuse fiber sheen.
- `leatherNubuckBlue` — blue nubuck leather; extremely fine sanded nap with soft directional shading and muted diffuse fiber sheen.
- `leatherEmbossedTechnicalBlack` — black automotive leather with a fine repeated technical emboss; opaque protective finish, soft satin reflection, and pattern expressed only as surface microtexture.
- `leatherEmbossedTechnicalGray` — gray automotive leather with a fine repeated technical emboss; opaque protective finish, soft satin reflection, and pattern expressed only as surface microtexture.
- `leatherEmbossedTechnicalRed` — red automotive leather with a fine repeated technical emboss; opaque protective finish, soft satin reflection, and pattern expressed only as surface microtexture.
- `leatherEmbossedTechnicalBlue` — blue automotive leather with a fine repeated technical emboss; opaque protective finish, soft satin reflection, and pattern expressed only as surface microtexture.

## Synthetic leather and coated upholstery

- `vinylLeatheretteFineGrainBlack` — black PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainCharcoal` — charcoal PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainGray` — gray PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainLightGray` — light gray PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainWhite` — white PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainIvory` — ivory PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainCream` — cream PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainBeige` — beige PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainTan` — tan PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainBrown` — brown PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainBurgundy` — burgundy PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainRed` — red PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainOrange` — orange PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainGreen` — green PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainBlue` — blue PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteFineGrainNavyBlue` — navy blue PVC-coated upholstery with fine embossed leather grain; opaque flexible skin, satin highlights, and more uniform texture than natural leather.
- `vinylLeatheretteCoarseGrainBlack` — black heavy-duty PVC upholstery with coarse embossed grain; durable-looking opaque satin surface, clean new finish.
- `vinylLeatheretteCoarseGrainGray` — gray heavy-duty PVC upholstery with coarse embossed grain; durable-looking opaque satin surface, clean new finish.
- `vinylLeatheretteCoarseGrainBeige` — beige heavy-duty PVC upholstery with coarse embossed grain; durable-looking opaque satin surface, clean new finish.
- `vinylLeatheretteCoarseGrainTan` — tan heavy-duty PVC upholstery with coarse embossed grain; durable-looking opaque satin surface, clean new finish.
- `vinylLeatheretteCoarseGrainBrown` — brown heavy-duty PVC upholstery with coarse embossed grain; durable-looking opaque satin surface, clean new finish.
- `vinylLeatheretteCoarseGrainRed` — red heavy-duty PVC upholstery with coarse embossed grain; durable-looking opaque satin surface, clean new finish.
- `vinylLeatheretteCoarseGrainBlue` — blue heavy-duty PVC upholstery with coarse embossed grain; durable-looking opaque satin surface, clean new finish.
- `polyurethaneLeatheretteBlack` — black PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteCharcoal` — charcoal PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteGray` — gray PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteWhite` — white PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteIvory` — ivory PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteBeige` — beige PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteTan` — tan PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteCognac` — cognac PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteBrown` — brown PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteRed` — red PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteBlue` — blue PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `polyurethaneLeatheretteGreen` — green PU-coated synthetic leather; fine soft grain, low satin sheen, uniform color, and gentle microtexture.
- `microfiberSyntheticLeatherBlack` — black microfiber-backed synthetic leather; fine leather-like surface grain and restrained soft satin sheen.
- `microfiberSyntheticLeatherGray` — gray microfiber-backed synthetic leather; fine leather-like surface grain and restrained soft satin sheen.
- `microfiberSyntheticLeatherIvory` — ivory microfiber-backed synthetic leather; fine leather-like surface grain and restrained soft satin sheen.
- `microfiberSyntheticLeatherBeige` — beige microfiber-backed synthetic leather; fine leather-like surface grain and restrained soft satin sheen.
- `microfiberSyntheticLeatherTan` — tan microfiber-backed synthetic leather; fine leather-like surface grain and restrained soft satin sheen.
- `microfiberSyntheticLeatherBrown` — brown microfiber-backed synthetic leather; fine leather-like surface grain and restrained soft satin sheen.
- `microfiberSyntheticLeatherRed` — red microfiber-backed synthetic leather; fine leather-like surface grain and restrained soft satin sheen.
- `microfiberSyntheticLeatherNavyBlue` — navy blue microfiber-backed synthetic leather; fine leather-like surface grain and restrained soft satin sheen.
- `siliconeCoatedUpholsteryBlack` — black silicone-coated upholstery; fine matte grain and soft broad dielectric highlights, clean uniform pigment.
- `siliconeCoatedUpholsteryGray` — gray silicone-coated upholstery; fine matte grain and soft broad dielectric highlights, clean uniform pigment.
- `siliconeCoatedUpholsteryWhite` — white silicone-coated upholstery; fine matte grain and soft broad dielectric highlights, clean uniform pigment.
- `siliconeCoatedUpholsteryBeige` — beige silicone-coated upholstery; fine matte grain and soft broad dielectric highlights, clean uniform pigment.
- `siliconeCoatedUpholsteryTan` — tan silicone-coated upholstery; fine matte grain and soft broad dielectric highlights, clean uniform pigment.
- `siliconeCoatedUpholsteryRed` — red silicone-coated upholstery; fine matte grain and soft broad dielectric highlights, clean uniform pigment.
- `siliconeCoatedUpholsteryBlue` — blue silicone-coated upholstery; fine matte grain and soft broad dielectric highlights, clean uniform pigment.
- `bioBasedLeatherAlternativeBlack` — black bio-based coated upholstery; fine natural-looking grain and satin resin surface; appearance is specified independently of feedstock claims.
- `bioBasedLeatherAlternativeGray` — gray bio-based coated upholstery; fine natural-looking grain and satin resin surface; appearance is specified independently of feedstock claims.
- `bioBasedLeatherAlternativeBeige` — beige bio-based coated upholstery; fine natural-looking grain and satin resin surface; appearance is specified independently of feedstock claims.
- `bioBasedLeatherAlternativeTan` — tan bio-based coated upholstery; fine natural-looking grain and satin resin surface; appearance is specified independently of feedstock claims.
- `bioBasedLeatherAlternativeBrown` — brown bio-based coated upholstery; fine natural-looking grain and satin resin surface; appearance is specified independently of feedstock claims.
- `bioBasedLeatherAlternativeGreen` — green bio-based coated upholstery; fine natural-looking grain and satin resin surface; appearance is specified independently of feedstock claims.
- `syntheticSuedeBlack` — black microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeCharcoal` — charcoal microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeGray` — gray microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeLightGray` — light gray microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeIvory` — ivory microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeBeige` — beige microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeTan` — tan microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeBrown` — brown microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeBurgundy` — burgundy microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeRed` — red microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeOrange` — orange microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeYellow` — yellow microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeGreen` — green microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeNavyBlue` — navy blue microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.
- `syntheticSuedeBlue` — blue microfiber suede; fine short nap with directional shading and soft grazing-angle fiber sheen, low frontal gloss.

## Woven, knitted, and technical upholstery textiles

- `upholsteryPlainWeaveBlack` — black plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveCharcoal` — charcoal plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveGray` — gray plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveLightGray` — light gray plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveBeige` — beige plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveTan` — tan plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveBrown` — brown plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveRed` — red plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveBlue` — blue plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveNavyBlue` — navy blue plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryPlainWeaveGreen` — green plain-woven automotive cloth; fine alternating yarn texture, diffuse body color, low fiber sheen, and physically scaled weave.
- `upholsteryTwillBlack` — black woven upholstery with fine diagonal twill texture; soft diffuse response and slight directional yarn sheen.
- `upholsteryTwillCharcoal` — charcoal woven upholstery with fine diagonal twill texture; soft diffuse response and slight directional yarn sheen.
- `upholsteryTwillGray` — gray woven upholstery with fine diagonal twill texture; soft diffuse response and slight directional yarn sheen.
- `upholsteryTwillBeige` — beige woven upholstery with fine diagonal twill texture; soft diffuse response and slight directional yarn sheen.
- `upholsteryTwillBrown` — brown woven upholstery with fine diagonal twill texture; soft diffuse response and slight directional yarn sheen.
- `upholsteryTwillRed` — red woven upholstery with fine diagonal twill texture; soft diffuse response and slight directional yarn sheen.
- `upholsteryTwillBlue` — blue woven upholstery with fine diagonal twill texture; soft diffuse response and slight directional yarn sheen.
- `upholsteryHeatherCharcoal` — charcoal heathered upholstery textile; mixed-color fibers produce fine mottled albedo, soft low-gloss yarn response, and visible weave at close range.
- `upholsteryHeatherGray` — gray heathered upholstery textile; mixed-color fibers produce fine mottled albedo, soft low-gloss yarn response, and visible weave at close range.
- `upholsteryHeatherLightGray` — light gray heathered upholstery textile; mixed-color fibers produce fine mottled albedo, soft low-gloss yarn response, and visible weave at close range.
- `upholsteryHeatherBeige` — beige heathered upholstery textile; mixed-color fibers produce fine mottled albedo, soft low-gloss yarn response, and visible weave at close range.
- `upholsteryHeatherBrown` — brown heathered upholstery textile; mixed-color fibers produce fine mottled albedo, soft low-gloss yarn response, and visible weave at close range.
- `upholsteryHeatherBlue` — blue heathered upholstery textile; mixed-color fibers produce fine mottled albedo, soft low-gloss yarn response, and visible weave at close range.
- `upholsteryJacquardBlackGray` — black gray multi-yarn jacquard fabric; clean repeated woven color motif with fine yarn texture and soft directional sheen.
- `upholsteryJacquardGrayBlue` — gray blue multi-yarn jacquard fabric; clean repeated woven color motif with fine yarn texture and soft directional sheen.
- `upholsteryJacquardGrayRed` — gray red multi-yarn jacquard fabric; clean repeated woven color motif with fine yarn texture and soft directional sheen.
- `upholsteryJacquardBeigeBrown` — beige brown multi-yarn jacquard fabric; clean repeated woven color motif with fine yarn texture and soft directional sheen.
- `upholsteryVelourBlack` — black automotive velour; dense short pile, soft directional nap shading, and broad fiber sheen.
- `upholsteryVelourGray` — gray automotive velour; dense short pile, soft directional nap shading, and broad fiber sheen.
- `upholsteryVelourBeige` — beige automotive velour; dense short pile, soft directional nap shading, and broad fiber sheen.
- `upholsteryVelourBrown` — brown automotive velour; dense short pile, soft directional nap shading, and broad fiber sheen.
- `upholsteryVelourBurgundy` — burgundy automotive velour; dense short pile, soft directional nap shading, and broad fiber sheen.
- `upholsteryVelourNavyBlue` — navy blue automotive velour; dense short pile, soft directional nap shading, and broad fiber sheen.
- `upholsteryTechnicalKnitBlack` — black technical knitted upholstery; fine looped yarn texture with diffuse body color and restrained fiber sheen.
- `upholsteryTechnicalKnitGray` — gray technical knitted upholstery; fine looped yarn texture with diffuse body color and restrained fiber sheen.
- `upholsteryTechnicalKnitWhite` — white technical knitted upholstery; fine looped yarn texture with diffuse body color and restrained fiber sheen.
- `upholsteryTechnicalKnitRed` — red technical knitted upholstery; fine looped yarn texture with diffuse body color and restrained fiber sheen.
- `upholsteryTechnicalKnitBlue` — blue technical knitted upholstery; fine looped yarn texture with diffuse body color and restrained fiber sheen.
- `upholsteryTechnicalKnitGreen` — green technical knitted upholstery; fine looped yarn texture with diffuse body color and restrained fiber sheen.
- `upholsterySpacerMeshBlack` — black spacer-mesh textile appearance; layered yarn texture with dark inter-yarn opacity and soft fiber sheen; material definition only.
- `upholsterySpacerMeshGray` — gray spacer-mesh textile appearance; layered yarn texture with dark inter-yarn opacity and soft fiber sheen; material definition only.
- `upholsterySpacerMeshRed` — red spacer-mesh textile appearance; layered yarn texture with dark inter-yarn opacity and soft fiber sheen; material definition only.
- `upholsterySpacerMeshBlue` — blue spacer-mesh textile appearance; layered yarn texture with dark inter-yarn opacity and soft fiber sheen; material definition only.
- `upholsteryWoolBlendCharcoal` — charcoal wool-blend automotive textile; fine slightly fuzzy yarns, heathered color, and soft diffuse fiber response.
- `upholsteryWoolBlendGray` — gray wool-blend automotive textile; fine slightly fuzzy yarns, heathered color, and soft diffuse fiber response.
- `upholsteryWoolBlendLightGray` — light gray wool-blend automotive textile; fine slightly fuzzy yarns, heathered color, and soft diffuse fiber response.
- `upholsteryWoolBlendBeige` — beige wool-blend automotive textile; fine slightly fuzzy yarns, heathered color, and soft diffuse fiber response.
- `upholsteryWoolBlendBrown` — brown wool-blend automotive textile; fine slightly fuzzy yarns, heathered color, and soft diffuse fiber response.
- `upholsteryWoolBlendNavyBlue` — navy blue wool-blend automotive textile; fine slightly fuzzy yarns, heathered color, and soft diffuse fiber response.
- `upholsteryRecycledPolyesterBlack` — black recycled-polyester upholstery; clean uniform fine weave and soft low-sheen fibers; no artificial dirt or wear.
- `upholsteryRecycledPolyesterGray` — gray recycled-polyester upholstery; clean uniform fine weave and soft low-sheen fibers; no artificial dirt or wear.
- `upholsteryRecycledPolyesterBeige` — beige recycled-polyester upholstery; clean uniform fine weave and soft low-sheen fibers; no artificial dirt or wear.
- `upholsteryRecycledPolyesterBlue` — blue recycled-polyester upholstery; clean uniform fine weave and soft low-sheen fibers; no artificial dirt or wear.
- `upholsteryRecycledPolyesterGreen` — green recycled-polyester upholstery; clean uniform fine weave and soft low-sheen fibers; no artificial dirt or wear.
- `upholsteryHerringboneBlackGray` — black gray herringbone textile; alternating diagonal yarn pattern with fine woven microtexture and subdued directional sheen.
- `upholsteryHerringboneGrayWhite` — gray white herringbone textile; alternating diagonal yarn pattern with fine woven microtexture and subdued directional sheen.
- `upholsteryHerringboneBeigeBrown` — beige brown herringbone textile; alternating diagonal yarn pattern with fine woven microtexture and subdued directional sheen.
- `upholsteryHoundstoothBlackWhite` — black white houndstooth woven textile; crisp multi-yarn color pattern at textile scale with low gloss and soft yarn relief.
- `upholsteryHoundstoothBlackGray` — black gray houndstooth woven textile; crisp multi-yarn color pattern at textile scale with low gloss and soft yarn relief.
- `upholsteryHoundstoothBrownBeige` — brown beige houndstooth woven textile; crisp multi-yarn color pattern at textile scale with low gloss and soft yarn relief.
- `upholsteryPlaidRedBlack` — red black plaid upholstery fabric; woven intersecting color bands, fine yarn texture, and diffuse fiber reflectance.
- `upholsteryPlaidBlueGray` — blue gray plaid upholstery fabric; woven intersecting color bands, fine yarn texture, and diffuse fiber reflectance.
- `upholsteryPlaidGreenBlack` — green black plaid upholstery fabric; woven intersecting color bands, fine yarn texture, and diffuse fiber reflectance.
- `upholsteryPlaidBeigeBrown` — beige brown plaid upholstery fabric; woven intersecting color bands, fine yarn texture, and diffuse fiber reflectance.
- `upholsteryCanvasBlack` — black heavy woven canvas; coarse tightly woven yarn texture and matte fibrous appearance, clean factory-new finish.
- `upholsteryCanvasGray` — gray heavy woven canvas; coarse tightly woven yarn texture and matte fibrous appearance, clean factory-new finish.
- `upholsteryCanvasTan` — tan heavy woven canvas; coarse tightly woven yarn texture and matte fibrous appearance, clean factory-new finish.
- `upholsteryCanvasOliveGreen` — olive green heavy woven canvas; coarse tightly woven yarn texture and matte fibrous appearance, clean factory-new finish.
- `upholsteryCanvasBlue` — blue heavy woven canvas; coarse tightly woven yarn texture and matte fibrous appearance, clean factory-new finish.

## Carpet, felt, flock, and textile linings

- `carpetCutPileBlack` — black dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileCharcoal` — charcoal dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileGray` — gray dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileLightGray` — light gray dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileBeige` — beige dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileTan` — tan dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileBrown` — brown dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileBurgundy` — burgundy dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileRed` — red dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetCutPileNavyBlue` — navy blue dense cut-pile automotive carpet; short upright fiber appearance, deep diffuse body color, soft grazing-angle sheen, and fine pile variation.
- `carpetLoopPileBlack` — black loop-pile carpet; small repeated yarn-loop texture, diffuse color, and low directional fiber sheen.
- `carpetLoopPileCharcoal` — charcoal loop-pile carpet; small repeated yarn-loop texture, diffuse color, and low directional fiber sheen.
- `carpetLoopPileGray` — gray loop-pile carpet; small repeated yarn-loop texture, diffuse color, and low directional fiber sheen.
- `carpetLoopPileBeige` — beige loop-pile carpet; small repeated yarn-loop texture, diffuse color, and low directional fiber sheen.
- `carpetLoopPileBrown` — brown loop-pile carpet; small repeated yarn-loop texture, diffuse color, and low directional fiber sheen.
- `carpetNeedlePunchBlack` — black needle-punched carpet; dense randomly interlocked fibers, flatter low-gloss texture than cut pile, subtle fiber mottling.
- `carpetNeedlePunchCharcoal` — charcoal needle-punched carpet; dense randomly interlocked fibers, flatter low-gloss texture than cut pile, subtle fiber mottling.
- `carpetNeedlePunchGray` — gray needle-punched carpet; dense randomly interlocked fibers, flatter low-gloss texture than cut pile, subtle fiber mottling.
- `carpetNeedlePunchBeige` — beige needle-punched carpet; dense randomly interlocked fibers, flatter low-gloss texture than cut pile, subtle fiber mottling.
- `carpetNeedlePunchBrown` — brown needle-punched carpet; dense randomly interlocked fibers, flatter low-gloss texture than cut pile, subtle fiber mottling.
- `feltLiningBlack` — black nonwoven felt; short randomized fibers and matte diffuse appearance with slight grazing sheen.
- `feltLiningCharcoal` — charcoal nonwoven felt; short randomized fibers and matte diffuse appearance with slight grazing sheen.
- `feltLiningGray` — gray nonwoven felt; short randomized fibers and matte diffuse appearance with slight grazing sheen.
- `feltLiningLightGray` — light gray nonwoven felt; short randomized fibers and matte diffuse appearance with slight grazing sheen.
- `feltLiningBeige` — beige nonwoven felt; short randomized fibers and matte diffuse appearance with slight grazing sheen.
- `feltLiningBrown` — brown nonwoven felt; short randomized fibers and matte diffuse appearance with slight grazing sheen.
- `flockedFinishBlack` — black fine adhesive-bound flock; short dense fibers with velvet-like directional shading and nearly matte frontal response.
- `flockedFinishGray` — gray fine adhesive-bound flock; short dense fibers with velvet-like directional shading and nearly matte frontal response.
- `flockedFinishBeige` — beige fine adhesive-bound flock; short dense fibers with velvet-like directional shading and nearly matte frontal response.
- `flockedFinishBrown` — brown fine adhesive-bound flock; short dense fibers with velvet-like directional shading and nearly matte frontal response.
- `headliningKnitBlack` — black fine knit headlining fabric; delicate uniform yarn texture, matte body response, and soft grazing sheen.
- `headliningKnitCharcoal` — charcoal fine knit headlining fabric; delicate uniform yarn texture, matte body response, and soft grazing sheen.
- `headliningKnitGray` — gray fine knit headlining fabric; delicate uniform yarn texture, matte body response, and soft grazing sheen.
- `headliningKnitLightGray` — light gray fine knit headlining fabric; delicate uniform yarn texture, matte body response, and soft grazing sheen.
- `headliningKnitIvory` — ivory fine knit headlining fabric; delicate uniform yarn texture, matte body response, and soft grazing sheen.
- `headliningKnitBeige` — beige fine knit headlining fabric; delicate uniform yarn texture, matte body response, and soft grazing sheen.
- `headliningKnitTan` — tan fine knit headlining fabric; delicate uniform yarn texture, matte body response, and soft grazing sheen.
- `headliningMicrofiberBlack` — black microfiber lining; extremely fine suede-like nap and soft directional sheen.
- `headliningMicrofiberGray` — gray microfiber lining; extremely fine suede-like nap and soft directional sheen.
- `headliningMicrofiberIvory` — ivory microfiber lining; extremely fine suede-like nap and soft directional sheen.
- `headliningMicrofiberBeige` — beige microfiber lining; extremely fine suede-like nap and soft directional sheen.
- `headliningMicrofiberBrown` — brown microfiber lining; extremely fine suede-like nap and soft directional sheen.
- `sunshadeTextileBlack` — black fine woven light-filtering textile; low gloss, subdued fiber sheen, and partial transmission through the yarn structure expressed by material opacity.
- `sunshadeTextileGray` — gray fine woven light-filtering textile; low gloss, subdued fiber sheen, and partial transmission through the yarn structure expressed by material opacity.
- `sunshadeTextileBeige` — beige fine woven light-filtering textile; low gloss, subdued fiber sheen, and partial transmission through the yarn structure expressed by material opacity.
- `sunshadeTextileIvory` — ivory fine woven light-filtering textile; low gloss, subdued fiber sheen, and partial transmission through the yarn structure expressed by material opacity.
- `speakerGrilleClothBlack` — black acoustically open woven cloth; fine yarn albedo and normal texture with inter-yarn opacity, low gloss, and soft fiber sheen.
- `speakerGrilleClothCharcoal` — charcoal acoustically open woven cloth; fine yarn albedo and normal texture with inter-yarn opacity, low gloss, and soft fiber sheen.
- `speakerGrilleClothGray` — gray acoustically open woven cloth; fine yarn albedo and normal texture with inter-yarn opacity, low gloss, and soft fiber sheen.
- `speakerGrilleClothBeige` — beige acoustically open woven cloth; fine yarn albedo and normal texture with inter-yarn opacity, low gloss, and soft fiber sheen.
- `speakerGrilleClothBrown` — brown acoustically open woven cloth; fine yarn albedo and normal texture with inter-yarn opacity, low gloss, and soft fiber sheen.

## Webbing, yarn, thread, and fabric tapes

- `seatbeltWebbingBlack` — black tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingCharcoal` — charcoal tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingGray` — gray tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingLightGray` — light gray tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingBeige` — beige tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingTan` — tan tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingBrown` — brown tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingRed` — red tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingOrange` — orange tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingYellow` — yellow tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingGreen` — green tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingBlue` — blue tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingNavyBlue` — navy blue tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `seatbeltWebbingBurgundy` — burgundy tightly woven polyester safety webbing; fine longitudinal rib texture, compact yarn structure, and directional satin fiber sheen.
- `utilityWebbingBlack` — black heavy woven nylon or polyester webbing; visible yarn texture, matte body color, and restrained fiber sheen.
- `utilityWebbingGray` — gray heavy woven nylon or polyester webbing; visible yarn texture, matte body color, and restrained fiber sheen.
- `utilityWebbingTan` — tan heavy woven nylon or polyester webbing; visible yarn texture, matte body color, and restrained fiber sheen.
- `utilityWebbingOliveGreen` — olive green heavy woven nylon or polyester webbing; visible yarn texture, matte body color, and restrained fiber sheen.
- `utilityWebbingRed` — red heavy woven nylon or polyester webbing; visible yarn texture, matte body color, and restrained fiber sheen.
- `utilityWebbingOrange` — orange heavy woven nylon or polyester webbing; visible yarn texture, matte body color, and restrained fiber sheen.
- `utilityWebbingBlue` — blue heavy woven nylon or polyester webbing; visible yarn texture, matte body color, and restrained fiber sheen.
- `stitchingThreadBlack` — black automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadCharcoal` — charcoal automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadGray` — gray automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadWhite` — white automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadIvory` — ivory automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadBeige` — beige automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadTan` — tan automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadBrown` — brown automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadRed` — red automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadOrange` — orange automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadYellow` — yellow automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadGreen` — green automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadBlue` — blue automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `stitchingThreadPurple` — purple automotive upholstery thread material; fine twisted-fiber texture and satin yarn reflection, without any stitch layout specification.
- `textileBindingBlack` — black woven binding textile; fine dense yarn structure with soft directional fiber sheen.
- `textileBindingGray` — gray woven binding textile; fine dense yarn structure with soft directional fiber sheen.
- `textileBindingBeige` — beige woven binding textile; fine dense yarn structure with soft directional fiber sheen.
- `textileBindingTan` — tan woven binding textile; fine dense yarn structure with soft directional fiber sheen.
- `textileBindingBrown` — brown woven binding textile; fine dense yarn structure with soft directional fiber sheen.
- `textileBindingRed` — red woven binding textile; fine dense yarn structure with soft directional fiber sheen.
- `textileBindingBlue` — blue woven binding textile; fine dense yarn structure with soft directional fiber sheen.
- `clothElectricalTapeBlack` — black adhesive fabric tape face; fine woven or fleece-like surface, matte reflectance, and clean new fibers.
- `clothElectricalTapeGray` — gray adhesive fabric tape face; fine woven or fleece-like surface, matte reflectance, and clean new fibers.
- `clothElectricalTapeWhite` — white adhesive fabric tape face; fine woven or fleece-like surface, matte reflectance, and clean new fibers.
- `vinylElectricalTapeBlack` — black flexible PVC insulating tape; smooth satin dielectric surface with faint film texture.
- `vinylElectricalTapeWhite` — white flexible PVC insulating tape; smooth satin dielectric surface with faint film texture.
- `vinylElectricalTapeRed` — red flexible PVC insulating tape; smooth satin dielectric surface with faint film texture.
- `vinylElectricalTapeYellow` — yellow flexible PVC insulating tape; smooth satin dielectric surface with faint film texture.
- `vinylElectricalTapeGreen` — green flexible PVC insulating tape; smooth satin dielectric surface with faint film texture.
- `vinylElectricalTapeBlue` — blue flexible PVC insulating tape; smooth satin dielectric surface with faint film texture.
- `vinylElectricalTapeOrange` — orange flexible PVC insulating tape; smooth satin dielectric surface with faint film texture.
- `hookFastenerTextileBlack` — Black nylon hook-fastener textile appearance; dense fine polymer-fiber surface, dark diffuse body response, and subtle satin fiber glints; material specification only.
- `loopFastenerTextileBlack` — Black loop-fastener textile; soft fuzzy yarn surface with low gloss and gentle fiber sheen.
- `loopFastenerTextileGray` — Gray loop-fastener textile; dense fuzzy fibers and matte-to-soft-sheen response.
- `aramidFabricNaturalYellow` — Natural yellow aramid fabric; fine woven yarn texture, matte body color, and low directional fiber sheen.
- `glassFiberFabricWhite` — White glass-fiber cloth; fine woven texture, pale diffuse response, and mild satin fiber reflections.

## Natural wood, veneer, and decorative wood effects

- `woodWalnutGloss` — New decorative walnut veneer; warm medium-to-dark brown with flowing dark grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodWalnutOpenPore` — New decorative walnut veneer; warm medium-to-dark brown with flowing dark grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodBurlWalnutGloss` — New decorative burlWalnut veneer; rich brown with swirling burl figure and small dark eyes, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodBurlWalnutOpenPore` — New decorative burlWalnut veneer; rich brown with swirling burl figure and small dark eyes, thin matte-to-satin protective finish retaining visible pore texture.
- `woodOakGloss` — New decorative oak veneer; warm light-to-medium brown with prominent open linear grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodOakOpenPore` — New decorative oak veneer; warm light-to-medium brown with prominent open linear grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodAshGloss` — New decorative ash veneer; pale cream-to-tan with pronounced long grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodAshOpenPore` — New decorative ash veneer; pale cream-to-tan with pronounced long grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodMapleGloss` — New decorative maple veneer; pale creamy tan with fine subtle grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodMapleOpenPore` — New decorative maple veneer; pale creamy tan with fine subtle grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodBirdseyeMapleGloss` — New decorative birdseyeMaple veneer; light honey tan with small birdseye figuring, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodBirdseyeMapleOpenPore` — New decorative birdseyeMaple veneer; light honey tan with small birdseye figuring, thin matte-to-satin protective finish retaining visible pore texture.
- `woodBirchGloss` — New decorative birch veneer; pale golden tan with fine grain and mild figuring, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodBirchOpenPore` — New decorative birch veneer; pale golden tan with fine grain and mild figuring, thin matte-to-satin protective finish retaining visible pore texture.
- `woodCherryGloss` — New decorative cherry veneer; warm reddish brown with smooth fine grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodCherryOpenPore` — New decorative cherry veneer; warm reddish brown with smooth fine grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodMahoganyGloss` — New decorative mahogany veneer; rich red-brown with fine ribbon-like grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodMahoganyOpenPore` — New decorative mahogany veneer; rich red-brown with fine ribbon-like grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodRosewoodGloss` — New decorative rosewood veneer; deep reddish brown with dark contrasting grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodRosewoodOpenPore` — New decorative rosewood veneer; deep reddish brown with dark contrasting grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodEbonyGloss` — New decorative ebony veneer; very dark brown to black with subtle darker linear grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodEbonyOpenPore` — New decorative ebony veneer; very dark brown to black with subtle darker linear grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodZebranoGloss` — New decorative zebrano veneer; warm tan with strong dark linear striping, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodZebranoOpenPore` — New decorative zebrano veneer; warm tan with strong dark linear striping, thin matte-to-satin protective finish retaining visible pore texture.
- `woodBambooGloss` — New decorative bamboo veneer; pale honey color with fine elongated fiber pattern, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodBambooOpenPore` — New decorative bamboo veneer; pale honey color with fine elongated fiber pattern, thin matte-to-satin protective finish retaining visible pore texture.
- `woodTeakGloss` — New decorative teak veneer; warm golden brown with long oily-looking grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodTeakOpenPore` — New decorative teak veneer; warm golden brown with long oily-looking grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodEucalyptusGloss` — New decorative eucalyptus veneer; warm brown with fine ribbon-like figured grain, beneath a smooth transparent gloss lacquer; subtle grain depth and no age patina.
- `woodEucalyptusOpenPore` — New decorative eucalyptus veneer; warm brown with fine ribbon-like figured grain, thin matte-to-satin protective finish retaining visible pore texture.
- `woodDyedOpenPoreBlack` — black dyed open-pore wood veneer; visible longitudinal grain and pore microtexture beneath a thin satin protective finish.
- `woodDyedOpenPoreCharcoal` — charcoal dyed open-pore wood veneer; visible longitudinal grain and pore microtexture beneath a thin satin protective finish.
- `woodDyedOpenPoreGray` — gray dyed open-pore wood veneer; visible longitudinal grain and pore microtexture beneath a thin satin protective finish.
- `woodDyedOpenPoreBlue` — blue dyed open-pore wood veneer; visible longitudinal grain and pore microtexture beneath a thin satin protective finish.
- `woodDyedOpenPoreBrown` — brown dyed open-pore wood veneer; visible longitudinal grain and pore microtexture beneath a thin satin protective finish.
- `woodDyedGlossBlack` — black dyed wood veneer under glossy transparent lacquer; grain remains visible beneath the smooth dielectric top surface.
- `woodDyedGlossGray` — gray dyed wood veneer under glossy transparent lacquer; grain remains visible beneath the smooth dielectric top surface.
- `woodDyedGlossRed` — red dyed wood veneer under glossy transparent lacquer; grain remains visible beneath the smooth dielectric top surface.
- `woodDyedGlossBlue` — blue dyed wood veneer under glossy transparent lacquer; grain remains visible beneath the smooth dielectric top surface.
- `woodReconstitutedStripedSatin` — New reconstituted wood veneer with fine alternating tan and dark-brown grain bands; satin clear finish and visible fine wood texture.
- `woodPianoBlackLacquer` — Opaque deep black multi-layer lacquer over wood; smooth high-gloss dielectric surface with no visible grain.
- `woodPianoWhiteLacquer` — Opaque white lacquer over wood; smooth high-gloss dielectric surface with no visible grain.
- `woodPrintWalnutPolymer` — Walnut-look printed polymer laminate; brown wood-grain albedo pattern beneath a glossy or low-satin polymer surface, with limited grain depth.
- `woodPrintOakPolymer` — Oak-look printed polymer laminate; tan open-grain color pattern and fine satin embossed surface.
- `woodPrintBlackAshPolymer` — Black-ash-look printed polymer laminate; dark linear grain color pattern and fine satin embossed surface.
- `corkCompositeNatural` — New natural cork composite; warm tan cellular fleck pattern, matte diffuse response, and subtle cell microtexture.
- `corkCompositeDarkBrown` — New dark-brown cork composite; fine cellular flecks and matte low-gloss surface.

## Fiber composites and decorative composite surfaces

- `carbonFiberPlainWeaveGloss` — New black carbon-fiber composite with fine alternating plain weave; smooth glossy transparent resin with optical depth, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberPlainWeaveSatin` — New black carbon-fiber composite with fine alternating plain weave; satin clear resin with broad highlights, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberPlainWeaveMatte` — New black carbon-fiber composite with fine alternating plain weave; matte clear resin with soft low-contrast highlights, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberTwillGloss` — New black carbon-fiber composite with diagonal twill weave; smooth glossy transparent resin with optical depth, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberTwillSatin` — New black carbon-fiber composite with diagonal twill weave; satin clear resin with broad highlights, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberTwillMatte` — New black carbon-fiber composite with diagonal twill weave; matte clear resin with soft low-contrast highlights, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberSpreadTowGloss` — New black carbon-fiber composite with wide flattened tow weave; smooth glossy transparent resin with optical depth, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberSpreadTowSatin` — New black carbon-fiber composite with wide flattened tow weave; satin clear resin with broad highlights, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberSpreadTowMatte` — New black carbon-fiber composite with wide flattened tow weave; matte clear resin with soft low-contrast highlights, dark fiber bundles with directional sheen and physical-scale pattern.
- `carbonFiberUnidirectionalGloss` — New unidirectional carbon composite; aligned black fiber texture with directional sheen beneath clear glossy resin.
- `carbonFiberUnidirectionalMatte` — New unidirectional carbon composite; aligned dark fibers under matte clear resin with muted anisotropic sheen.
- `carbonFiberForgedGloss` — New chopped-carbon composite; irregular dark fiber fragments with varied directional sheen beneath clear glossy resin.
- `carbonFiberForgedMatte` — New chopped-carbon composite; irregular black and charcoal fiber flecks beneath matte clear resin.
- `carbonFiberTintedGlossRed` — Black woven carbon composite beneath transparent red tinted gloss resin; visible weave and directional fiber sheen, not opaque paint.
- `carbonFiberTintedGlossBlue` — Black woven carbon composite beneath transparent blue tinted gloss resin; visible weave and directional fiber sheen, not opaque paint.
- `carbonFiberTintedGlossGreen` — Black woven carbon composite beneath transparent green tinted gloss resin; visible weave and directional fiber sheen, not opaque paint.
- `carbonFiberTintedGlossGold` — Black woven carbon composite beneath transparent gold tinted gloss resin; visible weave and directional fiber sheen, not opaque paint.
- `carbonFiberTintedGlossBronze` — Black woven carbon composite beneath transparent bronze tinted gloss resin; visible weave and directional fiber sheen, not opaque paint.
- `carbonAramidWeaveGloss` — Black carbon and natural yellow aramid hybrid weave beneath clear gloss resin; contrasting yarn colors with directional fiber sheen.
- `carbonAramidWeaveMatte` — Black carbon and yellow aramid hybrid weave beneath matte resin; visible yarn contrast and subdued directional sheen.
- `aramidCompositeNatural` — Natural yellow woven aramid composite; fine yarn texture beneath clear satin resin.
- `glassFiberCompositeNatural` — Natural glass-fiber-reinforced resin; pale cream to amber translucent mottling with faint fiber texture and satin resin sheen.
- `glassFiberCompositeWhite` — White pigmented glass-fiber composite; opaque smooth satin resin with faint substrate fiber print-through.
- `sheetMoldingCompoundGray` — New gray fiber-reinforced sheet-molding compound; opaque satin resin finish and faint short-fiber mottling.
- `sheetMoldingCompoundBlack` — New black fiber-reinforced sheet-molding compound; fine matte-to-satin resin surface and subtle short-fiber texture.
- `naturalFiberCompositeFlax` — New flax-fiber composite; warm tan woven fibers visible under clear satin resin, subtle natural yarn color variation.
- `naturalFiberCompositeHemp` — New hemp-fiber composite; tan-to-brown random fiber texture in a matte resin surface.
- `naturalFiberCompositeKenaf` — New kenaf-fiber composite; pale brown coarse short-fiber flecks in a matte opaque binder.
- `carbonFiberPrintBlack` — Carbon-weave printed decorative laminate; black and charcoal weave albedo pattern under a smooth polymer finish, without real fiber optical depth.

## Foams, insulation, absorbers, and filter media

- `polyurethaneFoamOpenCellCream` — Clean new cream open-cell polyurethane foam; visible fine cellular texture, matte diffuse scattering, and soft color variation.
- `polyurethaneFoamOpenCellYellow` — Clean new yellow open-cell polyurethane foam; visible fine cellular texture, matte diffuse scattering, and soft color variation.
- `polyurethaneFoamOpenCellGray` — Clean new gray open-cell polyurethane foam; visible fine cellular texture, matte diffuse scattering, and soft color variation.
- `polyurethaneFoamOpenCellBlack` — Clean new black open-cell polyurethane foam; visible fine cellular texture, matte diffuse scattering, and soft color variation.
- `polyethyleneFoamClosedCellWhite` — Clean new white closed-cell polyethylene foam; fine dense cellular texture and matte waxy reflectance.
- `polyethyleneFoamClosedCellGray` — Clean new gray closed-cell polyethylene foam; fine dense cellular texture and matte waxy reflectance.
- `polyethyleneFoamClosedCellBlack` — Clean new black closed-cell polyethylene foam; fine dense cellular texture and matte waxy reflectance.
- `melamineFoamLightGray` — New light-gray melamine acoustic foam; extremely fine open-cell texture, low gloss, and soft diffuse response.
- `eppFoamBlack` — New black expanded-polypropylene foam; fused bead surface pattern, matte polymer reflectance, and slight beadwise color variation.
- `eppFoamGray` — New gray expanded-polypropylene foam; visible fused beads and low-gloss polymer response.
- `epsFoamWhite` — New white expanded-polystyrene foam; fine fused bead pattern and soft diffuse response.
- `polyurethaneFoamIntegralSkinBlack` — New black integral-skin polyurethane foam; smooth dense outer skin with fine molded grain and low satin sheen.
- `polyurethaneFoamIntegralSkinGray` — New gray integral-skin polyurethane foam; fine molded surface grain and soft low-gloss highlights.
- `recycledFiberInsulationMulticolor` — Clean new compressed recycled-fiber insulation; gray dominant mixed textile flecks, random fiber texture, and matte diffuse response.
- `petFiberInsulationGray` — Clean gray polyester-fiber acoustic insulation; dense random fine fibers and soft low-gloss response.
- `petFiberInsulationBlack` — Clean black polyester-fiber acoustic insulation; fine randomized fiber texture and muted sheen.
- `glassWoolInsulationPaleYellow` — New pale yellow glass-wool insulation; fine randomized fibers and soft diffuse scattering, without exposed coarse glitter.
- `mineralWoolInsulationGrayBrown` — New gray-brown mineral-fiber insulation; irregular fine fibers, matte diffuse response, no soot.
- `ceramicFiberInsulationWhite` — New white ceramic-fiber insulation; fine fibrous matte texture and soft diffuse scattering.
- `aerogelBlanketWhite` — New white aerogel insulation blanket; fine fibrous powdery matte appearance with low contrast.
- `aluminumFoilInsulationBright` — Clean bright aluminum foil surface; high silver conductor reflection with fine manufacturing microtexture.
- `aluminumFoilInsulationEmbossed` — Clean aluminum foil insulation face; silver conductor response with fine embossed surface microtexture, without a prescribed part shape.
- `aluminizedGlassCloth` — New aluminized glass-fiber textile; silver reflective coating with visible woven microtexture and anisotropic yarn sheen.
- `aluminizedPolymerFilm` — New metallized polymer film; bright silver conductor-like reflection beneath a thin transparent polymer layer.
- `bitumenDampingBlack` — Clean new black bituminous damping compound; dark fine-grained surface with low satin-to-waxy sheen.
- `butylDampingGray` — Clean new gray butyl damping compound; dense smooth elastomer with low satin reflectance.
- `filterPaperCream` — New cream cellulose filter medium; fine fibrous paper texture and matte diffuse response, no trapped dust.
- `filterPaperYellow` — New yellow resin-treated cellulose filter medium; fine fibrous texture and subdued matte sheen.
- `filterSyntheticWhite` — New white synthetic filter textile; fine random fibers and matte diffuse scattering.
- `filterSyntheticBlack` — New black synthetic filter textile; fine randomized fibers and very low gloss.
- `activatedCarbonFilterGray` — New charcoal-gray activated-carbon filter medium; fine dark granular and fibrous texture with matte diffuse response.

## Commercial, utility, and agricultural interior and cargo finishes

- `rubberFlooringFineGrainBlack` — black heavy-duty rubber flooring compound; dense fine grain and low satin sheen, clean new finish without scuffs.
- `rubberFlooringFineGrainCharcoal` — charcoal heavy-duty rubber flooring compound; dense fine grain and low satin sheen, clean new finish without scuffs.
- `rubberFlooringFineGrainGray` — gray heavy-duty rubber flooring compound; dense fine grain and low satin sheen, clean new finish without scuffs.
- `rubberFlooringFineGrainBrown` — brown heavy-duty rubber flooring compound; dense fine grain and low satin sheen, clean new finish without scuffs.
- `vinylFlooringBlack` — black commercial PVC flooring; fine embossed surface texture, opaque durable-looking satin finish.
- `vinylFlooringGray` — gray commercial PVC flooring; fine embossed surface texture, opaque durable-looking satin finish.
- `vinylFlooringBlue` — blue commercial PVC flooring; fine embossed surface texture, opaque durable-looking satin finish.
- `vinylFlooringBeige` — beige commercial PVC flooring; fine embossed surface texture, opaque durable-looking satin finish.
- `vinylFlooringSpeckledGrayBlack` — gray black speckled commercial vinyl flooring; small integrated pigment flecks and matte-to-satin polymer finish.
- `vinylFlooringSpeckledBlueGray` — blue gray speckled commercial vinyl flooring; small integrated pigment flecks and matte-to-satin polymer finish.
- `vinylFlooringSpeckledBeigeBrown` — beige brown speckled commercial vinyl flooring; small integrated pigment flecks and matte-to-satin polymer finish.
- `phenolicPlywoodBrown` — New brown phenolic-film-faced plywood surface; fine resin texture and low satin finish, without bare damaged patches.
- `phenolicPlywoodBlack` — New black phenolic-film-faced plywood surface; fine matte-to-satin resin texture.
- `plywoodBirchSealed` — New sealed birch plywood appearance; pale tan wood grain under clear satin protection, no stains or wear.
- `plywoodHardwoodSealed` — New sealed hardwood plywood appearance; medium brown grain and clear satin finish.
- `hardwoodFlooringNatural` — New natural hardwood surface; warm brown grain under a thin clear satin finish, no dents or use marks.
- `bambooFlooringSealed` — New laminated bamboo surface; pale honey fiber pattern under clear satin protection.
- `fiberglassGelcoatGlossWhite` — white opaque polyester gelcoat over fiber composite; smooth glossy dielectric finish with very faint substrate texture.
- `fiberglassGelcoatGlossCream` — cream opaque polyester gelcoat over fiber composite; smooth glossy dielectric finish with very faint substrate texture.
- `fiberglassGelcoatGlossGray` — gray opaque polyester gelcoat over fiber composite; smooth glossy dielectric finish with very faint substrate texture.
- `fiberglassGelcoatGlossBlack` — black opaque polyester gelcoat over fiber composite; smooth glossy dielectric finish with very faint substrate texture.
- `fiberglassGelcoatGlossRed` — red opaque polyester gelcoat over fiber composite; smooth glossy dielectric finish with very faint substrate texture.
- `fiberglassGelcoatGlossYellow` — yellow opaque polyester gelcoat over fiber composite; smooth glossy dielectric finish with very faint substrate texture.
- `fiberglassGelcoatGlossBlue` — blue opaque polyester gelcoat over fiber composite; smooth glossy dielectric finish with very faint substrate texture.
- `fiberglassGelcoatGlossGreen` — green opaque polyester gelcoat over fiber composite; smooth glossy dielectric finish with very faint substrate texture.
- `fiberglassGelcoatSatinWhite` — white opaque gelcoat over fiber composite; fine satin dielectric surface.
- `fiberglassGelcoatSatinGray` — gray opaque gelcoat over fiber composite; fine satin dielectric surface.
- `fiberglassGelcoatSatinBlack` — black opaque gelcoat over fiber composite; fine satin dielectric surface.
- `fiberglassGelcoatSatinBeige` — beige opaque gelcoat over fiber composite; fine satin dielectric surface.
- `thermoplasticLinerSmoothWhite` — white clean thermoplastic lining finish; smooth opaque satin surface with subtle fine molding texture.
- `thermoplasticLinerSmoothGray` — gray clean thermoplastic lining finish; smooth opaque satin surface with subtle fine molding texture.
- `thermoplasticLinerSmoothBlack` — black clean thermoplastic lining finish; smooth opaque satin surface with subtle fine molding texture.
- `pvcCoatedTarpaulinWhite` — white PVC-coated technical fabric; slight woven reinforcement print-through beneath a flexible satin-to-gloss polymer skin.
- `pvcCoatedTarpaulinGray` — gray PVC-coated technical fabric; slight woven reinforcement print-through beneath a flexible satin-to-gloss polymer skin.
- `pvcCoatedTarpaulinBlack` — black PVC-coated technical fabric; slight woven reinforcement print-through beneath a flexible satin-to-gloss polymer skin.
- `pvcCoatedTarpaulinRed` — red PVC-coated technical fabric; slight woven reinforcement print-through beneath a flexible satin-to-gloss polymer skin.
- `pvcCoatedTarpaulinOrange` — orange PVC-coated technical fabric; slight woven reinforcement print-through beneath a flexible satin-to-gloss polymer skin.
- `pvcCoatedTarpaulinYellow` — yellow PVC-coated technical fabric; slight woven reinforcement print-through beneath a flexible satin-to-gloss polymer skin.
- `pvcCoatedTarpaulinGreen` — green PVC-coated technical fabric; slight woven reinforcement print-through beneath a flexible satin-to-gloss polymer skin.
- `pvcCoatedTarpaulinBlue` — blue PVC-coated technical fabric; slight woven reinforcement print-through beneath a flexible satin-to-gloss polymer skin.
- `polyethyleneWovenTarpaulinWhite` — white woven polyethylene coated fabric; fine flat-tape weave visible beneath a waxy low-satin surface.
- `polyethyleneWovenTarpaulinGray` — gray woven polyethylene coated fabric; fine flat-tape weave visible beneath a waxy low-satin surface.
- `polyethyleneWovenTarpaulinGreen` — green woven polyethylene coated fabric; fine flat-tape weave visible beneath a waxy low-satin surface.
- `polyethyleneWovenTarpaulinBlue` — blue woven polyethylene coated fabric; fine flat-tape weave visible beneath a waxy low-satin surface.
- `coatedCanvasBlack` — black weather-resistant coated canvas; visible coarse textile weave beneath a matte flexible coating.
- `coatedCanvasGray` — gray weather-resistant coated canvas; visible coarse textile weave beneath a matte flexible coating.
- `coatedCanvasTan` — tan weather-resistant coated canvas; visible coarse textile weave beneath a matte flexible coating.
- `coatedCanvasOliveGreen` — olive green weather-resistant coated canvas; visible coarse textile weave beneath a matte flexible coating.
- `coatedCanvasBlue` — blue weather-resistant coated canvas; visible coarse textile weave beneath a matte flexible coating.
- `foodContactPolymerWhite` — white smooth food-contact polymer appearance; clean fine-grained satin finish; natural variant is milky translucent. This is a visual label, not a certification.
- `foodContactPolymerNaturalTranslucent` — natural translucent smooth food-contact polymer appearance; clean fine-grained satin finish; natural variant is milky translucent. This is a visual label, not a certification.
- `foodContactPolymerBlue` — blue smooth food-contact polymer appearance; clean fine-grained satin finish; natural variant is milky translucent. This is a visual label, not a certification.
- `foodContactPolymerBlack` — black smooth food-contact polymer appearance; clean fine-grained satin finish; natural variant is milky translucent. This is a visual label, not a certification.
- `uhmwPolyethyleneNatural` — New natural UHMW polyethylene; milky white waxy polymer with slight diffuse translucency and low satin surface.
- `uhmwPolyethyleneBlack` — New black UHMW polyethylene; smooth waxy low-satin opaque polymer surface.
- `uhmwPolyethyleneBlue` — New blue UHMW polyethylene; opaque smooth polymer with a restrained waxy sheen.
- `uhmwPolyethyleneGreen` — New green UHMW polyethylene; opaque smooth polymer with a restrained waxy sheen.
- `abrasionResistantSteelClean` — New unpainted abrasion-resistant steel; clean dark gray metallic surface with fine mill texture and no rust or field polishing.
- `boronSteelClean` — New clean boron-alloy steel appearance; dark gray conductor response and fine manufacturing texture, without use-induced shine.
- `tungstenCarbideSintered` — New sintered tungsten-carbide hard material; dark neutral gray metallic response with fine granular satin texture.

## Powertrain, friction, and technical ceramic materials

- `brakeFrictionCompositeGray` — New gray friction composite; fine mineral and fiber flecks, matte diffuse response, no brake dust or use glazing.
- `brakeFrictionCompositeDarkBrown` — New dark-brown resin-bonded friction composite; fine granular/fibrous texture and matte response.
- `clutchFrictionCompositeBrown` — New brown resin-bonded friction material; visible fine reinforcing fibers and low-gloss granular surface.
- `carbonCeramicCompositeGray` — New carbon-ceramic friction composite; charcoal-gray fine heterogeneous texture with subdued sheen, no use marks.
- `carbonCarbonCompositeBlack` — New carbon-carbon composite; black fibrous microtexture with muted directional sheen and low diffuse brightness.
- `sinteredMetalFrictionBronze` — New sintered metallic friction material; bronze-gray granular metallic texture and moderate roughness.
- `technicalCeramicSmoothWhite` — white dense technical ceramic; fine smooth dielectric surface with low-to-medium satin gloss.
- `technicalCeramicSmoothCream` — cream dense technical ceramic; fine smooth dielectric surface with low-to-medium satin gloss.
- `technicalCeramicSmoothGray` — gray dense technical ceramic; fine smooth dielectric surface with low-to-medium satin gloss.
- `technicalCeramicSmoothBlack` — black dense technical ceramic; fine smooth dielectric surface with low-to-medium satin gloss.
- `aluminaCeramicWhiteGloss` — New white alumina ceramic with a smooth glossy dielectric surface and slight diffuse subsurface softness.
- `siliconNitrideCeramicDarkGray` — New dark-gray silicon-nitride ceramic appearance; dense fine-grained surface and subdued dielectric sheen.
- `siliconCarbideCeramicBlack` — New black silicon-carbide ceramic appearance; fine crystalline texture and low satin reflectance.
- `ceramicThermalBarrierCream` — New cream-colored ceramic thermal barrier; fine porous matte surface with soft diffuse scattering.
- `graphiteGasketDarkGray` — New graphite sheet material; dark gray fine flaky microtexture with weak directional metallic-looking sheen.
- `compressedFiberGasketGreen` — New green compressed-fiber gasket material; fine random fiber texture and matte opaque finish.
- `compressedFiberGasketBlue` — New blue compressed-fiber gasket material; fine random fiber texture and matte opaque finish.
- `compressedFiberGasketTan` — New tan compressed-fiber gasket material; fine fibrous texture and low gloss.
- `corkRubberGasketBrown` — New cork-rubber composite; small tan cork particles in a dark elastomer binder, matte fine cellular texture.
- `aramidGasketGray` — New gray aramid-fiber gasket sheet; fine dense fibrous texture and matte response.
- `oilImpregnatedBronze` — New oil-impregnated sintered bronze; warm bronze metallic body with fine porosity and a restrained thin oil sheen.

## Electrical insulation, wiring polymers, and battery materials

- `wireInsulationPvcBlack` — black flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcWhite` — white flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcGray` — gray flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcBrown` — brown flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcRed` — red flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcOrange` — orange flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcYellow` — yellow flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcGreen` — green flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcBlue` — blue flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcViolet` — violet flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationPvcPink` — pink flexible PVC electrical insulation; smooth opaque satin polymer skin with fine extrusion texture.
- `wireInsulationCrosslinkedPolyethyleneBlack` — black crosslinked-polyethylene insulation; fine smooth satin finish and slightly waxy dielectric sheen.
- `wireInsulationCrosslinkedPolyethyleneWhite` — white crosslinked-polyethylene insulation; fine smooth satin finish and slightly waxy dielectric sheen.
- `wireInsulationCrosslinkedPolyethyleneRed` — red crosslinked-polyethylene insulation; fine smooth satin finish and slightly waxy dielectric sheen.
- `wireInsulationCrosslinkedPolyethyleneOrange` — orange crosslinked-polyethylene insulation; fine smooth satin finish and slightly waxy dielectric sheen.
- `wireInsulationCrosslinkedPolyethyleneYellow` — yellow crosslinked-polyethylene insulation; fine smooth satin finish and slightly waxy dielectric sheen.
- `wireInsulationCrosslinkedPolyethyleneBlue` — blue crosslinked-polyethylene insulation; fine smooth satin finish and slightly waxy dielectric sheen.
- `wireInsulationSiliconeBlack` — black silicone insulation; soft smooth low-satin surface and fine skin microtexture.
- `wireInsulationSiliconeWhite` — white silicone insulation; soft smooth low-satin surface and fine skin microtexture.
- `wireInsulationSiliconeRed` — red silicone insulation; soft smooth low-satin surface and fine skin microtexture.
- `wireInsulationSiliconeOrange` — orange silicone insulation; soft smooth low-satin surface and fine skin microtexture.
- `wireInsulationSiliconeBlue` — blue silicone insulation; soft smooth low-satin surface and fine skin microtexture.
- `heatShrinkPolyolefinBlack` — black heat-shrink polyolefin material; fine satin polymer surface; clear variant has low-haze transparent transmission.
- `heatShrinkPolyolefinGray` — gray heat-shrink polyolefin material; fine satin polymer surface; clear variant has low-haze transparent transmission.
- `heatShrinkPolyolefinWhite` — white heat-shrink polyolefin material; fine satin polymer surface; clear variant has low-haze transparent transmission.
- `heatShrinkPolyolefinRed` — red heat-shrink polyolefin material; fine satin polymer surface; clear variant has low-haze transparent transmission.
- `heatShrinkPolyolefinYellow` — yellow heat-shrink polyolefin material; fine satin polymer surface; clear variant has low-haze transparent transmission.
- `heatShrinkPolyolefinBlue` — blue heat-shrink polyolefin material; fine satin polymer surface; clear variant has low-haze transparent transmission.
- `heatShrinkPolyolefinClear` — clear heat-shrink polyolefin material; fine satin polymer surface; clear variant has low-haze transparent transmission.
- `electricalPottingEpoxyBlack` — black cured epoxy encapsulant; smooth glassy-to-satin resin, opaque except for amber/clear formulations with thickness-dependent transmission.
- `electricalPottingEpoxyGray` — gray cured epoxy encapsulant; smooth glassy-to-satin resin, opaque except for amber/clear formulations with thickness-dependent transmission.
- `electricalPottingEpoxyAmber` — amber cured epoxy encapsulant; smooth glassy-to-satin resin, opaque except for amber/clear formulations with thickness-dependent transmission.
- `electricalPottingEpoxyClear` — clear cured epoxy encapsulant; smooth glassy-to-satin resin, opaque except for amber/clear formulations with thickness-dependent transmission.
- `electricalPottingSiliconeBlack` — black cured silicone encapsulant; smooth low-satin elastomer; clear variant uses transparent transmission with slight haze.
- `electricalPottingSiliconeGray` — gray cured silicone encapsulant; smooth low-satin elastomer; clear variant uses transparent transmission with slight haze.
- `electricalPottingSiliconeWhite` — white cured silicone encapsulant; smooth low-satin elastomer; clear variant uses transparent transmission with slight haze.
- `electricalPottingSiliconeClear` — clear cured silicone encapsulant; smooth low-satin elastomer; clear variant uses transparent transmission with slight haze.
- `thermalInterfacePadGray` — gray thermally conductive filled silicone pad material; soft matte fine texture and diffuse opaque appearance.
- `thermalInterfacePadBlue` — blue thermally conductive filled silicone pad material; soft matte fine texture and diffuse opaque appearance.
- `thermalInterfacePadPink` — pink thermally conductive filled silicone pad material; soft matte fine texture and diffuse opaque appearance.
- `thermalInterfacePadWhite` — white thermally conductive filled silicone pad material; soft matte fine texture and diffuse opaque appearance.
- `thermalInterfacePasteGray` — gray thermal interface compound; dense fine paste texture with subdued satin reflections and no metallic sparkle.
- `thermalInterfacePasteWhite` — white thermal interface compound; dense fine paste texture with subdued satin reflections and no metallic sparkle.
- `circuitBoardSolderMaskGreen` — green cured solder-mask coating; thin smooth satin-to-gloss dielectric resin with mild translucent depth where appropriate.
- `circuitBoardSolderMaskDarkGreen` — dark green cured solder-mask coating; thin smooth satin-to-gloss dielectric resin with mild translucent depth where appropriate.
- `circuitBoardSolderMaskBlue` — blue cured solder-mask coating; thin smooth satin-to-gloss dielectric resin with mild translucent depth where appropriate.
- `circuitBoardSolderMaskRed` — red cured solder-mask coating; thin smooth satin-to-gloss dielectric resin with mild translucent depth where appropriate.
- `circuitBoardSolderMaskBlack` — black cured solder-mask coating; thin smooth satin-to-gloss dielectric resin with mild translucent depth where appropriate.
- `circuitBoardSolderMaskWhite` — white cured solder-mask coating; thin smooth satin-to-gloss dielectric resin with mild translucent depth where appropriate.
- `circuitBoardLaminateNatural` — Natural glass-epoxy electrical laminate; pale amber-green semi-translucent resin with faint woven glass texture.
- `solderAlloySilver` — New solder alloy; pale silver metallic response with fine solidification texture and restrained gloss.
- `silverPlatedConductor` — Clean silver plating; bright neutral metallic reflection with very fine manufacturing microtexture.
- `goldPlatedConductor` — Clean gold plating; warm yellow conductor reflectance and smooth fine-grained finish.
- `tinPlatedConductor` — Clean tin plating; cool silver metallic appearance with fine satin microtexture.
- `batteryPolymerBlack` — New black acid-resistant battery polymer; fine opaque molded grain and satin dielectric reflections.
- `batteryPolymerTranslucentWhite` — New milky-white acid-resistant battery polymer; fine satin surface with diffuse thickness-dependent transmission.
- `batteryPouchLaminateSilver` — New aluminum-polymer battery laminate; silver metallic response beneath a smooth transparent polymer skin.
- `batterySeparatorWhite` — New white microporous polymer separator; fine matte texture and slightly translucent diffuse scattering.
- `batteryElectrodeGraphiteBlack` — New black graphite electrode coating; fine granular matte surface, no emission or wet contamination.
- `batteryElectrodeOxideDarkGray` — New dark-gray metal-oxide electrode coating; fine granular matte dielectric appearance.
- `micaInsulationNatural` — New natural mica insulation; pale silver-tan flaky layered texture, subtle translucent depth, and low satin sheen.
- `micaInsulationWhite` — New white mica-based insulating sheet; fine flaky mineral texture and matte-to-satin response.
- `polyimideFilmAmber` — New amber polyimide film; transparent tinted dielectric with smooth satin-to-gloss reflections and thickness-dependent absorption.
- `polyimideFilmBlack` — New black polyimide film; fine opaque polymer surface and restrained satin highlights.

## Hydraulic, pneumatic, and reinforced flexible materials

- `hydraulicRubberCoverBlackSmooth` — New black oil-resistant rubber cover compound; smooth low-satin skin, fine extrusion texture, no oily contamination.
- `hydraulicRubberCoverBlackWrapped` — New black oil-resistant rubber cover with a fine textile-imprinted surface finish; matte-to-satin dielectric response.
- `hydraulicThermoplasticCoverBlack` — New black thermoplastic cover; fine smooth satin skin and slightly waxy polymer highlights.
- `hydraulicThermoplasticCoverOrange` — New orange thermoplastic cover; opaque smooth satin skin and fine extrusion microtexture.
- `hydraulicNylonSleevingBlack` — New black woven nylon protective textile; dense yarn texture and restrained directional fiber sheen.
- `hydraulicPolyesterSleevingBlack` — New black polyester protective textile; fine woven texture and low satin yarn response.
- `siliconeCoatedGlassFabricRed` — New red silicone-coated glass fabric; fine weave print-through under a soft low-gloss elastomer skin.
- `siliconeCoatedGlassFabricSilver` — New silver-gray silicone-coated glass fabric; fine weave print-through and broad low-satin dielectric highlights.
- `stainlessSteelBraidedFinish` — Clean stainless-wire textile surface; fine interwoven directional metallic texture and bright silver conductor highlights; material specification only.
- `copperBraidedFinish` — Clean copper-wire textile surface; fine interwoven directional metallic texture and warm reddish conductor highlights; material specification only.
- `pneumaticPolyurethaneBlack` — black pneumatic-grade polyurethane; smooth semi-gloss polymer skin; clear variant has low-haze transparent transmission.
- `pneumaticPolyurethaneClear` — clear pneumatic-grade polyurethane; smooth semi-gloss polymer skin; clear variant has low-haze transparent transmission.
- `pneumaticPolyurethaneBlue` — blue pneumatic-grade polyurethane; smooth semi-gloss polymer skin; clear variant has low-haze transparent transmission.
- `pneumaticPolyurethaneRed` — red pneumatic-grade polyurethane; smooth semi-gloss polymer skin; clear variant has low-haze transparent transmission.
- `pneumaticPolyurethaneYellow` — yellow pneumatic-grade polyurethane; smooth semi-gloss polymer skin; clear variant has low-haze transparent transmission.
- `pneumaticPolyurethaneGreen` — green pneumatic-grade polyurethane; smooth semi-gloss polymer skin; clear variant has low-haze transparent transmission.
- `pneumaticNylonBlack` — black pneumatic-grade nylon; smooth satin polymer skin; natural formulation has mild milky transmission.
- `pneumaticNylonNaturalTranslucent` — natural translucent pneumatic-grade nylon; smooth satin polymer skin; natural formulation has mild milky transmission.
- `pneumaticNylonBlue` — blue pneumatic-grade nylon; smooth satin polymer skin; natural formulation has mild milky transmission.
- `pneumaticNylonRed` — red pneumatic-grade nylon; smooth satin polymer skin; natural formulation has mild milky transmission.
- `pvcFlexibleClear` — Clear flexible PVC; glossy transparent dielectric with slight absorption and fine extrusion texture.
- `pvcFlexibleReinforcedClear` — Clear reinforced PVC material; transparent glossy polymer with a visible fine white embedded fiber pattern represented as a material texture.
- `ptfeFlexibleNatural` — Natural white PTFE flexible material; smooth waxy low-gloss dielectric appearance and mild diffuse translucency.

## Adhesives, bonding compounds, and functional films

- `structuralEpoxyAdhesiveBlack` — black cured structural epoxy adhesive; dense opaque resin with fine smooth-to-slightly-grained surface and low satin sheen.
- `structuralEpoxyAdhesiveGray` — gray cured structural epoxy adhesive; dense opaque resin with fine smooth-to-slightly-grained surface and low satin sheen.
- `structuralEpoxyAdhesiveBeige` — beige cured structural epoxy adhesive; dense opaque resin with fine smooth-to-slightly-grained surface and low satin sheen.
- `polyurethaneAdhesiveBlack` — black cured polyurethane adhesive; opaque elastic resin with smooth low-satin skin.
- `polyurethaneAdhesiveGray` — gray cured polyurethane adhesive; opaque elastic resin with smooth low-satin skin.
- `polyurethaneAdhesiveWhite` — white cured polyurethane adhesive; opaque elastic resin with smooth low-satin skin.
- `polyurethaneAdhesiveBeige` — beige cured polyurethane adhesive; opaque elastic resin with smooth low-satin skin.
- `siliconeSealantBlack` — black cured silicone sealant; smooth soft satin skin; clear formulation has transparent transmission with slight haze.
- `siliconeSealantGray` — gray cured silicone sealant; smooth soft satin skin; clear formulation has transparent transmission with slight haze.
- `siliconeSealantWhite` — white cured silicone sealant; smooth soft satin skin; clear formulation has transparent transmission with slight haze.
- `siliconeSealantClear` — clear cured silicone sealant; smooth soft satin skin; clear formulation has transparent transmission with slight haze.
- `butylSealantBlack` — New black butyl sealing compound; dense smooth low-gloss elastomer with a slightly tacky-looking surface.
- `acrylicFoamAdhesiveGray` — New gray acrylic foam adhesive material; fine closed-cell texture and low-satin polymer reflectance.
- `acrylicFoamAdhesiveBlack` — New black acrylic foam adhesive material; fine closed-cell texture and subdued satin skin.
- `acrylicTransferAdhesiveClear` — Clear pressure-sensitive acrylic adhesive; smooth transparent dielectric film with very faint haze.
- `hotMeltAdhesiveAmber` — New amber hot-melt adhesive; translucent waxy resin with low-to-medium gloss and absorption tint.
- `hotMeltAdhesiveWhite` — New white hot-melt adhesive; opaque-to-milky waxy polymer with soft satin highlights.
- `threadlockingCompoundBlue` — Cured blue threadlocking resin; thin pigmented polymer finish with satin sheen and mild translucent depth.
- `threadlockingCompoundRed` — Cured red threadlocking resin; thin pigmented polymer finish with satin sheen and mild translucent depth.
- `threadlockingCompoundGreen` — Cured green retaining resin; thin pigmented polymer finish with satin sheen and mild translucent depth.
- `assemblyMarkingLacquerYellow` — Fresh yellow inspection lacquer; opaque thin gloss-to-satin pigmented resin, without a prescribed mark pattern.
- `assemblyMarkingLacquerWhite` — Fresh white inspection lacquer; opaque thin satin pigmented resin, without a prescribed mark pattern.
- `assemblyMarkingLacquerRed` — Fresh red inspection lacquer; opaque thin gloss-to-satin pigmented resin, without a prescribed mark pattern.

## Labels, inks, transfers, and safety films

- `printedInkMatteBlack` — black opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkMatteWhite` — white opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkMatteGray` — gray opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkMatteRed` — red opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkMatteOrange` — orange opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkMatteYellow` — yellow opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkMatteGreen` — green opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkMatteBlue` — blue opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkMatteSilver` — silver opaque printed ink; thin matte pigment film, fine print texture; silver uses a muted metallic-pigment response.
- `printedInkGlossBlack` — black opaque printed ink under a glossy binder; fine print texture, metallic pigment only for silver and gold.
- `printedInkGlossWhite` — white opaque printed ink under a glossy binder; fine print texture, metallic pigment only for silver and gold.
- `printedInkGlossRed` — red opaque printed ink under a glossy binder; fine print texture, metallic pigment only for silver and gold.
- `printedInkGlossYellow` — yellow opaque printed ink under a glossy binder; fine print texture, metallic pigment only for silver and gold.
- `printedInkGlossBlue` — blue opaque printed ink under a glossy binder; fine print texture, metallic pigment only for silver and gold.
- `printedInkGlossSilver` — silver opaque printed ink under a glossy binder; fine print texture, metallic pigment only for silver and gold.
- `printedInkGlossGold` — gold opaque printed ink under a glossy binder; fine print texture, metallic pigment only for silver and gold.
- `decalVinylGlossWhite` — white opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylGlossBlack` — black opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylGlossRed` — red opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylGlossOrange` — orange opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylGlossYellow` — yellow opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylGlossGreen` — green opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylGlossBlue` — blue opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylGlossSilver` — silver opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylGlossGold` — gold opaque adhesive decal film; smooth glossy dielectric surface, with metal-effect pigment for silver and gold.
- `decalVinylMatteWhite` — white opaque adhesive decal film; fine matte polymer surface and clean uniform pigmentation.
- `decalVinylMatteBlack` — black opaque adhesive decal film; fine matte polymer surface and clean uniform pigmentation.
- `decalVinylMatteGray` — gray opaque adhesive decal film; fine matte polymer surface and clean uniform pigmentation.
- `decalVinylMatteRed` — red opaque adhesive decal film; fine matte polymer surface and clean uniform pigmentation.
- `decalVinylMatteYellow` — yellow opaque adhesive decal film; fine matte polymer surface and clean uniform pigmentation.
- `decalVinylMatteGreen` — green opaque adhesive decal film; fine matte polymer surface and clean uniform pigmentation.
- `decalVinylMatteBlue` — blue opaque adhesive decal film; fine matte polymer surface and clean uniform pigmentation.
- `reflectiveSafetyFilmWhite` — white retroreflective safety film; source-directed reflected light beneath a glossy clear protective surface, no self-emission.
- `reflectiveSafetyFilmSilver` — silver retroreflective safety film; source-directed reflected light beneath a glossy clear protective surface, no self-emission.
- `reflectiveSafetyFilmRed` — red retroreflective safety film; source-directed reflected light beneath a glossy clear protective surface, no self-emission.
- `reflectiveSafetyFilmOrange` — orange retroreflective safety film; source-directed reflected light beneath a glossy clear protective surface, no self-emission.
- `reflectiveSafetyFilmYellow` — yellow retroreflective safety film; source-directed reflected light beneath a glossy clear protective surface, no self-emission.
- `reflectiveSafetyFilmYellowGreen` — yellow green retroreflective safety film; source-directed reflected light beneath a glossy clear protective surface, no self-emission.
- `reflectiveSafetyFilmBlue` — blue retroreflective safety film; source-directed reflected light beneath a glossy clear protective surface, no self-emission.
- `fluorescentSafetyFilmYellowGreen` — yellow green fluorescent safety film; strongly saturated diffuse appearance under daylight; spectral fluorescence where supported, no unconditional light emission.
- `fluorescentSafetyFilmOrange` — orange fluorescent safety film; strongly saturated diffuse appearance under daylight; spectral fluorescence where supported, no unconditional light emission.
- `fluorescentSafetyFilmRed` — red fluorescent safety film; strongly saturated diffuse appearance under daylight; spectral fluorescence where supported, no unconditional light emission.
- `fluorescentSafetyFilmPink` — pink fluorescent safety film; strongly saturated diffuse appearance under daylight; spectral fluorescence where supported, no unconditional light emission.
- `phosphorescentFilmPaleGreen` — Pale-green photoluminescent film; matte translucent-looking pigment with time-dependent afterglow emission only when charged; distinguish emission from reflectance.
- `brushedAluminumLabelStock` — New silver aluminum label stock; fine directional brushed metal response beneath a clear protective coating.
- `polyesterLabelStockWhite` — New opaque white polyester label film; fine smooth satin polymer surface.
- `polyesterLabelStockSilver` — New silver metallized polyester label film; smooth metallic response beneath a thin clear polymer surface.
- `polyesterLabelStockClear` — New clear polyester label film; smooth transparent dielectric surface and negligible haze.
- `paperLabelStockWhite` — New white coated paper label; fine matte fibrous texture and opaque diffuse appearance.
- `ceramicMarkingInkWhite` — White fired ceramic marking ink; fine opaque low-satin ceramic surface, no emission.
- `ceramicMarkingInkBlack` — Black fired ceramic marking ink; fine opaque matte ceramic surface, no emission.
- `laserMarkedPolymerLightGray` — Light-gray laser-modified polymer appearance; fine matte opaque surface, without any prescribed symbol or pattern.

## Display, emissive, and luminescent materials

- `displayCoverGlassClear` — Clear hard display cover glass; smooth glossy dielectric reflections, low haze, and no inherent emission.
- `displayCoverGlassAntiReflective` — Clear anti-reflective display cover glass; reduced front-surface glare with a faint residual angular coating tint.
- `displayCoverGlassAntiGlare` — Fine etched anti-glare display glass; broad softened reflections and slight transmission haze, no inherent emission.
- `displayPolarizerBlack` — Dark display polarizer material; near-black absorbing surface with restrained directional reflection, no inherent emission.
- `displayLcdActiveSurface` — Active LCD image-producing material; texture-driven color and backlit emission with a finite black level and angle-dependent contrast; specify luminance separately from the image.
- `displayOledActiveSurface` — Active OLED image-producing material; texture-driven emissive color, very low non-emitting black level, and smooth low-reflectance surface.
- `displayMicroLedActiveSurface` — Active micro-LED image-producing material; texture-driven emission with very dark inactive regions and controlled luminance.
- `displayEpaperWhite` — Reflective white electronic-paper state; matte diffuse light scattering with no self-emission.
- `displayEpaperBlack` — Reflective black electronic-paper state; dark matte absorbing appearance with no self-emission.
- `emissiveLedPhosphorWarmWhite` — warm white phosphor-converted LED material; emissive spectral/color output with a pale yellow-white diffuse phosphor appearance when unpowered; calibrate luminance.
- `emissiveLedPhosphorNeutralWhite` — neutral white phosphor-converted LED material; emissive spectral/color output with a pale yellow-white diffuse phosphor appearance when unpowered; calibrate luminance.
- `emissiveLedPhosphorCoolWhite` — cool white phosphor-converted LED material; emissive spectral/color output with a pale yellow-white diffuse phosphor appearance when unpowered; calibrate luminance.
- `emissiveLedRed` — red LED emitting material; narrow-band-like saturated emission with calibrated luminance, separate from any transparent encapsulant.
- `emissiveLedAmber` — amber LED emitting material; narrow-band-like saturated emission with calibrated luminance, separate from any transparent encapsulant.
- `emissiveLedYellow` — yellow LED emitting material; narrow-band-like saturated emission with calibrated luminance, separate from any transparent encapsulant.
- `emissiveLedGreen` — green LED emitting material; narrow-band-like saturated emission with calibrated luminance, separate from any transparent encapsulant.
- `emissiveLedCyan` — cyan LED emitting material; narrow-band-like saturated emission with calibrated luminance, separate from any transparent encapsulant.
- `emissiveLedBlue` — blue LED emitting material; narrow-band-like saturated emission with calibrated luminance, separate from any transparent encapsulant.
- `emissiveLedViolet` — violet LED emitting material; narrow-band-like saturated emission with calibrated luminance, separate from any transparent encapsulant.
- `emissiveIndicatorDiffuseWhite` — white diffuse luminous polymer material; soft scattering emission with a low-gloss surface; emitted intensity is a separately controlled parameter.
- `emissiveIndicatorDiffuseRed` — red diffuse luminous polymer material; soft scattering emission with a low-gloss surface; emitted intensity is a separately controlled parameter.
- `emissiveIndicatorDiffuseAmber` — amber diffuse luminous polymer material; soft scattering emission with a low-gloss surface; emitted intensity is a separately controlled parameter.
- `emissiveIndicatorDiffuseGreen` — green diffuse luminous polymer material; soft scattering emission with a low-gloss surface; emitted intensity is a separately controlled parameter.
- `emissiveIndicatorDiffuseBlue` — blue diffuse luminous polymer material; soft scattering emission with a low-gloss surface; emitted intensity is a separately controlled parameter.
- `emissiveAmbientRgb` — Color-variable diffuse luminous material; RGB-controlled emission with calibrated luminance and scattering, retaining a neutral translucent appearance when unpowered.
- `emissiveElectroluminescentCyan` — Cyan electroluminescent material; uniform low-luminance diffuse emission with a fine matte surface.
- `emissiveElectroluminescentGreen` — Green electroluminescent material; uniform low-luminance diffuse emission with a fine matte surface.
- `projectionCombinerCoating` — Transparent optical-combiner coating; selective angle-dependent reflection and clear transmission, without inherent emission.

## Clean operating fluids and assembly lubricants

- `engineOilFreshAmber` — Fresh amber engine oil; transparent absorbing liquid with smooth dielectric reflections, clear viscous appearance, no soot or contamination.
- `engineOilFreshPaleGold` — Fresh pale-gold engine oil; low-haze transparent transmission and smooth dielectric reflections.
- `gearOilFreshAmber` — Fresh amber gear lubricant; transparent absorption tint, smooth dielectric reflections, and no suspended contaminants.
- `transmissionFluidRed` — Fresh red transmission fluid; transparent red absorption tint and smooth glossy dielectric liquid response.
- `transmissionFluidAmber` — Fresh amber transmission fluid; transparent tinted liquid with smooth dielectric reflections.
- `transmissionFluidBlue` — Fresh blue transmission fluid; transparent absorption tint and smooth dielectric reflections.
- `hydraulicOilPaleAmber` — Fresh pale amber hydraulic oil; clear absorbing dielectric liquid, no bubbles, dirt, or milky contamination.
- `hydraulicFluidRed` — Fresh red hydraulic fluid; transparent tinted dielectric liquid with smooth surface reflections.
- `brakeFluidClear` — Fresh nearly colorless brake fluid; clear dielectric liquid with a faint warm tint and smooth reflections.
- `brakeFluidPaleAmber` — Fresh pale amber brake fluid; clear absorbing dielectric liquid with smooth glossy reflections.
- `coolantFluidGreen` — Fresh green coolant; transparent dye absorption in a clear dielectric liquid, no sediment or foam; color alone does not identify chemistry or compatibility.
- `coolantFluidBlue` — Fresh blue coolant; transparent dye absorption in a clear dielectric liquid, no sediment or foam; color alone does not identify chemistry or compatibility.
- `coolantFluidPink` — Fresh pink coolant; transparent dye absorption in a clear dielectric liquid, no sediment or foam; color alone does not identify chemistry or compatibility.
- `coolantFluidRed` — Fresh red coolant; transparent dye absorption in a clear dielectric liquid, no sediment or foam; color alone does not identify chemistry or compatibility.
- `coolantFluidOrange` — Fresh orange coolant; transparent dye absorption in a clear dielectric liquid, no sediment or foam; color alone does not identify chemistry or compatibility.
- `coolantFluidYellow` — Fresh yellow coolant; transparent dye absorption in a clear dielectric liquid, no sediment or foam; color alone does not identify chemistry or compatibility.
- `coolantFluidViolet` — Fresh violet coolant; transparent dye absorption in a clear dielectric liquid, no sediment or foam; color alone does not identify chemistry or compatibility.
- `washerFluidClear` — Fresh clear washer fluid; low-viscosity transparent dielectric liquid with absorption tint and no suspended dirt.
- `washerFluidBlue` — Fresh blue washer fluid; low-viscosity transparent dielectric liquid with absorption tint and no suspended dirt.
- `washerFluidPink` — Fresh pink washer fluid; low-viscosity transparent dielectric liquid with absorption tint and no suspended dirt.
- `washerFluidGreen` — Fresh green washer fluid; low-viscosity transparent dielectric liquid with absorption tint and no suspended dirt.
- `washerFluidPurple` — Fresh purple washer fluid; low-viscosity transparent dielectric liquid with absorption tint and no suspended dirt.
- `waterClear` — Clean colorless water; transparent dielectric liquid with smooth reflections, refraction, and very weak visible absorption.
- `dieselFuelPaleAmber` — Clean pale amber diesel fuel; transparent dielectric liquid with smooth reflections and absorption tint.
- `gasolinePaleStraw` — Clean pale-straw gasoline appearance; transparent dielectric liquid and smooth reflections, no contamination.
- `dieselExhaustFluidClear` — Clean colorless aqueous urea solution; transparent dielectric liquid with smooth reflections, no dried crystals.
- `batteryElectrolyteClear` — Clean colorless battery-electrolyte appearance; transparent dielectric liquid with smooth reflections, no bubbles or corrosion residue.
- `greaseLithiumAmber` — Fresh amber lithium-based grease appearance; semi-translucent dense lubricant, waxy glossy highlights, and thickness-dependent color.
- `greaseLithiumWhite` — Fresh white lithium grease appearance; opaque cream-white paste with soft waxy sheen.
- `greaseCalciumBrown` — Fresh brown calcium-based grease appearance; semi-opaque waxy lubricant with restrained gloss.
- `greaseMolyDarkGray` — Fresh molybdenum-containing grease appearance; opaque dark-gray fine paste with subdued oily sheen.
- `greaseSyntheticRed` — Fresh red synthetic grease appearance; translucent-to-opaque red waxy paste with smooth glossy highlights.
- `greaseSyntheticBlue` — Fresh blue synthetic grease appearance; translucent-to-opaque blue waxy paste with smooth glossy highlights.
- `assemblyLubricantClear` — Fresh clear assembly lubricant; transparent viscous dielectric with smooth wet-looking reflections and no contamination.

## Factory-fresh specialty mineral and decorative materials

- `marbleWhiteGrayVeinPolished` — New white marble decorative finish with gray veining; fine mineral color pattern beneath a polished dielectric surface and subtle subsurface softness.
- `marbleBlackWhiteVeinPolished` — New black marble decorative finish with white veins; polished dielectric reflections and fine mineral color pattern.
- `graniteGrayPolished` — New gray granite decorative surface; fine multi-mineral speckles and polished dielectric reflections with occasional mineral glints.
- `stoneVeneerSlateGray` — New gray slate veneer; fine layered mineral texture and low matte-to-satin sheen.
- `stoneVeneerQuartziteBeige` — New beige quartzite veneer; fine pale crystalline variation and satin mineral reflectance.
- `motherOfPearlNatural` — New natural mother-of-pearl decorative material; pale cream base with gentle angle-dependent iridescence and smooth gloss.
- `decorativeCrystalClear` — Clear decorative crystal glass; high-clarity dielectric transmission, glossy reflections, and dispersion where supported.
- `decorativeCrystalSmoke` — Smoke-tinted decorative crystal glass; transparent absorption tint, glossy dielectric reflections, and dispersion where supported.
- `porcelainWhiteGloss` — New white glazed porcelain; smooth glossy dielectric glaze over an opaque white ceramic body.
- `porcelainBlackGloss` — New black glazed porcelain; smooth glossy dielectric glaze over an opaque black ceramic body.
- `decorativeCeramicWhiteSatin` — New white decorative ceramic; fine smooth satin dielectric surface and opaque diffuse body.
- `decorativeCeramicBlackSatin` — New black decorative ceramic; dense fine surface with controlled satin dielectric highlights.

## Clear finishes, hardcoats, and transparent surface treatments

- `clearcoatPolyurethaneGloss` — Colorless automotive polyurethane clearcoat; high-gloss dielectric reflections, clear transmission, and very fine application microtexture.
- `clearcoatPolyurethaneSatin` — Colorless automotive polyurethane clearcoat; broad satin reflections and clear-to-slightly-hazy transmission.
- `clearcoatPolyurethaneMatte` — Colorless matte polyurethane clearcoat; strongly broadened dielectric reflections and fine uniform surface texture.
- `clearcoatAcrylicGloss` — Colorless acrylic clear finish; smooth glossy dielectric surface and high-clarity transmission.
- `clearcoatAcrylicSatin` — Colorless acrylic clear finish; fine satin surface and mild reflection diffusion.
- `clearcoatUvCuredGloss` — Colorless UV-cured clear resin; hard smooth high-gloss dielectric surface with clear transmission.
- `clearcoatUvCuredMatte` — Colorless UV-cured clear resin; fine matte surface and broad low-contrast dielectric highlights.
- `clearcoatPolyesterGloss` — Colorless polyester clear resin; smooth deep gloss and high-clarity dielectric transmission.
- `clearcoatEpoxyGloss` — Clear epoxy finish; smooth glossy dielectric surface with slight warm absorption at increased optical depth.
- `clearcoatAntiFingerprintSatin` — Colorless anti-fingerprint clear finish; uniform fine satin surface and mild reflection diffusion, clean new condition.
- `clearcoatAntiFingerprintGloss` — Colorless anti-fingerprint clear finish; smooth high-clarity gloss and faint fine-scale surface texture.
- `hardcoatOpticalPolymerClear` — Colorless abrasion-resistant optical polymer hardcoat; smooth glossy dielectric surface with very low haze.
- `hardcoatOpticalPolymerAntiGlare` — Colorless hardcoat with a fine anti-glare surface; broadened reflections and mild transmission haze.
- `hydrophobicGlassCoatingClear` — Colorless hydrophobic glass treatment; optically thin clear dielectric layer with minimal visible color or roughness change in clean dry condition.
- `ceramicPaintProtectionClear` — Colorless transparent paint-protection coating; smooth thin dielectric finish retaining the underlying paint texture and color.
- `clearcoatTintedSmoke` — Transparent smoke-tinted clearcoat; smooth gloss dielectric reflections and neutral absorption through the coating.
- `clearcoatTintedAmber` — Transparent amber clearcoat; smooth gloss dielectric reflections and warm absorption through the coating.

## Weatherproof textiles and specialist decorative fabrics

- `convertibleTopAcrylicClothBlack` — black solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothCharcoal` — charcoal solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothGray` — gray solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothBeige` — beige solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothTan` — tan solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothBrown` — brown solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothBurgundy` — burgundy solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothNavyBlue` — navy blue solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothBlue` — blue solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopAcrylicClothGreen` — green solution-dyed acrylic weatherproof cloth; tightly woven fine yarn texture, deep diffuse pigmentation, and low fiber sheen, factory-new condition.
- `convertibleTopPolyesterClothBlack` — black weatherproof polyester cloth; dense fine weave, matte body color, and slightly stronger yarn sheen than acrylic cloth.
- `convertibleTopPolyesterClothGray` — gray weatherproof polyester cloth; dense fine weave, matte body color, and slightly stronger yarn sheen than acrylic cloth.
- `convertibleTopPolyesterClothTan` — tan weatherproof polyester cloth; dense fine weave, matte body color, and slightly stronger yarn sheen than acrylic cloth.
- `convertibleTopPolyesterClothBurgundy` — burgundy weatherproof polyester cloth; dense fine weave, matte body color, and slightly stronger yarn sheen than acrylic cloth.
- `convertibleTopPolyesterClothNavyBlue` — navy blue weatherproof polyester cloth; dense fine weave, matte body color, and slightly stronger yarn sheen than acrylic cloth.
- `convertibleTopVinylBlack` — black weatherproof vinyl-coated fabric; fine embossed grain over a textile backing, low satin polymer sheen.
- `convertibleTopVinylWhite` — white weatherproof vinyl-coated fabric; fine embossed grain over a textile backing, low satin polymer sheen.
- `convertibleTopVinylGray` — gray weatherproof vinyl-coated fabric; fine embossed grain over a textile backing, low satin polymer sheen.
- `convertibleTopVinylBeige` — beige weatherproof vinyl-coated fabric; fine embossed grain over a textile backing, low satin polymer sheen.
- `convertibleTopVinylTan` — tan weatherproof vinyl-coated fabric; fine embossed grain over a textile backing, low satin polymer sheen.
- `convertibleTopVinylBrown` — brown weatherproof vinyl-coated fabric; fine embossed grain over a textile backing, low satin polymer sheen.
- `convertibleTopVinylBlue` — blue weatherproof vinyl-coated fabric; fine embossed grain over a textile backing, low satin polymer sheen.
- `awningAcrylicFabricWhite` — white outdoor acrylic fabric; fine tightly woven texture, matte diffuse color, and subdued yarn sheen.
- `awningAcrylicFabricGray` — gray outdoor acrylic fabric; fine tightly woven texture, matte diffuse color, and subdued yarn sheen.
- `awningAcrylicFabricBeige` — beige outdoor acrylic fabric; fine tightly woven texture, matte diffuse color, and subdued yarn sheen.
- `awningAcrylicFabricBlue` — blue outdoor acrylic fabric; fine tightly woven texture, matte diffuse color, and subdued yarn sheen.
- `awningAcrylicFabricGreen` — green outdoor acrylic fabric; fine tightly woven texture, matte diffuse color, and subdued yarn sheen.
- `decorativeSatinTextileBlack` — black fine decorative satin textile; smooth tightly woven face with pronounced directional fiber sheen and soft diffuse body color.
- `decorativeSatinTextileIvory` — ivory fine decorative satin textile; smooth tightly woven face with pronounced directional fiber sheen and soft diffuse body color.
- `decorativeSatinTextileChampagne` — champagne fine decorative satin textile; smooth tightly woven face with pronounced directional fiber sheen and soft diffuse body color.
- `decorativeSatinTextileRed` — red fine decorative satin textile; smooth tightly woven face with pronounced directional fiber sheen and soft diffuse body color.
- `decorativeSatinTextileNavyBlue` — navy blue fine decorative satin textile; smooth tightly woven face with pronounced directional fiber sheen and soft diffuse body color.
- `decorativeSilkBlendIvory` — ivory fine silk-blend decorative textile; subtle yarn irregularity and luminous directional fiber sheen without self-emission.
- `decorativeSilkBlendBeige` — beige fine silk-blend decorative textile; subtle yarn irregularity and luminous directional fiber sheen without self-emission.
- `decorativeSilkBlendBurgundy` — burgundy fine silk-blend decorative textile; subtle yarn irregularity and luminous directional fiber sheen without self-emission.
- `decorativeSilkBlendBlue` — blue fine silk-blend decorative textile; subtle yarn irregularity and luminous directional fiber sheen without self-emission.
- `decorativeBoucleIvory` — ivory boucle upholstery textile; dense curled-yarn surface texture with soft diffuse color and restrained grazing-angle sheen.
- `decorativeBoucleGray` — gray boucle upholstery textile; dense curled-yarn surface texture with soft diffuse color and restrained grazing-angle sheen.
- `decorativeBoucleBeige` — beige boucle upholstery textile; dense curled-yarn surface texture with soft diffuse color and restrained grazing-angle sheen.
- `decorativeBoucleBrown` — brown boucle upholstery textile; dense curled-yarn surface texture with soft diffuse color and restrained grazing-angle sheen.
- `decorativeFauxFurWhite` — white synthetic pile textile material; soft directional fiber scattering and deep diffuse body color, without a prescribed pile shape or length.
- `decorativeFauxFurCream` — cream synthetic pile textile material; soft directional fiber scattering and deep diffuse body color, without a prescribed pile shape or length.
- `decorativeFauxFurGray` — gray synthetic pile textile material; soft directional fiber scattering and deep diffuse body color, without a prescribed pile shape or length.
- `decorativeFauxFurBlack` — black synthetic pile textile material; soft directional fiber scattering and deep diffuse body color, without a prescribed pile shape or length.

## Specialty energy, sensor, and chemical-resistant materials

- `photovoltaicSiliconMonocrystalline` — Dark blue-black monocrystalline silicon photovoltaic surface with anti-reflective treatment; low diffuse brightness and subdued angular blue reflections, no emission.
- `photovoltaicSiliconPolycrystalline` — Blue polycrystalline silicon photovoltaic surface; fine crystalline color domains and restrained angular reflections beneath anti-reflective treatment, no emission.
- `photovoltaicThinFilmBlack` — Near-black thin-film photovoltaic coating; smooth low-reflectance semiconductor appearance and faint angle-dependent tint, no emission.
- `photovoltaicEncapsulantClear` — Colorless photovoltaic encapsulant resin; clear dielectric transmission, smooth reflections, and slight thickness-dependent absorption.
- `semiconductorSiliconPolished` — Clean polished silicon appearance; dark neutral-gray high-index reflective surface with a restrained colored reflection, no inherent emission.
- `opticalGermaniumCoated` — Coated germanium optical material; visibly opaque dark-gray surface with angle-dependent coated reflections; infrared transmission requires a spectral model.
- `opticalSapphireClear` — Colorless sapphire optical material; high-clarity dielectric transmission, smooth strong reflections, and no inherent emission.
- `conductiveCeramicInkSilver` — Cured silver-filled conductive ceramic ink; fine silver-gray metallic microtexture and medium satin sheen.
- `conductivePolymerInkBlack` — Cured black conductive polymer ink; fine matte-to-satin carbon-filled resin surface, non-emissive.
- `transparentConductiveOxide` — Transparent conductive oxide coating; very thin clear film with subtle angle-dependent residual tint and reduced transmission appropriate to reference data.
- `carbonLoadedPolymerBlack` — Black carbon-loaded conductive polymer; opaque fine-grained surface with low satin dielectric appearance.
- `fuelCellMembranePaleCream` — Pale-cream ion-conducting polymer membrane appearance; smooth low-satin translucent film, no inherent emission.
- `fuelCellCarbonDiffusionMedium` — Black carbon-fiber diffusion medium; fine random fibrous texture with low gloss and muted directional fiber sheen.
- `catalystWashcoatCream` — Clean new cream-colored catalyst ceramic coating; fine porous matte surface and soft diffuse scattering, no soot.
- `catalystWashcoatGray` — Clean new gray catalyst ceramic coating; fine porous matte texture and subdued diffuse response.
- `cordieriteCeramicPaleBeige` — Clean new pale-beige cordierite ceramic; fine porous matte mineral surface, without any prescribed structure.
- `pvdfChemicalResistantNaturalWhite` — natural white PVDF chemical-resistant polymer; smooth dense satin dielectric surface with faint waxy translucency in the natural formulation.
- `pvdfChemicalResistantBlack` — black PVDF chemical-resistant polymer; smooth dense satin dielectric surface with faint waxy translucency in the natural formulation.
- `fepChemicalResistantClear` — clear fluoropolymer material; smooth glossy-to-satin dielectric surface with transparent or diffusely translucent transmission as named.
- `fepChemicalResistantMilkyWhite` — milky white fluoropolymer material; smooth glossy-to-satin dielectric surface with transparent or diffusely translucent transmission as named.
- `ptfeGlassFilledTan` — New tan glass-filled PTFE; fine fibrous polymer texture and subdued waxy satin reflectance.
- `ptfeBronzeFilledBrown` — New brown bronze-filled PTFE; fine bronze-colored particle flecks in an opaque low-satin polymer matrix.
- `ceramicFilledPolymerGray` — New gray ceramic-filled engineering polymer; fine dense mineral-filled texture and matte-to-satin dielectric response.
- `fluoropolymerReleaseCoatingBlack` — New black fluoropolymer release coating; fine opaque low-gloss skin with subdued waxy highlights.
- `fluoropolymerReleaseCoatingGray` — New gray fluoropolymer release coating; fine opaque satin skin with subdued waxy highlights.

## Reference basis

The entries are proposed material-library specifications, not manufacturer-certified optical data.
The following primary references support selected material distinctions; their product coverage is
not the boundary of this catalog.

- [BASF automotive and transportation coatings](https://www.basf.com/us/en/products/dispersions-resins-additives/industries/automotive-transportation)
  describes coating materials for both exterior and interior automotive finishes.
- [Saint-Gobain Sekurit Transport: Learn](https://www.saint-gobain-sekurit-transport.com/learn)
  distinguishes tempered and laminated glazing and describes solar-control glazing.
- [Saint-Gobain automotive and transportation glazing](https://www.saint-gobain.co.kr/en/market/automobile-rail-and-marine)
  describes tempered, laminated, tinted, and functionally coated automotive glass.

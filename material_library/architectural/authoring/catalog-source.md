# Architectural rendering material catalog

A broad planning inventory of materials for rendering CAD-derived homes, cottages,
high rises, offices, and their associated outdoor spaces. Every listed item is a
material, coating, optical medium, or surface finish. Geometry, building parts,
assembled products, construction layouts, and object libraries are outside this
catalog. This is an extensive baseline rather than a claim that every regional,
historic, proprietary, or custom material has been enumerated.

## Naming and specification conventions

- Each table row defines one separately selectable material with a unique lower
  camel case name. Color variants are separate rows. Finish variants are also
  separate rows when their reflection or texture differs materially.
- Descriptions specify visual composition, color, grain or microtexture, finish,
  and relevant optical behavior. Named stones describe recognizable visual
  families; natural variation within a family is expected.
- Materials are reusable across applications. For example, a white satin coating
  is specified once rather than repeated for every building surface that uses it.
  Substrate-specific appearances receive distinct entries when visible differences
  warrant them. A material does not imply a particular building component.
- Texture, pores, fibers, veins, fine embossing, and fine relief describe surface
  appearance only. They do not prescribe geometry. Any feature that resolves as
  shape or silhouette must be handled by the consuming system, outside this list.
  No tile grids, bonds, joints, perforation layouts, openings, or modeled objects
  are included in the material definitions.
- Color labels are art-direction targets, not measured manufacturer swatches.
  Author actual color values in a documented color space from calibrated samples.
  Do not bake illumination, shadows, reflections, or ambient occlusion into base
  color. Preserve texture scale and grain direction consistently across assets.
- Unless stated otherwise, solids are opaque dielectrics. Bare metals use colored
  conductor reflection. Opaque paints and powder coatings use dielectric reflection
  even when applied over metal. Transparent coatings over visible substrates need
  layered optical responses where the renderer supports them.
- Transmission, absorption, scattering, anisotropy, retroreflection, iridescence,
  and emission require corresponding renderer support. Glass and liquid tint depend
  on optical path length; opacity alone is not an adequate substitute. Emission
  strength and texture scale are authored parameters rather than fixed universal
  constants. Ordinary white and translucent materials are not self-emissive.
- Wet, weathered, stained, and deposited materials are explicit appearances where
  listed. Other combinations can be added later as new named materials; no entry
  is an instruction to generate an unspecified geometry or color variant.
- This is a rendering-library specification, not a construction, structural,
  thermal, acoustic, fire-rating, hygiene, or product-selection specification.

## Inventory

The catalog contains **1,277 materials in 24 families**.

- [Paint and interior coatings](#paint-and-interior-coatings) — 97 materials
- [Plaster, gypsum, stucco, and mineral renders](#plaster-gypsum-stucco-and-mineral-renders) — 49 materials
- [Concrete and cementitious surfaces](#concrete-and-cementitious-surfaces) — 51 materials
- [Brick, fired clay, mortar, and masonry finishes](#brick-fired-clay-mortar-and-masonry-finishes) — 45 materials
- [Natural stone](#natural-stone) — 109 materials
- [Engineered stone, ceramic, porcelain, and glass-derived finishes](#engineered-stone-ceramic-porcelain-and-glass-derived-finishes) — 97 materials
- [Natural wood and clear wood finishes](#natural-wood-and-clear-wood-finishes) — 90 materials
- [Engineered wood, laminates, lacquers, and composites](#engineered-wood-laminates-lacquers-and-composites) — 69 materials
- [Transparent protective coatings and surface treatments](#transparent-protective-coatings-and-surface-treatments) — 18 materials
- [Bare metals, plated metals, and patinas](#bare-metals-plated-metals-and-patinas) — 46 materials
- [Metal coatings and factory finishes](#metal-coatings-and-factory-finishes) — 65 materials
- [Architectural glass, mirrors, and optical films](#architectural-glass-mirrors-and-optical-films) — 47 materials
- [Roofing, waterproofing, and weather membranes](#roofing-waterproofing-and-weather-membranes) — 32 materials
- [Resilient flooring, resin coatings, and safety finishes](#resilient-flooring-resin-coatings-and-safety-finishes) — 63 materials
- [Carpet, felt, and textile surface finishes](#carpet-felt-and-textile-surface-finishes) — 58 materials
- [Upholstery, drapery, bedding, and woven fibers](#upholstery-drapery-bedding-and-woven-fibers) — 75 materials
- [Leather, hide, and synthetic upholstery](#leather-hide-and-synthetic-upholstery) — 37 materials
- [Plastics, elastomers, sealants, and adhesives](#plastics-elastomers-sealants-and-adhesives) — 57 materials
- [Sanitary ceramics, enamel, and utility composites](#sanitary-ceramics-enamel-and-utility-composites) — 26 materials
- [Insulation, exposed service materials, and construction substrates](#insulation-exposed-service-materials-and-construction-substrates) — 37 materials
- [Paper, wallcoverings, natural fiber finishes, and decorative coatings](#paper-wallcoverings-natural-fiber-finishes-and-decorative-coatings) — 29 materials
- [Exterior paving media, earth, aggregates, and landscape surface materials](#exterior-paving-media-earth-aggregates-and-landscape-surface-materials) — 46 materials
- [Water, frozen water, moisture, and deposited matter](#water-frozen-water-moisture-and-deposited-matter) — 19 materials
- [Luminous, display, and technical optical materials](#luminous-display-and-technical-optical-materials) — 15 materials

## Paint and interior coatings

| Material name                   | Description / specification                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `paintPureWhiteMatte`           | Pure white; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.   |
| `paintWarmWhiteMatte`           | Warm white; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.   |
| `paintIvoryMatte`               | Ivory; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.        |
| `paintCreamMatte`               | Cream; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.        |
| `paintBeigeMatte`               | Beige; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.        |
| `paintGreigeMatte`              | Greige; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.       |
| `paintLightGrayMatte`           | Light gray; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.   |
| `paintMediumGrayMatte`          | Medium gray; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.  |
| `paintCharcoalMatte`            | Charcoal; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.     |
| `paintBlackMatte`               | Black; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.        |
| `paintSageGreenMatte`           | Sage green; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.   |
| `paintOliveGreenMatte`          | Olive green; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.  |
| `paintForestGreenMatte`         | Forest green; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights. |
| `paintPaleBlueMatte`            | Pale blue; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.    |
| `paintNavyBlueMatte`            | Navy blue; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.    |
| `paintDustyRoseMatte`           | Dusty rose; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.   |
| `paintTerracottaMatte`          | Terracotta; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.   |
| `paintOchreMatte`               | Ochre; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.        |
| `paintMutedPurpleMatte`         | Muted purple; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights. |
| `paintTealMatte`                | Teal; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.         |
| `paintYellowMatte`              | Yellow; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.       |
| `paintRedMatte`                 | Red; opaque matte architectural paint with fine roller stipple, broad diffuse reflection, and very weak specular highlights.          |
| `paintPureWhiteEggshell`        | Pure white; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                |
| `paintWarmWhiteEggshell`        | Warm white; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                |
| `paintIvoryEggshell`            | Ivory; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                     |
| `paintCreamEggshell`            | Cream; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                     |
| `paintBeigeEggshell`            | Beige; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                     |
| `paintGreigeEggshell`           | Greige; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                    |
| `paintLightGrayEggshell`        | Light gray; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                |
| `paintMediumGrayEggshell`       | Medium gray; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.               |
| `paintCharcoalEggshell`         | Charcoal; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                  |
| `paintBlackEggshell`            | Black; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                     |
| `paintSageGreenEggshell`        | Sage green; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                |
| `paintOliveGreenEggshell`       | Olive green; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.               |
| `paintForestGreenEggshell`      | Forest green; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.              |
| `paintPaleBlueEggshell`         | Pale blue; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                 |
| `paintNavyBlueEggshell`         | Navy blue; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                 |
| `paintDustyRoseEggshell`        | Dusty rose; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                |
| `paintTerracottaEggshell`       | Terracotta; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                |
| `paintOchreEggshell`            | Ochre; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                     |
| `paintMutedPurpleEggshell`      | Muted purple; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.              |
| `paintTealEggshell`             | Teal; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                      |
| `paintYellowEggshell`           | Yellow; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                    |
| `paintRedEggshell`              | Red; opaque eggshell architectural paint with subtle roller texture and a soft, low-sheen dielectric highlight.                       |
| `paintPureWhiteSatin`           | Pure white; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.              |
| `paintWarmWhiteSatin`           | Warm white; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.              |
| `paintIvorySatin`               | Ivory; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                   |
| `paintCreamSatin`               | Cream; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                   |
| `paintBeigeSatin`               | Beige; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                   |
| `paintGreigeSatin`              | Greige; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                  |
| `paintLightGraySatin`           | Light gray; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.              |
| `paintMediumGraySatin`          | Medium gray; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.             |
| `paintCharcoalSatin`            | Charcoal; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                |
| `paintBlackSatin`               | Black; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                   |
| `paintSageGreenSatin`           | Sage green; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.              |
| `paintOliveGreenSatin`          | Olive green; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.             |
| `paintForestGreenSatin`         | Forest green; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.            |
| `paintPaleBlueSatin`            | Pale blue; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.               |
| `paintNavyBlueSatin`            | Navy blue; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.               |
| `paintDustyRoseSatin`           | Dusty rose; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.              |
| `paintTerracottaSatin`          | Terracotta; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.              |
| `paintOchreSatin`               | Ochre; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                   |
| `paintMutedPurpleSatin`         | Muted purple; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.            |
| `paintTealSatin`                | Teal; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                    |
| `paintYellowSatin`              | Yellow; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                  |
| `paintRedSatin`                 | Red; opaque satin architectural paint with fine application texture and a wider, clearer highlight than eggshell.                     |
| `paintPureWhiteSemiGloss`       | Pure white; opaque semi-gloss enamel with a smooth film and distinct reflected highlights.                                            |
| `paintWarmWhiteSemiGloss`       | Warm white; opaque semi-gloss enamel with a smooth film and distinct reflected highlights.                                            |
| `paintCreamSemiGloss`           | Cream; opaque semi-gloss enamel with a smooth film and distinct reflected highlights.                                                 |
| `paintLightGraySemiGloss`       | Light gray; opaque semi-gloss enamel with a smooth film and distinct reflected highlights.                                            |
| `paintCharcoalSemiGloss`        | Charcoal; opaque semi-gloss enamel with a smooth film and distinct reflected highlights.                                              |
| `paintBlackSemiGloss`           | Black; opaque semi-gloss enamel with a smooth film and distinct reflected highlights.                                                 |
| `paintNavyBlueSemiGloss`        | Navy blue; opaque semi-gloss enamel with a smooth film and distinct reflected highlights.                                             |
| `paintForestGreenSemiGloss`     | Forest green; opaque semi-gloss enamel with a smooth film and distinct reflected highlights.                                          |
| `paintPureWhiteHighGloss`       | Pure white; opaque high-gloss enamel with sharp dielectric reflections and a faint application ripple.                                |
| `paintIvoryHighGloss`           | Ivory; opaque high-gloss enamel with sharp dielectric reflections and a faint application ripple.                                     |
| `paintBlackHighGloss`           | Black; opaque high-gloss enamel with sharp dielectric reflections and a faint application ripple.                                     |
| `paintRedHighGloss`             | Red; opaque high-gloss enamel with sharp dielectric reflections and a faint application ripple.                                       |
| `paintNavyBlueHighGloss`        | Navy blue; opaque high-gloss enamel with sharp dielectric reflections and a faint application ripple.                                 |
| `limewashChalkWhite`            | Chalk white; mineral limewash with clouded pigment density, overlapping brush variation, and a dry chalky matte surface.              |
| `limewashIvory`                 | Ivory; mineral limewash with clouded pigment density, overlapping brush variation, and a dry chalky matte surface.                    |
| `limewashSand`                  | Sand; mineral limewash with clouded pigment density, overlapping brush variation, and a dry chalky matte surface.                     |
| `limewashWarmGray`              | Warm gray; mineral limewash with clouded pigment density, overlapping brush variation, and a dry chalky matte surface.                |
| `limewashRose`                  | Rose; mineral limewash with clouded pigment density, overlapping brush variation, and a dry chalky matte surface.                     |
| `limewashOchre`                 | Ochre; mineral limewash with clouded pigment density, overlapping brush variation, and a dry chalky matte surface.                    |
| `limewashSage`                  | Sage; mineral limewash with clouded pigment density, overlapping brush variation, and a dry chalky matte surface.                     |
| `limewashTerracotta`            | Terracotta; mineral limewash with clouded pigment density, overlapping brush variation, and a dry chalky matte surface.               |
| `clayPaintWhite`                | White; opaque clay-based paint with a velvety matte response and fine mineral granularity.                                            |
| `clayPaintSand`                 | Sand; opaque clay-based paint with a velvety matte response and fine mineral granularity.                                             |
| `clayPaintEarthBrown`           | Earth brown; opaque clay-based paint with a velvety matte response and fine mineral granularity.                                      |
| `clayPaintRose`                 | Rose; opaque clay-based paint with a velvety matte response and fine mineral granularity.                                             |
| `clayPaintOchre`                | Ochre; opaque clay-based paint with a velvety matte response and fine mineral granularity.                                            |
| `chalkboardPaintBlack`          | Deep black pigmented coating; very matte, fine tooth, with optional separate chalk residue overlay.                                   |
| `chalkboardPaintGreen`          | Dark green pigmented coating; very matte, fine tooth, with optional separate chalk residue overlay.                                   |
| `whiteboardCoatingWhite`        | Opaque white writable coating with a smooth, glossy dielectric surface and crisp reflections.                                         |
| `projectionCoatingNeutralWhite` | Neutral white opaque projection coating with a uniform matte response and no self-emission.                                           |
| `projectionCoatingNeutralGray`  | Neutral gray opaque projection coating with a uniform matte response and no self-emission.                                            |

## Plaster, gypsum, stucco, and mineral renders

| Material name                       | Description / specification                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `gypsumPlasterWhiteSmooth`          | White; fine gypsum plaster with subtly mottled color, low relief, and a dry matte finish.                            |
| `gypsumPlasterCreamSmooth`          | Cream; fine gypsum plaster with subtly mottled color, low relief, and a dry matte finish.                            |
| `gypsumPlasterLightGraySmooth`      | Light gray; fine gypsum plaster with subtly mottled color, low relief, and a dry matte finish.                       |
| `limePlasterWhiteTroweled`          | White; lime plaster with irregular trowel burnishing, fine pores, and softly varying roughness.                      |
| `limePlasterIvoryTroweled`          | Ivory; lime plaster with irregular trowel burnishing, fine pores, and softly varying roughness.                      |
| `limePlasterSandTroweled`           | Sand; lime plaster with irregular trowel burnishing, fine pores, and softly varying roughness.                       |
| `limePlasterWarmGrayTroweled`       | Warm gray; lime plaster with irregular trowel burnishing, fine pores, and softly varying roughness.                  |
| `venetianPlasterIvoryPolished`      | Ivory; pigmented polished plaster with layered cloudy depth and directional burnished sheen; opaque dielectric.      |
| `venetianPlasterBeigePolished`      | Beige; pigmented polished plaster with layered cloudy depth and directional burnished sheen; opaque dielectric.      |
| `venetianPlasterGrayPolished`       | Gray; pigmented polished plaster with layered cloudy depth and directional burnished sheen; opaque dielectric.       |
| `venetianPlasterCharcoalPolished`   | Charcoal; pigmented polished plaster with layered cloudy depth and directional burnished sheen; opaque dielectric.   |
| `venetianPlasterRosePolished`       | Rose; pigmented polished plaster with layered cloudy depth and directional burnished sheen; opaque dielectric.       |
| `venetianPlasterGreenPolished`      | Green; pigmented polished plaster with layered cloudy depth and directional burnished sheen; opaque dielectric.      |
| `tadelaktIvory`                     | Ivory; soap-polished lime finish with softly mottled pigment and a continuous waxy satin sheen.                      |
| `tadelaktSand`                      | Sand; soap-polished lime finish with softly mottled pigment and a continuous waxy satin sheen.                       |
| `tadelaktOchre`                     | Ochre; soap-polished lime finish with softly mottled pigment and a continuous waxy satin sheen.                      |
| `tadelaktTerracotta`                | Terracotta; soap-polished lime finish with softly mottled pigment and a continuous waxy satin sheen.                 |
| `tadelaktGray`                      | Gray; soap-polished lime finish with softly mottled pigment and a continuous waxy satin sheen.                       |
| `tadelaktBlack`                     | Black; soap-polished lime finish with softly mottled pigment and a continuous waxy satin sheen.                      |
| `stuccoWhiteFine`                   | White; mineral render with fine aggregate grain, irregular small-scale relief, and matte reflection.                 |
| `stuccoCreamFine`                   | Cream; mineral render with fine aggregate grain, irregular small-scale relief, and matte reflection.                 |
| `stuccoSandFine`                    | Sand; mineral render with fine aggregate grain, irregular small-scale relief, and matte reflection.                  |
| `stuccoGrayFine`                    | Gray; mineral render with fine aggregate grain, irregular small-scale relief, and matte reflection.                  |
| `stuccoTerracottaFine`              | Terracotta; mineral render with fine aggregate grain, irregular small-scale relief, and matte reflection.            |
| `stuccoOchreFine`                   | Ochre; mineral render with fine aggregate grain, irregular small-scale relief, and matte reflection.                 |
| `stuccoWhiteCoarse`                 | White; mineral render with visibly coarse embedded aggregate, deep local microrelief, and diffuse reflection.        |
| `stuccoCreamCoarse`                 | Cream; mineral render with visibly coarse embedded aggregate, deep local microrelief, and diffuse reflection.        |
| `stuccoSandCoarse`                  | Sand; mineral render with visibly coarse embedded aggregate, deep local microrelief, and diffuse reflection.         |
| `stuccoGrayCoarse`                  | Gray; mineral render with visibly coarse embedded aggregate, deep local microrelief, and diffuse reflection.         |
| `stuccoTerracottaCoarse`            | Terracotta; mineral render with visibly coarse embedded aggregate, deep local microrelief, and diffuse reflection.   |
| `acrylicRenderWhite`                | White; opaque polymer render with consistent fine granularity and low sheen.                                         |
| `acrylicRenderIvory`                | Ivory; opaque polymer render with consistent fine granularity and low sheen.                                         |
| `acrylicRenderBeige`                | Beige; opaque polymer render with consistent fine granularity and low sheen.                                         |
| `acrylicRenderLightGray`            | Light gray; opaque polymer render with consistent fine granularity and low sheen.                                    |
| `acrylicRenderCharcoal`             | Charcoal; opaque polymer render with consistent fine granularity and low sheen.                                      |
| `microcementWhite`                  | White; continuous cementitious finish with restrained trowel mottling, fine pores, and a sealed satin response.      |
| `microcementWarmGray`               | Warm gray; continuous cementitious finish with restrained trowel mottling, fine pores, and a sealed satin response.  |
| `microcementCoolGray`               | Cool gray; continuous cementitious finish with restrained trowel mottling, fine pores, and a sealed satin response.  |
| `microcementCharcoal`               | Charcoal; continuous cementitious finish with restrained trowel mottling, fine pores, and a sealed satin response.   |
| `microcementBeige`                  | Beige; continuous cementitious finish with restrained trowel mottling, fine pores, and a sealed satin response.      |
| `microcementTerracotta`             | Terracotta; continuous cementitious finish with restrained trowel mottling, fine pores, and a sealed satin response. |
| `gypsumBoardPaperUnfinished`        | Warm off-white paper facing with fine fibers, matte reflection, and subtle paper mottling.                           |
| `gypsumJointCompound`               | Chalky off-white joint compound with fine sanding striations and a very matte response.                              |
| `gypsumBoardMoistureResistantGreen` | Pale green paper facing with visible fine fiber and a matte finish.                                                  |
| `gypsumBoardFireResistantPink`      | Pale pink paper facing with visible fine fiber and a matte finish.                                                   |
| `earthenPlasterStraw`               | Warm brown clay plaster with visible pale straw fibers, granular texture, and high roughness.                        |
| `rammedEarthOchre`                  | Ochre earth with subtle compressed sedimentary color bands, fine exposed grit, and matte reflection.                 |
| `rammedEarthRed`                    | Red-brown earth with subtle compressed sedimentary color bands, fine exposed grit, and matte reflection.             |
| `rammedEarthGray`                   | Gray-brown earth with subtle compressed sedimentary color bands, fine exposed grit, and matte reflection.            |

## Concrete and cementitious surfaces

| Material name                         | Description / specification                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `concreteNaturalGrayAsCast`           | Natural gray; as-cast cement paste with subtle laitance variation, pinholes, and matte reflection; opaque nonmetallic material.             |
| `concreteWarmGrayAsCast`              | Warm gray; as-cast cement paste with subtle laitance variation, pinholes, and matte reflection; opaque nonmetallic material.                |
| `concreteWhiteAsCast`                 | White; as-cast cement paste with subtle laitance variation, pinholes, and matte reflection; opaque nonmetallic material.                    |
| `concreteCharcoalAsCast`              | Charcoal; as-cast cement paste with subtle laitance variation, pinholes, and matte reflection; opaque nonmetallic material.                 |
| `concreteNaturalGraySmoothPrecast`    | Natural gray; dense precast cement surface with fine pores, uniform color, and low sheen; opaque nonmetallic material.                      |
| `concreteWarmGraySmoothPrecast`       | Warm gray; dense precast cement surface with fine pores, uniform color, and low sheen; opaque nonmetallic material.                         |
| `concreteWhiteSmoothPrecast`          | White; dense precast cement surface with fine pores, uniform color, and low sheen; opaque nonmetallic material.                             |
| `concreteCharcoalSmoothPrecast`       | Charcoal; dense precast cement surface with fine pores, uniform color, and low sheen; opaque nonmetallic material.                          |
| `concreteNaturalGrayBoardImprinted`   | Natural gray; cement surface carrying a directional wood-grain imprint and subtle absorption variation; opaque nonmetallic material.        |
| `concreteWarmGrayBoardImprinted`      | Warm gray; cement surface carrying a directional wood-grain imprint and subtle absorption variation; opaque nonmetallic material.           |
| `concreteWhiteBoardImprinted`         | White; cement surface carrying a directional wood-grain imprint and subtle absorption variation; opaque nonmetallic material.               |
| `concreteCharcoalBoardImprinted`      | Charcoal; cement surface carrying a directional wood-grain imprint and subtle absorption variation; opaque nonmetallic material.            |
| `concreteNaturalGraySandblasted`      | Natural gray; abraded cement surface with exposed fine sand, small pits, and high roughness; opaque nonmetallic material.                   |
| `concreteWarmGraySandblasted`         | Warm gray; abraded cement surface with exposed fine sand, small pits, and high roughness; opaque nonmetallic material.                      |
| `concreteWhiteSandblasted`            | White; abraded cement surface with exposed fine sand, small pits, and high roughness; opaque nonmetallic material.                          |
| `concreteCharcoalSandblasted`         | Charcoal; abraded cement surface with exposed fine sand, small pits, and high roughness; opaque nonmetallic material.                       |
| `concreteNaturalGrayHoned`            | Natural gray; honed cement with small exposed mineral flecks and a restrained satin sheen; opaque nonmetallic material.                     |
| `concreteWarmGrayHoned`               | Warm gray; honed cement with small exposed mineral flecks and a restrained satin sheen; opaque nonmetallic material.                        |
| `concreteWhiteHoned`                  | White; honed cement with small exposed mineral flecks and a restrained satin sheen; opaque nonmetallic material.                            |
| `concreteCharcoalHoned`               | Charcoal; honed cement with small exposed mineral flecks and a restrained satin sheen; opaque nonmetallic material.                         |
| `concreteNaturalGrayPolished`         | Natural gray; polished cement with fine mineral exposure, cloudy paste variation, and clear broad reflections; opaque nonmetallic material. |
| `concreteWarmGrayPolished`            | Warm gray; polished cement with fine mineral exposure, cloudy paste variation, and clear broad reflections; opaque nonmetallic material.    |
| `concreteWhitePolished`               | White; polished cement with fine mineral exposure, cloudy paste variation, and clear broad reflections; opaque nonmetallic material.        |
| `concreteCharcoalPolished`            | Charcoal; polished cement with fine mineral exposure, cloudy paste variation, and clear broad reflections; opaque nonmetallic material.     |
| `concreteNaturalGrayBroomFinished`    | Natural gray; cement paste with fine directional brushing striations and high roughness; opaque nonmetallic material.                       |
| `concreteWarmGrayBroomFinished`       | Warm gray; cement paste with fine directional brushing striations and high roughness; opaque nonmetallic material.                          |
| `concreteWhiteBroomFinished`          | White; cement paste with fine directional brushing striations and high roughness; opaque nonmetallic material.                              |
| `concreteCharcoalBroomFinished`       | Charcoal; cement paste with fine directional brushing striations and high roughness; opaque nonmetallic material.                           |
| `concreteNaturalGrayExposedAggregate` | Natural gray; cement matrix with densely exposed mixed mineral grains and strong local roughness variation; opaque nonmetallic material.    |
| `concreteWarmGrayExposedAggregate`    | Warm gray; cement matrix with densely exposed mixed mineral grains and strong local roughness variation; opaque nonmetallic material.       |
| `concreteWhiteExposedAggregate`       | White; cement matrix with densely exposed mixed mineral grains and strong local roughness variation; opaque nonmetallic material.           |
| `concreteCharcoalExposedAggregate`    | Charcoal; cement matrix with densely exposed mixed mineral grains and strong local roughness variation; opaque nonmetallic material.        |
| `concretePigmentedBuff`               | Buff; integrally colored concrete with cloudy cement variation, fine mineral grain, and matte reflection.                                   |
| `concretePigmentedTerracotta`         | Terracotta; integrally colored concrete with cloudy cement variation, fine mineral grain, and matte reflection.                             |
| `concretePigmentedRed`                | Red; integrally colored concrete with cloudy cement variation, fine mineral grain, and matte reflection.                                    |
| `concretePigmentedOlive`              | Olive; integrally colored concrete with cloudy cement variation, fine mineral grain, and matte reflection.                                  |
| `concretePigmentedBlueGray`           | Blue gray; integrally colored concrete with cloudy cement variation, fine mineral grain, and matte reflection.                              |
| `concreteWeatheredGray`               | Aged gray cement with darkened pores, patchy mineral staining, and a rough diffuse surface.                                                 |
| `concreteWetGray`                     | Water-darkened gray concrete with reduced diffuse brightness and a smooth reflective water film over visible pores.                         |
| `concreteCarbonatedWhite`             | Pale gray cement with chalky white mineral deposits and a dry high-roughness response.                                                      |
| `concreteLightweightAerated`          | Pale gray aerated cement with dense small open pores and very matte reflection.                                                             |
| `cementTerrazzoWhite`                 | White cement with white and gray marble chips; dense mineral composite with irregular multiscale inclusions and a honed satin surface.      |
| `cementTerrazzoCream`                 | Cream cement with warm marble chips; dense mineral composite with irregular multiscale inclusions and a honed satin surface.                |
| `cementTerrazzoGray`                  | Gray cement with mixed gray stone chips; dense mineral composite with irregular multiscale inclusions and a honed satin surface.            |
| `cementTerrazzoBlack`                 | Black cement with white marble chips; dense mineral composite with irregular multiscale inclusions and a honed satin surface.               |
| `cementTerrazzoPink`                  | Pink cement with white and red marble chips; dense mineral composite with irregular multiscale inclusions and a honed satin surface.        |
| `cementTerrazzoGreen`                 | Green cement with pale marble chips; dense mineral composite with irregular multiscale inclusions and a honed satin surface.                |
| `resinTerrazzoWhite`                  | White resin with colorful mineral chips; opaque resin-mineral composite with crisp inclusions beneath a polished dielectric surface.        |
| `resinTerrazzoGray`                   | Gray resin with white and charcoal chips; opaque resin-mineral composite with crisp inclusions beneath a polished dielectric surface.       |
| `resinTerrazzoBlack`                  | Black resin with pale stone chips; opaque resin-mineral composite with crisp inclusions beneath a polished dielectric surface.              |
| `resinTerrazzoBlue`                   | Blue resin with pale chips; opaque resin-mineral composite with crisp inclusions beneath a polished dielectric surface.                     |

## Brick, fired clay, mortar, and masonry finishes

| Material name                       | Description / specification                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `brickClayRed`                      | Red; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included.        |
| `brickClayOrange`                   | Orange; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included.     |
| `brickClayBuff`                     | Buff; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included.       |
| `brickClayCream`                    | Cream; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included.      |
| `brickClayWhite`                    | White; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included.      |
| `brickClaySalmon`                   | Salmon; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included.     |
| `brickClayBrown`                    | Brown; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included.      |
| `brickClayDarkBrown`                | Dark brown; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included. |
| `brickClayCharcoal`                 | Charcoal; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included.   |
| `brickClayBlueBlack`                | Blue black; fired clay with fine pores, mottled kiln coloration, small mineral inclusions, and a dry rough surface; no bond pattern or mortar included. |
| `brickClayReclaimedRed`             | Weathered red fired clay with soot-darkened pores, pale salt traces, and chipped microtexture; no mortar pattern included.                              |
| `brickClayReclaimedBuff`            | Weathered buff fired clay with patchy dark staining, pale mineral deposits, and eroded microtexture; no mortar pattern included.                        |
| `brickGlazeWhite`                   | White; opaque fired ceramic glaze with slight orange-peel texture, soft kiln color variation, and glossy dielectric reflection.                         |
| `brickGlazeCream`                   | Cream; opaque fired ceramic glaze with slight orange-peel texture, soft kiln color variation, and glossy dielectric reflection.                         |
| `brickGlazeBlack`                   | Black; opaque fired ceramic glaze with slight orange-peel texture, soft kiln color variation, and glossy dielectric reflection.                         |
| `brickGlazeGreen`                   | Green; opaque fired ceramic glaze with slight orange-peel texture, soft kiln color variation, and glossy dielectric reflection.                         |
| `brickGlazeBlue`                    | Blue; opaque fired ceramic glaze with slight orange-peel texture, soft kiln color variation, and glossy dielectric reflection.                          |
| `terracottaUnglazedOrange`          | Orange; unglazed fired clay with fine open pores, natural kiln mottling, and a matte response.                                                          |
| `terracottaUnglazedRed`             | Red; unglazed fired clay with fine open pores, natural kiln mottling, and a matte response.                                                             |
| `terracottaUnglazedBuff`            | Buff; unglazed fired clay with fine open pores, natural kiln mottling, and a matte response.                                                            |
| `terracottaUnglazedBrown`           | Brown; unglazed fired clay with fine open pores, natural kiln mottling, and a matte response.                                                           |
| `terracottaGlazeWhite`              | White; glazed terracotta finish with a smooth vitreous surface, slight color pooling, and glossy reflection.                                            |
| `terracottaGlazeCream`              | Cream; glazed terracotta finish with a smooth vitreous surface, slight color pooling, and glossy reflection.                                            |
| `terracottaGlazeRed`                | Red; glazed terracotta finish with a smooth vitreous surface, slight color pooling, and glossy reflection.                                              |
| `terracottaGlazeGreen`              | Green; glazed terracotta finish with a smooth vitreous surface, slight color pooling, and glossy reflection.                                            |
| `terracottaGlazeBlue`               | Blue; glazed terracotta finish with a smooth vitreous surface, slight color pooling, and glossy reflection.                                             |
| `terracottaGlazeBlack`              | Black; glazed terracotta finish with a smooth vitreous surface, slight color pooling, and glossy reflection.                                            |
| `mortarWhite`                       | White; cement-lime mortar with fine exposed sand, small pores, and high roughness; material only, without joint layout.                                 |
| `mortarCream`                       | Cream; cement-lime mortar with fine exposed sand, small pores, and high roughness; material only, without joint layout.                                 |
| `mortarBuff`                        | Buff; cement-lime mortar with fine exposed sand, small pores, and high roughness; material only, without joint layout.                                  |
| `mortarLightGray`                   | Light gray; cement-lime mortar with fine exposed sand, small pores, and high roughness; material only, without joint layout.                            |
| `mortarMediumGray`                  | Medium gray; cement-lime mortar with fine exposed sand, small pores, and high roughness; material only, without joint layout.                           |
| `mortarCharcoal`                    | Charcoal; cement-lime mortar with fine exposed sand, small pores, and high roughness; material only, without joint layout.                              |
| `mortarRed`                         | Red; cement-lime mortar with fine exposed sand, small pores, and high roughness; material only, without joint layout.                                   |
| `limeMortarWhite`                   | White; lime-rich mortar with chalky binder, visible fine sand grains, and a very matte response.                                                        |
| `limeMortarBuff`                    | Buff; lime-rich mortar with chalky binder, visible fine sand grains, and a very matte response.                                                         |
| `limeMortarGray`                    | Gray; lime-rich mortar with chalky binder, visible fine sand grains, and a very matte response.                                                         |
| `masonryCementGray`                 | Gray; dense concrete masonry surface with fine aggregate flecks, small air pores, and high roughness.                                                   |
| `masonryCementWhite`                | White; dense concrete masonry surface with fine aggregate flecks, small air pores, and high roughness.                                                  |
| `masonryCementBuff`                 | Buff; dense concrete masonry surface with fine aggregate flecks, small air pores, and high roughness.                                                   |
| `masonryCementCharcoal`             | Charcoal; dense concrete masonry surface with fine aggregate flecks, small air pores, and high roughness.                                               |
| `masonryCementGraySplitTexture`     | Gray; fractured concrete masonry surface with coarse exposed stone fragments and irregular roughness; no block layout included.                         |
| `masonryCementBuffSplitTexture`     | Buff; fractured concrete masonry surface with coarse exposed stone fragments and irregular roughness; no block layout included.                         |
| `masonryCementCharcoalSplitTexture` | Charcoal; fractured concrete masonry surface with coarse exposed stone fragments and irregular roughness; no block layout included.                     |
| `clinkerClayDarkBrown`              | Dense dark brown fired clay with near-black kiln patches, occasional vitrified flecks, and variable satin-to-matte reflection.                          |

## Natural stone

| Material name                          | Description / specification                                                                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marbleCarraraWhiteHoned`              | White calcitic stone with soft gray branching veins; smooth honed surface with soft satin reflection.                                                                                         |
| `marbleCarraraWhitePolished`           | White calcitic stone with soft gray branching veins; polished surface with strong dielectric reflections and enhanced mineral contrast.                                                       |
| `marbleCalacattaGoldHoned`             | Warm white calcitic stone with bold gray and gold veining; smooth honed surface with soft satin reflection.                                                                                   |
| `marbleCalacattaGoldPolished`          | Warm white calcitic stone with bold gray and gold veining; polished surface with strong dielectric reflections and enhanced mineral contrast.                                                 |
| `marbleStatuarioWhiteHoned`            | Bright white calcitic stone with pronounced cool gray veins; smooth honed surface with soft satin reflection.                                                                                 |
| `marbleStatuarioWhitePolished`         | Bright white calcitic stone with pronounced cool gray veins; polished surface with strong dielectric reflections and enhanced mineral contrast.                                               |
| `marbleCremaMarfilBeigeHoned`          | Cream-beige calcitic stone with faint warm veins; smooth honed surface with soft satin reflection.                                                                                            |
| `marbleCremaMarfilBeigePolished`       | Cream-beige calcitic stone with faint warm veins; polished surface with strong dielectric reflections and enhanced mineral contrast.                                                          |
| `marbleEmperadorBrownHoned`            | Deep brown calcitic stone with pale irregular vein networks; smooth honed surface with soft satin reflection.                                                                                 |
| `marbleEmperadorBrownPolished`         | Deep brown calcitic stone with pale irregular vein networks; polished surface with strong dielectric reflections and enhanced mineral contrast.                                               |
| `marbleNeroMarquinaBlackHoned`         | Black calcitic stone with sharp white veins; smooth honed surface with soft satin reflection.                                                                                                 |
| `marbleNeroMarquinaBlackPolished`      | Black calcitic stone with sharp white veins; polished surface with strong dielectric reflections and enhanced mineral contrast.                                                               |
| `marbleVerdeGreenHoned`                | Dark green decorative stone with lighter mineral veining; smooth honed surface with soft satin reflection.                                                                                    |
| `marbleVerdeGreenPolished`             | Dark green decorative stone with lighter mineral veining; polished surface with strong dielectric reflections and enhanced mineral contrast.                                                  |
| `marbleRossoRedHoned`                  | Deep red decorative stone with pale veins and mineral mottling; smooth honed surface with soft satin reflection.                                                                              |
| `marbleRossoRedPolished`               | Deep red decorative stone with pale veins and mineral mottling; polished surface with strong dielectric reflections and enhanced mineral contrast.                                            |
| `graniteSaltAndPepperGrayHoned`        | Gray granular stone with interlocking black, white, and translucent mineral flecks; smooth honed surface with soft satin reflection.                                                          |
| `graniteSaltAndPepperGrayPolished`     | Gray granular stone with interlocking black, white, and translucent mineral flecks; polished surface with strong dielectric reflections and enhanced mineral contrast.                        |
| `graniteAbsoluteBlackHoned`            | Near-black fine-grained decorative stone with sparse subtle mineral flecks; smooth honed surface with soft satin reflection.                                                                  |
| `graniteAbsoluteBlackPolished`         | Near-black fine-grained decorative stone with sparse subtle mineral flecks; polished surface with strong dielectric reflections and enhanced mineral contrast.                                |
| `graniteBalticBrownHoned`              | Brown decorative stone with rounded dark mineral clusters; smooth honed surface with soft satin reflection.                                                                                   |
| `graniteBalticBrownPolished`           | Brown decorative stone with rounded dark mineral clusters; polished surface with strong dielectric reflections and enhanced mineral contrast.                                                 |
| `graniteRosePinkHoned`                 | Pink granular stone with black mica and pale quartz flecks; smooth honed surface with soft satin reflection.                                                                                  |
| `graniteRosePinkPolished`              | Pink granular stone with black mica and pale quartz flecks; polished surface with strong dielectric reflections and enhanced mineral contrast.                                                |
| `graniteWhiteHoned`                    | White granular stone with dispersed gray and black mineral flecks; smooth honed surface with soft satin reflection.                                                                           |
| `graniteWhitePolished`                 | White granular stone with dispersed gray and black mineral flecks; polished surface with strong dielectric reflections and enhanced mineral contrast.                                         |
| `limestoneCreamHoned`                  | Cream sedimentary stone with fine fossil fragments and soft color clouds; smooth honed surface with soft satin reflection.                                                                    |
| `limestoneCreamPolished`               | Cream sedimentary stone with fine fossil fragments and soft color clouds; polished surface with strong dielectric reflections and enhanced mineral contrast.                                  |
| `limestoneBuffHoned`                   | Buff sedimentary stone with faint bedding and small fossil inclusions; smooth honed surface with soft satin reflection.                                                                       |
| `limestoneBuffPolished`                | Buff sedimentary stone with faint bedding and small fossil inclusions; polished surface with strong dielectric reflections and enhanced mineral contrast.                                     |
| `limestoneGrayHoned`                   | Gray sedimentary stone with fine mineral mottling and sparse fossils; smooth honed surface with soft satin reflection.                                                                        |
| `limestoneGrayPolished`                | Gray sedimentary stone with fine mineral mottling and sparse fossils; polished surface with strong dielectric reflections and enhanced mineral contrast.                                      |
| `limestoneBlueGrayHoned`               | Blue-gray sedimentary stone with pale fossil flecks; smooth honed surface with soft satin reflection.                                                                                         |
| `limestoneBlueGrayPolished`            | Blue-gray sedimentary stone with pale fossil flecks; polished surface with strong dielectric reflections and enhanced mineral contrast.                                                       |
| `sandstoneBuffHoned`                   | Buff sedimentary stone with fine sand grains and subtle bedding; smooth honed surface with soft satin reflection.                                                                             |
| `sandstoneRedHoned`                    | Red sedimentary stone with warm iron-oxide mottling and fine grains; smooth honed surface with soft satin reflection.                                                                         |
| `sandstoneGrayHoned`                   | Gray sedimentary stone with fine quartz grains and faint bedding; smooth honed surface with soft satin reflection.                                                                            |
| `travertineIvoryHoned`                 | Ivory calcitic stone with elongated natural pores and cream mineral bands; smooth honed surface with soft satin reflection.                                                                   |
| `travertineIvoryPolished`              | Ivory calcitic stone with elongated natural pores and cream mineral bands; polished surface with strong dielectric reflections and enhanced mineral contrast.                                 |
| `travertineSilverHoned`                | Silver-gray calcitic stone with elongated pores and gray-beige mineral bands; smooth honed surface with soft satin reflection.                                                                |
| `travertineSilverPolished`             | Silver-gray calcitic stone with elongated pores and gray-beige mineral bands; polished surface with strong dielectric reflections and enhanced mineral contrast.                              |
| `travertineWalnutHoned`                | Brown calcitic stone with elongated pores and warm mineral bands; smooth honed surface with soft satin reflection.                                                                            |
| `travertineWalnutPolished`             | Brown calcitic stone with elongated pores and warm mineral bands; polished surface with strong dielectric reflections and enhanced mineral contrast.                                          |
| `slateCharcoalHoned`                   | Charcoal metamorphic stone with fine layered mineral variation; smooth honed surface with soft satin reflection.                                                                              |
| `slateBlueGrayHoned`                   | Blue-gray metamorphic stone with fine layered mineral variation; smooth honed surface with soft satin reflection.                                                                             |
| `slateGreenHoned`                      | Green-gray metamorphic stone with fine layered mineral variation; smooth honed surface with soft satin reflection.                                                                            |
| `slateRustMulticolorHoned`             | Slate with charcoal, rust, and ochre mineral patches; smooth honed surface with soft satin reflection.                                                                                        |
| `quartziteWhiteHoned`                  | White quartz-rich stone with translucent crystalline flecks and fine gray veins; smooth honed surface with soft satin reflection.                                                             |
| `quartziteWhitePolished`               | White quartz-rich stone with translucent crystalline flecks and fine gray veins; polished surface with strong dielectric reflections and enhanced mineral contrast.                           |
| `quartziteTajMahalBeigeHoned`          | Warm beige quartz-rich stone with soft cream bands and translucent crystalline depth; smooth honed surface with soft satin reflection.                                                        |
| `quartziteTajMahalBeigePolished`       | Warm beige quartz-rich stone with soft cream bands and translucent crystalline depth; polished surface with strong dielectric reflections and enhanced mineral contrast.                      |
| `quartziteGreenHoned`                  | Green quartz-rich stone with pale mineral streaks and crystalline flecks; smooth honed surface with soft satin reflection.                                                                    |
| `quartziteGreenPolished`               | Green quartz-rich stone with pale mineral streaks and crystalline flecks; polished surface with strong dielectric reflections and enhanced mineral contrast.                                  |
| `basaltDarkGrayHoned`                  | Dark gray volcanic stone with fine mineral speckle and sparse pinholes; smooth honed surface with soft satin reflection.                                                                      |
| `basaltDarkGrayPolished`               | Dark gray volcanic stone with fine mineral speckle and sparse pinholes; polished surface with strong dielectric reflections and enhanced mineral contrast.                                    |
| `bluestoneBlueGrayHoned`               | Blue-gray fine-grained sedimentary stone with subtle bedding; smooth honed surface with soft satin reflection.                                                                                |
| `soapstoneCharcoalHoned`               | Charcoal stone with soft pale veins and a dense fine-grained appearance; smooth honed surface with soft satin reflection.                                                                     |
| `soapstoneCharcoalPolished`            | Charcoal stone with soft pale veins and a dense fine-grained appearance; polished surface with strong dielectric reflections and enhanced mineral contrast.                                   |
| `schistSilverGrayHoned`                | Silver-gray metamorphic stone with directional mica flecks; smooth honed surface with soft satin reflection.                                                                                  |
| `graniteSaltAndPepperGrayTextured`     | Gray granular stone with interlocking black, white, and translucent mineral flecks; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief. |
| `graniteAbsoluteBlackTextured`         | Near-black fine-grained decorative stone with sparse subtle mineral flecks; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.         |
| `graniteBalticBrownTextured`           | Brown decorative stone with rounded dark mineral clusters; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                          |
| `graniteRosePinkTextured`              | Pink granular stone with black mica and pale quartz flecks; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                         |
| `graniteWhiteTextured`                 | White granular stone with dispersed gray and black mineral flecks; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                  |
| `limestoneCreamTextured`               | Cream sedimentary stone with fine fossil fragments and soft color clouds; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.           |
| `limestoneBuffTextured`                | Buff sedimentary stone with faint bedding and small fossil inclusions; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.              |
| `limestoneGrayTextured`                | Gray sedimentary stone with fine mineral mottling and sparse fossils; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.               |
| `limestoneBlueGrayTextured`            | Blue-gray sedimentary stone with pale fossil flecks; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                                |
| `sandstoneBuffTextured`                | Buff sedimentary stone with fine sand grains and subtle bedding; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                    |
| `sandstoneRedTextured`                 | Red sedimentary stone with warm iron-oxide mottling and fine grains; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                |
| `sandstoneGrayTextured`                | Gray sedimentary stone with fine quartz grains and faint bedding; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                   |
| `slateCharcoalTextured`                | Charcoal metamorphic stone with fine layered mineral variation; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                     |
| `slateBlueGrayTextured`                | Blue-gray metamorphic stone with fine layered mineral variation; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                    |
| `slateGreenTextured`                   | Green-gray metamorphic stone with fine layered mineral variation; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                   |
| `slateRustMulticolorTextured`          | Slate with charcoal, rust, and ochre mineral patches; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                               |
| `basaltDarkGrayTextured`               | Dark gray volcanic stone with fine mineral speckle and sparse pinholes; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.             |
| `bluestoneBlueGrayTextured`            | Blue-gray fine-grained sedimentary stone with subtle bedding; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                       |
| `schistSilverGrayTextured`             | Silver-gray metamorphic stone with directional mica flecks; irregular natural or mechanically roughened mineral surface with high roughness and visible grain relief.                         |
| `travertineIvoryUnfilled`              | Ivory travertine with open natural cavities, soft warm banding, and a honed low-sheen mineral surface.                                                                                        |
| `travertineSilverUnfilled`             | Silver-gray travertine with open natural cavities, cool banding, and a honed low-sheen mineral surface.                                                                                       |
| `onyxHoneyTranslucent`                 | Honey-gold banded stone with cream veins, polished reflection, and thickness-dependent amber subsurface transmission.                                                                         |
| `onyxWhiteTranslucent`                 | Milky white banded stone with pale warm veins, polished reflection, and thickness-dependent diffuse transmission.                                                                             |
| `alabasterCreamTranslucent`            | Cream mineral with cloudy fine veining, a satin surface, and warm diffuse transmission through thin material.                                                                                 |
| `lavaStoneBlackPorous`                 | Near-black volcanic mineral surface with visible vesicles, fine crystalline flecks, and high roughness.                                                                                       |
| `fieldstoneMixedGray`                  | Mixed gray natural mineral appearance with irregular fine grain, weathered mottling, and rough diffuse reflection; no stone arrangement included.                                             |
| `graniteSaltAndPepperGrayFlamed`       | Gray granular stone with interlocking black, white, and translucent mineral flecks; heat-roughened fine crystalline surface with exposed mineral grain and high roughness.                    |
| `graniteSaltAndPepperGrayBushHammered` | Gray granular stone with interlocking black, white, and translucent mineral flecks; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.        |
| `graniteSaltAndPepperGrayLeathered`    | Gray granular stone with interlocking black, white, and translucent mineral flecks; softly brushed irregular mineral microrelief with satin high points and matte recesses.                   |
| `graniteAbsoluteBlackFlamed`           | Near-black fine-grained decorative stone with sparse subtle mineral flecks; heat-roughened fine crystalline surface with exposed mineral grain and high roughness.                            |
| `graniteAbsoluteBlackBushHammered`     | Near-black fine-grained decorative stone with sparse subtle mineral flecks; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                |
| `graniteAbsoluteBlackLeathered`        | Near-black fine-grained decorative stone with sparse subtle mineral flecks; softly brushed irregular mineral microrelief with satin high points and matte recesses.                           |
| `graniteBalticBrownFlamed`             | Brown decorative stone with rounded dark mineral clusters; heat-roughened fine crystalline surface with exposed mineral grain and high roughness.                                             |
| `graniteBalticBrownBushHammered`       | Brown decorative stone with rounded dark mineral clusters; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                                 |
| `graniteBalticBrownLeathered`          | Brown decorative stone with rounded dark mineral clusters; softly brushed irregular mineral microrelief with satin high points and matte recesses.                                            |
| `graniteRosePinkFlamed`                | Pink granular stone with black mica and pale quartz flecks; heat-roughened fine crystalline surface with exposed mineral grain and high roughness.                                            |
| `graniteRosePinkBushHammered`          | Pink granular stone with black mica and pale quartz flecks; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                                |
| `graniteRosePinkLeathered`             | Pink granular stone with black mica and pale quartz flecks; softly brushed irregular mineral microrelief with satin high points and matte recesses.                                           |
| `graniteWhiteFlamed`                   | White granular stone with dispersed gray and black mineral flecks; heat-roughened fine crystalline surface with exposed mineral grain and high roughness.                                     |
| `graniteWhiteBushHammered`             | White granular stone with dispersed gray and black mineral flecks; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                         |
| `graniteWhiteLeathered`                | White granular stone with dispersed gray and black mineral flecks; softly brushed irregular mineral microrelief with satin high points and matte recesses.                                    |
| `limestoneCreamBushHammered`           | Cream sedimentary stone with fine fossil fragments and soft color clouds; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                  |
| `limestoneBuffBushHammered`            | Buff sedimentary stone with faint bedding and small fossil inclusions; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                     |
| `limestoneGrayBushHammered`            | Gray sedimentary stone with fine mineral mottling and sparse fossils; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                      |
| `limestoneBlueGrayBushHammered`        | Blue-gray sedimentary stone with pale fossil flecks; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                                       |
| `quartziteWhiteLeathered`              | White quartz-rich stone with translucent crystalline flecks and fine gray veins; softly brushed irregular mineral microrelief with satin high points and matte recesses.                      |
| `quartziteTajMahalBeigeLeathered`      | Warm beige quartz-rich stone with soft cream bands and translucent crystalline depth; softly brushed irregular mineral microrelief with satin high points and matte recesses.                 |
| `quartziteGreenLeathered`              | Green quartz-rich stone with pale mineral streaks and crystalline flecks; softly brushed irregular mineral microrelief with satin high points and matte recesses.                             |
| `basaltDarkGrayFlamed`                 | Dark gray volcanic stone with fine mineral speckle and sparse pinholes; heat-roughened fine crystalline surface with exposed mineral grain and high roughness.                                |
| `basaltDarkGrayBushHammered`           | Dark gray volcanic stone with fine mineral speckle and sparse pinholes; dense fine impact-pitted mineral surface with a dry diffuse response; no tooling layout specified.                    |

## Engineered stone, ceramic, porcelain, and glass-derived finishes

| Material name                         | Description / specification                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quartzCompositePureWhitePolished`    | Pure white with sparse fine mineral flecks; opaque resin-bound mineral composite with a dense smooth surface and glossy dielectric reflection.    |
| `quartzCompositeWarmWhitePolished`    | Warm white with faint cream flecks; opaque resin-bound mineral composite with a dense smooth surface and glossy dielectric reflection.            |
| `quartzCompositeBeigePolished`        | Beige with fine warm aggregate; opaque resin-bound mineral composite with a dense smooth surface and glossy dielectric reflection.                |
| `quartzCompositeGrayPolished`         | Gray with fine pale aggregate; opaque resin-bound mineral composite with a dense smooth surface and glossy dielectric reflection.                 |
| `quartzCompositeCharcoalPolished`     | Charcoal with sparse pale flecks; opaque resin-bound mineral composite with a dense smooth surface and glossy dielectric reflection.              |
| `quartzCompositeBlackPolished`        | Black with fine crystalline flecks; opaque resin-bound mineral composite with a dense smooth surface and glossy dielectric reflection.            |
| `quartzCompositeWhiteHoned`           | White with fine mineral flecks; opaque resin-bound mineral composite with a smooth satin surface.                                                 |
| `quartzCompositeGrayHoned`            | Gray with fine mineral flecks; opaque resin-bound mineral composite with a smooth satin surface.                                                  |
| `quartzCompositeBlackHoned`           | Black with fine mineral flecks; opaque resin-bound mineral composite with a smooth satin surface.                                                 |
| `quartzCompositeWhiteGrayVeined`      | White engineered mineral composite with gray marble-like veins and a polished dielectric surface.                                                 |
| `quartzCompositeWhiteGoldVeined`      | Warm white engineered mineral composite with gold and gray veins and a polished dielectric surface.                                               |
| `sinteredStoneWhiteMatte`             | White; dense sintered mineral surface with fine mottling, low porosity appearance, and diffuse matte reflection.                                  |
| `sinteredStoneBeigeMatte`             | Beige; dense sintered mineral surface with fine mottling, low porosity appearance, and diffuse matte reflection.                                  |
| `sinteredStoneGrayMatte`              | Gray; dense sintered mineral surface with fine mottling, low porosity appearance, and diffuse matte reflection.                                   |
| `sinteredStoneCharcoalMatte`          | Charcoal; dense sintered mineral surface with fine mottling, low porosity appearance, and diffuse matte reflection.                               |
| `sinteredStoneBlackMatte`             | Black; dense sintered mineral surface with fine mottling, low porosity appearance, and diffuse matte reflection.                                  |
| `sinteredStoneRustMatte`              | Rust brown; dense sintered mineral surface with fine mottling, low porosity appearance, and diffuse matte reflection.                             |
| `solidSurfaceAcrylicWhiteSatin`       | White; opaque acrylic-mineral composite with a uniform fine texture and smooth satin sheen.                                                       |
| `solidSurfaceAcrylicIvorySatin`       | Ivory; opaque acrylic-mineral composite with a uniform fine texture and smooth satin sheen.                                                       |
| `solidSurfaceAcrylicBeigeSatin`       | Beige; opaque acrylic-mineral composite with a uniform fine texture and smooth satin sheen.                                                       |
| `solidSurfaceAcrylicLightGraySatin`   | Light gray; opaque acrylic-mineral composite with a uniform fine texture and smooth satin sheen.                                                  |
| `solidSurfaceAcrylicCharcoalSatin`    | Charcoal; opaque acrylic-mineral composite with a uniform fine texture and smooth satin sheen.                                                    |
| `solidSurfaceAcrylicBlackSatin`       | Black; opaque acrylic-mineral composite with a uniform fine texture and smooth satin sheen.                                                       |
| `solidSurfaceAcrylicTranslucentWhite` | Milky white acrylic-mineral composite with soft satin reflection and diffuse transmission; not self-emissive.                                     |
| `solidSurfaceAcrylicWhiteSpeckled`    | White acrylic-mineral composite with small gray inclusions and a fine satin finish.                                                               |
| `ceramicGlazeWhiteGloss`              | White; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.        |
| `ceramicGlazeIvoryGloss`              | Ivory; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.        |
| `ceramicGlazeCreamGloss`              | Cream; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.        |
| `ceramicGlazeBeigeGloss`              | Beige; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.        |
| `ceramicGlazeLightGrayGloss`          | Light gray; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.   |
| `ceramicGlazeDarkGrayGloss`           | Dark gray; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.    |
| `ceramicGlazeBlackGloss`              | Black; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.        |
| `ceramicGlazeTerracottaGloss`         | Terracotta; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.   |
| `ceramicGlazeSageGreenGloss`          | Sage green; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.   |
| `ceramicGlazeForestGreenGloss`        | Forest green; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included. |
| `ceramicGlazeSkyBlueGloss`            | Sky blue; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.     |
| `ceramicGlazeNavyBlueGloss`           | Navy blue; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.    |
| `ceramicGlazePinkGloss`               | Pink; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.         |
| `ceramicGlazeYellowGloss`             | Yellow; opaque vitreous glaze with subtle firing variation, smooth microtexture, and glossy dielectric reflection; no tile layout included.       |
| `ceramicGlazeWhiteMatte`              | White; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.                |
| `ceramicGlazeIvoryMatte`              | Ivory; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.                |
| `ceramicGlazeCreamMatte`              | Cream; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.                |
| `ceramicGlazeBeigeMatte`              | Beige; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.                |
| `ceramicGlazeLightGrayMatte`          | Light gray; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.           |
| `ceramicGlazeDarkGrayMatte`           | Dark gray; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.            |
| `ceramicGlazeBlackMatte`              | Black; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.                |
| `ceramicGlazeTerracottaMatte`         | Terracotta; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.           |
| `ceramicGlazeSageGreenMatte`          | Sage green; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.           |
| `ceramicGlazeForestGreenMatte`        | Forest green; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.         |
| `ceramicGlazeSkyBlueMatte`            | Sky blue; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.             |
| `ceramicGlazeNavyBlueMatte`           | Navy blue; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.            |
| `ceramicGlazePinkMatte`               | Pink; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.                 |
| `ceramicGlazeYellowMatte`             | Yellow; opaque ceramic glaze with subtle firing variation, a fine dry texture, and broad muted highlights; no tile layout included.               |
| `porcelainWhiteUnglazed`              | White; dense unglazed ceramic with fine mineral grain and a low-sheen surface; no tile layout included.                                           |
| `porcelainCreamUnglazed`              | Cream; dense unglazed ceramic with fine mineral grain and a low-sheen surface; no tile layout included.                                           |
| `porcelainGrayUnglazed`               | Gray; dense unglazed ceramic with fine mineral grain and a low-sheen surface; no tile layout included.                                            |
| `porcelainCharcoalUnglazed`           | Charcoal; dense unglazed ceramic with fine mineral grain and a low-sheen surface; no tile layout included.                                        |
| `porcelainBlackUnglazed`              | Black; dense unglazed ceramic with fine mineral grain and a low-sheen surface; no tile layout included.                                           |
| `porcelainTerracottaUnglazed`         | Terracotta; dense unglazed ceramic with fine mineral grain and a low-sheen surface; no tile layout included.                                      |
| `porcelainWhitePolished`              | White; dense ceramic with faint cloudy coloration and a polished dielectric surface; no tile layout included.                                     |
| `porcelainIvoryPolished`              | Ivory; dense ceramic with faint cloudy coloration and a polished dielectric surface; no tile layout included.                                     |
| `porcelainGrayPolished`               | Gray; dense ceramic with faint cloudy coloration and a polished dielectric surface; no tile layout included.                                      |
| `porcelainBlackPolished`              | Black; dense ceramic with faint cloudy coloration and a polished dielectric surface; no tile layout included.                                     |
| `zelligeGlazeWhite`                   | Warm white; handmade-look glaze with pooled pigment, pinholes, and locally uneven gloss; no tile shapes or layout included.                       |
| `zelligeGlazeCream`                   | Cream; handmade-look glaze with pooled pigment, pinholes, and locally uneven gloss; no tile shapes or layout included.                            |
| `zelligeGlazeEmerald`                 | Emerald green; handmade-look glaze with pooled pigment, pinholes, and locally uneven gloss; no tile shapes or layout included.                    |
| `zelligeGlazeTeal`                    | Teal; handmade-look glaze with pooled pigment, pinholes, and locally uneven gloss; no tile shapes or layout included.                             |
| `zelligeGlazeBlue`                    | Cobalt blue; handmade-look glaze with pooled pigment, pinholes, and locally uneven gloss; no tile shapes or layout included.                      |
| `zelligeGlazeTerracotta`              | Terracotta; handmade-look glaze with pooled pigment, pinholes, and locally uneven gloss; no tile shapes or layout included.                       |
| `zelligeGlazeBlack`                   | Black; handmade-look glaze with pooled pigment, pinholes, and locally uneven gloss; no tile shapes or layout included.                            |
| `zelligeGlazeRose`                    | Rose; handmade-look glaze with pooled pigment, pinholes, and locally uneven gloss; no tile shapes or layout included.                             |
| `cementPigmentedIvoryMatte`           | Ivory; pigmented cement with cloudy absorption variation, fine pores, and a sealed matte response; no tile pattern included.                      |
| `cementPigmentedGrayMatte`            | Gray; pigmented cement with cloudy absorption variation, fine pores, and a sealed matte response; no tile pattern included.                       |
| `cementPigmentedCharcoalMatte`        | Charcoal; pigmented cement with cloudy absorption variation, fine pores, and a sealed matte response; no tile pattern included.                   |
| `cementPigmentedTerracottaMatte`      | Terracotta; pigmented cement with cloudy absorption variation, fine pores, and a sealed matte response; no tile pattern included.                 |
| `cementPigmentedBlueMatte`            | Blue; pigmented cement with cloudy absorption variation, fine pores, and a sealed matte response; no tile pattern included.                       |
| `cementPigmentedGreenMatte`           | Green; pigmented cement with cloudy absorption variation, fine pores, and a sealed matte response; no tile pattern included.                      |
| `glassMosaicGlazeWhite`               | White; colored vitreous surface with shallow optical depth and glossy reflection; no mosaic layout included.                                      |
| `glassMosaicGlazeTurquoise`           | Turquoise; colored vitreous surface with shallow optical depth and glossy reflection; no mosaic layout included.                                  |
| `glassMosaicGlazeCobalt`              | Cobalt blue; colored vitreous surface with shallow optical depth and glossy reflection; no mosaic layout included.                                |
| `glassMosaicGlazeGreen`               | Green; colored vitreous surface with shallow optical depth and glossy reflection; no mosaic layout included.                                      |
| `glassMosaicGlazeAmber`               | Amber; colored vitreous surface with shallow optical depth and glossy reflection; no mosaic layout included.                                      |
| `glassMosaicGlazeBlack`               | Black; colored vitreous surface with shallow optical depth and glossy reflection; no mosaic layout included.                                      |
| `ceramicCrackleGlazeWhite`            | White vitreous glaze with a fine dark crackle network beneath glossy dielectric reflection; crackle is a surface effect.                          |
| `ceramicCrackleGlazeCeladon`          | Pale green translucent glaze over a light ceramic body with fine crackle and glossy reflection.                                                   |
| `ceramicIridescentPearl`              | Pale pearl ceramic glaze with a restrained angle-dependent iridescent sheen and smooth glossy reflection.                                         |
| `groutCementWhite`                    | White; fine cementitious grout with small pores, subtle sand grains, and matte reflection; no joint layout included.                              |
| `groutCementCream`                    | Cream; fine cementitious grout with small pores, subtle sand grains, and matte reflection; no joint layout included.                              |
| `groutCementBeige`                    | Beige; fine cementitious grout with small pores, subtle sand grains, and matte reflection; no joint layout included.                              |
| `groutCementLightGray`                | Light gray; fine cementitious grout with small pores, subtle sand grains, and matte reflection; no joint layout included.                         |
| `groutCementDarkGray`                 | Dark gray; fine cementitious grout with small pores, subtle sand grains, and matte reflection; no joint layout included.                          |
| `groutCementBlack`                    | Black; fine cementitious grout with small pores, subtle sand grains, and matte reflection; no joint layout included.                              |
| `groutCementBrown`                    | Brown; fine cementitious grout with small pores, subtle sand grains, and matte reflection; no joint layout included.                              |
| `groutEpoxyWhite`                     | White; dense pigmented epoxy grout with fine aggregate and a low satin sheen; no joint layout included.                                           |
| `groutEpoxyGray`                      | Gray; dense pigmented epoxy grout with fine aggregate and a low satin sheen; no joint layout included.                                            |
| `groutEpoxyBlack`                     | Black; dense pigmented epoxy grout with fine aggregate and a low satin sheen; no joint layout included.                                           |
| `groutEpoxyBeige`                     | Beige; dense pigmented epoxy grout with fine aggregate and a low satin sheen; no joint layout included.                                           |

## Natural wood and clear wood finishes

| Material name                 | Description / specification                                                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `whiteOakRaw`                 | Pale straw to light brown oak with open pores and strong directional grain; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.        |
| `whiteOakOiled`               | Pale straw to light brown oak with open pores and strong directional grain; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                      |
| `whiteOakClearSatin`          | Pale straw to light brown oak with open pores and strong directional grain; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent. |
| `redOakRaw`                   | Warm pink-brown oak with open pores and coarse directional grain; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                  |
| `redOakOiled`                 | Warm pink-brown oak with open pores and coarse directional grain; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                |
| `redOakClearSatin`            | Warm pink-brown oak with open pores and coarse directional grain; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.           |
| `mapleRaw`                    | Pale cream wood with tight grain and subtle figure; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                                |
| `mapleOiled`                  | Pale cream wood with tight grain and subtle figure; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                              |
| `mapleClearSatin`             | Pale cream wood with tight grain and subtle figure; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.                         |
| `birchRaw`                    | Cream to light amber wood with fine grain and gentle color variation; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.              |
| `birchOiled`                  | Cream to light amber wood with fine grain and gentle color variation; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                            |
| `birchClearSatin`             | Cream to light amber wood with fine grain and gentle color variation; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.       |
| `beechRaw`                    | Pale pink-beige wood with fine grain and small ray flecks; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                         |
| `beechOiled`                  | Pale pink-beige wood with fine grain and small ray flecks; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                       |
| `beechClearSatin`             | Pale pink-beige wood with fine grain and small ray flecks; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.                  |
| `ashRaw`                      | Pale tan wood with pronounced open grain and alternating growth bands; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.             |
| `ashOiled`                    | Pale tan wood with pronounced open grain and alternating growth bands; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                           |
| `ashClearSatin`               | Pale tan wood with pronounced open grain and alternating growth bands; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.      |
| `walnutRaw`                   | Rich chocolate-brown wood with dark flowing grain; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                                 |
| `walnutOiled`                 | Rich chocolate-brown wood with dark flowing grain; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                               |
| `walnutClearSatin`            | Rich chocolate-brown wood with dark flowing grain; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.                          |
| `cherryRaw`                   | Warm reddish-brown wood with fine grain and occasional darker streaks; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.             |
| `cherryOiled`                 | Warm reddish-brown wood with fine grain and occasional darker streaks; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                           |
| `cherryClearSatin`            | Warm reddish-brown wood with fine grain and occasional darker streaks; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.      |
| `pineRaw`                     | Pale yellow softwood with strong growth bands and scattered knots; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                 |
| `pineOiled`                   | Pale yellow softwood with strong growth bands and scattered knots; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                               |
| `pineClearSatin`              | Pale yellow softwood with strong growth bands and scattered knots; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.          |
| `spruceRaw`                   | Pale cream softwood with fine straight grain and small knots; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                      |
| `spruceOiled`                 | Pale cream softwood with fine straight grain and small knots; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                    |
| `spruceClearSatin`            | Pale cream softwood with fine straight grain and small knots; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.               |
| `douglasFirRaw`               | Warm orange-brown softwood with strong straight growth bands; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                      |
| `douglasFirOiled`             | Warm orange-brown softwood with strong straight growth bands; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                    |
| `douglasFirClearSatin`        | Warm orange-brown softwood with strong straight growth bands; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.               |
| `westernRedCedarRaw`          | Red-brown cedar with straight grain and natural tonal variation; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                   |
| `westernRedCedarOiled`        | Red-brown cedar with straight grain and natural tonal variation; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                 |
| `westernRedCedarClearSatin`   | Red-brown cedar with straight grain and natural tonal variation; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.            |
| `easternWhiteCedarRaw`        | Pale tan cedar with fine straight grain and small knots; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                           |
| `easternWhiteCedarOiled`      | Pale tan cedar with fine straight grain and small knots; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                         |
| `easternWhiteCedarClearSatin` | Pale tan cedar with fine straight grain and small knots; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.                    |
| `larchRaw`                    | Golden-brown softwood with prominent growth rings and occasional knots; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.            |
| `larchOiled`                  | Golden-brown softwood with prominent growth rings and occasional knots; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                          |
| `larchClearSatin`             | Golden-brown softwood with prominent growth rings and occasional knots; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.     |
| `teakRaw`                     | Golden-brown wood with dark streaks and a dense oily-looking grain; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                |
| `teakOiled`                   | Golden-brown wood with dark streaks and a dense oily-looking grain; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                              |
| `teakClearSatin`              | Golden-brown wood with dark streaks and a dense oily-looking grain; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.         |
| `ipeRaw`                      | Deep olive-brown wood with dense fine grain; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                                       |
| `ipeOiled`                    | Deep olive-brown wood with dense fine grain; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                                     |
| `ipeClearSatin`               | Deep olive-brown wood with dense fine grain; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.                                |
| `mahoganyRaw`                 | Red-brown wood with fine pores and interlocked directional figure; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                 |
| `mahoganyOiled`               | Red-brown wood with fine pores and interlocked directional figure; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                               |
| `mahoganyClearSatin`          | Red-brown wood with fine pores and interlocked directional figure; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.          |
| `sapeleRaw`                   | Reddish-brown wood with ribbon-like interlocked figure; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                            |
| `sapeleOiled`                 | Reddish-brown wood with ribbon-like interlocked figure; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                          |
| `sapeleClearSatin`            | Reddish-brown wood with ribbon-like interlocked figure; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.                     |
| `bambooNaturalRaw`            | Pale straw bamboo with linear fibers and subtle node marks; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                        |
| `bambooNaturalOiled`          | Pale straw bamboo with linear fibers and subtle node marks; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                      |
| `bambooNaturalClearSatin`     | Pale straw bamboo with linear fibers and subtle node marks; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.                 |
| `bambooCarbonizedRaw`         | Caramel-brown bamboo with linear fibers and subtle node marks; uncoated matte fibers with visible directional pore relief. Grain direction follows the material tangent.                     |
| `bambooCarbonizedOiled`       | Caramel-brown bamboo with linear fibers and subtle node marks; oil-darkened grain with low satin reflection. Grain direction follows the material tangent.                                   |
| `bambooCarbonizedClearSatin`  | Caramel-brown bamboo with linear fibers and subtle node marks; transparent satin protective coating over visible grain and pores. Grain direction follows the material tangent.              |
| `whiteOakClearGloss`          | Pale straw to light brown oak with open pores and strong directional grain; clear glossy varnish with sharp dielectric reflections over visible wood grain.                                  |
| `mapleClearGloss`             | Pale cream wood with tight grain and subtle figure; clear glossy varnish with sharp dielectric reflections over visible wood grain.                                                          |
| `walnutClearGloss`            | Rich chocolate-brown wood with dark flowing grain; clear glossy varnish with sharp dielectric reflections over visible wood grain.                                                           |
| `cherryClearGloss`            | Warm reddish-brown wood with fine grain and occasional darker streaks; clear glossy varnish with sharp dielectric reflections over visible wood grain.                                       |
| `mahoganyClearGloss`          | Red-brown wood with fine pores and interlocked directional figure; clear glossy varnish with sharp dielectric reflections over visible wood grain.                                           |
| `sapeleClearGloss`            | Reddish-brown wood with ribbon-like interlocked figure; clear glossy varnish with sharp dielectric reflections over visible wood grain.                                                      |
| `oakStainWhitewashedSatin`    | Whitewashed pale oak; open oak grain remains visible beneath a translucent stain and a clear satin coating.                                                                                  |
| `oakStainNaturalSatin`        | Natural golden oak; open oak grain remains visible beneath a translucent stain and a clear satin coating.                                                                                    |
| `oakStainHoneySatin`          | Honey-brown oak; open oak grain remains visible beneath a translucent stain and a clear satin coating.                                                                                       |
| `oakStainSmokedSatin`         | Smoked medium-brown oak; open oak grain remains visible beneath a translucent stain and a clear satin coating.                                                                               |
| `oakStainWalnutSatin`         | Walnut-brown oak; open oak grain remains visible beneath a translucent stain and a clear satin coating.                                                                                      |
| `oakStainEspressoSatin`       | Espresso-brown oak; open oak grain remains visible beneath a translucent stain and a clear satin coating.                                                                                    |
| `oakStainGraySatin`           | Gray-stained oak; open oak grain remains visible beneath a translucent stain and a clear satin coating.                                                                                      |
| `oakStainBlackSatin`          | Black-stained oak; open oak grain remains visible beneath a translucent stain and a clear satin coating.                                                                                     |
| `pineStainWhitewashedSatin`   | Whitewashed pine; softwood growth bands and knots remain visible beneath a translucent stain and satin coating.                                                                              |
| `pineStainHoneySatin`         | Honey pine; softwood growth bands and knots remain visible beneath a translucent stain and satin coating.                                                                                    |
| `pineStainWalnutSatin`        | Walnut-brown pine; softwood growth bands and knots remain visible beneath a translucent stain and satin coating.                                                                             |
| `pineStainGraySatin`          | Gray-stained pine; softwood growth bands and knots remain visible beneath a translucent stain and satin coating.                                                                             |
| `pineStainBlackSatin`         | Black-stained pine; softwood growth bands and knots remain visible beneath a translucent stain and satin coating.                                                                            |
| `oakFumedDark`                | Deep brown fumed oak with preserved open grain, natural board-to-board tonal variation, and an oiled matte response; no board layout included.                                               |
| `oakLimedWhite`               | Natural tan oak with white pigment concentrated in open pores and a matte protective finish.                                                                                                 |
| `oakEbonizedBlack`            | Near-black chemically darkened oak with visible open pores and a low satin sheen.                                                                                                            |
| `cedarWeatheredSilver`        | Silver-gray weathered cedar with raised grain, faded warm traces, and a dry matte response.                                                                                                  |
| `pineReclaimedBrown`          | Aged brown pine with dark knots, fine checks, ingrained stains, and a matte worn finish.                                                                                                     |
| `barnWoodWeatheredGray`       | Weathered gray wood with raised grain, fine surface checking, and darkened pores; no plank layout included.                                                                                  |
| `woodCharredBlack`            | Black charred wood with a fine fractured carbon crust, retained directional grain, and patchy low sheen.                                                                                     |
| `woodCharredBrushedBrown`     | Brushed charred wood with dark brown raised grain, black recessed pores, and a matte oiled response.                                                                                         |
| `corkNatural`                 | Natural tan cork with small cellular granules, mottled organic color, and matte reflection.                                                                                                  |
| `corkDark`                    | Dark brown cork with visible cellular granules and a fine satin seal.                                                                                                                        |
| `corkWhitewashed`             | Pale cream cork with visible cellular granules beneath a translucent white finish and matte reflection.                                                                                      |

## Engineered wood, laminates, lacquers, and composites

| Material name                       | Description / specification                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plywoodBirchFaceRaw`               | Pale birch veneer with fine grain, subtle rotary-cut figure, and an unfinished matte surface.                                                          |
| `plywoodBirchEdgeRaw`               | Alternating pale and tan bonded wood layers with visible fiber grain and a matte surface; edge appearance only.                                        |
| `plywoodSoftwoodRaw`                | Warm yellow softwood veneer with prominent rotary grain, knots, and a rough matte surface.                                                             |
| `plywoodMarineBrown`                | Warm brown hardwood veneer with fine directional grain and a sealed low-sheen response.                                                                |
| `orientedStrandBoardNatural`        | Golden wood strands of varied size and direction embedded in translucent amber binder with a rough low sheen.                                          |
| `mediumDensityFiberboardRaw`        | Uniform tan compressed wood fiber with very fine fuzzy texture and a matte response.                                                                   |
| `particleboardRaw`                  | Tan compressed wood chips with irregular coarse inclusions and a dry rough surface.                                                                    |
| `hardboardBrown`                    | Dense dark brown wood fiber with a fine smooth matte surface.                                                                                          |
| `woodWoolCementNatural`             | Pale wood fibers bound in gray-beige cement with open fibrous microtexture and high roughness.                                                         |
| `woodWoolCementWhitePainted`        | White; opaque pigment over visible tangled wood fibers and mineral binder; rough matte response.                                                       |
| `woodWoolCementGrayPainted`         | Gray; opaque pigment over visible tangled wood fibers and mineral binder; rough matte response.                                                        |
| `woodWoolCementBlackPainted`        | Black; opaque pigment over visible tangled wood fibers and mineral binder; rough matte response.                                                       |
| `melamineWhiteMatte`                | White; opaque melamine resin surface with a fine uniform microtexture and low sheen.                                                                   |
| `melamineCreamMatte`                | Cream; opaque melamine resin surface with a fine uniform microtexture and low sheen.                                                                   |
| `melamineBeigeMatte`                | Beige; opaque melamine resin surface with a fine uniform microtexture and low sheen.                                                                   |
| `melamineLightGrayMatte`            | Light gray; opaque melamine resin surface with a fine uniform microtexture and low sheen.                                                              |
| `melamineCharcoalMatte`             | Charcoal; opaque melamine resin surface with a fine uniform microtexture and low sheen.                                                                |
| `melamineBlackMatte`                | Black; opaque melamine resin surface with a fine uniform microtexture and low sheen.                                                                   |
| `highPressureLaminateWhiteMatte`    | White; opaque high-pressure laminate with fine stipple and a durable-looking matte dielectric response.                                                |
| `highPressureLaminateIvoryMatte`    | Ivory; opaque high-pressure laminate with fine stipple and a durable-looking matte dielectric response.                                                |
| `highPressureLaminateGrayMatte`     | Gray; opaque high-pressure laminate with fine stipple and a durable-looking matte dielectric response.                                                 |
| `highPressureLaminateCharcoalMatte` | Charcoal; opaque high-pressure laminate with fine stipple and a durable-looking matte dielectric response.                                             |
| `highPressureLaminateBlackMatte`    | Black; opaque high-pressure laminate with fine stipple and a durable-looking matte dielectric response.                                                |
| `highPressureLaminateRedMatte`      | Red; opaque high-pressure laminate with fine stipple and a durable-looking matte dielectric response.                                                  |
| `highPressureLaminateBlueMatte`     | Blue; opaque high-pressure laminate with fine stipple and a durable-looking matte dielectric response.                                                 |
| `highPressureLaminateGreenMatte`    | Green; opaque high-pressure laminate with fine stipple and a durable-looking matte dielectric response.                                                |
| `highPressureLaminateWhiteGloss`    | White; opaque high-pressure laminate with a smooth glossy resin surface.                                                                               |
| `highPressureLaminateGrayGloss`     | Gray; opaque high-pressure laminate with a smooth glossy resin surface.                                                                                |
| `highPressureLaminateBlackGloss`    | Black; opaque high-pressure laminate with a smooth glossy resin surface.                                                                               |
| `highPressureLaminateRedGloss`      | Red; opaque high-pressure laminate with a smooth glossy resin surface.                                                                                 |
| `fenixLikeLaminateWhite`            | White; opaque ultramatte laminate with very fine microtexture and highly subdued broad highlights.                                                     |
| `fenixLikeLaminateBeige`            | Beige; opaque ultramatte laminate with very fine microtexture and highly subdued broad highlights.                                                     |
| `fenixLikeLaminateGray`             | Gray; opaque ultramatte laminate with very fine microtexture and highly subdued broad highlights.                                                      |
| `fenixLikeLaminateBlack`            | Black; opaque ultramatte laminate with very fine microtexture and highly subdued broad highlights.                                                     |
| `fenixLikeLaminateGreen`            | Green; opaque ultramatte laminate with very fine microtexture and highly subdued broad highlights.                                                     |
| `woodPrintLaminateOak`              | Pale oak printed grain beneath a thin satin resin finish; shallow embossed pore texture, without natural wood subsurface depth.                        |
| `woodPrintLaminateWalnut`           | Dark walnut printed grain beneath a thin satin resin finish; shallow embossed pore texture, without natural wood subsurface depth.                     |
| `woodPrintLaminateMaple`            | Pale maple printed grain beneath a thin satin resin finish; shallow embossed pore texture, without natural wood subsurface depth.                      |
| `woodPrintLaminateAsh`              | Light ash printed grain beneath a thin satin resin finish; shallow embossed pore texture, without natural wood subsurface depth.                       |
| `lacquerWhiteSatin`                 | White; opaque smooth pigmented lacquer with a uniform satin dielectric sheen.                                                                          |
| `lacquerIvorySatin`                 | Ivory; opaque smooth pigmented lacquer with a uniform satin dielectric sheen.                                                                          |
| `lacquerLightGraySatin`             | Light gray; opaque smooth pigmented lacquer with a uniform satin dielectric sheen.                                                                     |
| `lacquerCharcoalSatin`              | Charcoal; opaque smooth pigmented lacquer with a uniform satin dielectric sheen.                                                                       |
| `lacquerBlackSatin`                 | Black; opaque smooth pigmented lacquer with a uniform satin dielectric sheen.                                                                          |
| `lacquerSageSatin`                  | Sage green; opaque smooth pigmented lacquer with a uniform satin dielectric sheen.                                                                     |
| `lacquerNavySatin`                  | Navy blue; opaque smooth pigmented lacquer with a uniform satin dielectric sheen.                                                                      |
| `lacquerWhiteGloss`                 | White; opaque smooth pigmented lacquer with clear glossy dielectric reflections.                                                                       |
| `lacquerCreamGloss`                 | Cream; opaque smooth pigmented lacquer with clear glossy dielectric reflections.                                                                       |
| `lacquerBlackGloss`                 | Black; opaque smooth pigmented lacquer with clear glossy dielectric reflections.                                                                       |
| `lacquerRedGloss`                   | Red; opaque smooth pigmented lacquer with clear glossy dielectric reflections.                                                                         |
| `lacquerNavyGloss`                  | Navy blue; opaque smooth pigmented lacquer with clear glossy dielectric reflections.                                                                   |
| `woodPlasticCompositeCedar`         | Cedar brown; opaque wood-polymer composite with subtle directional embossed grain, fine fiber flecks, and matte reflection; no board layout included.  |
| `woodPlasticCompositeWalnut`        | Walnut brown; opaque wood-polymer composite with subtle directional embossed grain, fine fiber flecks, and matte reflection; no board layout included. |
| `woodPlasticCompositeGray`          | Gray; opaque wood-polymer composite with subtle directional embossed grain, fine fiber flecks, and matte reflection; no board layout included.         |
| `woodPlasticCompositeCharcoal`      | Charcoal; opaque wood-polymer composite with subtle directional embossed grain, fine fiber flecks, and matte reflection; no board layout included.     |
| `fiberCementNaturalGray`            | Natural gray; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                  |
| `fiberCementWhite`                  | White; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                         |
| `fiberCementCream`                  | Cream; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                         |
| `fiberCementBeige`                  | Beige; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                         |
| `fiberCementCharcoal`               | Charcoal; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                      |
| `fiberCementBlack`                  | Black; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                         |
| `fiberCementRed`                    | Brick red; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                     |
| `fiberCementBlue`                   | Slate blue; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                    |
| `fiberCementGreen`                  | Sage green; cement-fiber surface with fine mineral mottling, slight fibrous texture, and low sheen.                                                    |
| `fiberCementWoodTextureWhite`       | White; pigmented cement-fiber surface with shallow directional wood-grain embossing and a matte finish.                                                |
| `fiberCementWoodTextureCream`       | Cream; pigmented cement-fiber surface with shallow directional wood-grain embossing and a matte finish.                                                |
| `fiberCementWoodTextureGray`        | Gray; pigmented cement-fiber surface with shallow directional wood-grain embossing and a matte finish.                                                 |
| `fiberCementWoodTextureBrown`       | Brown; pigmented cement-fiber surface with shallow directional wood-grain embossing and a matte finish.                                                |
| `fiberCementWoodTextureCharcoal`    | Charcoal; pigmented cement-fiber surface with shallow directional wood-grain embossing and a matte finish.                                             |

## Transparent protective coatings and surface treatments

These entries define coating materials for layering over a separately assigned substrate. They do not duplicate complete substrate appearances such as oiled oak or polished concrete.

| Material name                 | Description / specification                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `clearPolyurethaneMatte`      | Colorless cured polyurethane with fine antiglare microtexture and subdued dielectric highlights; underlying color and grain remain visible.                  |
| `clearPolyurethaneSatin`      | Colorless cured polyurethane with a smooth satin dielectric response and visible underlying substrate.                                                       |
| `clearPolyurethaneGloss`      | Colorless cured polyurethane with smooth sharp dielectric reflection and clear transmission to the underlying substrate.                                     |
| `clearPolyurethaneAmberGloss` | Warm amber cured polyurethane with glossy reflection and weak yellow volume absorption over a visible substrate.                                             |
| `clearAcrylicSealerMatte`     | Colorless acrylic sealer with fine antiglare texture and low sheen over a visible substrate.                                                                 |
| `clearAcrylicSealerGloss`     | Colorless acrylic sealer with a smooth glossy dielectric surface over a visible substrate.                                                                   |
| `clearEpoxyGloss`             | Colorless cured epoxy with smooth glossy dielectric reflection and clear transmission to a visible substrate.                                                |
| `clearEpoxyAmberGloss`        | Amber cured epoxy with smooth glossy reflection and warm path-length-dependent absorption over a visible substrate.                                          |
| `clearVarnishSatin`           | Transparent slightly amber varnish with fine satin reflection over a visible substrate.                                                                      |
| `clearVarnishGloss`           | Transparent slightly amber varnish with smooth glossy reflection over a visible substrate.                                                                   |
| `shellacAmber`                | Amber shellac coating with warm transparent absorption and a smooth polished dielectric sheen.                                                               |
| `shellacBlonde`               | Pale blonde shellac coating with weak warm transparent absorption and a smooth polished dielectric sheen.                                                    |
| `woodOilClear`                | Transparent penetrating oil appearance with very weak warm absorption and low satin reflection; substrate darkening must be handled by the layered material. |
| `woodOilAmber`                | Transparent amber penetrating oil appearance with warm absorption and low satin reflection over visible wood fibers.                                         |
| `waxClearSatin`               | Thin translucent wax coating with soft broad dielectric highlights and very weak milky scattering.                                                           |
| `waxWhiteLiming`              | White-pigmented wax with diffuse scattering and a soft low-sheen surface; coverage and concentration in substrate pores are assigned separately.             |
| `concreteSealerClearSatin`    | Colorless cement sealer with a thin satin dielectric response over a separately defined mineral substrate.                                                   |
| `stoneSealerClearGloss`       | Colorless film-forming mineral sealer with smooth glossy dielectric reflection over a visible stone substrate.                                               |

## Bare metals, plated metals, and patinas

| Material name               | Description / specification                                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stainlessSteelPolished`    | Neutral silver stainless steel; smooth polished conductor with sharp colored metallic reflections; use conductor behavior rather than a gray dielectric approximation. |
| `stainlessSteelBrushed`     | Neutral silver stainless steel; fine directional abrasion with anisotropic metallic highlights; use conductor behavior rather than a gray dielectric approximation.    |
| `stainlessSteelSatin`       | Neutral silver stainless steel; fine nondirectional abrasion with broad metallic highlights; use conductor behavior rather than a gray dielectric approximation.       |
| `aluminumPolished`          | Light silver aluminum; smooth polished conductor with sharp colored metallic reflections; use conductor behavior rather than a gray dielectric approximation.          |
| `aluminumBrushed`           | Light silver aluminum; fine directional abrasion with anisotropic metallic highlights; use conductor behavior rather than a gray dielectric approximation.             |
| `aluminumSatin`             | Light silver aluminum; fine nondirectional abrasion with broad metallic highlights; use conductor behavior rather than a gray dielectric approximation.                |
| `brassPolished`             | Warm yellow brass; smooth polished conductor with sharp colored metallic reflections; use conductor behavior rather than a gray dielectric approximation.              |
| `brassBrushed`              | Warm yellow brass; fine directional abrasion with anisotropic metallic highlights; use conductor behavior rather than a gray dielectric approximation.                 |
| `brassSatin`                | Warm yellow brass; fine nondirectional abrasion with broad metallic highlights; use conductor behavior rather than a gray dielectric approximation.                    |
| `bronzePolished`            | Warm brown bronze; smooth polished conductor with sharp colored metallic reflections; use conductor behavior rather than a gray dielectric approximation.              |
| `bronzeBrushed`             | Warm brown bronze; fine directional abrasion with anisotropic metallic highlights; use conductor behavior rather than a gray dielectric approximation.                 |
| `bronzeSatin`               | Warm brown bronze; fine nondirectional abrasion with broad metallic highlights; use conductor behavior rather than a gray dielectric approximation.                    |
| `copperPolished`            | Red-orange copper; smooth polished conductor with sharp colored metallic reflections; use conductor behavior rather than a gray dielectric approximation.              |
| `copperBrushed`             | Red-orange copper; fine directional abrasion with anisotropic metallic highlights; use conductor behavior rather than a gray dielectric approximation.                 |
| `copperSatin`               | Red-orange copper; fine nondirectional abrasion with broad metallic highlights; use conductor behavior rather than a gray dielectric approximation.                    |
| `nickelPolished`            | Warm silver nickel; smooth polished conductor with sharp colored metallic reflections; use conductor behavior rather than a gray dielectric approximation.             |
| `nickelBrushed`             | Warm silver nickel; fine directional abrasion with anisotropic metallic highlights; use conductor behavior rather than a gray dielectric approximation.                |
| `nickelSatin`               | Warm silver nickel; fine nondirectional abrasion with broad metallic highlights; use conductor behavior rather than a gray dielectric approximation.                   |
| `chromePolished`            | Cool silver chromium plating; smooth polished conductor with sharp colored metallic reflections; use conductor behavior rather than a gray dielectric approximation.   |
| `chromeBrushed`             | Cool silver chromium plating; fine directional abrasion with anisotropic metallic highlights; use conductor behavior rather than a gray dielectric approximation.      |
| `chromeSatin`               | Cool silver chromium plating; fine nondirectional abrasion with broad metallic highlights; use conductor behavior rather than a gray dielectric approximation.         |
| `stainlessSteelBeadBlasted` | Neutral silver stainless steel with fine nondirectional pits and subdued broad metallic reflection.                                                                    |
| `steelMillScale`            | Blue-black steel with irregular dark oxide scale and patches of muted metallic reflection.                                                                             |
| `steelRawGray`              | Dark gray bare carbon steel with fine machining marks and broad metallic reflections.                                                                                  |
| `steelBlackened`            | Near-black oxidized steel with mottled dark conversion finish and subtle exposed-metal glints.                                                                         |
| `steelGalvanizedSpangled`   | Silver zinc-coated steel with irregular crystalline spangle, subtle tone shifts, and broad metallic highlights.                                                        |
| `steelGalvanizedMatte`      | Dull gray weathered zinc-coated steel with fine crystalline texture and low-contrast metallic reflection.                                                              |
| `steelWeatheringRust`       | Stable-looking orange-brown weathering steel patina with dark streaks, fine granular oxide, and predominantly diffuse reflection.                                      |
| `steelRustOrange`           | Bright orange iron oxide with powdery fine grain, dark pits, and very high roughness.                                                                                  |
| `steelRustDarkBrown`        | Deep brown iron oxide with uneven fine grain and a rough diffuse response.                                                                                             |
| `castIronBlack`             | Dark gray-black cast iron with fine casting granularity and subdued metallic highlights at exposed high points.                                                        |
| `zincNatural`               | Blue-gray zinc with fine rolling marks and soft metallic reflection.                                                                                                   |
| `zincPreweatheredGray`      | Matte medium-gray zinc patina with soft cloudy variation and subdued metallic undertones.                                                                              |
| `zincPreweatheredBlack`     | Dark charcoal zinc patina with slight cloudy variation and a low satin response.                                                                                       |
| `leadWeatheredGray`         | Dull gray lead appearance with cloudy oxidation and broad low-contrast reflections.                                                                                    |
| `tinSatinSilver`            | Pale silver tin coating with fine rolling texture and soft metallic highlights.                                                                                        |
| `copperAgedBrown`           | Dark brown oxidized copper with patchy reddish metallic undertones and varied satin roughness.                                                                         |
| `copperPatinaGreen`         | Green copper patina with pale turquoise mottling, granular oxide texture, and a mostly diffuse response.                                                               |
| `copperPatinaBlueGreen`     | Blue-green copper patina with dark copper traces, fine mineral texture, and high roughness.                                                                            |
| `brassAged`                 | Muted ochre brass with brown tarnish concentrated in fine texture and residual metallic highlights.                                                                    |
| `bronzeDarkPatinated`       | Deep brown patinated bronze with near-black mottling and warm metallic glints at exposed microtexture.                                                                 |
| `bronzeVerdigris`           | Green-blue patina over brown bronze with granular oxide and sparse warm metallic flecks.                                                                               |
| `silverTarnished`           | Silver metal with gray-black tarnish mottling and remaining bright metallic reflection.                                                                                |
| `goldPlatingPolished`       | Rich yellow-gold plating with smooth sharp colored conductor reflections.                                                                                              |
| `goldPlatingBrushed`        | Rich yellow-gold plating with directional fine abrasion and anisotropic reflection.                                                                                    |
| `titaniumSatin`             | Cool gray titanium with fine directional texture and subdued metallic reflections.                                                                                     |

## Metal coatings and factory finishes

| Material name                           | Description / specification                                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aluminumAnodizedNatural`               | Natural silver; anodized aluminum with a fine directional metallic substrate beneath a colored oxide layer and a satin response.                     |
| `aluminumAnodizedChampagne`             | Champagne; anodized aluminum with a fine directional metallic substrate beneath a colored oxide layer and a satin response.                          |
| `aluminumAnodizedBronze`                | Bronze; anodized aluminum with a fine directional metallic substrate beneath a colored oxide layer and a satin response.                             |
| `aluminumAnodizedDarkBronze`            | Dark bronze; anodized aluminum with a fine directional metallic substrate beneath a colored oxide layer and a satin response.                        |
| `aluminumAnodizedBlack`                 | Black; anodized aluminum with a fine directional metallic substrate beneath a colored oxide layer and a satin response.                              |
| `aluminumAnodizedGold`                  | Gold; anodized aluminum with a fine directional metallic substrate beneath a colored oxide layer and a satin response.                               |
| `powderCoatWhiteMatte`                  | White; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.        |
| `powderCoatCreamMatte`                  | Cream; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.        |
| `powderCoatBeigeMatte`                  | Beige; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.        |
| `powderCoatLightGrayMatte`              | Light gray; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.   |
| `powderCoatSilverGrayMatte`             | Silver gray; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.  |
| `powderCoatCharcoalMatte`               | Charcoal; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.     |
| `powderCoatBlackMatte`                  | Black; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.        |
| `powderCoatBrownMatte`                  | Brown; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.        |
| `powderCoatBronzeBrownMatte`            | Bronze brown; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered. |
| `powderCoatRedMatte`                    | Red; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.          |
| `powderCoatTerracottaMatte`             | Terracotta; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.   |
| `powderCoatBlueMatte`                   | Blue; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.         |
| `powderCoatNavyMatte`                   | Navy blue; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.    |
| `powderCoatGreenMatte`                  | Green; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.        |
| `powderCoatForestGreenMatte`            | Forest green; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered. |
| `powderCoatYellowMatte`                 | Yellow; opaque powder coating with fine orange-peel microtexture and broad matte dielectric highlights; underlying metal is optically covered.       |
| `powderCoatWhiteSatin`                  | White; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.          |
| `powderCoatCreamSatin`                  | Cream; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.          |
| `powderCoatBeigeSatin`                  | Beige; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.          |
| `powderCoatLightGraySatin`              | Light gray; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.     |
| `powderCoatSilverGraySatin`             | Silver gray; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.    |
| `powderCoatCharcoalSatin`               | Charcoal; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.       |
| `powderCoatBlackSatin`                  | Black; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.          |
| `powderCoatBrownSatin`                  | Brown; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.          |
| `powderCoatBronzeBrownSatin`            | Bronze brown; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.   |
| `powderCoatRedSatin`                    | Red; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.            |
| `powderCoatTerracottaSatin`             | Terracotta; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.     |
| `powderCoatBlueSatin`                   | Blue; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.           |
| `powderCoatNavySatin`                   | Navy blue; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.      |
| `powderCoatGreenSatin`                  | Green; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.          |
| `powderCoatForestGreenSatin`            | Forest green; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.   |
| `powderCoatYellowSatin`                 | Yellow; opaque powder coating with fine orange-peel microtexture and a smooth satin dielectric sheen; underlying metal is optically covered.         |
| `powderCoatWhiteGloss`                  | White; opaque powder coating with slight orange-peel texture and glossy dielectric reflection.                                                       |
| `powderCoatBlackGloss`                  | Black; opaque powder coating with slight orange-peel texture and glossy dielectric reflection.                                                       |
| `powderCoatRedGloss`                    | Red; opaque powder coating with slight orange-peel texture and glossy dielectric reflection.                                                         |
| `powderCoatBlueGloss`                   | Blue; opaque powder coating with slight orange-peel texture and glossy dielectric reflection.                                                        |
| `powderCoatGreenGloss`                  | Green; opaque powder coating with slight orange-peel texture and glossy dielectric reflection.                                                       |
| `powderCoatYellowGloss`                 | Yellow; opaque powder coating with slight orange-peel texture and glossy dielectric reflection.                                                      |
| `fluoropolymerCoatingWhite`             | White; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                                     |
| `fluoropolymerCoatingCream`             | Cream; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                                     |
| `fluoropolymerCoatingGray`              | Gray; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                                      |
| `fluoropolymerCoatingCharcoal`          | Charcoal; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                                  |
| `fluoropolymerCoatingBlack`             | Black; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                                     |
| `fluoropolymerCoatingBronze`            | Bronze brown; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                              |
| `fluoropolymerCoatingRed`               | Red; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                                       |
| `fluoropolymerCoatingBlue`              | Blue; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                                      |
| `fluoropolymerCoatingGreen`             | Green; opaque factory-applied fluoropolymer finish with fine smooth texture and low satin sheen.                                                     |
| `fluoropolymerCoatingMetallicSilver`    | Silver metallic-flake fluoropolymer coating with fine reflective flecks suspended in a satin dielectric binder.                                      |
| `fluoropolymerCoatingMetallicChampagne` | Champagne metallic-flake fluoropolymer coating with fine warm reflective flecks suspended in a satin dielectric binder.                              |
| `fluoropolymerCoatingMetallicBronze`    | Bronze metallic-flake fluoropolymer coating with fine brown-gold reflective flecks suspended in a satin dielectric binder.                           |
| `vitreousEnamelMetalWhite`              | White; opaque glassy enamel over metal with a smooth vitreous surface and strong dielectric reflection.                                              |
| `vitreousEnamelMetalBlack`              | Black; opaque glassy enamel over metal with a smooth vitreous surface and strong dielectric reflection.                                              |
| `vitreousEnamelMetalCream`              | Cream; opaque glassy enamel over metal with a smooth vitreous surface and strong dielectric reflection.                                              |
| `vitreousEnamelMetalRed`                | Red; opaque glassy enamel over metal with a smooth vitreous surface and strong dielectric reflection.                                                |
| `vitreousEnamelMetalBlue`               | Blue; opaque glassy enamel over metal with a smooth vitreous surface and strong dielectric reflection.                                               |
| `stainlessSteelPvdGold`                 | Gold-toned thin-film finish on brushed stainless steel with directional metallic highlights.                                                         |
| `stainlessSteelPvdRoseGold`             | Rose-gold thin-film finish on brushed stainless steel with directional metallic highlights.                                                          |
| `stainlessSteelPvdBlack`                | Dark graphite thin-film finish on brushed stainless steel with directional metallic highlights.                                                      |
| `aluminumAnodizedWeatheredBronze`       | Bronze anodized aluminum with mild chalking, uneven fading, and a low satin metallic response.                                                       |

## Architectural glass, mirrors, and optical films

Glass entries describe the optical medium or surface treatment. Thickness, air gaps, laminate stacks, supports, and opening layouts belong to the consuming model.

| Material name                 | Description / specification                                                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `glassClearFloat`             | Clear soda-lime glass with a slight green absorption tint, smooth dielectric reflection, and clear specular transmission; tint increases with optical path length.         |
| `glassLowIronClear`           | Low-iron glass with very weak green absorption, smooth dielectric reflection, and high clarity.                                                                            |
| `glassTemperedClear`          | Clear architectural glass with the same bulk optics as clear float glass and optional subtle stress-related reflection variation.                                          |
| `glassTintedGreen`            | Green; smooth transparent glass with wavelength-dependent absorption through its volume and sharp dielectric reflection; preserve path-length-dependent tint.              |
| `glassTintedBlue`             | Blue; smooth transparent glass with wavelength-dependent absorption through its volume and sharp dielectric reflection; preserve path-length-dependent tint.               |
| `glassTintedGray`             | Neutral gray; smooth transparent glass with wavelength-dependent absorption through its volume and sharp dielectric reflection; preserve path-length-dependent tint.       |
| `glassTintedBronze`           | Bronze brown; smooth transparent glass with wavelength-dependent absorption through its volume and sharp dielectric reflection; preserve path-length-dependent tint.       |
| `glassTintedDarkGray`         | Dark gray; smooth transparent glass with wavelength-dependent absorption through its volume and sharp dielectric reflection; preserve path-length-dependent tint.          |
| `glassTintedAmber`            | Amber; smooth transparent glass with wavelength-dependent absorption through its volume and sharp dielectric reflection; preserve path-length-dependent tint.              |
| `glassReflectiveSilver`       | Silver; solar-reflective coated glass with increased specular reflection, reduced transmission, and a restrained coating tint; view depends on illumination on both sides. |
| `glassReflectiveBlue`         | Blue; solar-reflective coated glass with increased specular reflection, reduced transmission, and a restrained coating tint; view depends on illumination on both sides.   |
| `glassReflectiveGreen`        | Green; solar-reflective coated glass with increased specular reflection, reduced transmission, and a restrained coating tint; view depends on illumination on both sides.  |
| `glassReflectiveBronze`       | Bronze; solar-reflective coated glass with increased specular reflection, reduced transmission, and a restrained coating tint; view depends on illumination on both sides. |
| `glassReflectiveGray`         | Gray; solar-reflective coated glass with increased specular reflection, reduced transmission, and a restrained coating tint; view depends on illumination on both sides.   |
| `glassLowEmissivityNeutral`   | Neutral low-emissivity coated glass with a weak residual reflected tint and high visible clarity; thermal performance is outside this appearance specification.            |
| `glassLowEmissivityBlue`      | Low-emissivity coated glass with a subtle blue reflected tint, clear specular transmission, and smooth surface reflection.                                                 |
| `glassAcidEtched`             | Colorless glass with fine uniform surface frosting, broad reflected highlights, and blurred transmission.                                                                  |
| `glassSandblasted`            | Colorless glass with a visibly granular frosted surface, diffuse reflection, and strongly scattered transmission.                                                          |
| `glassFrostedWhite`           | White privacy glass appearance with strong forward scattering, soft transmitted silhouettes, and a matte surface.                                                          |
| `glassReededClear`            | Colorless transparent glass with directional fine-scale refractive distortion and glossy reflection; any resolvable fluting is outside the material definition.            |
| `glassTexturedObscure`        | Colorless glass with irregular fine-scale refractive distortion and glossy reflection; no macroscopic relief specified.                                                    |
| `glassSeededClear`            | Clear glass with sparse fine trapped bubbles and slight optical waviness; smooth glossy reflection.                                                                        |
| `glassAntiqueClear`           | Slightly green clear glass with subtle waviness and faint thickness-dependent absorption.                                                                                  |
| `glassMilkWhite`              | Milky white glass with strong volume scattering, diffuse transmission, and smooth glossy surface reflection.                                                               |
| `glassOpalWarmWhite`          | Warm white opal glass with dense subsurface scattering and soft warm transmission; no emission unless separately assigned.                                                 |
| `glassBackPaintedWhite`       | White; opaque color viewed through a clear smooth glass surface, with shallow optical depth and sharp dielectric reflections.                                              |
| `glassBackPaintedCream`       | Cream; opaque color viewed through a clear smooth glass surface, with shallow optical depth and sharp dielectric reflections.                                              |
| `glassBackPaintedLightGray`   | Light gray; opaque color viewed through a clear smooth glass surface, with shallow optical depth and sharp dielectric reflections.                                         |
| `glassBackPaintedBlack`       | Black; opaque color viewed through a clear smooth glass surface, with shallow optical depth and sharp dielectric reflections.                                              |
| `glassBackPaintedRed`         | Red; opaque color viewed through a clear smooth glass surface, with shallow optical depth and sharp dielectric reflections.                                                |
| `glassBackPaintedBlue`        | Blue; opaque color viewed through a clear smooth glass surface, with shallow optical depth and sharp dielectric reflections.                                               |
| `glassBackPaintedGreen`       | Green; opaque color viewed through a clear smooth glass surface, with shallow optical depth and sharp dielectric reflections.                                              |
| `glassCeramicFritWhite`       | White; opaque ceramic frit surface with fine baked-on granularity and a low satin response; no dot, stripe, or coverage layout included.                                   |
| `glassCeramicFritGray`        | Gray; opaque ceramic frit surface with fine baked-on granularity and a low satin response; no dot, stripe, or coverage layout included.                                    |
| `glassCeramicFritBlack`       | Black; opaque ceramic frit surface with fine baked-on granularity and a low satin response; no dot, stripe, or coverage layout included.                                   |
| `glassElectrochromicClear`    | Clear-state switchable glass with a faint cool tint and high specular transmission.                                                                                        |
| `glassElectrochromicDarkBlue` | Dark-state switchable glass with deep blue absorption, reduced transmission, and smooth specular reflection.                                                               |
| `glassPrivacyFilmTranslucent` | Milky switchable privacy-film appearance with diffuse transmission and smooth surface reflection; no electrical assembly specified.                                        |
| `glassPrivacyFilmClear`       | Clear-state privacy film with slight residual haze and smooth dielectric reflection.                                                                                       |
| `mirrorSilver`                | Neutral silver-backed optical surface with nearly specular reflection and negligible transmission; optional clear protective surface response.                             |
| `mirrorBronze`                | Bronze-tinted reflective optical surface with warm absorption in reflected light and negligible transmission.                                                              |
| `mirrorGray`                  | Gray-tinted reflective optical surface with reduced reflection brightness and negligible transmission.                                                                     |
| `mirrorAntiqued`              | Silver mirror finish with mottled dark oxidation, small desilvered specks, and locally reduced reflectance.                                                                |
| `mirrorSmokedBlack`           | Dark smoked reflective surface with neutral absorption, subdued specular reflection, and negligible transmission.                                                          |
| `privacyFilmFrosted`          | Fine matte translucent polymer film with strong transmission blur and low surface sheen.                                                                                   |
| `solarFilmNeutralGray`        | Neutral gray transparent polymer film with absorptive tint and smooth reflective surface.                                                                                  |
| `dichroicFilmIridescent`      | Transparent optical film with angle-dependent transmitted and reflected hues and a smooth specular surface.                                                                |

## Roofing, waterproofing, and weather membranes

| Material name                          | Description / specification                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `asphaltShingleGranulesBlack`          | Black; asphalt-bound mineral granules with small randomly mixed color flecks and very rough diffuse reflection; no shingle geometry or course pattern included.           |
| `asphaltShingleGranulesCharcoal`       | Charcoal; asphalt-bound mineral granules with small randomly mixed color flecks and very rough diffuse reflection; no shingle geometry or course pattern included.        |
| `asphaltShingleGranulesGray`           | Gray; asphalt-bound mineral granules with small randomly mixed color flecks and very rough diffuse reflection; no shingle geometry or course pattern included.            |
| `asphaltShingleGranulesBrown`          | Brown; asphalt-bound mineral granules with small randomly mixed color flecks and very rough diffuse reflection; no shingle geometry or course pattern included.           |
| `asphaltShingleGranulesWeatheredBrown` | Weathered brown; asphalt-bound mineral granules with small randomly mixed color flecks and very rough diffuse reflection; no shingle geometry or course pattern included. |
| `asphaltShingleGranulesRed`            | Red; asphalt-bound mineral granules with small randomly mixed color flecks and very rough diffuse reflection; no shingle geometry or course pattern included.             |
| `asphaltShingleGranulesGreen`          | Green; asphalt-bound mineral granules with small randomly mixed color flecks and very rough diffuse reflection; no shingle geometry or course pattern included.           |
| `asphaltShingleGranulesBlueGray`       | Blue gray; asphalt-bound mineral granules with small randomly mixed color flecks and very rough diffuse reflection; no shingle geometry or course pattern included.       |
| `bituminousMembraneBlackGranulated`    | Black; bituminous surface densely covered in fine mineral granules with high roughness.                                                                                   |
| `bituminousMembraneGrayGranulated`     | Gray; bituminous surface densely covered in fine mineral granules with high roughness.                                                                                    |
| `bituminousMembraneWhiteGranulated`    | White; bituminous surface densely covered in fine mineral granules with high roughness.                                                                                   |
| `bituminousMembraneBrownGranulated`    | Brown; bituminous surface densely covered in fine mineral granules with high roughness.                                                                                   |
| `bitumenBlackSmooth`                   | Deep black bituminous material with fine flow texture and a dull-to-satin tar-like reflection.                                                                            |
| `roofingEpdmBlack`                     | Black EPDM elastomer with fine rubber texture, broad weak highlights, and opaque diffuse response.                                                                        |
| `roofingEpdmGray`                      | Gray EPDM elastomer with fine rubber texture and a matte response.                                                                                                        |
| `roofingTpoWhite`                      | White; opaque thermoplastic membrane with subtle fine embossing and a low satin sheen.                                                                                    |
| `roofingTpoGray`                       | Gray; opaque thermoplastic membrane with subtle fine embossing and a low satin sheen.                                                                                     |
| `roofingTpoTan`                        | Tan; opaque thermoplastic membrane with subtle fine embossing and a low satin sheen.                                                                                      |
| `roofingPvcWhite`                      | White; opaque PVC membrane with fine smooth texture and a low satin sheen.                                                                                                |
| `roofingPvcGray`                       | Gray; opaque PVC membrane with fine smooth texture and a low satin sheen.                                                                                                 |
| `roofingPvcCream`                      | Cream; opaque PVC membrane with fine smooth texture and a low satin sheen.                                                                                                |
| `roofingSiliconeWhite`                 | Opaque white silicone coating with fine application ripple and a soft satin response.                                                                                     |
| `roofingAcrylicWhite`                  | Opaque white acrylic coating with fine roller texture and matte reflection.                                                                                               |
| `waterproofingCementGray`              | Gray cementitious waterproofing with fine sand texture and high roughness.                                                                                                |
| `waterproofingLiquidBlack`             | Opaque black cured liquid membrane with a slightly rippled rubber-like satin surface.                                                                                     |
| `waterproofingLiquidBlue`              | Opaque blue cured liquid membrane with a fine rubber-like matte surface.                                                                                                  |
| `waterproofingLiquidRed`               | Opaque red cured liquid membrane with a fine rubber-like matte surface.                                                                                                   |
| `roofingAsphaltFoilSilver`             | Silver aluminum-faced bituminous surface with fine foil wrinkles and broad metallic reflection.                                                                           |
| `houseWrapWhite`                       | Opaque white nonwoven polymer membrane with fine tangled fibers and matte reflection; no branding or printed text.                                                        |
| `airBarrierBlack`                      | Opaque black polymer membrane with fine nonwoven texture and low sheen.                                                                                                   |
| `vaporBarrierTranslucent`              | Milky translucent polyethylene film with soft haze and smooth slightly rippled dielectric reflection.                                                                     |
| `breatherMembraneBlue`                 | Blue nonwoven polymer membrane with fine fibrous texture and matte reflection.                                                                                            |

## Resilient flooring, resin coatings, and safety finishes

| Material name                      | Description / specification                                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `vinylSheetWhiteMatte`             | White; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.            |
| `vinylSheetCreamMatte`             | Cream; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.            |
| `vinylSheetBeigeMatte`             | Beige; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.            |
| `vinylSheetGrayMatte`              | Gray; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.             |
| `vinylSheetCharcoalMatte`          | Charcoal; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.         |
| `vinylSheetBlackMatte`             | Black; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.            |
| `vinylSheetBlueMatte`              | Blue; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.             |
| `vinylSheetGreenMatte`             | Green; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.            |
| `vinylSheetRedMatte`               | Red; opaque vinyl with fine uniform microtexture, faint pigment mottling, and low satin reflection; no flooring layout included.              |
| `vinylHomogeneousGraySpeckled`     | Gray with fine black and white flecks; dense resilient polymer with small embedded pigment chips and a matte sealed surface.                  |
| `vinylHomogeneousBeigeSpeckled`    | Beige with warm mineral-like flecks; dense resilient polymer with small embedded pigment chips and a matte sealed surface.                    |
| `vinylHomogeneousBlueSpeckled`     | Blue with pale flecks; dense resilient polymer with small embedded pigment chips and a matte sealed surface.                                  |
| `vinylHomogeneousGreenSpeckled`    | Green with pale flecks; dense resilient polymer with small embedded pigment chips and a matte sealed surface.                                 |
| `linoleumCreamMarbled`             | Cream; linoleum with softly blended fibrous pigment marbling and a low satin sheen.                                                           |
| `linoleumOchreMarbled`             | Ochre; linoleum with softly blended fibrous pigment marbling and a low satin sheen.                                                           |
| `linoleumGrayMarbled`              | Gray; linoleum with softly blended fibrous pigment marbling and a low satin sheen.                                                            |
| `linoleumCharcoalMarbled`          | Charcoal; linoleum with softly blended fibrous pigment marbling and a low satin sheen.                                                        |
| `linoleumRedMarbled`               | Red; linoleum with softly blended fibrous pigment marbling and a low satin sheen.                                                             |
| `linoleumBlueMarbled`              | Blue; linoleum with softly blended fibrous pigment marbling and a low satin sheen.                                                            |
| `linoleumGreenMarbled`             | Green; linoleum with softly blended fibrous pigment marbling and a low satin sheen.                                                           |
| `rubberFlooringBlack`              | Black; opaque rubber with fine granular microtexture and broad subdued highlights; no raised tread geometry included.                         |
| `rubberFlooringGray`               | Gray; opaque rubber with fine granular microtexture and broad subdued highlights; no raised tread geometry included.                          |
| `rubberFlooringBlue`               | Blue; opaque rubber with fine granular microtexture and broad subdued highlights; no raised tread geometry included.                          |
| `rubberFlooringRed`                | Red; opaque rubber with fine granular microtexture and broad subdued highlights; no raised tread geometry included.                           |
| `rubberFlooringGreen`              | Green; opaque rubber with fine granular microtexture and broad subdued highlights; no raised tread geometry included.                         |
| `rubberFlooringBeige`              | Beige; opaque rubber with fine granular microtexture and broad subdued highlights; no raised tread geometry included.                         |
| `rubberRecycledBlack`              | Black with mixed colored flecks; compressed recycled elastomer granules with visible inclusions and a rough matte response.                   |
| `rubberRecycledGray`               | Gray with dark and light flecks; compressed recycled elastomer granules with visible inclusions and a rough matte response.                   |
| `rubberRecycledBlue`               | Blue with black and pale flecks; compressed recycled elastomer granules with visible inclusions and a rough matte response.                   |
| `epoxyCoatingWhiteGloss`           | White; opaque resin coating with fine application ripple and clear glossy dielectric reflections.                                             |
| `epoxyCoatingLightGrayGloss`       | Light gray; opaque resin coating with fine application ripple and clear glossy dielectric reflections.                                        |
| `epoxyCoatingDarkGrayGloss`        | Dark gray; opaque resin coating with fine application ripple and clear glossy dielectric reflections.                                         |
| `epoxyCoatingBeigeGloss`           | Beige; opaque resin coating with fine application ripple and clear glossy dielectric reflections.                                             |
| `epoxyCoatingBlueGloss`            | Blue; opaque resin coating with fine application ripple and clear glossy dielectric reflections.                                              |
| `epoxyCoatingGreenGloss`           | Green; opaque resin coating with fine application ripple and clear glossy dielectric reflections.                                             |
| `epoxyCoatingRedGloss`             | Red; opaque resin coating with fine application ripple and clear glossy dielectric reflections.                                               |
| `epoxyCoatingYellowGloss`          | Yellow; opaque resin coating with fine application ripple and clear glossy dielectric reflections.                                            |
| `epoxyCoatingGrayMatte`            | Gray; opaque resin coating with fine antiglare microtexture and broad muted highlights.                                                       |
| `epoxyCoatingBeigeMatte`           | Beige; opaque resin coating with fine antiglare microtexture and broad muted highlights.                                                      |
| `epoxyCoatingBlueMatte`            | Blue; opaque resin coating with fine antiglare microtexture and broad muted highlights.                                                       |
| `epoxyCoatingGreenMatte`           | Green; opaque resin coating with fine antiglare microtexture and broad muted highlights.                                                      |
| `epoxyCoatingGrayFlaked`           | Gray resin with white and black flakes; pigmented resin containing irregular colored flakes beneath a clear satin seal.                       |
| `epoxyCoatingTanFlaked`            | Tan resin with brown and cream flakes; pigmented resin containing irregular colored flakes beneath a clear satin seal.                        |
| `epoxyCoatingBlueFlaked`           | Blue resin with white and gray flakes; pigmented resin containing irregular colored flakes beneath a clear satin seal.                        |
| `polyurethaneCoatingGraySatin`     | Gray; opaque polyurethane finish with a smooth fine-grained surface and satin reflection.                                                     |
| `polyurethaneCoatingBeigeSatin`    | Beige; opaque polyurethane finish with a smooth fine-grained surface and satin reflection.                                                    |
| `polyurethaneCoatingBlueSatin`     | Blue; opaque polyurethane finish with a smooth fine-grained surface and satin reflection.                                                     |
| `polyurethaneCoatingGreenSatin`    | Green; opaque polyurethane finish with a smooth fine-grained surface and satin reflection.                                                    |
| `resinBoundAggregateGold`          | Golden stone mix; small mineral particles in clear resin with visible grain relief and localized glossy binder highlights.                    |
| `resinBoundAggregateGray`          | Gray stone mix; small mineral particles in clear resin with visible grain relief and localized glossy binder highlights.                      |
| `resinBoundAggregateCream`         | Cream stone mix; small mineral particles in clear resin with visible grain relief and localized glossy binder highlights.                     |
| `resinBoundAggregateRed`           | Red stone mix; small mineral particles in clear resin with visible grain relief and localized glossy binder highlights.                       |
| `antiSlipAggregateCoatingGray`     | Gray; opaque resin containing sharp fine mineral grit with high micro-roughness.                                                              |
| `antiSlipAggregateCoatingBlack`    | Black; opaque resin containing sharp fine mineral grit with high micro-roughness.                                                             |
| `antiSlipAggregateCoatingYellow`   | Yellow; opaque resin containing sharp fine mineral grit with high micro-roughness.                                                            |
| `antiSlipAggregateCoatingRed`      | Red; opaque resin containing sharp fine mineral grit with high micro-roughness.                                                               |
| `safetyMarkingPaintWhite`          | White; opaque high-coverage marking paint with a fine satin surface; no text, symbols, or line layout included.                               |
| `safetyMarkingPaintYellow`         | Yellow; opaque high-coverage marking paint with a fine satin surface; no text, symbols, or line layout included.                              |
| `safetyMarkingPaintRed`            | Red; opaque high-coverage marking paint with a fine satin surface; no text, symbols, or line layout included.                                 |
| `safetyMarkingPaintBlue`           | Blue; opaque high-coverage marking paint with a fine satin surface; no text, symbols, or line layout included.                                |
| `safetyMarkingPaintGreen`          | Green; opaque high-coverage marking paint with a fine satin surface; no text, symbols, or line layout included.                               |
| `retroreflectiveWhiteCoating`      | White binder containing fine glass beads with a bright return toward the illumination direction; requires a retroreflective appearance model. |
| `photoluminescentCoatingPaleGreen` | Pale green pigment with a matte surface and a green afterglow following excitation; emission intensity is time-dependent.                     |

## Carpet, felt, and textile surface finishes

| Material name                        | Description / specification                                                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `carpetWoolIvoryCutPile`             | Ivory; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                   |
| `carpetWoolBeigeCutPile`             | Beige; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                   |
| `carpetWoolTaupeCutPile`             | Taupe; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                   |
| `carpetWoolLightGrayCutPile`         | Light gray; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.              |
| `carpetWoolCharcoalCutPile`          | Charcoal; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                |
| `carpetWoolBlackCutPile`             | Black; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                   |
| `carpetWoolBrownCutPile`             | Brown; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                   |
| `carpetWoolNavyCutPile`              | Navy blue; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.               |
| `carpetWoolBlueCutPile`              | Blue; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                    |
| `carpetWoolGreenCutPile`             | Green; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                   |
| `carpetWoolBurgundyCutPile`          | Burgundy; dense wool fiber surface with fine irregular pile, soft grazing-angle fiber sheen, and diffuse color; no carpet layout included.                |
| `carpetNylonIvoryLoopPile`           | Ivory; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.      |
| `carpetNylonBeigeLoopPile`           | Beige; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.      |
| `carpetNylonTaupeLoopPile`           | Taupe; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.      |
| `carpetNylonLightGrayLoopPile`       | Light gray; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included. |
| `carpetNylonCharcoalLoopPile`        | Charcoal; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.   |
| `carpetNylonBlackLoopPile`           | Black; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.      |
| `carpetNylonBrownLoopPile`           | Brown; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.      |
| `carpetNylonNavyLoopPile`            | Navy blue; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.  |
| `carpetNylonBlueLoopPile`            | Blue; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.       |
| `carpetNylonGreenLoopPile`           | Green; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.      |
| `carpetNylonBurgundyLoopPile`        | Burgundy; dense nylon fiber surface with fine loop-scale texture, slightly brighter fiber highlights, and directional nap; no flooring layout included.   |
| `carpetPolypropyleneBeigeLowPile`    | Beige; low synthetic pile with tight fine fiber texture and mild directional sheen.                                                                       |
| `carpetPolypropyleneGrayLowPile`     | Gray; low synthetic pile with tight fine fiber texture and mild directional sheen.                                                                        |
| `carpetPolypropyleneCharcoalLowPile` | Charcoal; low synthetic pile with tight fine fiber texture and mild directional sheen.                                                                    |
| `carpetPolypropyleneBrownLowPile`    | Brown; low synthetic pile with tight fine fiber texture and mild directional sheen.                                                                       |
| `carpetPolypropyleneBlueLowPile`     | Blue; low synthetic pile with tight fine fiber texture and mild directional sheen.                                                                        |
| `carpetWoolGrayHeathered`            | Mixed light and dark gray fibers; fine multitone wool fiber surface with irregular soft pile and diffuse reflection.                                      |
| `carpetWoolBeigeHeathered`           | Mixed beige and cream fibers; fine multitone wool fiber surface with irregular soft pile and diffuse reflection.                                          |
| `carpetWoolBlueHeathered`            | Mixed navy and blue fibers; fine multitone wool fiber surface with irregular soft pile and diffuse reflection.                                            |
| `carpetWoolGreenHeathered`           | Mixed green and dark gray fibers; fine multitone wool fiber surface with irregular soft pile and diffuse reflection.                                      |
| `carpetOutdoorGray`                  | Gray; tight UV-stable synthetic fiber surface with a coarse fine-scale weave and muted satin fiber highlights.                                            |
| `carpetOutdoorBeige`                 | Beige; tight UV-stable synthetic fiber surface with a coarse fine-scale weave and muted satin fiber highlights.                                           |
| `carpetOutdoorBrown`                 | Brown; tight UV-stable synthetic fiber surface with a coarse fine-scale weave and muted satin fiber highlights.                                           |
| `carpetOutdoorGreen`                 | Green; tight UV-stable synthetic fiber surface with a coarse fine-scale weave and muted satin fiber highlights.                                           |
| `sisalNatural`                       | Golden tan sisal fibers with coarse directional micro-weave, dry rough texture, and diffuse reflection.                                                   |
| `sisalBleached`                      | Pale straw sisal fibers with coarse directional micro-weave and a dry matte response.                                                                     |
| `juteNatural`                        | Warm brown jute fibers with fine hairy texture, irregular fiber thickness, and diffuse reflection.                                                        |
| `coirNatural`                        | Dark golden-brown coconut fiber with coarse tangled microtexture and very high roughness.                                                                 |
| `feltWoolCream`                      | Cream; dense nonwoven wool fibers with a soft fuzzy surface and very broad grazing-angle sheen.                                                           |
| `feltWoolGray`                       | Gray; dense nonwoven wool fibers with a soft fuzzy surface and very broad grazing-angle sheen.                                                            |
| `feltWoolCharcoal`                   | Charcoal; dense nonwoven wool fibers with a soft fuzzy surface and very broad grazing-angle sheen.                                                        |
| `feltWoolBlack`                      | Black; dense nonwoven wool fibers with a soft fuzzy surface and very broad grazing-angle sheen.                                                           |
| `feltWoolRed`                        | Red; dense nonwoven wool fibers with a soft fuzzy surface and very broad grazing-angle sheen.                                                             |
| `feltWoolBlue`                       | Blue; dense nonwoven wool fibers with a soft fuzzy surface and very broad grazing-angle sheen.                                                            |
| `feltWoolGreen`                      | Green; dense nonwoven wool fibers with a soft fuzzy surface and very broad grazing-angle sheen.                                                           |
| `feltWoolOchre`                      | Ochre; dense nonwoven wool fibers with a soft fuzzy surface and very broad grazing-angle sheen.                                                           |
| `feltPetWhite`                       | White; compressed recycled-polyester fibers with fine flecking, a soft matte response, and subtle fiber sheen.                                            |
| `feltPetGray`                        | Gray; compressed recycled-polyester fibers with fine flecking, a soft matte response, and subtle fiber sheen.                                             |
| `feltPetCharcoal`                    | Charcoal; compressed recycled-polyester fibers with fine flecking, a soft matte response, and subtle fiber sheen.                                         |
| `feltPetBlack`                       | Black; compressed recycled-polyester fibers with fine flecking, a soft matte response, and subtle fiber sheen.                                            |
| `feltPetBlue`                        | Blue; compressed recycled-polyester fibers with fine flecking, a soft matte response, and subtle fiber sheen.                                             |
| `feltPetGreen`                       | Green; compressed recycled-polyester fibers with fine flecking, a soft matte response, and subtle fiber sheen.                                            |
| `feltPetOrange`                      | Orange; compressed recycled-polyester fibers with fine flecking, a soft matte response, and subtle fiber sheen.                                           |
| `acousticMineralFiberWhite`          | Off-white bonded mineral fibers with fine mottled porosity and very diffuse reflection; no holes or panel pattern included.                               |
| `acousticMineralFiberGray`           | Gray bonded mineral fibers with fine mottled porosity and very diffuse reflection; no holes or panel pattern included.                                    |
| `acousticMineralFiberBlack`          | Black bonded mineral fibers with fine porous microtexture and a highly matte response.                                                                    |
| `acousticGlassFiberWhite`            | White fine glass-fiber surface under a thin porous binder with soft fibrous microtexture and matte reflection.                                            |

## Upholstery, drapery, bedding, and woven fibers

These are textile materials only. Weave and pile refer to surface-scale appearance, not modeled fabric folds or furnishings.

| Material name                       | Description / specification                                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `linenNatural`                      | Natural flax; plain-weave flax textile with irregular yarn thickness, fine slubs, diffuse reflection, and soft fiber sheen.                        |
| `linenWhite`                        | White; plain-weave flax textile with irregular yarn thickness, fine slubs, diffuse reflection, and soft fiber sheen.                               |
| `linenCream`                        | Cream; plain-weave flax textile with irregular yarn thickness, fine slubs, diffuse reflection, and soft fiber sheen.                               |
| `linenGray`                         | Gray; plain-weave flax textile with irregular yarn thickness, fine slubs, diffuse reflection, and soft fiber sheen.                                |
| `linenCharcoal`                     | Charcoal; plain-weave flax textile with irregular yarn thickness, fine slubs, diffuse reflection, and soft fiber sheen.                            |
| `linenBlue`                         | Blue; plain-weave flax textile with irregular yarn thickness, fine slubs, diffuse reflection, and soft fiber sheen.                                |
| `linenGreen`                        | Sage green; plain-weave flax textile with irregular yarn thickness, fine slubs, diffuse reflection, and soft fiber sheen.                          |
| `cottonWhitePlainWeave`             | White; opaque cotton with fine plain weave, slight fiber fuzz, and a matte diffuse response.                                                       |
| `cottonCreamPlainWeave`             | Cream; opaque cotton with fine plain weave, slight fiber fuzz, and a matte diffuse response.                                                       |
| `cottonBeigePlainWeave`             | Beige; opaque cotton with fine plain weave, slight fiber fuzz, and a matte diffuse response.                                                       |
| `cottonGrayPlainWeave`              | Gray; opaque cotton with fine plain weave, slight fiber fuzz, and a matte diffuse response.                                                        |
| `cottonBlackPlainWeave`             | Black; opaque cotton with fine plain weave, slight fiber fuzz, and a matte diffuse response.                                                       |
| `cottonBluePlainWeave`              | Blue; opaque cotton with fine plain weave, slight fiber fuzz, and a matte diffuse response.                                                        |
| `cottonGreenPlainWeave`             | Green; opaque cotton with fine plain weave, slight fiber fuzz, and a matte diffuse response.                                                       |
| `cottonRedPlainWeave`               | Red; opaque cotton with fine plain weave, slight fiber fuzz, and a matte diffuse response.                                                         |
| `cottonCanvasNatural`               | Natural cream; dense cotton canvas with coarse fine-scale weave and soft matte fiber highlights.                                                   |
| `cottonCanvasWhite`                 | White; dense cotton canvas with coarse fine-scale weave and soft matte fiber highlights.                                                           |
| `cottonCanvasBeige`                 | Beige; dense cotton canvas with coarse fine-scale weave and soft matte fiber highlights.                                                           |
| `cottonCanvasGray`                  | Gray; dense cotton canvas with coarse fine-scale weave and soft matte fiber highlights.                                                            |
| `cottonCanvasBlack`                 | Black; dense cotton canvas with coarse fine-scale weave and soft matte fiber highlights.                                                           |
| `cottonCanvasNavy`                  | Navy blue; dense cotton canvas with coarse fine-scale weave and soft matte fiber highlights.                                                       |
| `velvetCream`                       | Cream; short dense pile with strong directional nap, soft grazing highlights, and view-dependent color depth.                                      |
| `velvetGray`                        | Gray; short dense pile with strong directional nap, soft grazing highlights, and view-dependent color depth.                                       |
| `velvetBlack`                       | Black; short dense pile with strong directional nap, soft grazing highlights, and view-dependent color depth.                                      |
| `velvetNavy`                        | Navy blue; short dense pile with strong directional nap, soft grazing highlights, and view-dependent color depth.                                  |
| `velvetEmerald`                     | Emerald green; short dense pile with strong directional nap, soft grazing highlights, and view-dependent color depth.                              |
| `velvetBurgundy`                    | Burgundy; short dense pile with strong directional nap, soft grazing highlights, and view-dependent color depth.                                   |
| `velvetRust`                        | Rust; short dense pile with strong directional nap, soft grazing highlights, and view-dependent color depth.                                       |
| `velvetGold`                        | Gold; short dense pile with strong directional nap, soft grazing highlights, and view-dependent color depth.                                       |
| `boucleIvory`                       | Ivory; looped yarn textile with fine irregular curled fibers and a soft diffuse response.                                                          |
| `boucleBeige`                       | Beige; looped yarn textile with fine irregular curled fibers and a soft diffuse response.                                                          |
| `boucleGray`                        | Gray; looped yarn textile with fine irregular curled fibers and a soft diffuse response.                                                           |
| `boucleCharcoal`                    | Charcoal; looped yarn textile with fine irregular curled fibers and a soft diffuse response.                                                       |
| `boucleRust`                        | Rust; looped yarn textile with fine irregular curled fibers and a soft diffuse response.                                                           |
| `woolTwillCream`                    | Cream; fine diagonal wool weave with fuzzy fibers and soft directional sheen.                                                                      |
| `woolTwillGray`                     | Gray; fine diagonal wool weave with fuzzy fibers and soft directional sheen.                                                                       |
| `woolTwillCharcoal`                 | Charcoal; fine diagonal wool weave with fuzzy fibers and soft directional sheen.                                                                   |
| `woolTwillNavy`                     | Navy blue; fine diagonal wool weave with fuzzy fibers and soft directional sheen.                                                                  |
| `woolTwillGreen`                    | Green; fine diagonal wool weave with fuzzy fibers and soft directional sheen.                                                                      |
| `woolTwillRust`                     | Rust; fine diagonal wool weave with fuzzy fibers and soft directional sheen.                                                                       |
| `polyesterSheerWhite`               | White; thin translucent fine-weave textile with weak fiber sheen and diffuse transmission; weave coverage controls opacity.                        |
| `polyesterSheerIvory`               | Ivory; thin translucent fine-weave textile with weak fiber sheen and diffuse transmission; weave coverage controls opacity.                        |
| `polyesterSheerGray`                | Gray; thin translucent fine-weave textile with weak fiber sheen and diffuse transmission; weave coverage controls opacity.                         |
| `linenSheerWhite`                   | White; thin translucent flax textile with slubbed fine yarns and diffuse transmission through the weave.                                           |
| `linenSheerNatural`                 | Natural flax; thin translucent flax textile with slubbed fine yarns and diffuse transmission through the weave.                                    |
| `linenSheerGray`                    | Gray; thin translucent flax textile with slubbed fine yarns and diffuse transmission through the weave.                                            |
| `blackoutTextileWhite`              | White; opaque coated textile with fine weave, soft matte reflection, and negligible light transmission.                                            |
| `blackoutTextileCream`              | Cream; opaque coated textile with fine weave, soft matte reflection, and negligible light transmission.                                            |
| `blackoutTextileGray`               | Gray; opaque coated textile with fine weave, soft matte reflection, and negligible light transmission.                                             |
| `blackoutTextileNavy`               | Navy blue; opaque coated textile with fine weave, soft matte reflection, and negligible light transmission.                                        |
| `blackoutTextileBlack`              | Black; opaque coated textile with fine weave, soft matte reflection, and negligible light transmission.                                            |
| `solarScreenTextileWhite`           | White; fine coated synthetic yarn with a subtle satin sheen; fine weave uses physically consistent coverage and transmission.                      |
| `solarScreenTextileCream`           | Cream; fine coated synthetic yarn with a subtle satin sheen; fine weave uses physically consistent coverage and transmission.                      |
| `solarScreenTextileGray`            | Gray; fine coated synthetic yarn with a subtle satin sheen; fine weave uses physically consistent coverage and transmission.                       |
| `solarScreenTextileCharcoal`        | Charcoal; fine coated synthetic yarn with a subtle satin sheen; fine weave uses physically consistent coverage and transmission.                   |
| `solarScreenTextileBlack`           | Black; fine coated synthetic yarn with a subtle satin sheen; fine weave uses physically consistent coverage and transmission.                      |
| `silkIvory`                         | Ivory; fine filament weave with smooth directional luster and subtle yarn irregularity.                                                            |
| `silkChampagne`                     | Champagne; fine filament weave with smooth directional luster and subtle yarn irregularity.                                                        |
| `silkGray`                          | Gray; fine filament weave with smooth directional luster and subtle yarn irregularity.                                                             |
| `silkBlue`                          | Blue; fine filament weave with smooth directional luster and subtle yarn irregularity.                                                             |
| `silkBurgundy`                      | Burgundy; fine filament weave with smooth directional luster and subtle yarn irregularity.                                                         |
| `satinTextileWhite`                 | White; smooth long-float weave with strong directional fiber sheen and soft diffuse color.                                                         |
| `satinTextileCream`                 | Cream; smooth long-float weave with strong directional fiber sheen and soft diffuse color.                                                         |
| `satinTextileBlack`                 | Black; smooth long-float weave with strong directional fiber sheen and soft diffuse color.                                                         |
| `satinTextileNavy`                  | Navy blue; smooth long-float weave with strong directional fiber sheen and soft diffuse color.                                                     |
| `polyesterOutdoorTextileWhite`      | White; solution-dyed synthetic textile with fine coarse-yarn weave and subdued fiber highlights.                                                   |
| `polyesterOutdoorTextileBeige`      | Beige; solution-dyed synthetic textile with fine coarse-yarn weave and subdued fiber highlights.                                                   |
| `polyesterOutdoorTextileGray`       | Gray; solution-dyed synthetic textile with fine coarse-yarn weave and subdued fiber highlights.                                                    |
| `polyesterOutdoorTextileNavy`       | Navy blue; solution-dyed synthetic textile with fine coarse-yarn weave and subdued fiber highlights.                                               |
| `polyesterOutdoorTextileGreen`      | Green; solution-dyed synthetic textile with fine coarse-yarn weave and subdued fiber highlights.                                                   |
| `polyesterOutdoorTextileTerracotta` | Terracotta; solution-dyed synthetic textile with fine coarse-yarn weave and subdued fiber highlights.                                              |
| `rattanNatural`                     | Warm honey rattan fiber surface with fine longitudinal striations, small organic color shifts, and low satin sheen; no woven arrangement included. |
| `rattanDarkBrown`                   | Dark brown stained rattan fiber surface with visible longitudinal striations and low satin sheen; no woven arrangement included.                   |
| `seagrassNatural`                   | Tan to olive dried seagrass fibers with fine longitudinal ridges, natural color variation, and a matte response; no woven arrangement included.    |
| `raffiaNatural`                     | Pale straw raffia fiber surface with irregular fine longitudinal texture and matte reflection; no woven arrangement included.                      |

## Leather, hide, and synthetic upholstery

| Material name                 | Description / specification                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `leatherIvorySemiAniline`     | Ivory; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                                    |
| `leatherTanSemiAniline`       | Tan; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                                      |
| `leatherCognacSemiAniline`    | Cognac; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                                   |
| `leatherBrownSemiAniline`     | Brown; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                                    |
| `leatherDarkBrownSemiAniline` | Dark brown; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                               |
| `leatherBlackSemiAniline`     | Black; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                                    |
| `leatherGraySemiAniline`      | Gray; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                                     |
| `leatherBurgundySemiAniline`  | Burgundy; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                                 |
| `leatherNavySemiAniline`      | Navy blue; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                                |
| `leatherGreenSemiAniline`     | Dark green; fine natural hide grain with pores, subtle color variation, and soft waxy satin highlights.                               |
| `leatherWhitePigmented`       | White; opaque pigmented hide with uniform fine embossed grain and a satin protective finish.                                          |
| `leatherCreamPigmented`       | Cream; opaque pigmented hide with uniform fine embossed grain and a satin protective finish.                                          |
| `leatherTanPigmented`         | Tan; opaque pigmented hide with uniform fine embossed grain and a satin protective finish.                                            |
| `leatherBrownPigmented`       | Brown; opaque pigmented hide with uniform fine embossed grain and a satin protective finish.                                          |
| `leatherBlackPigmented`       | Black; opaque pigmented hide with uniform fine embossed grain and a satin protective finish.                                          |
| `leatherGrayPigmented`        | Gray; opaque pigmented hide with uniform fine embossed grain and a satin protective finish.                                           |
| `leatherRedPigmented`         | Red; opaque pigmented hide with uniform fine embossed grain and a satin protective finish.                                            |
| `suedeSand`                   | Sand; fine napped hide with very soft directional fiber sheen and high diffuse roughness.                                             |
| `suedeTan`                    | Tan; fine napped hide with very soft directional fiber sheen and high diffuse roughness.                                              |
| `suedeBrown`                  | Brown; fine napped hide with very soft directional fiber sheen and high diffuse roughness.                                            |
| `suedeGray`                   | Gray; fine napped hide with very soft directional fiber sheen and high diffuse roughness.                                             |
| `suedeBlack`                  | Black; fine napped hide with very soft directional fiber sheen and high diffuse roughness.                                            |
| `nubuckTan`                   | Tan; finely buffed hide with shallow directional nap, soft pore texture, and a velvety matte response.                                |
| `nubuckCognac`                | Cognac; finely buffed hide with shallow directional nap, soft pore texture, and a velvety matte response.                             |
| `nubuckGray`                  | Gray; finely buffed hide with shallow directional nap, soft pore texture, and a velvety matte response.                               |
| `nubuckBlack`                 | Black; finely buffed hide with shallow directional nap, soft pore texture, and a velvety matte response.                              |
| `vinylUpholsteryWhite`        | White; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                   |
| `vinylUpholsteryCream`        | Cream; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                   |
| `vinylUpholsteryTan`          | Tan; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                     |
| `vinylUpholsteryBrown`        | Brown; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                   |
| `vinylUpholsteryBlack`        | Black; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                   |
| `vinylUpholsteryGray`         | Gray; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                    |
| `vinylUpholsteryBlue`         | Blue; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                    |
| `vinylUpholsteryGreen`        | Green; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                   |
| `vinylUpholsteryRed`          | Red; opaque flexible vinyl with a fine embossed hide grain and slightly uniform satin highlights.                                     |
| `sheepskinIvory`              | Ivory wool fiber surface with dense irregular soft pile and broad fiber scattering; no hide outline or long-strand geometry included. |
| `cowhideBrownWhite`           | Short natural hair surface with irregular brown and white pigment mottling and a soft directional sheen; no hide outline included.    |

## Plastics, elastomers, sealants, and adhesives

| Material name                  | Description / specification                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `pvcRigidWhite`                | White; opaque rigid PVC with a fine smooth surface and low satin dielectric highlights.                                              |
| `pvcRigidCream`                | Cream; opaque rigid PVC with a fine smooth surface and low satin dielectric highlights.                                              |
| `pvcRigidGray`                 | Gray; opaque rigid PVC with a fine smooth surface and low satin dielectric highlights.                                               |
| `pvcRigidBlack`                | Black; opaque rigid PVC with a fine smooth surface and low satin dielectric highlights.                                              |
| `pvcRigidBrown`                | Brown; opaque rigid PVC with a fine smooth surface and low satin dielectric highlights.                                              |
| `absPlasticWhite`              | White; opaque ABS polymer with fine molded stipple and broad satin highlights.                                                       |
| `absPlasticCream`              | Cream; opaque ABS polymer with fine molded stipple and broad satin highlights.                                                       |
| `absPlasticGray`               | Gray; opaque ABS polymer with fine molded stipple and broad satin highlights.                                                        |
| `absPlasticBlack`              | Black; opaque ABS polymer with fine molded stipple and broad satin highlights.                                                       |
| `polypropyleneWhite`           | White; opaque polypropylene with a slightly waxy surface, fine molded texture, and broad weak highlights.                            |
| `polypropyleneGray`            | Gray; opaque polypropylene with a slightly waxy surface, fine molded texture, and broad weak highlights.                             |
| `polypropyleneBlack`           | Black; opaque polypropylene with a slightly waxy surface, fine molded texture, and broad weak highlights.                            |
| `polypropyleneBlue`            | Blue; opaque polypropylene with a slightly waxy surface, fine molded texture, and broad weak highlights.                             |
| `polypropyleneGreen`           | Green; opaque polypropylene with a slightly waxy surface, fine molded texture, and broad weak highlights.                            |
| `polyethyleneWhite`            | White; opaque polyethylene with fine molded texture and a low waxy satin sheen.                                                      |
| `polyethyleneBlack`            | Black; opaque polyethylene with fine molded texture and a low waxy satin sheen.                                                      |
| `polyethyleneBlue`             | Blue; opaque polyethylene with fine molded texture and a low waxy satin sheen.                                                       |
| `polyethyleneYellow`           | Yellow; opaque polyethylene with fine molded texture and a low waxy satin sheen.                                                     |
| `polyethyleneOrange`           | Orange; opaque polyethylene with fine molded texture and a low waxy satin sheen.                                                     |
| `polyethyleneMilkyTranslucent` | Unpigmented milky polyethylene with strong volume scattering and diffuse transmission.                                               |
| `acrylicClear`                 | Colorless transparent acrylic with smooth dielectric reflection, clear specular transmission, and weak bulk absorption.              |
| `acrylicFrosted`               | Colorless acrylic with finely abraded surface scattering, soft reflection, and blurred transmission.                                 |
| `acrylicOpalWhite`             | White opal acrylic with strong volume scattering, diffuse transmission, and a smooth satin surface.                                  |
| `acrylicSmokeGray`             | Smoke-gray transparent acrylic with neutral absorptive tint and smooth dielectric reflection.                                        |
| `acrylicOpaqueWhite`           | White; opaque acrylic with a smooth glossy dielectric surface.                                                                       |
| `acrylicOpaqueBlack`           | Black; opaque acrylic with a smooth glossy dielectric surface.                                                                       |
| `acrylicOpaqueRed`             | Red; opaque acrylic with a smooth glossy dielectric surface.                                                                         |
| `acrylicOpaqueBlue`            | Blue; opaque acrylic with a smooth glossy dielectric surface.                                                                        |
| `acrylicOpaqueGreen`           | Green; opaque acrylic with a smooth glossy dielectric surface.                                                                       |
| `acrylicOpaqueYellow`          | Yellow; opaque acrylic with a smooth glossy dielectric surface.                                                                      |
| `polycarbonateClear`           | Clear polycarbonate with slight warm absorption, smooth glossy reflection, and clear transmission; no hollow-cell geometry included. |
| `polycarbonateOpal`            | Milky opal polycarbonate with diffuse volume transmission and smooth surface reflection; no hollow-cell geometry included.           |
| `polycarbonateBronze`          | Bronze-tinted translucent polycarbonate with warm absorption, mild haze, and smooth reflection.                                      |
| `ptfeCoatedGlassFiberWhite`    | White PTFE-coated glass-fiber textile with faint fine weave, matte reflection, and soft diffuse transmission.                        |
| `etfeClear`                    | Colorless transparent ETFE film with very weak absorption and smooth dielectric reflection; no inflated form included.               |
| `etfeTranslucentWhite`         | White translucent ETFE film with diffuse transmission and smooth dielectric reflection; no frit or coverage pattern included.        |
| `siliconeSealantClear`         | Clear translucent; cured silicone with a smooth rubber-like satin sheen; pigment controls opacity and scattering.                    |
| `siliconeSealantWhite`         | White; cured silicone with a smooth rubber-like satin sheen; pigment controls opacity and scattering.                                |
| `siliconeSealantIvory`         | Ivory; cured silicone with a smooth rubber-like satin sheen; pigment controls opacity and scattering.                                |
| `siliconeSealantGray`          | Gray; cured silicone with a smooth rubber-like satin sheen; pigment controls opacity and scattering.                                 |
| `siliconeSealantBlack`         | Black; cured silicone with a smooth rubber-like satin sheen; pigment controls opacity and scattering.                                |
| `siliconeSealantBrown`         | Brown; cured silicone with a smooth rubber-like satin sheen; pigment controls opacity and scattering.                                |
| `polyurethaneSealantWhite`     | White; opaque cured elastomeric sealant with fine application texture and a low satin response.                                      |
| `polyurethaneSealantGray`      | Gray; opaque cured elastomeric sealant with fine application texture and a low satin response.                                       |
| `polyurethaneSealantBlack`     | Black; opaque cured elastomeric sealant with fine application texture and a low satin response.                                      |
| `polyurethaneSealantTan`       | Tan; opaque cured elastomeric sealant with fine application texture and a low satin response.                                        |
| `acrylicCaulkWhite`            | White; opaque cured acrylic filler with fine chalky microtexture and a matte response.                                               |
| `acrylicCaulkCream`            | Cream; opaque cured acrylic filler with fine chalky microtexture and a matte response.                                               |
| `acrylicCaulkGray`             | Gray; opaque cured acrylic filler with fine chalky microtexture and a matte response.                                                |
| `rubberEpdmBlack`              | Black EPDM rubber with fine matte microtexture and broad weak dielectric highlights.                                                 |
| `rubberNeopreneBlack`          | Black neoprene rubber with a fine smooth skin and a low satin response.                                                              |
| `rubberNaturalTan`             | Tan natural rubber with subtle color mottling, fine microtexture, and a low waxy sheen.                                              |
| `rubberSiliconeTranslucent`    | Milky translucent silicone rubber with soft volume scattering and smooth satin reflection.                                           |
| `rubberButylBlack`             | Deep black butyl rubber with slightly tacky-looking fine flow texture and muted satin highlights.                                    |
| `adhesiveEpoxyAmber`           | Cured transparent amber epoxy with warm path-length absorption and a glossy dielectric surface.                                      |
| `adhesiveCementGray`           | Gray cement-based adhesive with fine sand grains and a dry high-roughness response.                                                  |
| `adhesiveWoodDriedClear`       | Cured pale amber wood adhesive with weak translucency and a fine satin surface.                                                      |

## Sanitary ceramics, enamel, and utility composites

| Material name                | Description / specification                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vitreousChinaWhite`         | White; dense opaque ceramic with an extremely smooth glazed surface, slight warm subsurface softness, and strong glossy dielectric reflection.                         |
| `vitreousChinaIvory`         | Ivory; dense opaque ceramic with an extremely smooth glazed surface, slight warm subsurface softness, and strong glossy dielectric reflection.                         |
| `vitreousChinaCream`         | Cream; dense opaque ceramic with an extremely smooth glazed surface, slight warm subsurface softness, and strong glossy dielectric reflection.                         |
| `vitreousChinaBlack`         | Black; dense opaque ceramic with an extremely smooth glazed surface, slight warm subsurface softness, and strong glossy dielectric reflection.                         |
| `vitreousChinaGray`          | Gray; dense opaque ceramic with an extremely smooth glazed surface, slight warm subsurface softness, and strong glossy dielectric reflection.                          |
| `porcelainEnamelWhite`       | White; opaque glassy enamel with slight orange-peel microtexture and glossy dielectric reflection.                                                                     |
| `porcelainEnamelCream`       | Cream; opaque glassy enamel with slight orange-peel microtexture and glossy dielectric reflection.                                                                     |
| `porcelainEnamelBlack`       | Black; opaque glassy enamel with slight orange-peel microtexture and glossy dielectric reflection.                                                                     |
| `porcelainEnamelGray`        | Gray; opaque glassy enamel with slight orange-peel microtexture and glossy dielectric reflection.                                                                      |
| `porcelainEnamelBlue`        | Blue; opaque glassy enamel with slight orange-peel microtexture and glossy dielectric reflection.                                                                      |
| `sanitaryAcrylicWhite`       | White; opaque pigmented acrylic with a smooth high-gloss dielectric surface and subtle internal scattering.                                                            |
| `sanitaryAcrylicIvory`       | Ivory; opaque pigmented acrylic with a smooth high-gloss dielectric surface and subtle internal scattering.                                                            |
| `sanitaryAcrylicBlack`       | Black; opaque pigmented acrylic with a smooth high-gloss dielectric surface and subtle internal scattering.                                                            |
| `mineralCastCompositeWhite`  | White; dense cast mineral-resin composite with a fine homogeneous texture and smooth matte-to-satin reflection.                                                        |
| `mineralCastCompositeCream`  | Cream; dense cast mineral-resin composite with a fine homogeneous texture and smooth matte-to-satin reflection.                                                        |
| `mineralCastCompositeGray`   | Gray; dense cast mineral-resin composite with a fine homogeneous texture and smooth matte-to-satin reflection.                                                         |
| `mineralCastCompositeBlack`  | Black; dense cast mineral-resin composite with a fine homogeneous texture and smooth matte-to-satin reflection.                                                        |
| `graniteResinCompositeWhite` | White with fine gray flecks; opaque mineral-resin composite with fine granular texture and low sheen.                                                                  |
| `graniteResinCompositeGray`  | Gray with dark mineral flecks; opaque mineral-resin composite with fine granular texture and low sheen.                                                                |
| `graniteResinCompositeBlack` | Black with fine pale mineral flecks; opaque mineral-resin composite with fine granular texture and low sheen.                                                          |
| `graniteResinCompositeBeige` | Beige with warm flecks; opaque mineral-resin composite with fine granular texture and low sheen.                                                                       |
| `glassCeramicBlack`          | Opaque near-black glass-ceramic with a smooth glossy dielectric surface and faint deep brown transmission only at sufficient illumination and low optical path length. |
| `glassCeramicWhite`          | Opaque white glass-ceramic with fine internal scattering and a smooth glossy dielectric surface.                                                                       |
| `fiberglassGelcoatWhite`     | Opaque white polyester gelcoat with a smooth glossy surface and faint subsurface fiber print-through.                                                                  |
| `fiberglassGelcoatGray`      | Opaque gray polyester gelcoat with smooth satin reflection and faint subsurface fiber print-through.                                                                   |
| `fiberglassRawAmber`         | Translucent amber resin with visible fine glass fibers and a slightly rippled glossy surface.                                                                          |

## Insulation, exposed service materials, and construction substrates

| Material name                 | Description / specification                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `mineralWoolYellowBrown`      | Yellow-brown bonded mineral fibers with dense tangled microtexture and high diffuse roughness.                                       |
| `rockWoolOlive`               | Olive-gray bonded stone fibers with coarse fuzzy microtexture and a highly matte response.                                           |
| `glassWoolYellow`             | Pale yellow glass fibers with very fine tangled texture, soft scattering, and matte overall appearance.                              |
| `glassWoolPink`               | Pink glass fibers with very fine tangled texture, soft scattering, and matte overall appearance.                                     |
| `celluloseInsulationGray`     | Gray recycled cellulose fibers with tiny paper flecks and a rough diffuse response.                                                  |
| `woodFiberInsulationBrown`    | Brown compressed wood fibers with fine irregular flecks and a dry matte response.                                                    |
| `hempFiberInsulationTan`      | Tan bonded plant fibers with coarse organic strands and a soft matte response.                                                       |
| `expandedPolystyreneWhite`    | White fused foam beads with visible fine bead boundaries, soft scattering, and low sheen.                                            |
| `expandedPolystyreneGraphite` | Dark gray fused foam beads with visible fine bead boundaries and a matte response.                                                   |
| `extrudedPolystyrenePink`     | Pink closed-cell polymer foam with fine uniform surface porosity and matte reflection.                                               |
| `extrudedPolystyreneBlue`     | Blue closed-cell polymer foam with fine uniform surface porosity and matte reflection.                                               |
| `extrudedPolystyreneGreen`    | Green closed-cell polymer foam with fine uniform surface porosity and matte reflection.                                              |
| `polyisocyanurateFoamCream`   | Cream rigid foam with fine closed-cell texture and matte reflection.                                                                 |
| `sprayPolyurethaneFoamYellow` | Pale yellow cured polyurethane foam with irregular small cells and a matte response.                                                 |
| `sprayPolyurethaneFoamWhite`  | Off-white cured polyurethane foam with fine irregular cells and a matte response.                                                    |
| `phenolicFoamPinkBrown`       | Pink-brown rigid phenolic foam with fine cellular texture and matte reflection.                                                      |
| `elastomericInsulationBlack`  | Black flexible closed-cell foam with fine pores and a soft matte rubber-like response.                                               |
| `insulationFoilAluminum`      | Thin silver aluminum foil with fine crinkles and sharp-to-broad metallic reflections.                                                |
| `insulationFacingKraftBrown`  | Brown kraft paper with fine visible fibers, mild mottling, and diffuse reflection.                                                   |
| `fireproofingCementGray`      | Gray sprayed cementitious fiber coating with fine irregular granularity and very high roughness.                                     |
| `fireproofingFiberOffWhite`   | Off-white sprayed mineral fibers with fuzzy irregular microtexture and matte reflection.                                             |
| `intumescentCoatingWhite`     | Opaque white protective coating with fine application texture and a low satin response; only its unexpanded appearance is specified. |
| `intumescentCoatingGray`      | Opaque gray protective coating with fine application texture and a low satin response; only its unexpanded appearance is specified.  |
| `firestopSealantRed`          | Opaque red cured elastomeric compound with fine application texture and a matte response.                                            |
| `firestopSealantGray`         | Opaque gray cured elastomeric compound with fine application texture and a matte response.                                           |
| `firestopPuttyRedBrown`       | Red-brown dense putty with a fine slightly waxy surface and low satin reflection.                                                    |
| `calciumSilicateWhite`        | Chalky white calcium-silicate surface with fine mineral pores and a highly diffuse response.                                         |
| `cementBoardGray`             | Gray cement board surface with small mineral inclusions, faint fiber flecks, and high roughness.                                     |
| `magnesiumOxideBoardWhite`    | Off-white mineral board surface with very fine pores and a dry matte response.                                                       |
| `hdpeBlackUtility`            | Opaque black high-density polyethylene with fine manufacturing texture and a smooth low satin sheen.                                 |
| `hdpeBlueUtility`             | Opaque blue high-density polyethylene with fine manufacturing texture and a smooth low satin sheen.                                  |
| `pvcOrangeUtility`            | Opaque orange rigid PVC with a smooth slightly glossy dielectric surface.                                                            |
| `pvcGrayUtility`              | Opaque medium-gray rigid PVC with a smooth slightly glossy dielectric surface.                                                       |
| `cpvcCreamUtility`            | Opaque cream chlorinated PVC with a fine smooth texture and low satin sheen.                                                         |
| `pexRedUtility`               | Opaque red cross-linked polyethylene with a slightly waxy smooth satin surface.                                                      |
| `pexBlueUtility`              | Opaque blue cross-linked polyethylene with a slightly waxy smooth satin surface.                                                     |
| `pexWhiteUtility`             | Milky white cross-linked polyethylene with weak subsurface scattering and a smooth satin surface.                                    |

## Paper, wallcoverings, natural fiber finishes, and decorative coatings

| Material name                           | Description / specification                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `wallcoveringPaperWhite`                | White; opaque paper wallcovering with fine fibers, subtle pigment mottling, and diffuse matte reflection; no graphic pattern included.          |
| `wallcoveringPaperCream`                | Cream; opaque paper wallcovering with fine fibers, subtle pigment mottling, and diffuse matte reflection; no graphic pattern included.          |
| `wallcoveringPaperBeige`                | Beige; opaque paper wallcovering with fine fibers, subtle pigment mottling, and diffuse matte reflection; no graphic pattern included.          |
| `wallcoveringPaperGray`                 | Gray; opaque paper wallcovering with fine fibers, subtle pigment mottling, and diffuse matte reflection; no graphic pattern included.           |
| `wallcoveringPaperBlue`                 | Blue; opaque paper wallcovering with fine fibers, subtle pigment mottling, and diffuse matte reflection; no graphic pattern included.           |
| `wallcoveringPaperGreen`                | Green; opaque paper wallcovering with fine fibers, subtle pigment mottling, and diffuse matte reflection; no graphic pattern included.          |
| `wallcoveringPaperRose`                 | Rose; opaque paper wallcovering with fine fibers, subtle pigment mottling, and diffuse matte reflection; no graphic pattern included.           |
| `wallcoveringVinylWhiteLinenTexture`    | White; opaque vinyl wallcovering with fine woven-linen embossing and subdued satin reflection.                                                  |
| `wallcoveringVinylCreamLinenTexture`    | Cream; opaque vinyl wallcovering with fine woven-linen embossing and subdued satin reflection.                                                  |
| `wallcoveringVinylBeigeLinenTexture`    | Beige; opaque vinyl wallcovering with fine woven-linen embossing and subdued satin reflection.                                                  |
| `wallcoveringVinylGrayLinenTexture`     | Gray; opaque vinyl wallcovering with fine woven-linen embossing and subdued satin reflection.                                                   |
| `wallcoveringVinylCharcoalLinenTexture` | Charcoal; opaque vinyl wallcovering with fine woven-linen embossing and subdued satin reflection.                                               |
| `wallcoveringGrassclothNatural`         | Natural tan; fine plant-fiber surface with irregular yarn thickness, organic tonal variation, and matte reflection; no panel seams included.    |
| `wallcoveringGrassclothBleached`        | Bleached straw; fine plant-fiber surface with irregular yarn thickness, organic tonal variation, and matte reflection; no panel seams included. |
| `wallcoveringGrassclothGray`            | Gray; fine plant-fiber surface with irregular yarn thickness, organic tonal variation, and matte reflection; no panel seams included.           |
| `wallcoveringGrassclothGreen`           | Muted green; fine plant-fiber surface with irregular yarn thickness, organic tonal variation, and matte reflection; no panel seams included.    |
| `wallcoveringGrassclothBlue`            | Muted blue; fine plant-fiber surface with irregular yarn thickness, organic tonal variation, and matte reflection; no panel seams included.     |
| `wallcoveringSilkIvory`                 | Ivory; fine silk-like textile surface with subtle slubs and directional fiber luster.                                                           |
| `wallcoveringSilkChampagne`             | Champagne; fine silk-like textile surface with subtle slubs and directional fiber luster.                                                       |
| `wallcoveringSilkGray`                  | Gray; fine silk-like textile surface with subtle slubs and directional fiber luster.                                                            |
| `wallcoveringSilkBlue`                  | Blue; fine silk-like textile surface with subtle slubs and directional fiber luster.                                                            |
| `wallcoveringMetallicGold`              | Gold-colored metallic-pigment wallcovering with fine paper texture and softly directional reflective flecks.                                    |
| `wallcoveringMetallicSilver`            | Silver-colored metallic-pigment wallcovering with fine paper texture and softly directional reflective flecks.                                  |
| `wallcoveringMicaPearl`                 | Pale pearl mineral-flake finish with small reflective mica particles in a matte binder.                                                         |
| `goldLeaf`                              | Thin warm gold metal finish with fine overlapping tone variation, micro-wrinkles, and strong conductor reflections; no leaf layout specified.   |
| `silverLeaf`                            | Thin silver metal finish with fine overlapping tone variation, micro-wrinkles, and strong conductor reflections; no leaf layout specified.      |
| `copperLeaf`                            | Thin copper metal finish with warm red-orange reflection, fine micro-wrinkles, and subtle oxidation variation.                                  |
| `decorativePearlescentWhite`            | White coating containing fine pearl pigment with soft angle-dependent sheen and a smooth satin binder.                                          |
| `decorativeMetallicBronze`              | Bronze-colored paint with fine metallic flakes under a satin dielectric binder; distinct from solid bronze metal.                               |

## Exterior paving media, earth, aggregates, and landscape surface materials

Only constituent materials and surface appearances are listed. Site objects, planting forms, paving arrangements, and terrain geometry are outside this catalog.

| Material name                    | Description / specification                                                                                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `asphaltFreshBlack`              | Fresh near-black bituminous mix with fine exposed mineral aggregate and a matte-to-low-satin binder.                                                                                          |
| `asphaltWeatheredGray`           | Weathered gray bituminous mix with faded binder, visible mineral grains, and high roughness.                                                                                                  |
| `asphaltWetBlack`                | Water-darkened asphalt with visible aggregate and a smooth reflective water film between grains.                                                                                              |
| `asphaltRedPigmented`            | Red-brown pigmented bituminous mix with fine aggregate and a rough matte response.                                                                                                            |
| `aggregateGravelGray`            | Gray mixed mineral grains; dry granular mineral appearance with local color variation and rough diffuse reflection; individual stones and their distribution require separate representation. |
| `aggregateGravelWhite`           | White mineral grains; dry granular mineral appearance with local color variation and rough diffuse reflection; individual stones and their distribution require separate representation.      |
| `aggregateGravelBuff`            | Buff mixed mineral grains; dry granular mineral appearance with local color variation and rough diffuse reflection; individual stones and their distribution require separate representation. |
| `aggregateGravelRed`             | Red mineral grains; dry granular mineral appearance with local color variation and rough diffuse reflection; individual stones and their distribution require separate representation.        |
| `aggregateGravelBlack`           | Black mineral grains; dry granular mineral appearance with local color variation and rough diffuse reflection; individual stones and their distribution require separate representation.      |
| `aggregatePeaGravelNatural`      | Tan and gray mineral mix; water-worn mineral appearance with fine speckles and low satin-to-matte reflection; no particle geometry included.                                                  |
| `aggregatePeaGravelCream`        | Cream mineral mix; water-worn mineral appearance with fine speckles and low satin-to-matte reflection; no particle geometry included.                                                         |
| `aggregatePeaGravelGray`         | Gray mineral mix; water-worn mineral appearance with fine speckles and low satin-to-matte reflection; no particle geometry included.                                                          |
| `aggregateRiverStoneMixed`       | Mixed brown, gray, and cream mineral appearance with smooth weathered microtexture and soft dielectric highlights; no particle geometry included.                                             |
| `aggregateDecomposedGraniteGold` | Golden tan decomposed granite with fine quartz and mica flecks and high diffuse roughness.                                                                                                    |
| `aggregateDecomposedGraniteGray` | Gray decomposed granite with fine pale quartz and dark mineral flecks and high diffuse roughness.                                                                                             |
| `aggregateCrushedLimestoneCream` | Cream limestone granulate appearance with dusty fine pores and a very matte response; no particle geometry included.                                                                          |
| `aggregateCrushedBasaltBlack`    | Dark gray-black basalt granulate appearance with fine crystalline grain and high roughness; no particle geometry included.                                                                    |
| `aggregateLavaRed`               | Red-brown porous volcanic aggregate appearance with small vesicles and high roughness; no particle geometry included.                                                                         |
| `aggregateLavaBlack`             | Black porous volcanic aggregate appearance with small vesicles and high roughness; no particle geometry included.                                                                             |
| `sandDryPale`                    | Pale tan dry sand with fine varied mineral grains, sparse small glints, and high overall roughness.                                                                                           |
| `sandDryWhite`                   | White dry sand with fine pale mineral grains and a rough diffuse response.                                                                                                                    |
| `sandWetBrown`                   | Water-darkened brown sand with fine mineral grain and increased smooth surface reflection.                                                                                                    |
| `soilLoamDry`                    | Dark brown dry loam with fine organic flecks, granular microtexture, and diffuse reflection.                                                                                                  |
| `soilLoamWet`                    | Near-black moist loam with dark organic flecks and locally glossy moisture highlights.                                                                                                        |
| `soilClayRed`                    | Red clay-rich earth with fine mineral grain, subtle color mottling, and a dry matte response.                                                                                                 |
| `soilClayBuff`                   | Buff clay-rich earth with fine mineral grain and a dry matte response.                                                                                                                        |
| `soilCompostBlack`               | Very dark brown compost with small organic fiber flecks and high diffuse roughness.                                                                                                           |
| `mulchWoodNatural`               | Natural warm brown; coarse organic wood-fiber appearance with irregular grain and a dry matte response; no chip geometry included.                                                            |
| `mulchWoodDarkBrown`             | Dark brown; coarse organic wood-fiber appearance with irregular grain and a dry matte response; no chip geometry included.                                                                    |
| `mulchWoodBlack`                 | Black; coarse organic wood-fiber appearance with irregular grain and a dry matte response; no chip geometry included.                                                                         |
| `mulchWoodRed`                   | Red; coarse organic wood-fiber appearance with irregular grain and a dry matte response; no chip geometry included.                                                                           |
| `barkPineBrown`                  | Brown pine bark surface with reddish inner tones, fine fibrous fissures, and high roughness; no bark fragments or trunk geometry included.                                                    |
| `barkBirchWhite`                 | White birch bark surface with dark fine lenticel marks, pale papery fiber, and matte reflection; no peeling geometry included.                                                                |
| `barkOakGrayBrown`               | Gray-brown oak bark appearance with fine rough organic grain and diffuse reflection; deep bark forms require separate representation.                                                         |
| `strawDryGold`                   | Dry golden straw fiber surface with fine longitudinal striations and soft waxy highlights; no stalk geometry included.                                                                        |
| `thatchWeatheredBrown`           | Weathered brown reed-fiber appearance with fine longitudinal texture and diffuse reflection; no stalks or roof form included.                                                                 |
| `grassBladeHealthyGreen`         | Healthy green plant tissue with fine longitudinal veins, waxy dielectric highlights, and green diffuse transmission; no blade geometry included.                                              |
| `grassBladeDryStraw`             | Dry straw-colored plant tissue with fine longitudinal fibers, matte reflection, and weak warm transmission; no blade geometry included.                                                       |
| `grassBladeDormantOlive`         | Dormant olive-brown plant tissue with fine longitudinal veins and muted waxy reflection; no blade geometry included.                                                                          |
| `leafDeciduousGreen`             | Medium green leaf tissue with fine branching vein coloration, waxy surface sheen, and green subsurface transmission; no leaf outline included.                                                |
| `leafDeciduousDarkGreen`         | Dark green leaf tissue with fine branching vein coloration, glossy waxy highlights, and reduced green transmission; no leaf outline included.                                                 |
| `leafAutumnYellow`               | Golden yellow leaf tissue with fine vein coloration, low waxy sheen, and warm diffuse transmission; no leaf outline included.                                                                 |
| `leafAutumnRed`                  | Red leaf tissue with fine vein coloration, low waxy sheen, and red-orange diffuse transmission; no leaf outline included.                                                                     |
| `leafEvergreenBlueGreen`         | Blue-green plant tissue with fine longitudinal color variation, waxy satin reflection, and weak transmission; no needle geometry included.                                                    |
| `mossGreen`                      | Soft green organic fiber surface with fine dense microtexture, highly diffuse reflection, and subtle green subsurface scattering; no growth form included.                                    |
| `turfSyntheticGreen`             | Green polymer fiber surface with mixed green and straw-colored filaments and waxy highlights; no grass-fiber geometry included.                                                               |

## Water, frozen water, moisture, and deposited matter

| Material name          | Description / specification                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `waterClear`           | Clear liquid water with smooth dielectric reflection, specular refraction, and weak blue-green volume absorption; motion and surface shape are separate. |
| `waterPoolBlue`        | Clear water with weak blue absorption and low suspended-particle scattering; blue appearance also depends on depth and surrounding materials.            |
| `waterFreshwaterGreen` | Fresh water with mild green absorption and moderate fine-particle volume scattering.                                                                     |
| `waterPondBrown`       | Brown organic-tinted water with increased volume absorption and suspended-particle scattering.                                                           |
| `iceClear`             | Clear frozen water with smooth dielectric reflection, refraction, weak blue absorption, and sparse fine internal bubbles.                                |
| `iceCloudyWhite`       | Milky frozen water with strong bubble-induced volume scattering and a smooth-to-satin surface.                                                           |
| `snowFreshWhite`       | White fine ice grains with strong multiple scattering, sparse sparkling glints, and a soft rough diffuse response.                                       |
| `snowCompactedGray`    | Compacted off-white snow with gray contamination, reduced fine porosity, and occasional wet crystalline highlights.                                      |
| `frostWhite`           | Fine white ice crystals with strong scattering, diffuse reflection, and small crystalline glints; material coverage is assigned separately.              |
| `saltDepositWhite`     | White crystalline salt deposits with chalky granularity and sparse mineral glints; coverage is assigned separately.                                      |
| `efflorescenceWhite`   | Powdery white mineral bloom with fine irregular grains and high diffuse roughness; coverage is assigned separately.                                      |
| `limescaleOffWhite`    | Off-white calcium deposit with dense chalky mineral microtexture and a matte response.                                                                   |
| `sootBlack`            | Black carbonaceous deposit with fine powder texture and very low diffuse reflectance.                                                                    |
| `dustWarmGray`         | Warm gray fine dust with powdery grains, high roughness, and a soft diffuse response.                                                                    |
| `dustBrown`            | Brown fine dust with mineral and organic flecks, high roughness, and a diffuse response.                                                                 |
| `algaeFilmGreen`       | Dark green moist organic film with fine irregular mottling and patchy slimy satin highlights.                                                            |
| `mildewDepositBlack`   | Near-black organic spotting material with fine diffuse texture; coverage is assigned separately.                                                         |
| `rustDepositOrange`    | Orange-brown fine iron-oxide residue with granular texture and high roughness; coverage is assigned separately.                                          |
| `oilFilmAmber`         | Transparent amber oil with smooth glossy reflection, warm volume absorption, and optional thin-film interference at very low thickness.                  |

## Luminous, display, and technical optical materials

Emission entries are material responses. No luminaires, screens, electronics, symbols, or illumination geometry are specified.

| Material name                   | Description / specification                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `emissiveDiffuserWarmWhite`     | Warm white luminous polymer appearance with diffuse emission, milky scattering, and a smooth satin surface; emitted intensity is a scene-calibrated parameter.    |
| `emissiveDiffuserNeutralWhite`  | Neutral white luminous polymer appearance with diffuse emission, milky scattering, and a smooth satin surface; emitted intensity is a scene-calibrated parameter. |
| `emissiveDiffuserCoolWhite`     | Cool white luminous polymer appearance with diffuse emission, milky scattering, and a smooth satin surface; emitted intensity is a scene-calibrated parameter.    |
| `emissiveDiffuserRed`           | Red luminous polymer appearance with diffuse emission, milky scattering, and a smooth satin surface; emitted intensity is a scene-calibrated parameter.           |
| `emissiveDiffuserGreen`         | Green luminous polymer appearance with diffuse emission, milky scattering, and a smooth satin surface; emitted intensity is a scene-calibrated parameter.         |
| `emissiveDiffuserBlue`          | Blue luminous polymer appearance with diffuse emission, milky scattering, and a smooth satin surface; emitted intensity is a scene-calibrated parameter.          |
| `emissiveDiffuserAmber`         | Amber luminous polymer appearance with diffuse emission, milky scattering, and a smooth satin surface; emitted intensity is a scene-calibrated parameter.         |
| `displayGlassBlackOff`          | Near-black absorptive optical glass with smooth glossy reflection, very low transmission, and no emission.                                                        |
| `displaySurfaceNeutralEmissive` | Neutral emissive optical surface with smooth low-gloss reflection; image, color, and emitted intensity are supplied by separate material inputs.                  |
| `displayAntiglareCoating`       | Transparent optical coating with fine forward scattering, broadened surface reflections, and low haze.                                                            |
| `opticalAntireflectionCoating`  | Transparent optical coating with reduced specular reflectance and a very weak angle-dependent residual tint.                                                      |
| `photovoltaicSiliconBlue`       | Dark blue crystalline-silicon appearance with fine crystal mottling, subdued angle-dependent reflection, and negligible transmission; no cell grid included.      |
| `photovoltaicSiliconBlack`      | Near-black silicon appearance with restrained cool specular reflection and negligible transmission; no cell grid included.                                        |
| `phosphorCoatingWarmWhite`      | Pale yellow phosphor-bearing coating that emits warm white light under excitation, with a fine matte non-emitting surface appearance.                             |
| `phosphorCoatingCoolWhite`      | Pale cream phosphor-bearing coating that emits cool white light under excitation, with a fine matte non-emitting surface appearance.                              |

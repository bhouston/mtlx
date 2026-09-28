# Round comparison

This page compares five rounds of AI agents authoring procedural MaterialX materials. Each round used
a better version of the guide, cookbook, and `mtlx` tooling than the one before. Round 5 reran the
round-1 concrete briefs word for word. For the narrative and conclusions, see [REPORT.md](REPORT.md).

## Summary by round

Wall time and tool calls come from the agent harness. Iterations are self-reported edit/render
cycles.

| Round | Subject                         | Agents         | Mean time | Median time | Mean tool calls | Mean iterations |
| ----- | ------------------------------- | -------------- | --------- | ----------- | --------------- | --------------- |
| 1     | Concrete                        | 9 (+1 by hand) | 29.4 min  | 31 min      | 46              | 7.0             |
| 2     | Kitchen backsplash tiling       | 8              | 16.4 min  | 16.5 min    | 35              | 5.5             |
| 3     | Wood flooring                   | 8              | 19.3 min  | 14.5 min    | 41              | 5.9             |
| 4     | Wall panelling                  | 8              | 10.2 min  | 8 min       | 41              | 5.4             |
| 5     | Concrete rerun (round-1 briefs) | 9 (+1)         | 12.2 min  | 12.5 min    | 44              | 8.2             |

What held each round back:

- **Round 1:** no multi-view render, no numeric checks, and no guidance on noise behaviour. Up to 16
  concurrent Chrome renders took 1–3 min each and sometimes timed out.
- **Round 3:** its mean is inflated by three agents who lost 10–20 min to slow shader compiles
  ([renderer bugs 6 and 7](RENDERER_BUGS.md)) before the workaround landed mid-round. The other
  five agents took 8–15 min.
- **Round 4:** six of eight agents finished in 5–9 min. The outlier (barnwood, 26 min) spent 5.4 min
  on one 320 s compile, which led to the graph-size warning in `render`.
- **Round 5:** harder briefs than rounds 2–4 (organic concrete with no layout to lean on), yet each
  one took about 2.4× less time than in round 1.

## Round 1 vs round 5: the same briefs

| Brief             | Time r1 → r5        | Tool calls r1 → r5 | Iterations r1 → r5 | Visual verdict                                                                        |
| ----------------- | ------------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------- |
| board-formed      | 38 → **13** min     | 57 → 42            | 9 → 5              | r5 better: staggered imprints, knot swirls, tie cones                                 |
| broom-finish      | 33 → **9.7** min    | 50 → 30            | 10 → 4             | r5 better: stroke start/stop, overlapping passes, AO in the saw cut                   |
| polished-floor    | 39 → **10** min     | 61 → 39            | 5 → 7              | about equal: r5 has more fractured stones, r1 layered sizes well                      |
| exposed-aggregate | 31 → **17** min     | 55 → 65            | 8 → 15             | mixed: r5 pebbles are rounder and nicer, but packed more sparsely than the brief asks |
| bush-hammered     | 28 → **11.5** min   | 50 → 42            | 8 → 7              | about equal: dense angular chips in both                                              |
| cmu-block         | 32 → **12.5** min   | 38 → 45            | 5 → 9              | about equal: r5 joints read better once AO was added                                  |
| white-precast     | 26 → **11** min     | 40 → 45            | 7 → 9              | about equal: sub-mm grain averages away at closeup in both                            |
| weathered         | 21 → **12.5** min   | 34 → 41            | 6 → 9              | about equal: r5 streaks are cleaner, its erosion patches blotchier                    |
| cracked-slab      | 17 → **13** min     | 30 → 45            | 5 → 9              | r5 better: sparse meandering cracks with tapered ends, not a cell network             |
| **Mean**          | **29.4 → 12.2 min** | **46 → 44**        | **7.0 → 8.2**      |                                                                                       |

**What changed and what didn't.** The number of tool calls and iterations stayed about the same. Each
iteration got much cheaper:

- **Round 1:** one render per view and 1–3 min per render under load. The only checks were visual
  guesses.
- **Round 5:**
  - Several views per call, in 2–20 s.
  - `--channel` numbers for heights, masks, and roughness.
  - `--center` driven by printed min/max UVs.
  - Recipes that worked on the first try.

Agents spent the saved time on extra refinement passes, not on stopping sooner.

### Side by side

Images are in the same order: round 1 plane, round 5 plane, round 1 closeup, round 5 closeup.

| Brief                          | Plane r1                                                                                                                    | Plane r5                                                                                                                       | Closeup r1                                                                                                                    | Closeup r5                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| board-formed                   | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/board-formed/plane.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/board-formed-r5/plane.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/board-formed/closeup.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/board-formed-r5/closeup.avif)      |
| broom-finish                   | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/broom-finish/plane.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/broom-finish-r5/plane.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/broom-finish/closeup.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/broom-finish-r5/closeup.avif)      |
| polished-floor                 | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/polished-floor/plane.avif)    | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/polished-floor-r5/plane.avif)    | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/polished-floor/closeup.avif)    | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/polished-floor-r5/closeup.avif)    |
| exposed-aggregate              | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/exposed-aggregate/plane.avif) | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/exposed-aggregate-r5/plane.avif) | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/exposed-aggregate/closeup.avif) | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/exposed-aggregate-r5/closeup.avif) |
| bush-hammered                  | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/bush-hammered/plane.avif)     | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/bush-hammered-r5/plane.avif)     | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/bush-hammered/closeup.avif)     | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/bush-hammered-r5/closeup.avif)     |
| cmu-block                      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/cmu-block/plane.avif)         | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/cmu-block-r5/plane.avif)         | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/cmu-block/closeup.avif)         | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/cmu-block-r5/closeup.avif)         |
| white-precast                  | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/white-precast/plane.avif)     | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/white-precast-r5/plane.avif)     | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/white-precast/closeup.avif)     | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/white-precast-r5/closeup.avif)     |
| weathered                      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/weathered/plane.avif)         | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/weathered-r5/plane.avif)         | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/weathered/closeup.avif)         | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/weathered-r5/closeup.avif)         |
| cracked-slab                   | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/cracked-slab/plane.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/cracked-slab-r5/plane.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/cracked-slab/closeup.avif)      | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/cracked-slab-r5/closeup.avif)      |
| smooth-cast (r1 built by hand) | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/smooth-cast/plane.avif)       | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/smooth-cast-r5/plane.avif)       | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/smooth-cast/closeup.avif)       | ![](https://raw.githubusercontent.com/bhouston/mtlx-sample-library/main/materials/ai_authored/smooth-cast-r5/closeup.avif)       |

## Every agent, every round

| Round | Material            | Wall time | Tool calls | Iterations | Render calls | Main time sink                                           |
| ----- | ------------------- | --------- | ---------- | ---------- | ------------ | -------------------------------------------------------- |
| 1     | cracked-slab        | 17 min    | 30         | 5          | –            | slow renders under load                                  |
| 1     | weathered           | 21 min    | 34         | 6          | –            | slow renders                                             |
| 1     | white-precast       | 26 min    | 40         | 7          | –            | shared scratchpad collision, slow renders                |
| 1     | bush-hammered       | 28 min    | 50         | 8          | –            | slow renders, reading three.js source for worley `style` |
| 1     | exposed-aggregate   | 31 min    | 55         | 8          | –            | per-stone ids (undocumented), slow renders               |
| 1     | cmu-block           | 32 min    | 38         | 5          | –            | scratchpad collision, no pan or center                   |
| 1     | broom-finish        | 33 min    | 50         | 10         | –            | slow renders, no channel view                            |
| 1     | board-formed        | 38 min    | 57         | 9          | –            | no pan or center, moiré                                  |
| 1     | polished-floor      | 39 min    | 61         | 5          | –            | 60–100 s renders, gloss invisible on the plane           |
| 2     | encaustic-cement    | 11 min    | 20         | 3          | 6            | –                                                        |
| 2     | penny-round         | 13 min    | 31         | 4          | 11           | hex lattice by hand                                      |
| 2     | hex-marble-mosaic   | 15 min    | 30         | 5          | 14           | neutral IBL cast (then fixed)                            |
| 2     | zellige             | 16 min    | 31         | 4          | 14           | `--channel` low-value error (then fixed)                 |
| 2     | herringbone-marble  | 17 min    | 33         | 6          | 14           | deriving the herringbone lattice                         |
| 2     | crackle-glaze       | 19 min    | 50         | ~10        | 18           | breaking up the Voronoi look                             |
| 2     | subway-gloss        | 19 min    | 39         | 5          | 24           | diagnosing two tool issues                               |
| 2     | fish-scale          | 21 min    | 45         | 7          | ~30          | exact scallop geometry                                   |
| 3     | maple-strip         | 8 min     | 23         | 3          | 10           | –                                                        |
| 3     | chevron-oak         | 11 min    | 28         | 3          | 13           | cookbook too big to read in one pass                     |
| 3     | end-grain-block     | 13 min    | 27         | 5          | 8            | –                                                        |
| 3     | basketweave-parquet | 14 min    | 34         | 6          | 17           | no wood-grain recipe                                     |
| 3     | hickory-handscraped | 15 min    | 34         | 4          | 12           | multi-meter layout check                                 |
| 3     | walnut-herringbone  | 28 min    | 75         | 6          | ~28          | slow compile (bug 6)                                     |
| 3     | reclaimed-pine      | 29 min    | 55         | 10         | ~26          | GPU errors, painterly wood                               |
| 3     | oak-plank           | 36 min    | 53         | 10         | 25           | slow compiles (bugs 6/7)                                 |
| 4     | acoustic-slat       | 5.4 min   | 28         | 4          | 10           | –                                                        |
| 4     | fluted-walnut       | 6 min     | 36         | 3          | 15           | –                                                        |
| 4     | shaker-panel        | 6 min     | 37         | 5          | 14           | –                                                        |
| 4     | beadboard           | 8 min     | 41         | 4          | 17           | –                                                        |
| 4     | bookmatched-veneer  | 8 min     | 40         | 4          | 15           | symmetry check by hand (now `--mirror`)                  |
| 4     | board-batten        | 9 min     | 38         | 4          | 16           | `smax` ghost mask                                        |
| 4     | shiplap-whitewash   | 13 min    | 42         | 8          | 17           | slow `--channel` compile (then fixed)                    |
| 4     | barnwood-wall       | 26 min    | 68         | ~11        | 29           | one 320 s compile (bug 7)                                |
| 5     | smooth-cast         | 7.5 min   | 33         | ~7         | 14           | –                                                        |
| 5     | broom-finish        | 9.7 min   | 30         | 4          | 19           | 3 stale renders (`;` instead of `&&`)                    |
| 5     | polished-floor      | 10 min    | 39         | 7          | 16           | grinder swirls                                           |
| 5     | white-precast       | 11 min    | 45         | 9          | 21           | making sub-mm sand read as stone                         |
| 5     | bush-hammered       | 11.5 min  | 42         | 7          | 18           | worley F2 seams at high jitter                           |
| 5     | cmu-block           | 12.5 min  | 45         | 9          | 16           | recessed joints reading as raised                        |
| 5     | weathered           | 12.5 min  | 41         | 9          | 18           | streak and spall shapes                                  |
| 5     | cracked-slab        | 13 min    | 45         | 9          | 22           | uniform crack network, no sparse-crack recipe            |
| 5     | board-formed        | 13 min    | 42         | 5          | 20           | knot density on long boards                              |
| 5     | exposed-aggregate   | 17 min    | 65         | 15         | ~29          | faceted pebbles from the domed-pebble recipe             |

## Galleries

Every material with its screenshots is in [README.md](README.md), with one section per round.

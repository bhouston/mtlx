# Model-viewer lighting and API comparison

Research and implementation: November 6, 2026.

## Default presentation

Google model-viewer defaults to its generated `neutral` environment when neither an environment
image nor a skybox is supplied. The environment lights the model without becoming its backdrop.
The renderer clears transparently; the embedding page controls the visible background. Our
material-viewer now defaults to a white backdrop, with independent `environment` and `none`
background choices.

The [neutral room source](https://github.com/google/model-viewer/blob/734aff3858aa208cf59561ec9939942ef4acfe5a/packages/model-viewer/src/three-components/EnvironmentScene.ts)
contains a white inward-facing room, six white boxes, a white point light, and seven bright
unlit light-panel meshes. The scene is offset downward by 3.5 units. Panel RGB values reach 80;
encoding this room as an ordinary 8-bit PNG clips the highlights that make reflections useful.

Model-viewer's [texture generation](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/TextureUtils.ts)
captures 256-pixel cube faces into half-float, linear-sRGB targets with tone mapping disabled,
then applies a 0.04-radian blur. It caches the generated environment. Its
[environment feature](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/features/environment.ts)
uses Neutral tone mapping and exposure 1 by default.

Our replacement adapts Google's neutral room verbatim apart from the Three.js WebGPU import,
removal of the unused legacy room, and an ownership wrapper. Copyright and Apache 2.0 terms
are retained in `packages/viewer/src/neutralEnvironment.ts` and `LICENSE.model-viewer`.
The layout, light intensities, offset, near/far planes, cube resolution, and blur sigma match.
Three.js's WebGPU PMREM generator captures and filters the scene directly into a half-float
CubeUV target. Google instead captures a cubemap and runs its own separable blur before its
renderer's environment filtering. This is a close reproduction of the lighting, rather than a
claim of pixel-identical output across those different render pipelines.

Our existing Neutral tone mapper, intensity 1, and exposure 0 EV (a multiplier of 1) are retained.
Existing AO and bloom settings remain available; they are additional differences from Google's
base presentation. White is applied behind the transparent canvas using CSS, so exposure and
tone mapping cannot turn the backdrop gray. `none` uses the host's background and keeps alpha
for exports; `environment` displays the filtered IBL. Changing the backdrop never reloads lighting.

The generated studio is cached per viewer/renderer and disposed with it. Switching to bridge or
a custom file and back reuses the studio target. The default no longer fetches the roughly 6 MB
bridge HDR or the 171 KB studio PNG. It still downloads the viewer code, material resources,
and shaderball. This saves network transfer; startup still includes GPU capture/filtering, so a
specific loading-time improvement needs measurement on target devices. The old studio PNG and
baking scripts are removed. `ibl="studio"` keeps working with the new generated lighting.
CLI exports keep their established transparent-background defaults.

## API opportunities

These are recommendations, not additional API changes in the lighting patch. The existing
progress work is separate. Features below come from Google's
[API reference source](https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/data/docs.json).
Priorities reflect material-viewer's current capabilities and material inspection needs.

| Priority | Model-viewer feature                                                            | Material-viewer opportunity                                                                                                                                                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | `poster`, `loading="lazy"`, `reveal`, visibility reporting                      | Show a material thumbnail immediately and defer renderer initialization and asset downloads until near the viewport. Pause offscreen viewers. Especially useful for material catalogs containing many embeds. See [loading examples](https://modelviewer.dev/examples/loading/).                                                                                                      |
| High     | `camera-orbit`, `camera-target`, `field-of-view`, orbit limits, `camera-change` | Expose stable camera framing through custom-element attributes and share URLs. The low-level viewer already exposes its camera and controls, and the extension persists camera state; the embed API lacks equivalent controls. Add reset framing and camera events for synchronized material comparisons. See [camera examples](https://modelviewer.dev/examples/stagingandcameras/). |
| High     | `alt`, interaction prompts, `touch-action`, zoom/pan controls                   | Add host-supplied accessible material descriptions and predictable touch behavior in scrolling pages. Our canvas currently has a generic accessibility label. Keep keyboard navigation and reduced-motion handling.                                                                                                                                                                   |
| High     | `environment-image` distinct from `skybox-image`, plus `environment-change`     | This patch separates the backdrop from IBL. A future alias to `environment-image` would make migration familiar; add an environment-ready/change event and rotation controls for examining roughness and anisotropy without moving the camera. Preserve `ibl` compatibility.                                                                                                          |
| Medium   | `toBlob()` and `toDataURL()`                                                    | Offer a public capture API that waits for textures and a completed render, with size and background options. The CLI already renders snapshots; the custom element should support a predictable equivalent for sharing and comparisons.                                                                                                                                               |
| Medium   | `loaded`, `model-visibility`, `camera-change`, structured error details         | Improve integration state without requiring hosts to infer it from DOM or string logs. We already have load/error/progress events and richer low-level reports; expose consistent read-only state and structured error categories while preserving existing string errors.                                                                                                            |
| Medium   | `auto-rotate-delay`, `rotation-per-second`, `interaction-prompt`                | Give embeds control over rotation speed and resumption after inspection. Current rotation is largely a boolean. Preserve reduced-motion behavior and pause while users inspect details.                                                                                                                                                                                               |
| Later    | `minimumRenderScale`, `render-scale`                                            | Consider adaptive resolution for heavy materials, restoring full resolution when still. Make quality changes observable and allow disabling them for judging fine normal/roughness detail. Profile first.                                                                                                                                                                             |
| Later    | `materialFromPoint()`, `positionAndNormalFromPoint()`, hotspots                 | Connect picking to the existing material/node inspector and annotate material examples. Useful once custom preview models contain multiple meaningful regions. See [scene examples](https://modelviewer.dev/examples/scenegraph/).                                                                                                                                                    |

The next additions I would implement are poster/lazy loading and declarative camera framing.
They improve both embedding performance and the ability to compare materials consistently.
Broad glTF material editing overlaps our existing MaterialX editor; AR/USDZ export would require
a separate material-conversion project and is a lower priority for this viewer.

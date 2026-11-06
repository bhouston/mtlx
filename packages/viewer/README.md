# mtlx-viewer

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/bhouston/mtlx/branch/main/graph/badge.svg)](https://codecov.io/gh/bhouston/mtlx)
[![Discord](https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/wzQWaBBxup)

Part of the [Mtlx suite of web-focused MaterialX tools](https://mtlx.ben3d.ca).
Provides three.js MaterialX scenes and IBL environment assets used by the website, CLI preview, and VS Code
extension. Callers own the rendering lifecycle, with optional shared helpers for renderer setup and cleanup.
Preview support follows three.js's MaterialX loader; it is not a full reference MaterialX renderer.

```sh
npm install mtlx-viewer three
```

## Custom element errors

`<material-viewer>` shows loading, parsing, initialization and rendering failures in a translucent overlay at the top-left, above its controls. The overlay includes the error message, source and available cause details, a dismiss button, and **Copy to clipboard**. Starting another load clears the previous error.

Omit `errors` to show errors (the default). Set `errors="silent"` to hide the overlay while preserving the existing `error` events, whose `event.detail` is the message string:

```html
<material-viewer src="/materials/example.mtlx" errors="silent"></material-viewer>
```

Changing `errors` applies immediately without reloading. Removing it reveals the current error unless dismissed or cleared.

## Automatic loading progress

Both `<material-viewer>` and React `MaterialViewer` show a top progress bar automatically.
It covers material and shaderball downloads, renderer initialization, environment processing,
MaterialX parsing, referenced textures, custom geometry, and the first render. Environment,
geometry, and material changes start another loading cycle. Errors, source removal, and
unmounting clear the bar. Texture failures remain available in preview diagnostics.

The presentation and customization follow [Google model-viewer](https://modelviewer.dev/docs/#entrydocs-loading-slots-progressBar):
a 5px bar fills left to right, waits one second at completion, then fades over 300ms.
No enable attribute is needed. Change its color or height with CSS variables, or style the
custom element's `default-progress-bar` part (avoid changing `transform`, which drives progress):

```css
material-viewer {
  --progress-bar-color: #4285f4;
  --progress-bar-height: 3px;
}
material-viewer::part(default-progress-bar) {
  border-radius: 2px;
}
```

Disable the bar with an empty replacement slot, exactly as in model-viewer:

```html
<material-viewer src="/materials/example.mtlx.zip">
  <span slot="progress-bar"></span>
</material-viewer>
```

Or hide only the default fill with `material-viewer::part(default-progress-bar) { display: none; }`.
There is no dedicated disable attribute. Disabling the visual does not stop progress events.
The React wrapper supports the same slot via children:

```tsx
import { MaterialViewer } from 'mtlx-viewer/react';

<MaterialViewer src="/materials/example.mtlx.zip" style={{ width: 512, height: 512 }}>
  <span slot="progress-bar" />
</MaterialViewer>;
```

For custom UI, supply content in `slot="progress-bar"` and update it using `progress` events
(React: `onProgress`). `detail.totalProgress` is the overall fraction from 0 to 1;
`detail.reason` is `material-load`, `environment-update`, or `geometry-update`.
The slot replaces the default bar; you control your replacement's appearance and visibility.
The host's `aria-busy` attribute tracks the loading cycle even with a replacement slot.

```js
viewer.addEventListener('progress', ({ detail }) => {
  customBar.hidden = detail.totalProgress === 1;
  customBar.value = detail.totalProgress; // <progress max="1" slot="progress-bar">
});
viewer.addEventListener('error', () => {
  customBar.hidden = true;
});
```

Overall progress is a monotonic estimate of completed activities, not an elapsed-time prediction.
Known material download sizes use byte progress; processing uses actual milestones and resource
counts. No timer advances the overall percentage. A slow operation can hold the value steady;
completion waits for pending resources and the render using them.

The existing `loaded`, `total`, and `progress` fields still describe **only the material file
download**, independently of `totalProgress`. Before headers arrive, these are `0`, `null`,
and `null`. Download updates are sampled every 250ms and on completion; other loading work
also emits events. Unknown or compressed Content-Length keeps `total` and `progress` null
until download completion. A download can reach `progress: 1` while `totalProgress < 1`.
Use the `load` event / React `onLoad` for initial preview readiness, not download completion.
Changing/removing `src` or unmounting cancels obsolete work and notifications. Attach listeners
before assigning `src` to receive the initial event. `createViewer({ onProgress })` provides
the same overall progress for hosts managing their own UI.

## Camera framing and sharing

`camera-orbit="30deg 65deg 2m"` sets azimuth, polar angle measured from +Y, and distance from
the target. `camera-target="0m 0m 0m"` selects the aim point. `field-of-view="35deg"` sets the
vertical field of view. The React wrapper accepts the same hyphenated props; `createViewer`
settings use `cameraOrbit`, `cameraTarget`, and `fieldOfView` (numeric degrees). All geometry
is normalized to a one-meter cube, so these distances are normalized scene meters, not source
mesh dimensions. Bare numbers use the same units. CSS expressions, percentages and `auto`
components are not accepted.

Orbit polar angles must be 0.01..179.99 degrees, distance 0.01..1000 meters, target components
-1000..1000 meters, and field of view 1..120 degrees. Invalid attributes/query values are ignored.
Without camera options, the viewer automatically frames the geometry as before. Explicit camera
options update in place; resizing preserves their absolute distance and the user's current orbit/pan.
Removing all options restores automatic framing. Camera changes leave the material and renderer intact.

`viewer.getCameraSettings()` captures the current camera, including orbit, pan and perspective
zoom. The custom element returns the same object (or `null` before loading) and dispatches
`camera-change` with that object as `event.detail`. React and low-level viewers expose
`onCameraChange`. The website's Share menu captures this live framing in viewer links, embed
links and iframe code, rather than copying only the initial camera attributes. URL search
parameters use the camelCase names. For example:

```html
<material-viewer
  src="material.mtlx"
  camera-orbit="30deg 65deg 2m"
  camera-target="0m 0.1m 0m"
  field-of-view="35deg"
></material-viewer>
```

## Scene

`createMtlxScene` parses a `.mtlx` / `.mtlx.zip` file and builds a swappable preview scene: a
shaderball/sphere/cube/plane wearing the material, ready to add to your own `THREE.Scene`. Callers own
the renderer, camera, controls, and animation loop. The scene owns MaterialX parsing and its
preview geometry, materials, and textures.

```ts
import { createMtlxScene, type MtlxScene } from 'mtlx-viewer';

// The built-in shaderball is served from mtlx-static.ben3d.ca, not shipped in the package.
const shaderBallUrl = 'https://mtlx-static.ben3d.ca/viewer/shaderball.glb';

const preview: MtlxScene = await createMtlxScene(camera, controls, {
  data: mtlxBytes, // ArrayBuffer of the .mtlx or .mtlx.zip
  fileName: 'material.mtlx', // used for resource-path resolution and archive sniffing
  shaderBall: await (await fetch(shaderBallUrl)).arrayBuffer(),
  // optional:
  materialName: 'Wood_Oak', // defaults to the document's last material
  geometry: 'sphere', // 'totem' | 'sphere' | 'cube' | 'plane', defaults to 'totem'
  autoRotate: true, // defaults to true
  manager: myLoadingManager, // supply your own for setURLModifier/onProgress/onError
});

threeScene.add(preview.root);

// each frame:
preview.update(deltaSeconds);

// switch materials/geometry without reparsing:
const otherMaterial = preview.materialNames[1];
if (otherMaterial) preview.setMaterial(otherMaterial);
preview.setGeometry('plane');
preview.autoRotate = false;
preview.resetCamera(); // Restore the object's orientation, camera position, target, and zoom.

// Before replacing the preview or removing its host:
threeScene.remove(preview.root);
preview.dispose();
```

`MtlxScene` also exposes `materialNames: string[]`, `activeMaterial: string`,
`geometry: GeometryKind`, and `autoRotate: boolean` for driving your own UI.

`preview.dispose()` releases the loaded geometries, materials, and their textures. The caller
still disposes its renderer, controls, environments/PMREM targets, animation loop, and any blob URLs
it created. If an asynchronous load completes after cancellation, dispose the returned preview
immediately instead of attaching it to an abandoned scene.

The `?url` imports above assume a bundler such as Vite. Other integrations should serve the exported
assets themselves and pass fetched bytes. The snippets assume the caller has created `camera`,
`controls`, `threeScene`, and its animation loop. Loose materials also need a loading manager able
to resolve referenced textures; packaged `.mtlx.zip` inputs can contain those resources.

Additional glTF/GLB geometry can be loaded without rebuilding the material scene:

```ts
await preview.addGeometry('bust', gltfBytes, geometryLoadingManager);
preview.setGeometry('bust');
```

Names must match `[a-zA-Z_][a-zA-Z0-9_]*` and cannot duplicate existing geometry names. The optional
loading manager resolves glTF sidecars. The preview owns the added geometries, their original
materials/textures, and their Reset orientations. `preview.dispose()` releases them too.

## Environments

The default `studio` is generated on the GPU from Google model-viewer's neutral room, preserving
HDR light-panel intensities. It downloads no environment image and reuses its filtered target
when switching away and back. `bridge` remains an optional photographic HDR; custom HDR, EXR,
PNG and JPEG environments still use `loadEnvironment` and `parseEnvironmentFile`.

`background` is independent of the lighting: `white` (default) is a CSS white backdrop behind a
transparent canvas, `environment` displays the active IBL, and `none` leaves the canvas transparent
for the host page or image exports. White stays white when exposure or tone mapping changes.
The CLI's render exports retain their existing transparent-background default.

The old 8-bit studio PNG and its bake scripts have been removed. Existing `ibl="studio"` embeds
now use the generated HDR room. The room layout is adapted under Apache 2.0; see
[LICENSE.model-viewer](LICENSE.model-viewer). Details and API recommendations are in
[the model-viewer comparison](../../docs/model-viewer-comparison.md).

## Shared host utilities

Both the website and VS Code extension use these framework-independent modules:

- `mtlx-viewer/diagnostics`: `computeChecks`, `summarizeInternalNodes`, and `formatFileSize` produce common inspection results without DOM or React dependencies.
- `mtlx-viewer/settings`: `parseViewerSettings` validates rendering, lighting, rotation, material, and asset selections. Hosts can supply allowed custom IBL and geometry names. Persistence remains host-specific: website query parameters or VS Code webview state.
- `mtlx-viewer/lifecycle`: `CleanupScope` releases resources in reverse ownership order, exactly once, including resources registered after disposal.
- The main entry exports `createViewerRenderer`, `observeViewerResize`, and `applyViewerRenderingSettings`. These helpers share renderer initialization, pixel-ratio limits, resize handling, EV exposure, and lighting settings. Hosts retain their canvas sizing policy and animation loop.

The website's query adapter supports the built-in environments and geometries. The extension's
state adapter also supports configured assets and preserves its existing storage keys and saved camera.
Its configuration determines initial rotation; reduced-motion preferences take precedence.

## Inspection capabilities

<!-- test:capabilities -->

```ts
import { supportedMaterialXCategories } from 'mtlx-viewer/capabilities';

if (!supportedMaterialXCategories.includes('standard_surface')) throw new Error('Missing renderer capability');
```

`parseEnvironmentFile(bytes, sourceName)` loads additional equirectangular HDR, EXR, PNG and JPEG
assets. `createEnvironmentSwitcher` also accepts custom names supplied by its host loader.

The capability subpath is lightweight and can be imported in a host or worker without loading
three.js. A test compares it to the installed three.js registries so upgrades cannot silently
leave the inventory stale. Categories do not guarantee every input/type combination will render.

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).

## React UI

`mtlx-viewer/react` ships the React + Tailwind CSS components shared by the website and the VS Code
extension webview: `ViewerSettingsPanel` (collapsible geometry/IBL/background/tone-mapping/bloom/AO/exposure
controls), `MaterialSelect`, `InfoPanel`, `ValidityChecks`, `LogPanel`, plus the shadcn/ui primitives
they build on (`Button`, `Card`, `Select`, `Switch`, `Slider`, …) and the `cn` class helper. React is an
optional peer dependency; the rest of the package works without it.

Import the theme from your Tailwind v4 entry stylesheet, then override the `:root` tokens to re-theme:

```css
@import 'tailwindcss';
@import 'mtlx-viewer/styles/viewer.css';
```

```tsx
import { InfoPanel, ViewerSettingsPanel } from 'mtlx-viewer/react';
```

## Rendering effects

After initializing a `WebGPURenderer`, use `createViewerRendering(renderer, scene, camera)` and
call its `render()` instead of rendering the scene directly. Its `configure({ bloom, ao, toneMapping })`
method updates effects without rebuilding the material scene. Call `dispose()` before disposing the renderer.
`DEFAULT_RENDERING_SETTINGS` and `TONE_MAPPING_OPTIONS` are also available through `mtlx-viewer/settings`
without importing Three.js.

Bloom and AO default on; tone mapping defaults to `neutral`. AO uses full-resolution, 32-sample GTAO
with depth/normal-aware denoising and applies to indirect lighting through Three.js's AO context.
Transparent surfaces are excluded from the AO pre-pass. Bloom runs in HDR before output tone mapping
and color conversion. Disabled effects are omitted from the render graph. The passes resize with the
renderer and release their render targets on disposal. This pipeline supports WebGPU and its WebGL2 fallback.

The built-in totem starts 45° toward the front right. Auto-rotation takes 40 seconds per turn.

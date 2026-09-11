# mtlx-viewer

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [Mtlx suite of web-focused MaterialX tools](https://mtlx.ben3d.ca).
Provides three.js MaterialX scenes and IBL environment assets used by the website, CLI preview, and VS Code
extension. Callers own the rendering lifecycle, with optional shared helpers for renderer setup and cleanup.
Preview support follows three.js's MaterialX loader; it is not a full reference MaterialX renderer.

```sh
npm install mtlx-viewer three
```

## Scene

`createMtlxScene` parses a `.mtlx` / `.mtlx.zip` file and builds a swappable preview scene: a
shaderball/sphere/plane wearing the material, ready to add to your own `THREE.Scene`. Callers own
the renderer, camera, controls, and animation loop. The scene owns MaterialX parsing and its
preview geometry, materials, and textures.

```ts
import { createMtlxScene, type MtlxScene } from 'mtlx-viewer';
import shaderBallUrl from 'mtlx-viewer/assets/shaderball.glb?url';

const preview: MtlxScene = await createMtlxScene(camera, controls, {
  data: mtlxBytes, // ArrayBuffer of the .mtlx or .mtlx.zip
  fileName: 'material.mtlx', // used for resource-path resolution and archive sniffing
  shaderBall: await (await fetch(shaderBallUrl)).arrayBuffer(),
  // optional:
  materialName: 'Wood_Oak', // defaults to the document's last material
  geometry: 'sphere', // 'totem' | 'sphere' | 'plane', defaults to 'totem'
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

The studio and bridge IBL environments used by the preview scene are exposed separately in case
you want to build your own lighting rig.

```ts
import { ENVIRONMENT_ASSET_FILES, parseEnvironment, type EnvironmentKind } from 'mtlx-viewer';
import studioEnvironmentUrl from 'mtlx-viewer/assets/studio-environment.png?url';

const kind: EnvironmentKind = 'studio'; // 'default' is San Giuseppe Bridge (the three-ntc website IBL)
const texture = await parseEnvironment(kind, await (await fetch(studioEnvironmentUrl)).arrayBuffer());
threeScene.environment = texture;
// Clear the environment and dispose its texture when the caller no longer needs it.
// threeScene.environment = null;
// texture.dispose();

// ENVIRONMENT_ASSET_FILES maps each kind to its asset file name under mtlx-viewer/assets.
```

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

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)

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

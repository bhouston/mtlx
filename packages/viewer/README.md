# mtlx-viewer

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

The shared browser preview layer of the [mtlx](https://github.com/bhouston/mtlx) suite:
three.js MaterialX scenes and IBL environment assets used by the website, CLI preview, and VS Code
extension. The caller supplies a compatible three.js renderer and owns its rendering lifecycle.
Preview support follows three.js's MaterialX loader; it is not a full reference MaterialX renderer.

```sh
npm install mtlx-viewer three
```

## Scene

`createMtlxScene` parses a `.mtlx` / `.mtlx.zip` file and builds a swappable preview scene: a
shaderball/sphere/plane wearing the material, ready to add to your own `THREE.Scene`. Callers own
the renderer, camera, controls, and animation loop; this package only owns the
MaterialX-to-three.js parsing and the shared preview geometry/environments.

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

## Inspection controls and capabilities

The bridge is the initial environment in both hosts. The website and VS Code hosts provide pause/resume rotation, reduced-motion support, Reset,
fullscreen, exposure, and environment intensity controls. The bottom IBL dropdown selects Studio
or San Giuseppe Bridge, using the same HDR asset as the three-ntc website. Switching IBLs retains
the camera, geometry, material and exposure; superseded environment loads are disposed. Hosts should pass `autoRotate: false`
when the user's reduced-motion preference is active. Reset retains material, geometry, and
lighting choices. The renderer and its `THREE.Scene` own exposure and environment intensity.

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

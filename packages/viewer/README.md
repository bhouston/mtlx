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

## Environments

The studio and default IBL environments used by the preview scene are exposed separately in case
you want to build your own lighting rig.

```ts
import { ENVIRONMENT_ASSET_FILES, parseEnvironment, type EnvironmentKind } from 'mtlx-viewer';
import studioEnvironmentUrl from 'mtlx-viewer/assets/studio-environment.png?url';

const kind: EnvironmentKind = 'studio'; // or 'default'
const texture = await parseEnvironment(kind, await (await fetch(studioEnvironmentUrl)).arrayBuffer());
threeScene.environment = texture;
// Clear the environment and dispose its texture when the caller no longer needs it.
// threeScene.environment = null;
// texture.dispose();

// ENVIRONMENT_ASSET_FILES maps each kind to its asset file name under mtlx-viewer/assets.
```

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)

# mtlx-viewer

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [mtlx](https://github.com/bhouston/mtlx) suite: a pure TypeScript/JavaScript
MaterialX toolkit with no binary dependencies, working out of the box on Node, browsers, Windows,
macOS, and Linux. This package holds the shared three.js MaterialX preview scene and IBL
(image-based lighting) environment assets, used by both the [mtlx.ben3d.ca](https://mtlx.ben3d.ca)
website and the VS Code extension so neither reimplements this from scratch.

- Library: [mtlx-core on npm](https://www.npmjs.com/package/mtlx-core)
- Source: [github.com/bhouston/mtlx](https://github.com/bhouston/mtlx)

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

const scene: MtlxScene = await createMtlxScene(camera, controls, {
  data: mtlxBytes, // ArrayBuffer of the .mtlx or .mtlx.zip
  fileName: 'material.mtlx', // used for resource-path resolution and archive sniffing
  shaderBall: await (await fetch(shaderBallUrl)).arrayBuffer(),
  // optional:
  materialName: 'Wood_Oak', // defaults to the document's last material
  geometry: 'sphere', // 'totem' | 'sphere' | 'plane', defaults to 'totem'
  autoRotate: true, // defaults to true
  manager: myLoadingManager, // supply your own for setURLModifier/onProgress/onError
});

threeScene.add(scene.root);

// each frame:
scene.update(deltaSeconds);

// switch materials/geometry without reparsing:
scene.setMaterial(scene.materialNames[1]!);
scene.setGeometry('plane');
```

`MtlxScene` also exposes `materialNames: string[]`, `activeMaterial: string`,
`geometry: GeometryKind`, and `autoRotate: boolean` for driving your own UI.

## Environments

The studio and default IBL environments used by the preview scene are exposed separately in case
you want to build your own lighting rig.

```ts
import { ENVIRONMENT_ASSET_FILES, parseEnvironment, type EnvironmentKind } from 'mtlx-viewer';
import studioEnvironmentUrl from 'mtlx-viewer/assets/studio-environment.png?url';

const kind: EnvironmentKind = 'studio'; // or 'default'
const texture = await parseEnvironment(kind, await (await fetch(studioEnvironmentUrl)).arrayBuffer());
scene.environment = texture;

// ENVIRONMENT_ASSET_FILES maps each kind to its asset file name under mtlx-viewer/assets.
```

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)

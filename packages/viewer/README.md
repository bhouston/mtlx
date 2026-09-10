# mtlx-viewer

Part of the [mtlx](https://github.com/bhouston/mtlx) suite: a pure TypeScript/JavaScript
MaterialX toolkit with no binary dependencies, working out of the box on Node, browsers, Windows,
macOS, and Linux. This package holds the shared three.js MaterialX preview scene and IBL
(image-based lighting) environment assets, used by both the [mtlx.ben3d.ca](https://mtlx.ben3d.ca)
website and the VS Code extension so neither reimplements this from scratch.

- Documentation: [mtlx.ben3d.ca/docs](https://mtlx.ben3d.ca/docs/)
- Source: [github.com/bhouston/mtlx](https://github.com/bhouston/mtlx)

```ts
import { createMtlxScene, parseStudioEnvironment, type MtlxScene } from 'mtlx-viewer';
import studioEnvironmentUrl from 'mtlx-viewer/assets/studio-environment.png?url';
import shaderBallUrl from 'mtlx-viewer/assets/shaderball.glb?url';

const scene = await createMtlxScene(camera, controls, {
  data: mtlxBytes,
  fileName: 'material.mtlx',
  shaderBall: await (await fetch(shaderBallUrl)).arrayBuffer(),
});
threeScene.add(scene.root);

// each frame:
scene.update(deltaSeconds);
```

Callers own the renderer, camera, controls, and animation loop; this package only owns the
MaterialX-to-three.js parsing and the shared preview geometry/environments.

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)

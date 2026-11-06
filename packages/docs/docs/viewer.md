---
title: Viewer and React
---

Use [`<material-viewer>`](material-viewer.mdx) for a preview in plain HTML or any framework. This guide covers React and custom Three.js integration.

## React

```sh
npm install mtlx-viewer three react react-dom
```

```tsx
import { MaterialViewer } from 'mtlx-viewer/react';

<MaterialViewer
  src="/materials/copper.mtlx.zip"
  alt="Polished copper material"
  settings-panel="closed"
  style={{ height: 500 }}
  onLoad={() => console.log('Material ready')}
  onError={(message) => console.error(message)}
/>;
```

The wrapper accepts the same attributes as the custom element, including hyphenated names such as `camera-orbit` and `environment-rotation`. It registers the element in the browser and is safe to import during server rendering. See the [element reference](material-viewer.mdx#attributes) for supported attributes.

Use `onLoad`, `onError`, `onProgress`, and `onCameraChange` to connect your application's UI. `onProgress` receives `totalProgress` from 0 to 1; use `onLoad` for initial preview readiness. Give `alt` a description of the material's appearance.

### Screenshot export

```tsx
import { useRef } from 'react';
import { MaterialViewer, type MaterialViewerElement } from 'mtlx-viewer/react';

function Preview() {
  const viewer = useRef<MaterialViewerElement>(null);
  return (
    <>
      <MaterialViewer ref={viewer} src="/materials/copper.mtlx.zip" style={{ height: 500 }} />
      <button
        onClick={async () => {
          const blob = await viewer.current?.toBlob({ width: 1200, background: 'none' });
          // Save or upload the returned image Blob.
        }}
      >
        Capture image
      </button>
    </>
  );
}
```

See [screenshot options](material-viewer.mdx#screenshot-export) for image formats and sizing.

## Settings and supporting UI

`mtlx-viewer/settings` exports `parseViewerSettings` for validating settings and `DEFAULT_RENDERING_SETTINGS` for defaults. Lighting and backgrounds are independent: `studio` gives neutral lighting, `bridge` uses a photographic environment, and custom environments accept HDR, EXR, PNG, or JPEG URLs. Choose `white`, `environment`, or `none` for the background.

The custom element and React wrapper include their own settings panel. For a custom React interface, `mtlx-viewer/react` also exports `ViewerSettingsPanel`, `MaterialSelect`, `InfoPanel`, `ValidityChecks`, and `LogPanel`. Style these supporting components with Tailwind v4:

```css
@import 'tailwindcss';
@import 'mtlx-viewer/styles/viewer.css';
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

Serve any additional assets from your application and pass fetched bytes. The snippets assume the caller has created `camera`,
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

## Rendering and cleanup

For a scene you render yourself, call `createViewerRendering(renderer, scene, camera)` after initializing a Three.js `WebGPURenderer`. Use its `render()` method for bloom, ambient occlusion, and tone mapping. Update effects with `configure({ bloom, ao, toneMapping })`, then call `dispose()` when removing the viewer.

Dispose previews, controls, environments, and the renderer when their owning component unmounts. If an asynchronous load finishes after cancellation, dispose its result.

## Inspection capabilities

<!-- test:capabilities -->

```ts
import { supportedMaterialXCategories } from 'mtlx-viewer/capabilities';

if (!supportedMaterialXCategories.includes('standard_surface')) throw new Error('Missing renderer capability');
```

Use this category list to flag unsupported nodes before rendering. A supported category does not guarantee every input or type combination renders.

[Generated API reference](/docs/api/viewer/)

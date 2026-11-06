---
title: Quick start
---

## Preview a material

Open the [material viewer](/viewer), choose a sample or drop a `.mtlx` or `.mtlx.zip` file. Use the mouse or touch to inspect the material; the settings gear controls the geometry, lighting, backdrop, and rendering options.

The neutral HDR studio is generated in the browser and has a white backdrop by default. Choose a different backdrop independently of the lighting. The Share menu creates viewer, embed, and iframe links. Local files must be hosted at a URL before someone else can load them from a link.

## Use the command line

```sh
npx mtlx-cli info material.mtlx
npx mtlx-cli check material.mtlx
npx mtlx-cli view material.mtlx
```

For repeated use, install the CLI:

```sh
npm install -g mtlx-cli
mtlx --help
```

See the [CLI guide](cli.md) for packaging, transformations, renders, and automation.

## Edit a graph

Open the [node editor](/editor). Choose a sample or create a graph, edit parameters, and inspect the live preview. Undo and redo track semantic changes. Download the material to keep an editable MaterialX document, or share an editor snapshot.

## Build with the libraries

```sh
npm install mtlx-core
```

```ts
import { parseMaterialX, serializeMaterialX } from 'mtlx-core';

const document = parseMaterialX('<materialx version="1.39"/>');
console.log(serializeMaterialX(document));
```

Continue with [core](core.md), [React and the viewer](viewer.md), or the [SDK](sdk.md).

## Documentation and release versions

This website and its generated API reference follow the repository's `main` branch. npm packages are published through a separate release process, so newly documented APIs can arrive here before an npm release. The `/material-viewer.js` bundle served by this site is built from the same commit as the documentation. Use the repository build when developing against unreleased APIs, or consult your installed package version's README/types.

# mtlx-core

[![npm version](https://img.shields.io/npm/v/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-mtlx.ben3d.ca-blue)](https://mtlx.ben3d.ca)

Parse, validate, and serialize [MaterialX](https://materialx.org) (`.mtlx`) documents into an
in-memory representation that mirrors the on-disk XML structure, plus pack/unpack support for
`.mtlz` (spec-compliant) and `.mtlx.zip` (relaxed) single-file containers, and texture
resize/reformat via `mtlx-core/textures`.

```sh
npm install mtlx-core
```

```ts
import { parseMaterialX, validateDocument } from 'mtlx-core';

const document = parseMaterialX(xmlText);
const issues = validateDocument(document);
```

See the [mtlx monorepo](https://github.com/bhouston/mtlx) for the `mtlx` CLI, the
[mtlx.ben3d.ca](https://mtlx.ben3d.ca) viewer, and the VS Code extension built on this package.

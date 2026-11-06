---
title: MaterialX tools
slug: /
---

mtlx is a TypeScript toolkit for working with MaterialX documents and materials. Use the tools directly, or build them into your application.

| Start here                     | What it provides                                                    |
| ------------------------------ | ------------------------------------------------------------------- |
| [Quick start](quick-start.md)  | Preview a material and run your first validation                    |
| [CLI](cli.md)                  | Inspect, validate, package, convert, and render from the terminal   |
| [VS Code extension](vscode.md) | Diagnostics, graph inspection, and live previews inside your editor |
| [Core library](core.md)        | Browser-safe parsing, validation, packages, and headless editing    |
| [Viewer](viewer.md)            | The reusable Three.js viewer, React components, and custom element  |
| [SDK](sdk.md)                  | Typed clients for the MTLX.ai service                               |
| [Editor](editor.md)            | Reusable React graph editing components                             |

The [online viewer](/viewer) and [node editor](/editor) run locally in your browser. Opening a local material does not upload it to a service. Remote materials and their textures are fetched from the URLs you provide.

mtlx supports loose `.mtlx` XML and `.mtlx.zip` packages containing a document and its resources. MaterialX validation and preview rendering cover supported constructs; a passing check is not a promise of complete MaterialX conformance. See [formats and compatibility](formats.md).

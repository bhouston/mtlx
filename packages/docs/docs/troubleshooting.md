---
title: Troubleshooting
---

## A local material has missing textures

A loose browser upload cannot expose sibling files automatically. Load a `.mtlx.zip` package, use a hosted document whose texture URLs allow cross-origin requests, or use the CLI/VS Code preview with filesystem access.

## A remote material fails to load

Check the requested URL, status code, redirects, and CORS headers. The material and each external resource must be reachable from the browser. The viewer shows load and translation details in its log panel.

## The renderer cannot start

Use a browser with hardware WebGPU or WebGL2 support and confirm hardware acceleration is enabled. A static documentation page can load successfully while a browser or graphics driver prevents the interactive preview from starting. Parsing and non-rendering CLI commands remain available without a GPU.

## The editor is small on a phone

The editor's compact layout prioritizes the graph and selected controls. Use its layout selector or a larger viewport for simultaneous graph, inspector, and preview work. The viewer remains usable on narrow screens.

## Sharing a local file

A link cannot grant another browser access to files on your computer. Host a portable material package at a URL, or use the editor's snapshot-sharing feature within its documented limits.

[Report a reproducible issue](https://github.com/bhouston/mtlx/issues) with browser/OS versions, the failing stage, and a minimal material you can share.

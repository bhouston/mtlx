---
title: VS Code extension
---

The MaterialX extension adds validation, document inspection, graph views, and live material previews beside your source.

- [Install from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=benhouston3d.mtlx-vscode-extension)
- [Install from Open VSX](https://open-vsx.org/extension/benhouston3d/mtlx-vscode-extension)

Open a `.mtlx` or `.mtlx.zip` file and use the extension's preview command. The preview shares its renderer and controls with the web viewer, including neutral studio lighting, independent backgrounds, material selection, and environment rotation.

## Custom environments and geometry

```json
{
  "mtlx.preview.ibls": [{ "name": "courtyard", "source": "~/IBLs/courtyard.hdr" }],
  "mtlx.preview.defaultIbl": "courtyard",
  "mtlx.preview.background": "white",
  "mtlx.preview.environmentRotation": 45
}
```

The built-in environments are `studio` (generated neutral HDR, the default) and `bridge` (a photographic HDR). Additional environment names and geometry names are separate namespaces. Custom environments accept equirectangular HDR, EXR, PNG, and JPEG sources. Geometry accepts glTF/GLB with supported sidecars.

[All settings and extension source](https://github.com/bhouston/mtlx/tree/main/packages/vscode-extension)

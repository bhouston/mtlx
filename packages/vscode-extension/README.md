<p align="center">
  <a href="https://mtlx.ben3d.ca" target="_blank" rel="noopener noreferrer">
    <img alt="mtlx logo" src="https://raw.githubusercontent.com/bhouston/mtlx/main/packages/docs/static/img/icon-512.png" height="96">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=benhouston3d.mtlx-vscode-extension"><img src="https://img.shields.io/open-vsx/v/benhouston3d/mtlx-vscode-extension.svg" alt="open vsx version"></a>
  <a href="https://open-vsx.org/extension/benhouston3d/mtlx-vscode-extension"><img src="https://img.shields.io/open-vsx/dt/benhouston3d/mtlx-vscode-extension.svg" alt="open vsx downloads"></a>
  <a href="https://codecov.io/gh/bhouston/mtlx"><img src="https://codecov.io/gh/bhouston/mtlx/branch/main/graph/badge.svg" alt="coverage"></a>
  <a href="https://discord.gg/wzQWaBBxup"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
  <a href="https://mtlx.ben3d.ca/docs/vscode/"><img src="https://img.shields.io/badge/docs-read-blue?style=flat" alt="documentation"></a>
</p>
<br/>

# Mtlx Viewer for MaterialX

> Preview, inspect, and package MaterialX inside VS Code.

- 🎨 Interactive 3D Preview
- 🕸️ Node Graph Tab
- ✅ Validation Report
- 🔄 Refreshes on Save
- 📦 Pack and Unpack `.mtlx.zip`

Open `.mtlx` or `.mtlx.zip` files for an interactive 3D preview, node graph, and validation report. Saving a material or its textures refreshes the preview.

[Read the Docs to Learn More](https://mtlx.ben3d.ca/docs/vscode/).

![Material preview and node graph in VS Code](https://raw.githubusercontent.com/bhouston/mtlx/main/assets/extension.gif)

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=benhouston3d.mtlx-vscode-extension) or [Open VSX](https://open-vsx.org/extension/benhouston3d/mtlx-vscode-extension).
2. Open a `.mtlx` or `.mtlx.zip` file.
3. Drag to orbit, scroll to zoom, or switch to the **Graph** tab to inspect nodes.

Use **Reopen Editor With → Text Editor** to edit XML. Right-click materials in Explorer to pack or unpack `.mtlx.zip` archives.

Requires desktop VS Code 1.85+ with GPU acceleration. Preview support follows Three.js's MaterialX loader.

See the [extension guide](https://mtlx.ben3d.ca/docs/vscode/) for settings, custom lighting and models, conversion workflows, and troubleshooting.

## Contribution

See [Contributing Guide](https://github.com/bhouston/mtlx/blob/main/CONTRIBUTING.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).

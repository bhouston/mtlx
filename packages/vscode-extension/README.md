# Mtlx Viewer

Preview, inspect, and package [MaterialX](https://materialx.org) materials inside desktop VS Code.
Part of the [mtlx toolkit](https://github.com/bhouston/mtlx).

![Mtlx Viewer screenshot](images/screenshot.webp)

## Get started

In VS Code's Extensions view, search for **Mtlx Viewer** by **benhouston3d** and install it.
Open a `.mtlx` or `.mtlx.zip` file to preview it. To inspect or edit the source XML, use
**Reopen Editor With → Text Editor**; return with **Open with Mtlx Viewer** in the Command Palette.

The preview offers totem, sphere, and plane geometry and a selector for documents with multiple
materials. Its information panel lists version, materials, texture references, nodes, and
validation issues. Saved files and sibling resources refresh visible previews automatically;
use **Refresh** to reload manually. Material and geometry selections survive tab switching.

## Convert materials

Right-click one or more `.mtlx` / `.mtlx.zip` files in Explorer and choose **Convert to .mtlx**
or **Convert to .mtlx.zip**. Textures are carried along with the material. Converting to ZIP
packages the document and resources; it does not translate shaders into another rendering format.

Existing destination documents are preserved: if `wood.mtlx.zip` exists, packing `wood.mtlx`
creates `wood-2.mtlx.zip`. Files already in the requested format are skipped. A completion message
reports converted, skipped, and failed counts, with **Open** for outputs and **Details** for failures.

## Compatibility and troubleshooting

Rendering uses the shared `mtlx-viewer` three.js scene and requires working GPU acceleration
(WebGPU or its WebGL2 fallback). Preview coverage depends on three.js's MaterialX support;
a document passing validation may still use nodes or resources the renderer cannot display.
This is a material preview, not a promise of pixel-identical rendering across applications.

For loose `.mtlx` files, keep referenced textures alongside the document at their relative paths.
A `.mtlx.zip` containing its textures is the most portable input. External libraries, remote texture
URLs, and virtual/revision workspace texture resolution are not guaranteed by this extension.
The extension uses desktop extension-host filesystem APIs; browser-hosted VS Code is not supported.

If rendering fails, read the error below the preview and the **Mtlx Viewer** Output channel.
Try a packaged material to distinguish missing resources from renderer support problems. Include
VS Code version, operating system, and a shareable minimal material in a
[bug report](https://github.com/bhouston/mtlx/issues).

## Author

[Ben Houston](https://ben3d.ca), sponsored by [Land of Assets](https://landofassets.com).

# Mtlx Viewer

Part of the [mtlx](https://github.com/bhouston/mtlx) suite: a pure TypeScript/JavaScript
MaterialX toolkit with no binary dependencies, working out of the box on Node, browsers, Windows,
macOS, and Linux.

Preview, inspect, and convert [MaterialX](https://materialx.org) files directly in VS Code.

- Opens `.mtlx`, `.mtlz`, and `.mtlx.zip` files in a 3D preview (three.js, on a sphere), plus a
  stats panel: version, materials (surfaces/volumes), referenced textures, internal node list,
  and validity/issues.
- Right-click a `.mtlx`, `.mtlz`, or `.mtlx.zip` file in the Explorer to convert it to either of
  the other two formats.

Built on [`mtlx-core`](https://www.npmjs.com/package/mtlx-core) — see the
[mtlx monorepo](https://github.com/bhouston/mtlx) for the CLI and library this extension shares
its file-format logic with.

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)

---
title: CLI
---

`mtlx-cli` provides the `mtlx` command for local MaterialX workflows. Its `mtlx-ai` alias also exposes the MTLX.ai service commands.

```sh
npm install -g mtlx-cli
mtlx --help
mtlx info material.mtlx
mtlx check material.mtlx
mtlx view material.mtlx
```

## Packages and conversions

Loose `.mtlx` documents reference sibling textures. `.mtlx.zip` packages carry those resources with the document. The CLI can pack and unpack materials and transform them for delivery. Run a command's `--help` for the currently supported options; the command reference in this sidebar is generated from the same CLI source at build time.

## Rendering

```sh
mtlx render material.mtlx -o preview.png --view sphere --ibl studio
```

Use the generated command reference for view presets, texture channels, resolution, supersampling, and output format choices. CLI exports retain a transparent background unless the selected view or `--background` requests an environment backdrop.

The rendering commands use a browser and Three.js. They need a working GPU-backed browser context. Validation, inspection, and package manipulation do not require a renderer.

## Automation

Use exit codes and machine-readable command output rather than parsing formatted terminal text. The CLI also exposes an MCP server for agent workflows; see [agents and automation](agents.md).

[Source and complete CLI README](https://github.com/bhouston/mtlx/tree/main/packages/cli)

---
title: Agents and automation
---

The CLI is designed for scripts and agent-driven material workflows. Start with the same local inspect and validate commands you would use interactively.

```sh
mtlx info material.mtlx
mtlx check material.mtlx
mtlx render material.mtlx -o preview.png --view sphere --ibl studio
```

The MCP command exposes tools to MCP-compatible applications. Run `mtlx mcp --help` and consult the generated command reference for the current server options. Keep generated source materials editable; render previews to inspect changes rather than treating an image as the material source.

For programmatic edits, use the [core editing session](core.md#headless-editing). It supports transactions, graph queries, validation, subscriptions, and history without a DOM or renderer.

The repository also includes [material authoring guides](https://github.com/bhouston/mtlx/tree/main/docs/material-authoring) with practical examples and known rendering limits.

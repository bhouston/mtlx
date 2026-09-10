# mtlx

TypeScript tools for [MaterialX](https://materialx.org) file manipulation.

- [`@mtlx/core`](packages/core) — parse, validate, and serialize `.mtlx` documents; pack/unpack `.mtlz` single-file containers.
- [`@mtlx/cli`](packages/cli) — the `mtlx` command: `check`, `info`, `pack`, `unpack` for `.mtlx`, `.mtlz`, and `.mtlx.zip` files.
- [`website`](packages/website) — a drag-and-drop MaterialX viewer built on TanStack Start and three.js.

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Release

```sh
pnpm make-release:core
pnpm make-release:cli
```

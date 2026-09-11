# Contributing

mtlx is a pnpm monorepo. All code is TypeScript (ESM), formatted with oxfmt and linted with
oxlint; both run on staged files via husky.

## Setup

```sh
pnpm install
pnpm build   # builds every package; the website build also regenerates the docs
pnpm test    # type-check + vitest across all packages
pnpm lint
```

To use a local build of the CLI:

```sh
node packages/cli/bin/cli.js check material.mtlx
```

or `npm link` inside `packages/cli` so `mtlx` resolves to your checkout.

## Pull requests

Before adding a feature, please open an issue to discuss it. Changes with test coverage are
strongly preferred. Test fixtures live under `assets/` and are shared by every package's tests.

### Node and web compatibility

The root `mtlx-core` entry must stay pure: no `node:` imports, no `Buffer`, no native modules.
Platform resources are injected by the caller, never created by the library. Concretely:

- Filesystem helpers go in `packages/core/src/node.ts` (`mtlx-core/node`).
- Anything that needs sharp goes in `packages/core/src/textures.ts` (`mtlx-core/textures`).
- Pure functions take bytes (`Uint8Array`), text, or a reader callback such as `ResourceReader`.

The website imports only the root entry, which is the check that this rule holds.

### API conventions

- Functions, not classes. Plain interfaces for data.
- A function that takes options has an `XOptions` interface and, when any option has a default,
  an `X_DEFAULTS` const.
- Anything that operates on a whole material is a `Transform` (`(pkg: MaterialXPackage) => void |
Promise<void>`) so it composes with `transform(pkg, ...)`.
- Validation returns `MaterialXValidationIssue[]`; it never throws on bad input.

## Documentation

Each published package documents itself: `packages/core/README.md`, `packages/cli/README.md`, and
`packages/viewer/README.md` list and demonstrate their key exported APIs, and that's what users see
on npm. Keep them current when you change an export's signature or behavior.

- Open with an italic one-line summary, then prose, then a fenced `ts` example, when adding a doc
  comment to an exported symbol.
- Tag every export with `@category`: `Parsing`, `Validation`, `Packaging`, `Transforms`, or
  `Textures`. `@internal` hides a symbol from the type declarations.

```sh
pnpm docs:cli    # splice `mtlx --help` output into packages/cli/README.md (commit the result)
```

## Releasing

Update `CHANGELOG.md`, bump versions, then:

```sh
pnpm docs:cli && git add packages/cli/README.md
pnpm make-release:core
pnpm make-release:cli
```

The website deploys to Cloud Run from `main` via GitHub Actions.

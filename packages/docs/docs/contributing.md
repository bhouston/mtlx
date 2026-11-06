---
title: Contributing
---

Development uses the Node version in `.nvmrc` and the pnpm version pinned in the root `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm tsc
pnpm lint
pnpm test
pnpm docs:build
```

Run `pnpm docs:dev` to work on this documentation site. The build generates the CLI reference, API references, interactive application bundle, and static assets before Docusaurus builds the final artifact.

Every tracked change starts with an issue and a branch from current `main`. Use Conventional Commits, open a PR, and merge only when required CI checks pass. Package releases are separate from merges.

[Contribution workflow](https://github.com/bhouston/mtlx/blob/main/CONTRIBUTING.md) · [Release process](https://github.com/bhouston/mtlx/blob/main/RELEASING.md)

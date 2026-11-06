# MaterialX viewer application

[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/deployment/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Interactive MaterialX viewer, editor, and iframe embed, built with React and TanStack Router. The Docusaurus website bundles these browser tools into its static deployment.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter website dev
```

Open `http://localhost:3000/viewer`. For the full documentation site, run `pnpm docs:dev`.

See the [application development guide](https://github.com/bhouston/mtlx/blob/main/docs/development/website.md) for implementation details and tests, and [deployment](https://mtlx.ben3d.ca/docs/deployment/) for the production site.

# mtlx documentation website

Docusaurus is the primary site for `https://mtlx.ben3d.ca`. It follows the documentation and
GitHub Pages artifact structure used by `ies-tools/packages/docs`, with mtlx-specific guides,
marketing pages, and browser-only editor/viewer pages.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm docs:build
pnpm --filter mtlx-docs serve
```

`pnpm docs:dev` generates references/static app assets and starts the documentation dev server.
The static application is built from `packages/website/src/static-main.tsx`, reusing the actual
editor, viewer, and embed routes; the existing Node website remains available for development
and manual Cloud Run rollback. Both applications share the same core/editor/viewer packages.

`generate` copies public material samples, the standalone material-viewer bundle and legacy
viewer asset paths, generates the CLI OpenCLI document, and renders the core/SDK/viewer/editor
API references with TypeDoc. Generated files are ignored and rebuilt from source.

The build output is `packages/docs/build`. `.github/workflows/docs.yml` publishes that directory
as a GitHub Pages artifact and deploys it. CI builds the same output and uploads a review
artifact. Repository Pages settings and Cloudflare DNS must be configured separately; see
[deployment](docs/deployment.md). No credentials are stored in this package.

Hardware browser smoke tests run with `pnpm --filter mtlx-docs test:e2e` after the build. They use
installed Google Chrome with the Metal backend and reject software renderers, exercising search,
mobile navigation, editor/viewer rendering, screenshot download, URL sharing and browser history.
CI validates static builds and links without relying on software GPU rendering.

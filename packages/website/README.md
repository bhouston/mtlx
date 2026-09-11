# MaterialX website

The React/TanStack Start website hosts the MaterialX inspector and documentation. It uses the
shared `mtlx-viewer` scene and assets; parsing and validation come from `mtlx-core`.

## Local development

From the repository root, use Node.js 22+ (the pinned `.nvmrc` is used in CI) and pnpm 11.1.3:

```sh
pnpm install --frozen-lockfile
pnpm --filter mtlx-core build
pnpm --filter mtlx-viewer build
pnpm --filter website dev
```

Open `http://localhost:3000/viewer`. The website uses Vite's `?url` asset imports. Large material
analysis runs in a worker; loose remote materials resolve dependencies relative to their URL.
Local loose documents cannot read neighboring files through the browser file picker. ZIP inputs
provide an inventory for archive and recursive dependency checks.

`/viewer?materialUrl=<encoded HTTP(S) URL>` and `/embed?materialUrl=<encoded HTTP(S) URL>` use the
same source. The bottom IBL dropdown uses the extension's stub names: `bridge` (San Giuseppe Bridge,
the default) and `studio` without resetting the camera or material. Selecting a sample populates the URL input; a matching URL selects its sample.
Bottom controls toggle bloom and full-resolution, denoised GTAO and select tone mapping. Bloom and
AO default on; tone mapping defaults to Neutral. Auto-rotation takes 40 seconds per turn.
Legacy `material=<preset id or URL>` links remain readable. New shared links use `materialUrl`.

## Compound sample

Choose `compound` in the sample picker to load a document containing `Copper` and `Tiled_Wood`.
Use the viewer's bottom Material dropdown to switch between them. The document and both wood
textures are hosted in `public/materials/compound/`, so this sample works without GitHub access.
A portable direct link is `/viewer?materialUrl=/materials/compound/compound.mtlx`.

Regenerate the fixture from the repository root using the CLI:

```sh
pnpm --filter mtlx-cli build
node packages/cli/bin/cli.js transform assets/copper/copper.mtlx assets/wood_grain/wood_grain.mtlx --output packages/website/public/materials/compound/compound.mtlx
node packages/cli/bin/cli.js check packages/website/public/materials/compound/compound.mtlx --rules basic structure types resources --strict
```

The browser regression test checks both material choices, texture requests, a rendered change
when switching materials, and sample selection after reloading the shared URL.

## Production and tests

```sh
pnpm build
pnpm tsc
pnpm exec playwright install chromium
pnpm test:e2e
pnpm --filter website start
```

E2E tests require the production website under `.output/` and the built extension assets under
`packages/vscode-extension/media/`; `pnpm build` produces both. They start their own server on
port 3123 and exercise Chromium rendering, keyboard controls, narrow layouts, sharing, and the
extension webview's ready/state-restoration protocol. On Linux CI use
`pnpm exec playwright install --with-deps chromium`. Unit tests run with `pnpm test`.

## Deployment

`vite.config.ts` configures Nitro's `node-server` output. The production entry is
`.output/server/index.mjs`; `PORT` selects the listening port. The Docker build uses the repository
root as context and `packages/website/Dockerfile`, exposes port 8080, and runs the server.
`.github/workflows/deploy.yml` deploys `main` through the shared Cloud Run workflow and its
`GCP_SA_KEY` secret. Keep the worker, JS chunks and viewer assets in the deployed output.

## Implementation map

- `src/routes/viewer.tsx`: source selection, share links and diagnostics.
- `src/components/MaterialViewer.tsx`: renderer lifecycle and inspection controls.
- `src/lib/material-load.ts`: cancellation and consistent source/analysis delivery.
- `src/lib/material-analysis.worker.ts`: all validation rules and recursive remote resources.
- `../viewer/src/scene.ts`: shared geometry, material selection, rotation and Reset.
- `../core/src/inspect.ts`: shared XML/archive/dependency inspection.

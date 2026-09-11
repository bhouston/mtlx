# MaterialX website

Part of the [Mtlx suite of web-focused MaterialX tools](https://mtlx.ben3d.ca).

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
A blue-on-white progress overlay appears immediately while loading, advances with streamed bytes
when a download size is available, and shows the checking and rendering stages before the preview.
Unknown-size downloads show received bytes; phase milestones do not estimate elapsed time.
The details panel uses matching collapsible sections in this order: File details, Materials,
References, Internal Nodes, and Validity Checks. File details starts open; Materials starts open
only for documents with multiple materials. References and Internal Nodes include counts and start collapsed.
Internal Nodes groups entries alphabetically by node type and shows each type's usage count, without
instance names or material nodes (`surfacematerial` / `volumematerial`). Its heading counts the remaining
node instances, so you can audit which functionality a material requires.
Validity Checks uses one collapsed summary when all checks pass. Expand it for XML, nodes, structure,
types, dependencies, renderer support and preview results. Failures and warnings expand automatically
with diagnostics beneath the affected check; unavailable checks are never marked as passed.
Local loose documents cannot read neighboring files through the browser file picker. ZIP inputs
provide an inventory for archive and recursive dependency checks.

## Viewer controls and sharing

The toolbar offers Choose file, a Load URL dialog, a Sample materials action menu, and Share.
Share copies a viewer link, embed link, or iframe code with the current settings. Local uploads
must be hosted at a URL before they can be shared. File details remain available beside the viewer.
Viewer settings start collapsed on both routes; expand the panel to adjust lighting and rendering.
On narrow screens the settings sit below the canvas.

`/viewer` and `/embed` use the same validated query parameters through TanStack Router's native
search APIs, defined in `src/lib/viewer-search.ts`:

| Parameter      | Values                                                           | Default                     |
| -------------- | ---------------------------------------------------------------- | --------------------------- |
| `materialUrl`  | HTTP(S) .mtlx/.mtlx.zip URL or same-origin path                  | No material                 |
| `ibl`          | `bridge`, `studio`                                               | `bridge`                    |
| `bloom`, `ao`  | `true`, `false`                                                  | `true`                      |
| `intensity`    | 0–2                                                              | 1                           |
| `toneMapping`  | `neutral`, `aces`, `agx`, `reinhard`, `cineon`, `linear`, `none` | `neutral`                   |
| `exposure`     | −2–2 EV                                                          | 0                           |
| `rotate`       | `true`, `false` (40 seconds per turn)                            | `false`                     |
| `geometry`     | `totem`, `sphere`, `plane`                                       | `totem`                     |
| `materialName` | Material name within the document                                | Document's initial material |

Setting changes replace the current history entry without resetting the scene or scrolling;
loading a different material creates a history entry and retains rendering settings. Invalid values
fall back to defaults and finite numeric values are clamped to the supported ranges.
Legacy `material=<preset id or URL>` links remain readable. New shared links use `materialUrl`.

Example: `/embed?materialUrl=/materials/compound/compound.mtlx&ibl=studio&geometry=sphere&bloom=false`.

## Compound sample

Choose `compound` in the sample picker to load a document containing `Copper` and `Tiled_Wood`.
Use the viewer's top Material dropdown to switch between them. The document and both wood
textures are hosted in `public/materials/compound/`, so this sample works without GitHub access.
The `compound_zip` sample contains the same document and textures in one `.mtlx.zip` archive.
It is hosted at `/materials/compound_zip/compound_zip.mtlx.zip`.
A portable direct link to the loose sample is `/viewer?materialUrl=/materials/compound/compound.mtlx`.

Regenerate the fixture from the repository root using the CLI:

```sh
pnpm --filter mtlx-cli build
node packages/cli/bin/cli.js transform assets/copper/copper.mtlx assets/wood_grain/wood_grain.mtlx --output packages/website/public/materials/compound/compound.mtlx
node packages/cli/bin/cli.js check packages/website/public/materials/compound/compound.mtlx --rules basic structure types resources --strict
```

Create and validate the ZIP example with the CLI:

```sh
node packages/cli/bin/cli.js transform packages/website/public/materials/compound/compound.mtlx --output packages/website/public/materials/compound_zip/compound_zip.mtlx.zip
node packages/cli/bin/cli.js check packages/website/public/materials/compound_zip/compound_zip.mtlx.zip --rules basic structure types resources --strict
```

The ZIP regression test blocks external texture requests to verify the archive is self-contained.
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
- `src/components/viewer/`: reusable toolbar, URL dialog, sample/share menus, and file drop zone.
- `src/hooks/use-material-load.ts`: TanStack Query mutation state, progress, and cancellation on replacement/unmount.
- `src/lib/material-load.ts`: abortable file/download and analysis promise with structured error diagnostics.
- `src/lib/material-analysis.worker.ts`: all validation rules and recursive remote resources.
- `../viewer/src/diagnostics.ts`: shared validation statuses and internal-node summaries.
- `../viewer/src/runtime.ts` and `lifecycle.ts`: shared renderer setup, resizing, settings application, and cleanup.
- `../viewer/src/scene.ts`: shared geometry, material selection, rotation and Reset.
- `../core/src/inspect.ts`: shared XML/archive/dependency inspection.

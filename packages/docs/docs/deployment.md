---
title: Documentation deployment
---

The primary site is a static Docusaurus build in `packages/docs/build`. The editor, viewer, and embed are static browser applications included in the same artifact; no Node server is needed to serve them.

## GitHub Actions

The Documentation workflow never runs on pushes or merges to `main`. The Release workflow calls it after each release (including a recovered release, but not a dry run), passing the release tag; it checks out that tag, builds from it, uploads a GitHub Pages artifact and deploys it with `actions/deploy-pages`. To redeploy manually, dispatch the workflow on `main`; it builds the `ref` tag you give, or the latest `v*` tag. Pull-request CI builds the same docs and uploads a review artifact without changing production.

GitHub repository Pages settings must use **GitHub Actions** as their build source. Configure `mtlx.ben3d.ca` as the repository's custom Pages domain; with a custom Actions workflow the `CNAME` file alone does not configure the domain.

## Cloudflare routing

The intended routing matches the `ies-tools.ben3d.ca` reference project: a proxied CNAME from `mtlx.ben3d.ca` to `bhouston.github.io`. The existing Cloud Run service can remain available during verification and rollback, but automatic Cloud Run website deployment is replaced by the documentation workflow.

Before changing the record, confirm a successful Pages deployment, custom-domain configuration, and HTTPS readiness. Use the authenticated `cf` CLI to inspect and update the existing `mtlx` DNS record rather than creating duplicate records. Follow the CLI's current `cf dns --help`/record-update schema; credentials belong in the authenticated profile, never this repository.

A maintainer can inspect the record and validate the intended edit with:

```sh
cf -q --zone ben3d.ca dns records list --name mtlx.ben3d.ca
cf -q --zone ben3d.ca dns records edit <record-id> --dry-run \
  --body '{"type":"CNAME","name":"mtlx.ben3d.ca","content":"bhouston.github.io","proxied":true,"ttl":1}'
```

Use the actual existing record ID from the inspection response. Remove `--dry-run` only for the
production cutover after the Pages deployment is verified. These commands update DNS; they do not
upload the artifact or configure the GitHub Pages custom domain.

Rollback changes the same record back to the previous origin. The former origin is `ghs.googlehosted.com`; record the current value at cutover rather than assuming it has not changed. The separate `mtlx-static.ben3d.ca` immutable asset host is unaffected.

## Public routes

`/viewer`, `/editor`, and `/embed` retain their public URLs and query strings. Their app bundle lives under `/app/`, isolating application styles and browser-only code from documentation rendering. `/material-viewer`, `/extension`, and `/agents` redirect to the corresponding documentation pages. Material samples and `/viewer-assets/` remain available in the static artifact, and `/material-viewer.js` serves the standalone custom element.

A legacy studio PNG is retained only at `/viewer-assets/studio-environment.png` for older published clients. It is not offered by the current viewer, which generates its neutral HDR studio without downloading an environment image.

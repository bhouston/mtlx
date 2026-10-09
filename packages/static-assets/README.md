# static-assets

Large immutable assets served at `https://mtlx-static.ben3d.ca/` (the shaderball and IBL HDRs used by
`mtlx-viewer`, the website, the CLI and the VS Code extension). `public/foo/bar.hdr` →
`https://mtlx-static.ben3d.ca/foo/bar.hdr`.

All files get `Cache-Control: public, max-age=31536000, immutable` and
`Access-Control-Allow-Origin: *`, so **never change a file in place**: add a new file name (for
example `shaderball-v2.glb`) and point the code at it. Files removed from git are not deleted from
the bucket, because published packages may still reference them. `/` serves `index.html`, which
redirects to https://mtlx.ben3d.ca/; directories are not listed.

## Local development

`pnpm dev` at the repository root starts `server.mjs` on http://localhost:3001 (override with
`PORT`), which serves `public/` with the same headers. The website uses it in dev builds and the
CDN in production builds.

## Deployment

[`.github/workflows/sync-static-assets.yml`](../../.github/workflows/sync-static-assets.yml) runs on
every push to `main` that touches `public/`:
`gcloud storage rsync public gs://mtlx-static.ben3d.ca --recursive --checksums-only`, setting the
cache header on upload. It uses the repository's `GCP_SA_KEY` secret.

## One-time setup

The bucket must be named after the domain: Cloudflare can only rewrite the `Host` header on
Enterprise plans, and GCS picks the bucket from the `Host` header. `ben3d.ca` ownership must be
verified for the Google account (Search Console).

```sh
B=gs://mtlx-static.ben3d.ca
SA=<service account email in GCP_SA_KEY>
gcloud storage buckets create $B --project=bhouston-general-hosting \
  --location=us-central1 --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding $B \
  --member=allUsers --role=roles/storage.legacyObjectReader  # read objects, no listing
gcloud storage buckets update $B --web-main-page-suffix=index.html  # / serves the redirect page
gcloud storage buckets update $B --cors-file=packages/static-assets/cors.json
gcloud storage buckets add-iam-policy-binding $B --member=serviceAccount:$SA --role=roles/storage.objectAdmin
gcloud storage buckets add-iam-policy-binding $B --member=serviceAccount:$SA --role=roles/storage.legacyBucketReader  # rsync needs buckets.get
```

Cloudflare, for `mtlx-static.ben3d.ca`:

1. DNS: `CNAME mtlx-static → c.storage.googleapis.com`, **proxied**.
2. Configuration Rule: SSL = **Flexible** (GCS only serves plain HTTP for custom domains; visitors
   still get HTTPS from Cloudflare).
3. Cache Rule: Eligible for cache, Edge TTL = respect origin.
4. Response Header Transform Rule: set `Access-Control-Allow-Origin: *`. GCS only sends the CORS
   header when the request has an `Origin` header, and Cloudflare caches without regard to
   `Vary: Origin`, so a cached copy fetched without `Origin` would otherwise break cross-origin
   requests.

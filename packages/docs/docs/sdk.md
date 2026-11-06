---
title: MTLX.ai SDK
---

`mtlx-sdk` is a typed client for the MTLX.ai service. It is separate from the local document, viewer, and editor libraries: use it when you need hosted materials, users, uploads, or other service endpoints.

```sh
npm install mtlx-sdk
```

```ts
import { createSecretTokenInstance, listAssets } from 'mtlx-sdk';

const client = createSecretTokenInstance({ secretToken: process.env.MTLX_API_TOKEN! });
const assets = await listAssets(client, { query: { userName: 'alice' } });
```

The functional API exports operations as standalone functions. Requests and responses have TypeScript definitions and Zod validation. Client helpers support anonymous, token, frontend-token, and session authentication.

Keep secret tokens in trusted server-side environments. Browser applications should use the appropriate frontend/session flow rather than embedding a service secret in public JavaScript.

Materials uploaded to the service are stored as `.mtlx.zip` packages. The upload-and-create workflow and authentication options are described below.

## Uploading a Material

The SDK provides a simple helper function for uploading files. Here's a complete example:

```typescript
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createSecretTokenInstance, uploadFile, createAsset } from 'mtlx-sdk';

const userName = 'alice';

const client = createSecretTokenInstance({
  secretToken: process.env.MTLX_API_TOKEN!,
});

// Read the file and extract filename (loose `.mtlx` or packaged `.mtlx.zip`)
const fileData = await readFile('copper.mtlx.zip');
const filename = basename('copper.mtlx.zip');

// Upload the file (infers MIME type and uploads)
const uploadToken = await uploadFile(client, {
  params: { userName },
  fileData,
  filename,
});

// Create the asset record with the upload token. The API validates the
// MaterialX document during ingest and rejects malformed content with 400.
const asset = await createAsset(client, {
  params: { userName },
  body: {
    name: 'copper',
    description: 'A brushed copper material',
    type: 'MATERIAL',
    uploadToken,
    visibility: 'PUBLIC',
    shareLicense: 'CC_BY',
  },
});
```

`uploadFile` returns an upload token for `createAsset`. Pass bytes and a filename; in a browser, convert a selected file with `new Uint8Array(await file.arrayBuffer())`.

## Authentication

Choose `createSecretTokenInstance` for server-side API tokens, `createAnonymousClient` for public access, or `createFrontendTokenInstance` / `createSessionInstance` for browser authentication. The default API host is `https://api.mtlx.ai`.

All operations follow `operation(client, props)`. Use the [API reference](/docs/api/sdk/) for request options, response types, and exported Zod schemas.

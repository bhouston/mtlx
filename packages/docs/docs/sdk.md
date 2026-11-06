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

Materials uploaded to the service are stored as `.mtlx.zip` packages. See the package README for the upload-and-create workflow and authentication options.

[Generated API reference](/docs/api/sdk/) · [SDK source and examples](https://github.com/bhouston/mtlx/tree/main/packages/sdk)

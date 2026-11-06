# mtlx-sdk

[![npm](https://img.shields.io/npm/v/mtlx-sdk.svg)](https://www.npmjs.com/package/mtlx-sdk)
[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/sdk/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Typed JavaScript and TypeScript client for the [MTLX.ai](https://mtlx.ai) REST API. Search hosted materials, upload packages, and work with users, comments, and notifications through standalone functions.

```sh
npm install mtlx-sdk
```

```ts
import { createSecretTokenInstance, listAssets } from 'mtlx-sdk';

const client = createSecretTokenInstance({ secretToken: process.env.MTLX_API_TOKEN! });
const assets = await listAssets(client, { query: { userName: 'alice' } });
console.log(assets);
```

Keep secret tokens on the server. See the [SDK guide](https://mtlx.ben3d.ca/docs/sdk/) for authentication, uploads, schemas, and the [API reference](https://mtlx.ben3d.ca/docs/api/sdk/).

MIT · Created by [Ben Houston](https://ben3d.ca), sponsored by [Land of Assets](https://landofassets.com).

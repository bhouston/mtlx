<p align="center">
  <a href="https://mtlx.ben3d.ca" target="_blank" rel="noopener noreferrer">
    <img alt="mtlx logo" src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" height="96">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/mtlx-sdk"><img src="https://img.shields.io/npm/v/mtlx-sdk.svg" alt="npm package"></a>
  <a href="https://www.npmtrends.com/mtlx-sdk"><img src="https://img.shields.io/npm/dw/mtlx-sdk.svg" alt="npm downloads"></a>
  <a href="https://codecov.io/gh/bhouston/mtlx"><img src="https://codecov.io/gh/bhouston/mtlx/branch/main/graph/badge.svg" alt="coverage"></a>
  <a href="https://discord.gg/wzQWaBBxup"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
  <a href="https://mtlx.ben3d.ca/docs/sdk/"><img src="https://img.shields.io/badge/docs-read-blue?style=flat" alt="documentation"></a>
</p>
<br/>

# mtlx-sdk

> Typed TypeScript client for the MTLX.ai REST API.

- 🔎 Search Hosted Materials
- ⬆️ Upload Packages
- 👤 Users, Comments, Notifications
- 🧰 Standalone Functions
- 🟦 Fully Typed

A JavaScript and TypeScript client for the [MTLX.ai](https://mtlx.ai) REST API, built from standalone functions.

[Read the Docs to Learn More](https://mtlx.ben3d.ca/docs/sdk/).

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

## Contribution

See [Contributing Guide](https://github.com/bhouston/mtlx/blob/main/CONTRIBUTING.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).

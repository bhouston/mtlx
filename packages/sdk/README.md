# mtlx-sdk

Official SDK for the [MTLX.ai](https://mtlx.ai) REST API.

## Installation

```bash
npm install mtlx-sdk
# or
pnpm add mtlx-sdk
# or
yarn add mtlx-sdk
```

## Quick Start

The SDK uses a **functional approach** - all API operations are exported as standalone functions that take a client instance as their first parameter. Every material belongs directly to a user (there are no organizations or projects).

```typescript
import { createSecretTokenInstance, listAssets, getAsset } from 'mtlx-sdk';

const userName = 'alice';

// Create a client instance (host defaults to https://api.mtlx.ai)
const client = createSecretTokenInstance({
  secretToken: 'your-api-token',
});

// List a user's materials
const assets = await listAssets(client, {
  query: { userName },
});

// Get a specific material
const asset = await getAsset(client, {
  params: { userName, assetName: 'copper' },
});
```

## Features

- **Functional API design** - All operations are exported as standalone functions
- Full TypeScript support with complete type definitions
- Zod schema validation for requests and responses
- Axios-based HTTP client with automatic error handling
- Support for all MTLX.ai API endpoints:
  - Materials (MaterialX assets, always stored as `.mtlx.zip`)
  - Users and authentication
  - Comments and notifications
  - File uploads and downloads
  - API tokens

## Uploading a Material

The SDK provides a simple helper function for uploading files. Here's a complete example:

```typescript
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createSecretTokenInstance, uploadFile, createAsset } from 'mtlx-sdk';

const userName = 'alice';

const client = createSecretTokenInstance({
  secretToken: 'your-api-token',
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

The `uploadFile` helper:

- Accepts file data (Buffer or Uint8Array) and filename
- Infers the MIME type from the file extension
- Prepares the upload and gets a signed URL
- Uploads the file to the signed URL
- Returns the upload token for use in `createAsset`

**Note:** In Node.js environments, you'll need to read the file yourself using `readFile` from `node:fs/promises` before calling `uploadFile`. In browser environments, you can pass a `File` object directly to `uploadFileToUploadUrl()` or convert it to an `ArrayBuffer`/`Uint8Array` for `uploadFile`.

For more control, you can use `prepareAssetUpload()` and `uploadFileToUploadUrl()` directly.

## API Reference

### Client Configuration

The SDK provides several client creation functions depending on your authentication method:

```typescript
import {
  createSecretTokenInstance, // For API tokens (most common)
  createFrontendTokenInstance, // For frontend tokens
  createSessionInstance, // For user sessions
  createAnonymousClient, // For anonymous access
} from 'mtlx-sdk';

// Most common: API token authentication
// host defaults to 'https://api.mtlx.ai' if not provided
const client = createSecretTokenInstance({
  secretToken: 'your-api-token',
  // host: 'https://api.mtlx.ai', // Optional, defaults to production API
});
```

**Note:** For normal users, you typically don't need to specify the `host` parameter as it defaults to `https://api.mtlx.ai`. Only internal developers may need to override this for testing against different environments.

### Available Functions

The SDK exports functions for all API operations. Here are the main categories:

**Assets (materials):**

- `listAssets()` - List a user's materials (or search public ones)
- `getAsset()` - Get material metadata, including the parsed `materialInfo`
- `createAsset()` - Create a new material
- `updateAsset()` - Update material metadata or replace its file
- `deleteAsset()` - Delete a material
- `uploadFile()` - Upload a file and get upload token (helper function)
- `prepareAssetUpload()` - Get signed upload URL and token
- `uploadFileToUploadUrl()` - Upload file to signed URL

**Other resources:**

- Users and authentication
- Comments and notifications
- API tokens

All functions follow the pattern: `functionName(client, props)` where `client` is the API client instance and `props` contains the request parameters.

## Zod Schemas

The SDK exports Zod schemas for all API request and response types, enabling runtime validation:

```typescript
import { assetSchema, createAssetBodySchema } from 'mtlx-sdk';

// Validate an asset object
const validatedAsset = assetSchema.parse(assetData);

// Validate create asset input
const validatedInput = createAssetBodySchema.parse(createAssetInput);
```

## Requirements

- Node.js >= 23.0.0

## License

MIT

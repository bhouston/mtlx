import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { assetParamsSchema, booleanPropSchema } from '../lib/schemas.js';
import { makeUrl } from '../lib/url.js';

// Alias retained for API route schema imports.
export const getAssetMediaParamsSchema = assetParamsSchema;
export type GetAssetMediaParams = z.infer<typeof getAssetMediaParamsSchema>;

// ---------------------------------------------------------------------------
// Media API (read-only original file passthrough)
// Path pattern: /media/:userName/:assetName/original
// ---------------------------------------------------------------------------

export const mediaParamsSchema = assetParamsSchema;
export type MediaParams = z.infer<typeof mediaParamsSchema>;

export const mediaOriginalQuerySchema = z.object({ download: booleanPropSchema.optional() });
export type MediaOriginalQuery = z.infer<typeof mediaOriginalQuerySchema>;

/** GET /media/:userName/:assetName/original - original uploaded file */
export const getMediaOriginalUrl = (
  client: ApiClient,
  props: { params: MediaParams; query?: MediaOriginalQuery },
): URL => {
  const path = buildPath('/media/$userName/$assetName/original', props.params);
  return makeUrl(client.host, path, props.query);
};

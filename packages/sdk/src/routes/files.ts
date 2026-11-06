import { z } from 'zod';
import type { ApiClient } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { fetchBinary } from '../lib/fetchBinary.js';
import { type BinaryResponse, type BinaryResponseType, defaultBinaryResponse } from '../lib/types.js';
import { makeUrl } from '../lib/url.js';

/**
 * File path parameter schema
 */
export const fileParamsSchema = z.strictObject({
  oid: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .describe('OID of the storage file'),
});

export type FileParams = z.infer<typeof fileParamsSchema>;

export const fileQuerySchema = z.strictObject({
  name: z.string().optional().describe('Optional asset name to use in Content-Disposition header'),
});

export type FileQuery = z.infer<typeof fileQuerySchema>;

// Composed props schema for SDK entry-point parsing
export const getFilePropsSchema = z
  .object({
    params: fileParamsSchema,
    query: fileQuerySchema.optional(),
  })
  .strict();

export type GetFileProps = z.infer<typeof getFilePropsSchema>;

/**
 * Gets the path + search string for a storage file by OID (no host).
 * Use for same-origin redirects (e.g. in API handlers) or to build a full URL by prefixing with a host.
 *
 * @param props - The request properties
 * @param props.params - Path parameters (oid)
 * @param props.query - Query parameters (name)
 * @returns Path and query string, e.g. `/files/{oid}` or `/files/{oid}?name=...`
 */
export const getLocalFileUrl = (props: GetFileProps): string => {
  const { params, query } = getFilePropsSchema.parse(props);
  const path = buildPath('/files/$oid', params);
  const url = makeUrl('http://x', path, query);
  return url.pathname + url.search;
};

/**
 * Gets the URL for a storage file by OID.
 *
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (oid)
 * @param props.query - Query parameters (name)
 * @returns URL object for the storage file
 * @example
 * ```typescript
 * const fileUrl = getFileUrl(client, {
 *   params: { oid: 'abc123...' },
 *   query: { name: 'my-asset' }
 * });
 * ```
 */
export const getFileUrl = (client: ApiClient, props: GetFileProps): URL => new URL(getLocalFileUrl(props), client.host);

/**
 * Gets a storage file as binary data.
 *
 * @operationId get-file
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (oid)
 * @param props.query - Query parameters (name)
 * @param binaryResponse - Optional binary response type configuration
 * @returns Promise resolving to the file binary data
 * @example
 * ```typescript
 * const file = await getFile(client, {
 *   params: { oid: 'abc123...' },
 *   query: { name: 'my-asset' }
 * });
 * ```
 */
export const getFile = async <T extends BinaryResponse>(
  client: ApiClient,
  props: GetFileProps,
  binaryResponse = defaultBinaryResponse<T>(),
): Promise<BinaryResponseType<T>> => {
  const url = getFileUrl(client, props);
  const response = await fetchBinary(client.axios, url.toString(), { maxRedirects: 5 }, binaryResponse);
  return response.data;
};

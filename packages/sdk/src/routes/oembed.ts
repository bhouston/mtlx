import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { makeUrl } from '../lib/url.js';

export const getOEmbedQuerySchema = z
  .object({
    url: z.url().describe('The URL to generate oEmbed data for'),
    format: z
      .enum(['json', 'xml'])
      .optional()
      .default('json')
      .describe('Response format (only "json" is currently supported)'),
    maxwidth: z.coerce.number().int().positive().optional().describe('Maximum width for embedded content in pixels'),
    maxheight: z.coerce.number().int().positive().optional().describe('Maximum height for embedded content in pixels'),
  })
  .strict();

export type GetOEmbedQuery = z.infer<typeof getOEmbedQuerySchema>;

export const oEmbedResponseSchema = z
  .object({
    version: z.literal('1.0').describe('The oEmbed version number'),
    type: z.enum(['photo', 'video', 'link', 'rich']).describe('The resource type'),
    provider_name: z.string().describe('The name of the resource provider'),
    provider_url: z.url().describe('The URL of the resource provider'),
    url: z.url().optional().describe('The URL of the resource (for photo/video types)'),
    width: z.number().int().positive().optional().describe('The width in pixels'),
    height: z.number().int().positive().optional().describe('The height in pixels'),
    title: z.string().optional().describe('The title of the resource'),
    author_name: z.string().optional().describe('The name of the resource author'),
    author_url: z.url().optional().describe('The URL of the resource author'),
    thumbnail_url: z.url().optional().describe('The URL of a thumbnail image'),
    thumbnail_width: z.number().int().positive().optional().describe('The width of the thumbnail in pixels'),
    thumbnail_height: z.number().int().positive().optional().describe('The height of the thumbnail in pixels'),
    html: z.string().optional().describe('The HTML required to embed the resource (for rich/video types)'),
  })
  .describe('oEmbed response following the oEmbed specification');

export type OEmbedResponse = z.infer<typeof oEmbedResponseSchema>;

export type GetOEmbedResult = OEmbedResponse;

export const getOEmbedPropsSchema = z.object({ query: getOEmbedQuerySchema }).strict();
export type GetOEmbedProps = z.infer<typeof getOEmbedPropsSchema>;

/**
 * Gets the URL for the oEmbed endpoint.
 *
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (url, format, maxwidth, maxheight)
 * @returns URL object for the oEmbed endpoint
 * @example
 * ```typescript
 * const oembedUrl = getOEmbedUrl(client, {
 *   query: { url: 'https://example.com/org/my-org', format: 'json' }
 * });
 * ```
 */
export const getOEmbedUrl = (client: ApiClient, props: GetOEmbedProps): URL => {
  const { query } = getOEmbedPropsSchema.parse(props);
  return makeUrl(client.host, '/oembed', query);
};

/**
 * Gets oEmbed data for a URL.
 * Returns structured metadata about the resource following the oEmbed specification.
 *
 * @operationId get-oembed
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (url, format, maxwidth, maxheight)
 * @returns Promise resolving to oEmbed response data
 * @example
 * ```typescript
 * const oembed = await getOEmbed(client, {
 *   query: { url: 'https://example.com/org/my-org', format: 'json' }
 * });
 * ```
 */
export const getOEmbed = async (client: ApiClient, props: GetOEmbedProps): Promise<GetOEmbedResult> => {
  const url = getOEmbedUrl(client, props);
  const response = await client.axios.get(url.toString());
  return parseResult(client, oEmbedResponseSchema, response.data);
};

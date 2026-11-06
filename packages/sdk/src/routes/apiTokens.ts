import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { Enums } from '../lib/enums.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import { apiTokenNameSchema, shortDescriptionSchema, userNameSchema } from '../lib/schemas.js';

const apiTokenStringSchema = z.string().refine(
  (token) => {
    if (token === '') {
      return true;
    }
    if (token.length !== 39) {
      return false;
    }
    if (token.startsWith('st_')) {
      return true;
    }
    if (token.startsWith('ft_')) {
      return true;
    }
    return false;
  },
  {
    message:
      'Token must be empty (for SECRET tokens) or start with "st_" (SECRET) or "ft_" (FRONTEND) and be exactly 39 characters',
  },
);

export const apiTokenSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  token: apiTokenStringSchema.default(''),
  type: z.enum(Enums.ApiTokenType),
  domainWhitelist: z.string().nullable(),
  lastUsedAt: z.iso.datetime().nullable(),
  usedCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  userId: z.number().int(),
  userName: z.string(),
});

export type APIToken = z.infer<typeof apiTokenSchema>;

export const listApiTokensSortFields = ['createdAt', 'updatedAt', 'name', 'lastUsedAt', 'usedCount'] as const;

export const listApiTokensQuerySchema = paginationOptionalSchema
  .merge(createSortingOptionalSchema(listApiTokensSortFields))
  .extend({
    userName: userNameSchema.describe('The name of the user'),
    tokenType: z.enum(Enums.ApiTokenType).optional().describe('Filter by token type (SECRET or FRONTEND)'),
  })
  .strict();

export type ListAPITokenQuery = z.infer<typeof listApiTokensQuerySchema>;

export const listApiTokensResultSchema = listResultSchema(apiTokenSchema);

export type ListAPITokenResult = z.infer<typeof listApiTokensResultSchema>;

export const listApiTokenPropsSchema = z.object({ query: listApiTokensQuerySchema }).strict();
export type ListAPITokenProps = z.infer<typeof listApiTokenPropsSchema>;

/** @internal */
export const listApiSortFields = listApiTokensSortFields;

/** @internal */
export const listApiDefaultSort: SortingFromFields<typeof listApiSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListAPITokenSortField = (typeof listApiSortFields)[number];

/**
 * Lists API tokens for an organization or project.
 *
 * @operationId list-api-tokens
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters including userName, pagination, sorting, and optional tokenType filter
 * @returns Promise resolving to a paginated list of API tokens
 */
export const listAPITokens = async (client: ApiClient, props: ListAPITokenProps): Promise<ListAPITokenResult> => {
  const { query } = listApiTokenPropsSchema.parse(props);
  const path = '/api-tokens';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listApiTokensResultSchema, response.data);
};

export const createApiTokenQuerySchema = z.strictObject({
  userName: userNameSchema.describe('The name of the user'),
});

export type CreateAPITokenQuery = z.infer<typeof createApiTokenQuerySchema>;

export const createApiTokenBodySchema = z.strictObject({
  name: apiTokenNameSchema.describe('The name for the API token'),
  description: shortDescriptionSchema.optional().describe('Optional description for the token'),
  type: z.enum(Enums.ApiTokenType).describe('Token type: SECRET (server-side) or FRONTEND (browser)'),
  domainWhitelist: z
    .string()
    .max(1024)
    .regex(/^[a-zA-Z0-9.,\s]+$/, 'Domain whitelist must contain only letters, numbers, dots, commas, and whitespace')
    .optional()
    .describe('Optional comma-separated list of allowed domains (for FRONTEND tokens)'),
});

export type CreateAPITokenBody = z.infer<typeof createApiTokenBodySchema>;

export type CreateAPITokenResult = z.infer<typeof apiTokenSchema>;

export const createApiTokenPropsSchema = z
  .object({ query: createApiTokenQuerySchema, body: createApiTokenBodySchema })
  .strict();
export type CreateAPITokenProps = z.infer<typeof createApiTokenPropsSchema>;

/**
 * Creates a new API token.
 *
 * @operationId create-api-token
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (userName)
 * @param props.body - Request body with token details
 * @returns Promise resolving to the created API token (includes the token value)
 */
export const createAPIToken = async (client: ApiClient, props: CreateAPITokenProps): Promise<CreateAPITokenResult> => {
  const { query, body } = createApiTokenPropsSchema.parse(props);
  const path = '/api-tokens';
  const response = await client.axios.post(path, body, {
    params: query,
  });
  return parseResult(client, apiTokenSchema, response.data);
};

export const deleteApiTokenParamsSchema = z.strictObject({
  apiTokenName: z.string().max(255).describe('The name of the API token to delete'),
});

export type DeleteAPITokenParams = z.infer<typeof deleteApiTokenParamsSchema>;

export const deleteApiTokenQuerySchema = z.strictObject({
  userName: userNameSchema.describe('The name of the user'),
});

export type DeleteAPITokenQuery = z.infer<typeof deleteApiTokenQuerySchema>;

export const deleteApiTokenPropsSchema = z
  .object({ params: deleteApiTokenParamsSchema, query: deleteApiTokenQuerySchema })
  .strict();
export type DeleteAPITokenProps = z.infer<typeof deleteApiTokenPropsSchema>;

/**
 * Deletes an API token by name.
 *
 * @operationId delete-api-token
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (apiTokenName)
 * @param props.query - Query parameters (userName)
 * @returns Promise that resolves when the token is deleted
 */
export const deleteAPIToken = async (client: ApiClient, props: DeleteAPITokenProps): Promise<void> => {
  const { params, query } = deleteApiTokenPropsSchema.parse(props);
  const path = buildPath('/api-tokens/$apiTokenName', params);
  await client.axios.delete(path, {
    params: query,
  });
};

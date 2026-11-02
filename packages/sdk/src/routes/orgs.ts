import { AxiosError } from 'axios';
import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { Enums } from '../lib/enums.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import { descriptionSchema, orgNameSchema, orgParamsSchema, visibilitySchema } from '../lib/schemas.js';
import { makeUrl } from '../lib/url.js';

// --- Shared entity schema ---
export const orgSchema = z.object({
  id: z.number().int().describe('The ID of the organization'),
  name: z.string().describe('The name of the organization'),
  description: z.string().describe('The description of the organization'),
  visibility: visibilitySchema.describe('The visibility of the organization'),
  location: z.string().describe('The location of the organization'),
  createdAt: z.iso.datetime().describe('The date and time the organization was created'),
  updatedAt: z.iso.datetime().describe('The date and time the organization was updated'),
  isPersonalOrg: z.boolean().describe('Whether the organization is a personal organization'),
  socialLinks: z
    .array(
      z.strictObject({
        type: z.enum(Enums.SocialLinkType),
        url: z.url(),
      }),
    )
    .default([])
    .describe('Social media links for the organization'),
});

export type Org = z.infer<typeof orgSchema>;

// --- listOrgs ---
export const listOrgsSortFields = ['createdAt', 'updatedAt', 'name'] as const;

export const listOrgsQuerySchema = paginationOptionalSchema
  .merge(createSortingOptionalSchema(listOrgsSortFields))
  .merge(
    z.strictObject({
      userName: z.string().max(100).optional().describe('Filter by username'),
      visibility: visibilitySchema.optional().describe('Filter by visibility (PUBLIC or PRIVATE)'),
    }),
  );

export type ListOrgQuery = z.infer<typeof listOrgsQuerySchema>;

export const listOrgsResultSchema = listResultSchema(orgSchema);

export type ListOrgResult = z.infer<typeof listOrgsResultSchema>;

export const listOrgPropsSchema = z.object({ query: listOrgsQuerySchema }).strict();
export type ListOrgProps = z.infer<typeof listOrgPropsSchema>;

/** @internal */
export const listOrgSortFields = listOrgsSortFields;

/** @internal */
export const listOrgDefaultSort: SortingFromFields<typeof listOrgSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListOrgSortField = (typeof listOrgSortFields)[number];

/**
 * Lists organizations with optional filtering and pagination.
 *
 * @operationId list-orgs
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters for filtering, pagination, and sorting
 * @returns Promise resolving to a paginated list of organizations
 * @example
 * ```typescript
 * const orgs = await listOrgs(client, {
 *   query: { visibility: 'PUBLIC', pageOffset: 0, pageSize: 20 }
 * });
 * ```
 */
export const listOrgs = async (client: ApiClient, props: ListOrgProps): Promise<ListOrgResult> => {
  const { query } = listOrgPropsSchema.parse(props);
  const path = '/orgs';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listOrgsResultSchema, response.data);
};

// --- getOrg, getOrgUrl, orgExists ---
export const getOrgParamsSchema = orgParamsSchema;

export type GetOrgParams = z.infer<typeof getOrgParamsSchema>;

export type GetOrgResult = z.infer<typeof orgSchema>;

export const getOrgPropsSchema = z.object({ params: getOrgParamsSchema }).strict();
export type GetOrgProps = z.infer<typeof getOrgPropsSchema>;

/**
 * Gets organization information by name.
 *
 * @operationId get-org
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName)
 * @returns Promise resolving to the organization information
 * @example
 * ```typescript
 * const org = await getOrg(client, {
 *   params: { orgName: 'my-org' }
 * });
 * ```
 */
export const getOrg = async (client: ApiClient, props: GetOrgProps): Promise<GetOrgResult> => {
  const { params } = getOrgPropsSchema.parse(props);
  const path = buildPath('/orgs/$orgName', params);
  const response = await client.axios.get(path);
  return parseResult(client, orgSchema, response.data);
};

export const getOrgUrl = (client: ApiClient, props: GetOrgProps): URL => {
  const { params } = getOrgPropsSchema.parse(props);
  const path = buildPath('/orgs/$orgName', params);
  return makeUrl(client.host, path);
};

export const orgExists = async (client: ApiClient, props: GetOrgProps): Promise<boolean> => {
  const { params } = getOrgPropsSchema.parse(props);
  const path = buildPath('/orgs/$orgName', params);
  try {
    await client.axios.get(path);
    return true;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return false;
    }
    throw error;
  }
};

// --- createOrg ---
export const createOrgBodySchema = z.strictObject({
  name: orgNameSchema.describe('The name of the organization'),
  description: descriptionSchema.optional().describe('Optional description of the organization'),
  visibility: visibilitySchema.describe('Visibility level: PUBLIC (anyone can view) or PRIVATE (members only)'),
});

export type CreateOrgBody = z.infer<typeof createOrgBodySchema>;

export type CreateOrgResult = z.infer<typeof orgSchema>;

export const createOrgPropsSchema = z.object({ body: createOrgBodySchema }).strict();
export type CreateOrgProps = z.infer<typeof createOrgPropsSchema>;

/**
 * Creates a new organization.
 *
 * @operationId create-org
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.body - Request body with organization details
 * @returns Promise resolving to the created organization
 * @example
 * ```typescript
 * const org = await createOrg(client, {
 *   body: { name: 'my-org', description: 'My organization', visibility: 'PUBLIC' }
 * });
 * ```
 */
export const createOrg = async (client: ApiClient, props: CreateOrgProps): Promise<CreateOrgResult> => {
  const { body } = createOrgPropsSchema.parse(props);
  const path = '/orgs';
  const response = await client.axios.post(path, body);
  return parseResult(client, orgSchema, response.data);
};

// --- updateOrg ---
export const updateOrgParamsSchema = orgParamsSchema;

export type UpdateOrgParams = z.infer<typeof updateOrgParamsSchema>;

export const updateOrgBodySchema = z.strictObject({
  name: orgNameSchema.optional().describe('The new name for the organization'),
  description: descriptionSchema.optional().describe('The new description for the organization'),
  location: z.string().max(256).optional().describe('The location of the organization'),
  visibility: visibilitySchema.optional().describe('The new visibility level (PUBLIC or PRIVATE)'),
  socialLinks: z
    .array(
      z.strictObject({
        type: z.enum(Enums.SocialLinkType),
        url: z.url(),
      }),
    )
    .optional()
    .describe('Social media links for the organization'),
});

export type UpdateOrgBody = z.infer<typeof updateOrgBodySchema>;

export type UpdateOrgResult = z.infer<typeof orgSchema>;

export const updateOrgPropsSchema = z.object({ params: updateOrgParamsSchema, body: updateOrgBodySchema }).strict();
export type UpdateOrgProps = z.infer<typeof updateOrgPropsSchema>;

/**
 * Updates an organization's metadata.
 *
 * @operationId update-org
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName)
 * @param props.body - Request body with fields to update
 * @returns Promise resolving to the updated organization
 * @example
 * ```typescript
 * const org = await updateOrg(client, {
 *   params: { orgName: 'my-org' },
 *   body: { description: 'Updated description', location: 'San Francisco' }
 * });
 * ```
 */
export const updateOrg = async (client: ApiClient, props: UpdateOrgProps): Promise<UpdateOrgResult> => {
  const { params, body } = updateOrgPropsSchema.parse(props);
  const path = buildPath('/orgs/$orgName', params);
  const response = await client.axios.patch(path, body);
  return parseResult(client, orgSchema, response.data);
};

// --- deleteOrg ---
export const deleteOrgParamsSchema = orgParamsSchema;

export type DeleteOrgParams = z.infer<typeof deleteOrgParamsSchema>;

export const deleteOrgResultSchema = z.void();

export const deleteOrgPropsSchema = z.object({ params: deleteOrgParamsSchema }).strict();
export type DeleteOrgProps = z.infer<typeof deleteOrgPropsSchema>;

/**
 * Deletes an organization.
 *
 * @operationId delete-org
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName)
 * @returns Promise that resolves when the organization is deleted
 * @example
 * ```typescript
 * await deleteOrg(client, {
 *   params: { orgName: 'my-org' }
 * });
 * ```
 */
export const deleteOrg = async (client: ApiClient, props: DeleteOrgProps): Promise<void> => {
  const { params } = deleteOrgPropsSchema.parse(props);
  const path = buildPath('/orgs/$orgName', params);
  await client.axios.delete(path);
};

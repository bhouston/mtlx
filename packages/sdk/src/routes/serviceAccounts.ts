import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { Enums } from '../lib/enums.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import { orgNameSchema, projectNameSchema, serviceAccountNameSchema } from '../lib/schemas.js';

export const serviceAccountSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  apiTokenCount: z.number(),
  role: z.enum(Enums.MemberRole),
});

export type ServiceAccount = z.infer<typeof serviceAccountSchema>;

export const listServiceAccountsSortFields = ['createdAt', 'name'] as const;

export const listServiceAccountsQuerySchema = z.union([
  paginationOptionalSchema
    .merge(createSortingOptionalSchema(listServiceAccountsSortFields))
    .extend({
      orgName: orgNameSchema.describe('The name of the organization'),
      projectName: projectNameSchema.describe('The name of the project'),
    })
    .strict(),
  paginationOptionalSchema
    .merge(createSortingOptionalSchema(listServiceAccountsSortFields))
    .extend({
      orgName: orgNameSchema.describe('The name of the organization'),
    })
    .strict(),
]);

export type ListServiceAccountQuery = z.infer<typeof listServiceAccountsQuerySchema>;

export const listServiceAccountsResultSchema = listResultSchema(serviceAccountSchema);

export type ListServiceAccountResult = z.infer<typeof listServiceAccountsResultSchema>;

export const listServiceAccountPropsSchema = z.object({ query: listServiceAccountsQuerySchema }).strict();
export type ListServiceAccountProps = z.infer<typeof listServiceAccountPropsSchema>;

/** @internal */
export const listServiceAccountSortFields = listServiceAccountsSortFields;

/** @internal */
export const listServiceAccountDefaultSort: SortingFromFields<typeof listServiceAccountSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListServiceAccountSortField = (typeof listServiceAccountSortFields)[number];

/**
 * Lists service accounts with optional filtering and pagination.
 *
 * @operationId list-service-accounts
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters for filtering, pagination, and sorting
 * @returns Promise resolving to a paginated list of service accounts
 */
export const listServiceAccounts = async (
  client: ApiClient,
  props: ListServiceAccountProps,
): Promise<ListServiceAccountResult> => {
  const { query } = listServiceAccountPropsSchema.parse(props);
  const path = '/service-accounts';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listServiceAccountsResultSchema, response.data);
};

export const createServiceAccountQuerySchema = z.union([
  z.strictObject({
    orgName: orgNameSchema.describe('The name of the organization'),
    projectName: projectNameSchema.describe('The name of the project'),
  }),
  z.strictObject({
    orgName: orgNameSchema.describe('The name of the organization'),
  }),
]);

export type CreateServiceAccountQuery = z.infer<typeof createServiceAccountQuerySchema>;

export const createServiceAccountBodySchema = z.strictObject({
  name: serviceAccountNameSchema.describe('The name of the service account (must start with "sa-")'),
  role: z.enum(Enums.MemberRole).describe('The role to assign to the service account'),
});

export type CreateServiceAccountBody = z.infer<typeof createServiceAccountBodySchema>;

export const createServiceAccountPropsSchema = z
  .object({ query: createServiceAccountQuerySchema, body: createServiceAccountBodySchema })
  .strict();
export type CreateServiceAccountProps = z.infer<typeof createServiceAccountPropsSchema>;

/**
 * Creates a new service account in an organization or project.
 *
 * @operationId create-service-account
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (orgName, optional projectName)
 * @param props.body - Request body with service account name
 * @returns Promise resolving to the created service account
 */
export const createServiceAccount = async (
  client: ApiClient,
  props: CreateServiceAccountProps,
): Promise<ServiceAccount> => {
  const { query, body } = createServiceAccountPropsSchema.parse(props);
  const path = '/service-accounts';
  const response = await client.axios.post(path, body, {
    params: query,
  });
  return parseResult(client, serviceAccountSchema, response.data);
};

export const deleteServiceAccountParamsSchema = z.strictObject({
  serviceAccountName: serviceAccountNameSchema,
});

export type DeleteServiceAccountParams = z.infer<typeof deleteServiceAccountParamsSchema>;

export const deleteServiceAccountQuerySchema = z.union([
  z.strictObject({
    orgName: orgNameSchema,
    projectName: projectNameSchema,
  }),
  z.strictObject({
    orgName: orgNameSchema,
  }),
]);

export type DeleteServiceAccountQuery = z.infer<typeof deleteServiceAccountQuerySchema>;

export const deleteServiceAccountPropsSchema = z
  .object({ params: deleteServiceAccountParamsSchema, query: deleteServiceAccountQuerySchema })
  .strict();
export type DeleteServiceAccountProps = z.infer<typeof deleteServiceAccountPropsSchema>;

/**
 * Deletes a service account.
 *
 * @operationId delete-service-account
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (serviceAccountName)
 * @param props.query - Query parameters (orgName, optional projectName)
 * @returns Promise that resolves when the service account is deleted
 */
export const deleteServiceAccount = async (client: ApiClient, props: DeleteServiceAccountProps): Promise<void> => {
  const { params, query } = deleteServiceAccountPropsSchema.parse(props);
  const path = buildPath('/service-accounts/$serviceAccountName', params);
  await client.axios.delete(path, {
    params: query,
  });
};

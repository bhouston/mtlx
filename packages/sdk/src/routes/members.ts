import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { Enums } from '../lib/enums.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import { orgNameSchema, projectNameSchema } from '../lib/schemas.js';

export const memberSchema = z.object({
  id: z.number().int().describe('The ID of the member'),
  role: z.enum(Enums.MemberRole).describe('The role of the member'),
  createdAt: z.iso.datetime().describe('The date and time the member was created'),
  updatedAt: z.iso.datetime().describe('The date and time the member was updated'),
  userId: z.number().int().describe('The ID of the user who is a member'),
  orgId: z.number().int().nullable().describe('The ID of the organization'),
  projectId: z.number().int().nullable().describe('The ID of the project'),
  userName: z.string().describe('The username of the user who is a member'),
  orgName: z.string().nullable().describe('The name of the organization'),
  projectName: z.string().nullable().describe('The name of the project'),
  projectOrgId: z.number().int().nullable().describe('The ID of the project organization'),
  projectOrgName: z.string().nullable().describe('The name of the project organization'),
});

export type Member = z.infer<typeof memberSchema>;

export const listMembersSortFields = ['createdAt', 'updatedAt', 'role'] as const;

export const listMembersQuerySchema = z.union([
  paginationOptionalSchema
    .merge(createSortingOptionalSchema(listMembersSortFields))
    .extend({
      role: z.enum(Enums.MemberRole).optional().describe('Filter by member role'),
      orgName: orgNameSchema.describe('The name of the organization'),
      projectName: projectNameSchema.describe('The name of the project'),
    })
    .strict(),
  paginationOptionalSchema
    .merge(createSortingOptionalSchema(listMembersSortFields))
    .extend({
      role: z.enum(Enums.MemberRole).optional().describe('Filter by member role'),
      orgName: orgNameSchema.describe('The name of the organization'),
    })
    .strict(),
]);

export type ListMemberQuery = z.infer<typeof listMembersQuerySchema>;

export const listMembersResultSchema = listResultSchema(memberSchema);

export type ListMemberResult = z.infer<typeof listMembersResultSchema>;

export const listMemberPropsSchema = z.object({ query: listMembersQuerySchema }).strict();
export type ListMemberProps = z.infer<typeof listMemberPropsSchema>;

/** @internal */
export const listMemberSortFields = listMembersSortFields;

/** @internal */
export const listMemberDefaultSort: SortingFromFields<typeof listMemberSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListMemberSortField = (typeof listMemberSortFields)[number];

/**
 * Lists members of an organization or project.
 *
 * @operationId list-members
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (orgName, optional projectName, pagination, sorting, optional role filter)
 * @returns Promise resolving to a paginated list of members
 */
export const listMembers = async (client: ApiClient, props: ListMemberProps): Promise<ListMemberResult> => {
  const { query } = listMemberPropsSchema.parse(props);
  const path = '/members';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listMembersResultSchema, response.data);
};

export const deleteMemberQuerySchema = z.union([
  z.strictObject({
    userName: z.string().max(100),
    orgName: orgNameSchema,
    projectName: projectNameSchema,
  }),
  z.strictObject({
    userName: z.string().max(100),
    orgName: orgNameSchema,
  }),
]);

export type DeleteMemberQuery = z.infer<typeof deleteMemberQuerySchema>;

export const deleteMemberPropsSchema = z.strictObject({ query: deleteMemberQuerySchema });
export type DeleteMemberProps = z.infer<typeof deleteMemberPropsSchema>;

/**
 * Removes a member from an organization or project.
 *
 * @operationId delete-member
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (userName, orgName, optional projectName)
 * @returns Promise that resolves when the member is removed
 */
export const deleteMember = async (client: ApiClient, props: DeleteMemberProps): Promise<void> => {
  const { query } = deleteMemberPropsSchema.parse(props);
  const path = '/members';
  await client.axios.delete(path, {
    params: query,
  });
};

export const updateMemberQuerySchema = z.union([
  z.strictObject({
    userName: z.string().max(100),
    orgName: orgNameSchema,
  }),
  z.strictObject({
    userName: z.string().max(100),
    orgName: orgNameSchema,
    projectName: projectNameSchema,
  }),
]);

export type UpdateMemberQuery = z.infer<typeof updateMemberQuerySchema>;

export const updateMemberBodySchema = z.strictObject({
  role: z.enum(Enums.MemberRole),
});

export type UpdateMemberBody = z.infer<typeof updateMemberBodySchema>;

export type UpdateMemberResult = z.infer<typeof memberSchema>;

export const updateMemberPropsSchema = z
  .object({ query: updateMemberQuerySchema, body: updateMemberBodySchema })
  .strict();
export type UpdateMemberProps = z.infer<typeof updateMemberPropsSchema>;

/**
 * Updates a member's role in an organization or project.
 *
 * @operationId update-member
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (userName, orgName, optional projectName)
 * @param props.body - Request body with new role
 * @returns Promise resolving to the updated member
 */
export const updateMember = async (client: ApiClient, props: UpdateMemberProps): Promise<UpdateMemberResult> => {
  const { query, body } = updateMemberPropsSchema.parse(props);
  const path = '/members';
  const response = await client.axios.patch(path, body, {
    params: query,
  });
  return parseResult(client, memberSchema, response.data);
};

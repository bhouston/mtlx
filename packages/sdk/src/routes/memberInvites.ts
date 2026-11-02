import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { Enums } from '../lib/enums.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import { jwtSchema, orgNameSchema, projectNameSchema, userNameSchema } from '../lib/schemas.js';
import { makeUrl } from '../lib/url.js';

// --- Shared entity schema ---
export const memberInviteSchema = z.object({
  id: z.number().int().describe('The ID of the member invite'),
  role: z.enum(Enums.MemberRole).describe('The role of the member invite'),
  status: z.enum(Enums.MemberInviteStatus).describe('The status of the member invite'),
  createdAt: z.iso.datetime().describe('The date and time the member invite was created'),
  updatedAt: z.iso.datetime().optional().describe('The date and time the member invite was updated'),
  invitedByUserId: z.number().int().describe('The ID of the user who invited the member'),
  inviteeUserId: z.number().int().nullable().describe('The ID of the user who was invited'),
  inviteeEmail: z.string().nullable().describe('The email of the user who was invited'),
  memberId: z.number().int().nullable().describe('The ID of the member who was invited'),
  orgId: z.number().int().nullable().describe('The ID of the organization'),
  projectId: z.number().int().nullable().describe('The ID of the project'),
  orgName: z.string().nullable().describe('The name of the organization'),
  projectName: z.string().nullable().describe('The name of the project'),
  userAccountEmail: z.string().nullable().describe('The email of the user who was invited'),
  userFullName: z.string().nullable().describe('The full name of the user who was invited'),
  userName: z.string().nullable().describe('The username of the user who was invited'),
  userPersonalOrgId: z
    .number()
    .int()
    .nullable()
    .describe('The ID of the personal organization of the user who was invited'),
});

export type MemberInvite = z.infer<typeof memberInviteSchema>;

// --- createMemberInvite ---
export const createMemberInviteQuerySchema = z.union([
  z.strictObject({
    orgName: orgNameSchema.describe('The name of the organization'),
    projectName: projectNameSchema.describe('The name of the project'),
  }),
  z.strictObject({
    orgName: orgNameSchema.describe('The name of the organization'),
  }),
]);

export type CreateMemberInviteQuery = z.infer<typeof createMemberInviteQuerySchema>;

export const createMemberInviteBodySchema = z.strictObject({
  usernameOrEmail: z.string().min(1).max(255).describe('The username or email of the user to invite'),
  role: z.enum(Enums.MemberRole).describe('The role to assign to the member'),
});

export type CreateMemberInviteBody = z.infer<typeof createMemberInviteBodySchema>;

export type CreateMemberInviteResult = z.infer<typeof memberInviteSchema>;

export const createMemberInvitePropsSchema = z
  .object({ query: createMemberInviteQuerySchema, body: createMemberInviteBodySchema })
  .strict();
export type CreateMemberInviteProps = z.infer<typeof createMemberInvitePropsSchema>;

/**
 * Creates a member invite for an organization or project.
 *
 * @operationId create-member-invite
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (orgName, optional projectName)
 * @param props.body - Request body with usernameOrEmail and role
 * @returns Promise resolving to the created member invite
 */
export const createMemberInvite = async (
  client: ApiClient,
  props: CreateMemberInviteProps,
): Promise<CreateMemberInviteResult> => {
  const { query, body } = createMemberInvitePropsSchema.parse(props);
  const path = '/member-invites';
  const response = await client.axios.post(path, body, {
    params: query,
  });
  return parseResult(client, memberInviteSchema, response.data);
};

// --- listMemberInvites ---
export const listMemberInvitesSortFields = ['createdAt', 'status', 'role'] as const;

export const listMemberInvitesQuerySchema = z.union([
  paginationOptionalSchema
    .merge(createSortingOptionalSchema(listMemberInvitesSortFields))
    .merge(
      z.strictObject({
        status: z.enum(Enums.MemberInviteStatus).optional(),
        orgName: orgNameSchema,
        projectName: projectNameSchema.optional(),
      }),
    )
    .strict(),
  paginationOptionalSchema
    .merge(createSortingOptionalSchema(listMemberInvitesSortFields))
    .merge(
      z.strictObject({
        status: z.enum(Enums.MemberInviteStatus).optional(),
        userName: userNameSchema,
      }),
    )
    .strict(),
]);

export type ListMemberInviteQuery = z.infer<typeof listMemberInvitesQuerySchema>;

export const listMemberInvitesResultSchema = listResultSchema(memberInviteSchema);

export type ListMemberInviteResult = z.infer<typeof listMemberInvitesResultSchema>;

export const listMemberInvitePropsSchema = z.object({ query: listMemberInvitesQuerySchema }).strict();
export type ListMemberInviteProps = z.infer<typeof listMemberInvitePropsSchema>;

/** @internal */
export const listMemberInviteSortFields = listMemberInvitesSortFields;

/** @internal */
export const listMemberInviteDefaultSort: SortingFromFields<typeof listMemberInviteSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListMemberInviteSortField = (typeof listMemberInviteSortFields)[number];

/**
 * Lists member invites with optional filtering and pagination.
 *
 * @operationId list-member-invites
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters for filtering, pagination, and sorting
 * @returns Promise resolving to a paginated list of member invites
 */
export const listMemberInvites = async (
  client: ApiClient,
  props: ListMemberInviteProps,
): Promise<ListMemberInviteResult> => {
  const { query } = listMemberInvitePropsSchema.parse(props);
  const path = '/member-invites';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listMemberInvitesResultSchema, response.data);
};

// --- getMemberInvite, getMemberInviteUrl ---
export const getMemberInviteParamsSchema = z.strictObject({
  memberInviteId: z.coerce.number().int(),
});

export type GetMemberInviteParams = z.infer<typeof getMemberInviteParamsSchema>;

export type GetMemberInviteResult = z.infer<typeof memberInviteSchema>;

export const getMemberInvitePropsSchema = z.object({ params: getMemberInviteParamsSchema }).strict();
export type GetMemberInviteProps = z.infer<typeof getMemberInvitePropsSchema>;

/**
 * Gets member invite information by ID.
 *
 * @operationId get-member-invite
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (memberInviteId)
 * @returns Promise resolving to the member invite information
 */
export const getMemberInvite = async (
  client: ApiClient,
  props: GetMemberInviteProps,
): Promise<GetMemberInviteResult> => {
  const { params } = getMemberInvitePropsSchema.parse(props);
  const path = buildPath('/member-invites/$memberInviteId', params);
  const response = await client.axios.get(path);
  return parseResult(client, memberInviteSchema, response.data);
};

/**
 * Gets the URL for a member invite.
 *
 * @operationId get-member-invite
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (memberInviteId)
 * @returns URL object for the member invite
 */
export const getMemberInviteUrl = (client: ApiClient, props: GetMemberInviteProps): URL => {
  const { params } = getMemberInvitePropsSchema.parse(props);
  const path = buildPath('/member-invites/$memberInviteId', params);
  return makeUrl(client.host, path);
};

// --- deleteMemberInvite ---
export const deleteMemberInviteParamsSchema = z.strictObject({
  memberInviteId: z.coerce.number().int(),
});

export type DeleteMemberInviteParams = z.infer<typeof deleteMemberInviteParamsSchema>;

export const deleteMemberInvitePropsSchema = z.object({ params: deleteMemberInviteParamsSchema }).strict();
export type DeleteMemberInviteProps = z.infer<typeof deleteMemberInvitePropsSchema>;

/**
 * Deletes a member invite.
 *
 * @operationId delete-member-invite
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (memberInviteId)
 * @returns Promise that resolves when the member invite is deleted
 */
export const deleteMemberInvite = async (client: ApiClient, props: DeleteMemberInviteProps): Promise<void> => {
  const { params } = deleteMemberInvitePropsSchema.parse(props);
  const path = buildPath('/member-invites/$memberInviteId', params);
  await client.axios.delete(path);
};

// --- respondToMemberInvite ---
export const respondToMemberInviteParamsSchema = z.strictObject({
  memberInviteId: z.coerce.number().int(),
});

export type RespondToMemberInviteParams = z.infer<typeof respondToMemberInviteParamsSchema>;

export const respondToMemberInviteBodySchema = z.strictObject({
  status: z.enum(['ACCEPT', 'REJECT']),
});

export type RespondToMemberInviteBody = z.infer<typeof respondToMemberInviteBodySchema>;

export const respondToMemberInvitePropsSchema = z
  .object({ params: respondToMemberInviteParamsSchema, body: respondToMemberInviteBodySchema })
  .strict();
export type RespondToMemberInviteProps = z.infer<typeof respondToMemberInvitePropsSchema>;

/**
 * Responds to a member invite (accept or reject).
 *
 * @operationId respond-to-member-invite
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (memberInviteId)
 * @param props.body - Request body with status (ACCEPT or REJECT)
 * @returns Promise that resolves when the response is processed
 */
export const respondToMemberInvite = async (client: ApiClient, props: RespondToMemberInviteProps): Promise<void> => {
  const { params, body } = respondToMemberInvitePropsSchema.parse(props);
  const path = buildPath('/member-invites/$memberInviteId', params);
  await client.axios.post(path, body);
};

// --- respondToMemberInviteToken ---
export const respondToMemberInviteTokenQuerySchema = z.strictObject({
  inviteToken: jwtSchema,
});

export type RespondToMemberInviteTokenQuery = z.infer<typeof respondToMemberInviteTokenQuerySchema>;

export const respondToMemberInviteTokenBodySchema = z.strictObject({
  status: z.enum(['ACCEPT', 'REJECT']),
});

export type RespondToMemberInviteTokenBody = z.infer<typeof respondToMemberInviteTokenBodySchema>;

export const respondToMemberInviteTokenPropsSchema = z
  .object({ query: respondToMemberInviteTokenQuerySchema, body: respondToMemberInviteTokenBodySchema })
  .strict();
export type RespondToMemberInviteTokenProps = z.infer<typeof respondToMemberInviteTokenPropsSchema>;

/**
 * Responds to a member invite using an invite token.
 *
 * @operationId respond-to-member-invite-token
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (inviteToken)
 * @param props.body - Request body with status (ACCEPT or REJECT)
 * @returns Promise that resolves when the response is processed
 */
export const respondToMemberInviteToken = async (
  client: ApiClient,
  props: RespondToMemberInviteTokenProps,
): Promise<void> => {
  const { query, body } = respondToMemberInviteTokenPropsSchema.parse(props);
  const path = '/member-invites/token';
  await client.axios.post(path, body, {
    params: query,
  });
};

// --- getMemberInviteFromToken ---
export const getMemberInviteFromTokenQuerySchema = z.strictObject({
  inviteToken: jwtSchema,
});

export type GetMemberInviteFromTokenQuery = z.infer<typeof getMemberInviteFromTokenQuerySchema>;

export const getMemberInviteFromTokenResultSchema = z.strictObject({
  invite: memberInviteSchema,
  targetName: z.string().nullable(),
});

export type GetMemberInviteFromTokenResult = z.infer<typeof getMemberInviteFromTokenResultSchema>;

export const getMemberInviteFromTokenPropsSchema = z.object({ query: getMemberInviteFromTokenQuerySchema }).strict();
export type GetMemberInviteFromTokenProps = z.infer<typeof getMemberInviteFromTokenPropsSchema>;

/**
 * Gets member invite information from an invite token.
 *
 * @operationId get-member-invite-from-token
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (inviteToken)
 * @returns Promise resolving to the member invite information and target name
 */
export const getMemberInviteFromToken = async (
  client: ApiClient,
  props: GetMemberInviteFromTokenProps,
): Promise<GetMemberInviteFromTokenResult> => {
  const { query } = getMemberInviteFromTokenPropsSchema.parse(props);
  const path = '/member-invites/token';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, getMemberInviteFromTokenResultSchema, response.data);
};

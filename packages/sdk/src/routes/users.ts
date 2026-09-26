import { AxiosError } from 'axios';
import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { Enums } from '../lib/enums.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import { userNameParamsSchema, userNameSchema } from '../lib/schemas.js';

// --- Shared entity schemas ---
export const userSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const privateUserSchema = z.object({
  id: z.number().int().describe('The ID of the user'),
  name: z.string().describe('The username of the user'),
  createdAt: z.iso.datetime().describe('The date and time the user was created'),
  updatedAt: z.iso.datetime().describe('The date and time the user was updated'),
  email: z.string().describe('The email of the user'),
  fullName: z.string().describe('The full name of the user'),
  country: z.enum(Enums.CountryCode).nullable().describe('The country of the user (null for service accounts)'),
  company: z.string().describe('The company of the user'),
  city: z.string().describe('The city of the user'),
  role: z.string().describe('The role of the user'),
  phoneNumber: z.string().describe('The phone number of the user'),
  type: z.enum(Enums.UserType).describe('The type of the user'),
  emailNotifications: z.boolean().describe('Whether the user receives email notifications'),
  emailNewsletterUpdates: z.boolean().describe('Whether the user receives email newsletter updates'),
  emailAssetLikeNotifications: z.boolean().describe('Whether the user receives email asset like notifications'),
  emailCommentLikeNotifications: z.boolean().describe('Whether the user receives email comment like notifications'),
});

export type PrivateUser = z.infer<typeof privateUserSchema>;

// --- listUsers ---
export const listUsersSortFields = ['createdAt', 'email', 'name', 'fullName'] as const;

export const listUsersQuerySchema = paginationOptionalSchema
  .merge(createSortingOptionalSchema(listUsersSortFields))
  .merge(
    z.strictObject({
      searchText: z.string().max(256).optional(),
    }),
  );

export type ListUserQuery = z.infer<typeof listUsersQuerySchema>;

export const listUsersResultSchema = listResultSchema(userSchema);

export type ListUserResult = z.infer<typeof listUsersResultSchema>;

export const listUserPropsSchema = z.object({ query: listUsersQuerySchema }).strict();
export type ListUserProps = z.infer<typeof listUserPropsSchema>;

/** @internal */
export const listUserSortFields = listUsersSortFields;

/** @internal */
export const listUserDefaultSort: SortingFromFields<typeof listUserSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListUserSortField = (typeof listUserSortFields)[number];

/**
 * Lists users with optional search and pagination.
 *
 * @operationId list-users
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters for filtering, pagination, and sorting
 * @returns Promise resolving to a paginated list of users
 * @example
 * ```typescript
 * const users = await listUsers(client, {
 *   query: { searchText: 'john', pageOffset: 0, pageSize: 20 }
 * });
 * ```
 */
export const listUsers = async (client: ApiClient, props: ListUserProps): Promise<ListUserResult> => {
  const { query } = listUserPropsSchema.parse(props);
  const path = '/users';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listUsersResultSchema, response.data);
};

// --- getUser, userExists ---
export const getUserParamsSchema = userNameParamsSchema;

export type GetUserParams = z.infer<typeof getUserParamsSchema>;

export type GetUserResult = z.infer<typeof userSchema>;

export const getUserPropsSchema = z.object({ params: getUserParamsSchema }).strict();
export type GetUserProps = z.infer<typeof getUserPropsSchema>;

/**
 * Gets user information by username.
 *
 * @operationId get-user
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName)
 * @returns Promise resolving to the user information
 * @example
 * ```typescript
 * const user = await getUser(client, {
 *   params: { userName: 'john-doe' }
 * });
 * ```
 */
export const getUser = async (client: ApiClient, props: GetUserProps): Promise<GetUserResult> => {
  const { params } = getUserPropsSchema.parse(props);
  const path = buildPath('/users/$userName', params);
  const response = await client.axios.get(path);
  return parseResult(client, userSchema, response.data);
};

export const userExists = async (client: ApiClient, props: GetUserProps): Promise<boolean> => {
  const { params } = getUserPropsSchema.parse(props);
  const path = buildPath('/users/$userName', params);
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

// --- getUserPrivate ---
export const getUserPrivateParamsSchema = userNameParamsSchema;

export type GetUserPrivateParams = z.infer<typeof getUserPrivateParamsSchema>;

export type GetUserPrivateResult = z.infer<typeof privateUserSchema>;

export const getUserPrivatePropsSchema = z.object({ params: getUserPrivateParamsSchema }).strict();
export type GetUserPrivateProps = z.infer<typeof getUserPrivatePropsSchema>;

/**
 * Gets private user information by username.
 */
export const getUserPrivate = async (client: ApiClient, props: GetUserPrivateProps): Promise<GetUserPrivateResult> => {
  const { params } = getUserPrivatePropsSchema.parse(props);
  const path = buildPath('/users/$userName/private', params);
  const response = await client.axios.get(path);
  return parseResult(client, privateUserSchema, response.data);
};

// --- updateUser ---
export const updateUserParamsSchema = userNameParamsSchema;

export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;

export const updateUserBodySchema = z.strictObject({
  name: userNameSchema.optional(),
  fullName: z.string().max(255).optional(),
  country: z.enum(Enums.CountryCode).nullable().optional(),
  city: z.string().max(100).optional(),
  role: z.string().max(255).optional(),
  company: z.string().max(255).optional(),
  phoneNumber: z.string().max(50).optional(),
  emailNotifications: z.boolean().optional(),
  emailNewsletterUpdates: z.boolean().optional(),
  emailAssetLikeNotifications: z.boolean().optional(),
  emailCommentLikeNotifications: z.boolean().optional(),
});

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

export type UpdateUserResult = z.infer<typeof privateUserSchema>;

export const updateUserPropsSchema = z.object({ params: updateUserParamsSchema, body: updateUserBodySchema }).strict();
export type UpdateUserProps = z.infer<typeof updateUserPropsSchema>;

/**
 * Updates a user.
 */
export const updateUser = async (client: ApiClient, props: UpdateUserProps): Promise<UpdateUserResult> => {
  const { params, body } = updateUserPropsSchema.parse(props);
  const path = buildPath('/users/$userName', params);
  const response = await client.axios.patch(path, body);
  return parseResult(client, privateUserSchema, response.data);
};

// --- deleteUser ---
export const deleteUserParamsSchema = userNameParamsSchema;

export type DeleteUserParams = z.infer<typeof deleteUserParamsSchema>;

export const deleteUserResultSchema = z.void();

export const deleteUserPropsSchema = z.object({ params: deleteUserParamsSchema }).strict();
export type DeleteUserProps = z.infer<typeof deleteUserPropsSchema>;

/**
 * Deletes a user.
 */
export const deleteUser = async (client: ApiClient, props: DeleteUserProps): Promise<void> => {
  const { params } = deleteUserPropsSchema.parse(props);
  const path = buildPath('/users/$userName', params);
  await client.axios.delete(path);
};

// --- listUserSessions ---
export const userSessionSchema = z.strictObject({
  id: z.number().int(),
  ipAddress: z.string(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  client: z.string().nullable(),
  createdAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
});

export type UserSession = z.infer<typeof userSessionSchema>;

export const listUserSessionsSortFields = ['createdAt', 'lastUsedAt', 'expiresAt', 'ipAddress'] as const;

export const listUserSessionsQuerySchema = paginationOptionalSchema.merge(
  createSortingOptionalSchema(listUserSessionsSortFields),
);

export type ListUserSessionsQuery = z.infer<typeof listUserSessionsQuerySchema>;

export const listUserSessionsResultSchema = listResultSchema(userSessionSchema);

export type ListUserSessionsResult = z.infer<typeof listUserSessionsResultSchema>;

export const listUserSessionsParamsSchema = userNameParamsSchema;

export type ListUserSessionsParams = z.infer<typeof listUserSessionsParamsSchema>;

export const listUserSessionsPropsSchema = z
  .object({ params: listUserSessionsParamsSchema, query: listUserSessionsQuerySchema })
  .strict();
export type ListUserSessionsProps = z.infer<typeof listUserSessionsPropsSchema>;

/** @internal */
export const listUserSessionsSortFieldsExport = listUserSessionsSortFields;

/** @internal */
export const listUserSessionsDefaultSort: SortingFromFields<typeof listUserSessionsSortFieldsExport> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListUserSessionsSortField = (typeof listUserSessionsSortFieldsExport)[number];

/**
 * Lists active user sessions for a user with pagination and sorting.
 * **SECURITY: Does NOT return userSessionToken** - only public session data.
 *
 * @operationId list-user-sessions
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName)
 * @param props.query - Query parameters for pagination and sorting
 * @returns Promise resolving to a paginated list of user sessions
 * @example
 * ```typescript
 * const sessions = await listUserSessions(client, {
 *   params: { userName: 'john-doe' },
 *   query: { pageOffset: 0, pageSize: 20 }
 * });
 * ```
 */
export const listUserSessions = async (
  client: ApiClient,
  props: ListUserSessionsProps,
): Promise<ListUserSessionsResult> => {
  const { params, query } = listUserSessionsPropsSchema.parse(props);
  const path = buildPath('/users/$userName/sessions', params);
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listUserSessionsResultSchema, response.data);
};

// --- endUserSession ---
export const endUserSessionParamsSchema = userNameParamsSchema.extend({
  sessionId: z.coerce.number().int(),
});

export type EndUserSessionParams = z.infer<typeof endUserSessionParamsSchema>;

export const endUserSessionPropsSchema = z.object({ params: endUserSessionParamsSchema }).strict();
export type EndUserSessionProps = z.infer<typeof endUserSessionPropsSchema>;

/**
 * Ends a user session by marking it as deleted.
 *
 * @operationId end-user-session
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName, sessionId)
 * @returns Promise resolving when the session is ended
 * @example
 * ```typescript
 * await endUserSession(client, {
 *   params: { userName: 'john-doe', sessionId: '...' }
 * });
 * ```
 */
export const endUserSession = async (client: ApiClient, props: EndUserSessionProps): Promise<void> => {
  const { params } = endUserSessionPropsSchema.parse(props);
  const path = buildPath('/users/$userName/sessions/$sessionId', params);
  await client.axios.delete(path);
};

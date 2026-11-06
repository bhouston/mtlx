import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { fetchBinary } from '../lib/fetchBinary.js';
import { userNameSchema } from '../lib/schemas.js';
import {
  type BinaryResponse,
  type BinaryResponseType,
  defaultBinaryResponse,
  imageTransformOptionsSchemaProps,
} from '../lib/types.js';
import { makeUrl } from '../lib/url.js';

const commonQuerySchemaProps = {
  ...imageTransformOptionsSchemaProps,
  redirectOnNotFound: z.url().optional(),
  cacheKey: z.string().max(256).optional(),
};

export const uploadAvatarQuerySchema = z.strictObject({
  userName: userNameSchema,
});

export type UploadAvatarQuery = z.infer<typeof uploadAvatarQuerySchema>;

export const uploadAvatarBodySchema = z.strictObject({
  file: z.instanceof(File),
});

export type UploadAvatarBody = z.infer<typeof uploadAvatarBodySchema>;

export const uploadAvatarPropsSchema = z
  .object({ query: uploadAvatarQuerySchema, body: uploadAvatarBodySchema })
  .strict();
export type UploadAvatarProps = z.infer<typeof uploadAvatarPropsSchema>;

/**
 * Uploads an avatar for a user.
 *
 * @operationId upload-avatar
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (userName)
 * @param props.body - Request body containing the file to upload
 * @returns Promise that resolves when the avatar is uploaded
 * @example
 * ```typescript
 * await uploadAvatar(client, {
 *   query: { userName: 'my-user' },
 *   body: { file: avatarFile }
 * });
 * ```
 */
export const uploadAvatar = async (client: ApiClient, props: UploadAvatarProps): Promise<void> => {
  const { query, body } = uploadAvatarPropsSchema.parse(props);
  const path = '/avatars';
  const formData = new FormData();
  formData.append('file', body.file);
  await client.axios.post(path, formData, {
    params: query,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getAvatarQuerySchema = z.strictObject({
  ...commonQuerySchemaProps,
  userName: userNameSchema,
});

export type GetAvatarQuery = z.infer<typeof getAvatarQuerySchema>;

export const getAvatarPropsSchema = z.object({ query: getAvatarQuerySchema }).strict();
export type GetAvatarProps = z.infer<typeof getAvatarPropsSchema>;

/**
 * Gets the URL for an avatar.
 *
 * @operationId get-avatar
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (userName, image transform options)
 * @returns URL object for the avatar
 * @example
 * ```typescript
 * const avatarUrl = getAvatarUrl(client, {
 *   query: { userName: 'my-user', width: 200, height: 200 }
 * });
 * ```
 */
export const getAvatarUrl = (client: ApiClient, props: GetAvatarProps): URL => {
  const { query } = getAvatarPropsSchema.parse(props);
  const path = `/avatars`;
  return makeUrl(client.host, path, query);
};

/**
 * Gets avatar binary data.
 *
 * @operationId get-avatar
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (userName, image transform options)
 * @param binaryResponse - Optional binary response type configuration
 * @returns Promise resolving to the avatar binary data
 * @example
 * ```typescript
 * const avatarData = await getAvatar(client, {
 *   query: { userName: 'my-user', width: 200, height: 200 }
 * });
 * ```
 */
export const getAvatar = async <T extends BinaryResponse>(
  client: ApiClient,
  props: GetAvatarProps,
  binaryResponse = defaultBinaryResponse<T>(),
): Promise<BinaryResponseType<T>> => {
  const url = getAvatarUrl(client, props);
  const response = await fetchBinary(client.axios, url.toString(), { params: props.query }, binaryResponse);
  return response.data;
};

export const deleteAvatarQuerySchema = z.strictObject({
  userName: userNameSchema,
});

export type DeleteAvatarQuery = z.infer<typeof deleteAvatarQuerySchema>;

export const deleteAvatarPropsSchema = z.object({ query: deleteAvatarQuerySchema }).strict();
export type DeleteAvatarProps = z.infer<typeof deleteAvatarPropsSchema>;

/**
 * Deletes a user's avatar.
 *
 * @operationId delete-avatar
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (userName)
 * @returns Promise that resolves when the avatar is deleted
 * @example
 * ```typescript
 * await deleteAvatar(client, {
 *   query: { userName: 'my-user' }
 * });
 * ```
 */
export const deleteAvatar = async (client: ApiClient, props: DeleteAvatarProps): Promise<void> => {
  const { query } = deleteAvatarPropsSchema.parse(props);
  const path = `/avatars`;
  await client.axios.delete(path, {
    params: query,
  });
};

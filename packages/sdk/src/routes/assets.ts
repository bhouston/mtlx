import { AxiosError } from 'axios';
import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { Enums } from '../lib/enums.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import {
  aiUsageSchema,
  assetNameSchema,
  assetParamsSchema,
  assetVisibilitySchema,
  booleanPropSchema,
  descriptionSchema,
  userNameParamsSchema,
} from '../lib/schemas.js';
import { ImageTransformOptionsSchema } from '../lib/types.js';

export const materialInfoSchema = z.object({
  version: z.string().optional(),
  colorspace: z.string().optional(),
  materials: z.array(z.object({ name: z.string().optional(), category: z.string() })),
  nodeGraphCount: z.number().int(),
  topLevelNodeCount: z.number().int(),
  referencedTextures: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type MaterialInfo = z.infer<typeof materialInfoSchema>;

export const assetSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  type: z.enum(Enums.AssetType),
  visibility: assetVisibilitySchema,
  userId: z.number().int(),
  userName: z.string(),
  description: z.string(),
  keywords: z.string(),
  shareLicense: z.enum(Enums.ShareLicense),
  aiUsage: aiUsageSchema,
  commentMode: z.enum(Enums.CommentMode),
  reported: z.boolean(),
  likeCount: z.int(),
  shareCount: z.int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  archived: z.boolean(),
  metadata: z.string().max(10_240),
  versionOriginalSize: z.number().int().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  depth: z.number().nullable().optional(),
  fileOid: z.string(),
  thumbnailOid: z.string().nullable().optional(),
  materialInfo: materialInfoSchema.optional(),
});

export type Asset = z.infer<typeof assetSchema>;

export const getAssetThumbnailParamsSchema = assetParamsSchema;

export type GetAssetThumbnailParams = z.infer<typeof getAssetThumbnailParamsSchema>;

export const getAssetThumbnailQuerySchema = ImageTransformOptionsSchema.merge(
  z.strictObject({
    redirectOnNotFound: z.url().optional().describe('The URL to redirect if the asset is not found'),
  }),
);

export type GetAssetThumbnailQuery = z.infer<typeof getAssetThumbnailQuerySchema>;

export const listAssetsSortFields = ['createdAt', 'updatedAt', 'name', 'likeCount', 'shareCount'] as const;

export const listAssetsQuerySchema = paginationOptionalSchema
  .merge(createSortingOptionalSchema(listAssetsSortFields))
  .merge(
    z.strictObject({
      visibility: assetVisibilitySchema.optional().describe('Filter by visibility (PUBLIC or PRIVATE)'),
      searchText: z.string().max(256).optional().describe('Search text to filter assets by name or description'),
      type: z.enum(Enums.AssetType).optional().describe('Filter by asset type'),
      userName: z.string().max(100).optional().describe('Filter by username'),
      archived: booleanPropSchema
        .optional()
        .describe('Filter by archived status (true for archived, false for non-archived)'),
    }),
  );

export type ListAssetQuery = z.infer<typeof listAssetsQuerySchema>;

export const listAssetsResultSchema = listResultSchema(assetSchema);

export type ListAssetResult = z.infer<typeof listAssetsResultSchema>;

export const listAssetPropsSchema = z.object({ query: listAssetsQuerySchema }).strict();
export type ListAssetProps = z.infer<typeof listAssetPropsSchema>;

/** @internal */
export const listAssetSortFields = listAssetsSortFields;

/** @internal */
export const listAssetDefaultSort: SortingFromFields<typeof listAssetSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListAssetSortField = (typeof listAssetSortFields)[number];

/**
 * Lists assets with optional filtering and pagination.
 *
 * @operationId list-assets
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters for filtering, pagination, and sorting
 * @returns Promise resolving to a paginated list of assets
 * @example
 * ```typescript
 * const assets = await listAssets(client, {
 *   query: { visibility: 'PUBLIC', pageOffset: 0, pageSize: 20 }
 * });
 * ```
 */
export const listAssets = async (client: ApiClient, props: ListAssetProps): Promise<ListAssetResult> => {
  const { query } = listAssetPropsSchema.parse(props);
  const path = '/assets';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listAssetsResultSchema, response.data);
};

export const createAssetParamsSchema = userNameParamsSchema;

export type CreateAssetParams = z.infer<typeof createAssetParamsSchema>;

export const createAssetBodySchema = z.strictObject({
  name: assetNameSchema.describe('The name of the asset'),
  description: descriptionSchema.optional().describe('Optional description of the asset'),
  type: z.enum(Enums.AssetType).describe('The type of asset'),
  uploadToken: z.string().describe('The upload token from prepareAssetUpload'),
  visibility: assetVisibilitySchema.describe('Visibility level: PUBLIC (anyone can view) or PRIVATE (members only)'),
  shareLicense: z.enum(Enums.ShareLicense).describe('The license for sharing the asset'),
  aiUsage: aiUsageSchema.optional().describe('Optional AI usage policy'),
  commentMode: z.enum(Enums.CommentMode).optional().describe('Comment mode: ENABLED (default), MEMBERS_ONLY, or NONE'),
  metadata: z.string().max(10_240).optional().describe('Optional metadata as a string (max 10240 characters)'),
});

export type CreateAssetBody = z.infer<typeof createAssetBodySchema>;

export type CreateAssetResult = z.infer<typeof assetSchema>;

export const createAssetPropsSchema = z
  .object({ params: createAssetParamsSchema, body: createAssetBodySchema })
  .strict();
export type CreateAssetProps = z.infer<typeof createAssetPropsSchema>;

/**
 * Creates a new asset for a user.
 *
 * @operationId create-asset
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName)
 * @param props.body - Request body with asset details
 * @returns Promise resolving to the created asset
 * @example
 * ```typescript
 * const asset = await createAsset(client, {
 *   params: { userName: 'my-user' },
 *   body: {
 *     name: 'my-asset',
 *     type: 'MATERIAL',
 *     uploadToken: '...',
 *     visibility: 'PUBLIC',
 *     shareLicense: 'CC_BY'
 *   }
 * });
 * ```
 */
export const createAsset = async (client: ApiClient, props: CreateAssetProps): Promise<CreateAssetResult> => {
  const { params, body } = createAssetPropsSchema.parse(props);
  const path = buildPath('/assets/$userName', params);
  const response = await client.axios.post(path, body);
  return parseResult(client, assetSchema, response.data);
};

export const getAssetParamsSchema = assetParamsSchema;

export type GetAssetParams = z.infer<typeof getAssetParamsSchema>;

export type GetAssetResult = z.infer<typeof assetSchema>;

export const getAssetPropsSchema = z.object({ params: getAssetParamsSchema }).strict();
export type GetAssetProps = z.infer<typeof getAssetPropsSchema>;

/**
 * Gets asset metadata by user and asset names.
 *
 * @operationId get-asset-metadata
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName, assetName)
 * @returns Promise resolving to the asset metadata
 * @example
 * ```typescript
 * const asset = await getAsset(client, {
 *   params: { userName: 'my-user', assetName: 'my-asset' }
 * });
 * ```
 */
export const getAsset = async (client: ApiClient, props: GetAssetProps): Promise<GetAssetResult> => {
  const { params } = getAssetPropsSchema.parse(props);
  const path = buildPath('/assets/$userName/$assetName', params);
  const response = await client.axios.get(path);
  return parseResult(client, assetSchema, response.data);
};

export const assetExists = async (client: ApiClient, props: GetAssetProps): Promise<boolean> => {
  const { params } = getAssetPropsSchema.parse(props);
  const path = buildPath('/assets/$userName/$assetName', params);
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

export const updateAssetParamsSchema = assetParamsSchema;

export type UpdateAssetParams = z.infer<typeof updateAssetParamsSchema>;

export const updateAssetBodySchema = z.strictObject({
  name: assetNameSchema.optional().describe('Optional name of the asset, to rename asset'),
  description: descriptionSchema.optional().describe('Optional description of the asset'),
  keywords: z.string().max(10_240).optional().describe('Optional keywords of the asset'),
  visibility: assetVisibilitySchema.optional().describe('Optional visibility of the asset'),
  shareLicense: z.enum(Enums.ShareLicense).optional().describe('Optional share license of the asset'),
  aiUsage: aiUsageSchema.optional().describe('Optional AI usage policy of the asset'),
  commentMode: z.enum(Enums.CommentMode).optional().describe('Optional comment mode: ENABLED, MEMBERS_ONLY, or NONE'),
  archived: z.boolean().optional().describe('Optional archived status (true to archive, false to unarchive)'),
  metadata: z.string().max(10_240).optional().describe('Optional metadata as a string (max 10240 characters)'),
  uploadToken: z
    .string()
    .optional()
    .describe("Optional upload token from prepare-upload endpoint to update the asset's file content"),
});

export type UpdateAssetBody = z.infer<typeof updateAssetBodySchema>;

export type UpdateAssetResult = z.infer<typeof assetSchema>;

export const updateAssetPropsSchema = z
  .object({ params: updateAssetParamsSchema, body: updateAssetBodySchema })
  .strict();
export type UpdateAssetProps = z.infer<typeof updateAssetPropsSchema>;

/**
 * Updates an asset's metadata.
 *
 * @operationId update-asset
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName, assetName)
 * @param props.body - Request body with fields to update
 * @returns Promise resolving to the updated asset
 * @example
 * ```typescript
 * const asset = await updateAsset(client, {
 *   params: { userName: 'my-user', assetName: 'my-asset' },
 *   body: { description: 'Updated description' }
 * });
 * ```
 */
export const updateAsset = async (client: ApiClient, props: UpdateAssetProps): Promise<UpdateAssetResult> => {
  const { params, body } = updateAssetPropsSchema.parse(props);
  const path = buildPath('/assets/$userName/$assetName', params);
  const response = await client.axios.patch(path, body);
  return parseResult(client, assetSchema, response.data);
};

export const deleteAssetParamsSchema = assetParamsSchema;

export type DeleteAssetParams = z.infer<typeof deleteAssetParamsSchema>;

export const deleteAssetResultSchema = z.void();

export const deleteAssetPropsSchema = z.object({ params: deleteAssetParamsSchema }).strict();
export type DeleteAssetProps = z.infer<typeof deleteAssetPropsSchema>;

/**
 * Deletes an asset.
 *
 * @operationId delete-asset
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName, assetName)
 * @returns Promise that resolves when the asset is deleted
 * @example
 * ```typescript
 * await deleteAsset(client, {
 *   params: { userName: 'my-user', assetName: 'my-asset' }
 * });
 * ```
 */
export const deleteAsset = async (client: ApiClient, props: DeleteAssetProps): Promise<void> => {
  const { params } = deleteAssetPropsSchema.parse(props);
  const path = buildPath('/assets/$userName/$assetName', params);
  await client.axios.delete(path);
};

export const prepareAssetUploadParamsSchema = userNameParamsSchema;

export type PrepareAssetUploadParams = z.infer<typeof prepareAssetUploadParamsSchema>;

export const prepareAssetUploadBodySchema = z.strictObject({
  filename: z.string().min(1).max(255).describe('The filename of the asset'),
  contentType: z.string().min(1).max(255).describe('The content type of the asset'),
  size: z.number().int().positive().describe('The size of the asset'),
});

export type PrepareAssetUploadBody = z.infer<typeof prepareAssetUploadBodySchema>;

export const prepareAssetUploadResultSchema = z.strictObject({
  uploadUrl: z.url(),
  uploadToken: z.string(),
});

export type PrepareAssetUploadResult = z.infer<typeof prepareAssetUploadResultSchema>;

export const prepareAssetUploadPropsSchema = z
  .object({ params: prepareAssetUploadParamsSchema, body: prepareAssetUploadBodySchema })
  .strict();
export type PrepareAssetUploadProps = z.infer<typeof prepareAssetUploadPropsSchema>;

/**
 * Prepares an asset upload by generating an upload URL and token.
 *
 * @operationId prepare-asset-upload
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName)
 * @param props.body - Request body with file information
 * @returns Promise resolving to upload URL, token, and user upload ID
 * @example
 * ```typescript
 * const upload = await prepareAssetUpload(client, {
 *   params: { userName: 'my-user' },
 *   body: { filename: 'copper.mtlx.zip', contentType: 'application/zip', size: 1024000 }
 * });
 * ```
 */
export const prepareAssetUpload = async (
  client: ApiClient,
  props: PrepareAssetUploadProps,
): Promise<PrepareAssetUploadResult> => {
  const { params, body } = prepareAssetUploadPropsSchema.parse(props);
  const path = buildPath('/assets/$userName/prepare-upload', params);
  const response = await client.axios.post(path, body);
  return parseResult(client, prepareAssetUploadResultSchema, response.data);
};

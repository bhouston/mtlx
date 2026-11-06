import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import {
  type AssetParams,
  assetParamsSchema,
  type CommentParams,
  commentParamsSchema,
  commentTextSchema,
} from '../lib/schemas.js';

export const commentSchema = z.object({
  id: z.number().int(),
  text: commentTextSchema,
  likeCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  moderatedAt: z.iso.datetime().nullable(),
  moderationReason: z.string().nullable(),
  createdByUserId: z.number().int(),
  createdByName: z.string(),
  likeId: z.number().int().nullable(),
});

export type Comment = z.infer<typeof commentSchema>;

export const createCommentParamsSchema = assetParamsSchema;
export type CreateCommentParams = AssetParams;

export const createCommentBodySchema = z.strictObject({
  text: commentTextSchema.describe('The comment text'),
});

export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;

export type CreateCommentResult = z.infer<typeof commentSchema>;

export const createCommentPropsSchema = z
  .object({ params: createCommentParamsSchema, body: createCommentBodySchema })
  .strict();
export type CreateCommentProps = z.infer<typeof createCommentPropsSchema>;

/**
 * @operationId create-comment
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName, assetName)
 * @param props.body - Request body with comment text
 * @returns Promise resolving to the created comment
 */
export const createComment = async (client: ApiClient, props: CreateCommentProps): Promise<CreateCommentResult> => {
  const { params, body } = createCommentPropsSchema.parse(props);
  const path = buildPath('/comments/$userName/$assetName', params);
  const response = await client.axios.post(path, body);
  return parseResult(client, commentSchema, response.data);
};

export const listCommentsSortFields = ['createdAt'] as const;

export const listCommentsQuerySchema = paginationOptionalSchema.merge(
  createSortingOptionalSchema(listCommentsSortFields),
);

export type ListCommentQuery = z.infer<typeof listCommentsQuerySchema>;

export const listCommentsResultSchema = listResultSchema(commentSchema);

export type ListCommentResult = z.infer<typeof listCommentsResultSchema>;

export const listCommentPropsSchema = z.object({ params: assetParamsSchema, query: listCommentsQuerySchema }).strict();
export type ListCommentProps = z.infer<typeof listCommentPropsSchema>;

/** @internal */
export const listCommentSortFields = listCommentsSortFields;

/** @internal */
export const listCommentDefaultSort: SortingFromFields<typeof listCommentSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListCommentSortField = (typeof listCommentSortFields)[number];

/**
 * Lists comments for an asset.
 *
 * @operationId list-comments
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName, assetName)
 * @param props.query - Query parameters (pagination, sorting)
 * @returns Promise resolving to a paginated list of comments
 */
export const listComments = async (client: ApiClient, props: ListCommentProps): Promise<ListCommentResult> => {
  const { params, query } = listCommentPropsSchema.parse(props);
  const path = buildPath('/comments/$userName/$assetName', params);
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listCommentsResultSchema, response.data);
};

export const editCommentParamsSchema = commentParamsSchema;

export type EditCommentParams = CommentParams;

export const editCommentBodySchema = z.strictObject({
  text: commentTextSchema.describe('The updated comment text'),
});

export type EditCommentBody = z.infer<typeof editCommentBodySchema>;

export type EditCommentResult = z.infer<typeof commentSchema>;

export const editCommentPropsSchema = z
  .object({ params: editCommentParamsSchema, body: editCommentBodySchema })
  .strict();
export type EditCommentProps = z.infer<typeof editCommentPropsSchema>;

/**
 * Edits an existing comment.
 *
 * @operationId edit-comment
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName, assetName, commentId)
 * @param props.body - Request body with updated comment text
 * @returns Promise resolving to the updated comment
 */
export const editComment = async (client: ApiClient, props: EditCommentProps): Promise<EditCommentResult> => {
  const { params, body } = editCommentPropsSchema.parse(props);
  const path = buildPath('/comments/$userName/$assetName/$commentId', params);
  const response = await client.axios.patch(path, body);
  return parseResult(client, commentSchema, response.data);
};

export const deleteCommentParamsSchema = commentParamsSchema;

export type DeleteCommentParams = CommentParams;

export const deleteCommentPropsSchema = z.object({ params: deleteCommentParamsSchema }).strict();
export type DeleteCommentProps = z.infer<typeof deleteCommentPropsSchema>;

/**
 * Deletes a comment.
 *
 * @operationId delete-comment
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (userName, assetName, commentId)
 * @returns Promise that resolves when the comment is deleted
 */
export const deleteComment = async (client: ApiClient, props: DeleteCommentProps): Promise<void> => {
  const { params } = deleteCommentPropsSchema.parse(props);
  const path = buildPath('/comments/$userName/$assetName/$commentId', params);
  await client.axios.delete(path);
};

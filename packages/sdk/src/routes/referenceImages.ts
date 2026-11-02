import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import {
  type CreateReferenceImageProps,
  type CreateReferenceImageResult,
  createReferenceImagePropsSchema,
  type DeleteReferenceImageProps,
  deleteReferenceImagePropsSchema,
  type GetReferenceImageProps,
  type GetReferenceImageResult,
  getReferenceImagePropsSchema,
  referenceImageSchema,
  type UpdateReferenceImageProps,
  type UpdateReferenceImageResult,
  updateReferenceImagePropsSchema,
} from './products.js';

/**
 * Adds a reference image to a product.
 *
 * @operationId create-reference-image
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName, productCode)
 * @param props.body - Body with uploadToken and optional description
 * @returns Promise resolving to the created reference image
 */
export const createReferenceImage = async (
  client: ApiClient,
  props: CreateReferenceImageProps,
): Promise<CreateReferenceImageResult> => {
  const { params, body } = createReferenceImagePropsSchema.parse(props);
  const path = buildPath('/reference-images/$orgName/$projectName/$productCode', params);
  const response = await client.axios.post(path, body);
  return parseResult(client, referenceImageSchema, response.data);
};

/**
 * Gets a reference image by ID.
 *
 * @operationId get-reference-image
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName, productCode, referenceImageId)
 * @returns Promise resolving to the reference image
 */
export const getReferenceImage = async (
  client: ApiClient,
  props: GetReferenceImageProps,
): Promise<GetReferenceImageResult> => {
  const { params } = getReferenceImagePropsSchema.parse(props);
  const path = buildPath('/reference-images/$orgName/$projectName/$productCode/$referenceImageId', params);
  const response = await client.axios.get(path);
  return parseResult(client, referenceImageSchema, response.data);
};

/**
 * Updates a reference image (e.g. description).
 *
 * @operationId update-reference-image
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName, productCode, referenceImageId)
 * @param props.body - Body with optional description
 * @returns Promise resolving to the updated reference image
 */
export const updateReferenceImage = async (
  client: ApiClient,
  props: UpdateReferenceImageProps,
): Promise<UpdateReferenceImageResult> => {
  const { params, body } = updateReferenceImagePropsSchema.parse(props);
  const path = buildPath('/reference-images/$orgName/$projectName/$productCode/$referenceImageId', params);
  const response = await client.axios.patch(path, body);
  return parseResult(client, referenceImageSchema, response.data);
};

/**
 * Deletes a reference image.
 *
 * @operationId delete-reference-image
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName, productCode, referenceImageId)
 */
export const deleteReferenceImage = async (client: ApiClient, props: DeleteReferenceImageProps): Promise<void> => {
  const { params } = deleteReferenceImagePropsSchema.parse(props);
  const path = buildPath('/reference-images/$orgName/$projectName/$productCode/$referenceImageId', params);
  await client.axios.delete(path);
};

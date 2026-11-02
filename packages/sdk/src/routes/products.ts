import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import {
  descriptionSchema,
  orgNameSchema,
  productCodeSchema,
  productParamsSchema,
  projectNameSchema,
  projectParamsSchema,
} from '../lib/schemas.js';

// --- Shared entity schemas ---
export const referenceImageSchema = z.object({
  id: z.number().int(),
  productId: z.number().int(),
  description: z.string(),
  fileOid: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type ReferenceImage = z.infer<typeof referenceImageSchema>;

export const productSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string().max(1024),
  description: z.string(),
  projectId: z.number().int(),
  projectName: z.string(),
  orgId: z.number().int(),
  orgName: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  referenceImages: z.array(referenceImageSchema).optional(),
  firstReferenceImageOid: z.string().nullable().optional(),
});

export type Product = z.infer<typeof productSchema>;

// --- listProducts ---
export const listProductsSortFields = ['createdAt', 'updatedAt', 'code', 'name'] as const;

export const listProductsQuerySchema = paginationOptionalSchema
  .merge(createSortingOptionalSchema(listProductsSortFields))
  .merge(
    z.strictObject({
      orgName: orgNameSchema.describe('Organization name'),
      projectName: projectNameSchema.describe('Project name'),
    }),
  );

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const listProductsResultSchema = listResultSchema(productSchema);

export type ListProductsResult = z.infer<typeof listProductsResultSchema>;

export const listProductsPropsSchema = z.object({ query: listProductsQuerySchema }).strict();
export type ListProductsProps = z.infer<typeof listProductsPropsSchema>;

/** @internal */
export const listProductSortFields = listProductsSortFields;

/** @internal */
export const listProductDefaultSort: SortingFromFields<typeof listProductSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListProductSortField = (typeof listProductSortFields)[number];

/**
 * Lists products in a project.
 *
 * @operationId list-products
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters (orgName, projectName, pagination, sort)
 * @returns Promise resolving to a paginated list of products
 */
export const listProducts = async (client: ApiClient, props: ListProductsProps): Promise<ListProductsResult> => {
  const { query } = listProductsPropsSchema.parse(props);
  const path = '/products';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listProductsResultSchema, response.data);
};

// --- createProduct ---
export const createProductParamsSchema = projectParamsSchema;

export type CreateProductParams = z.infer<typeof createProductParamsSchema>;

export const createProductBodySchema = z.strictObject({
  code: productCodeSchema.describe('The code of the product (unique within project)'),
  name: z.string().max(1024).describe('The display name of the product'),
  description: descriptionSchema.optional().describe('Optional description of the product'),
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;

export type CreateProductResult = z.infer<typeof productSchema>;

export const createProductPropsSchema = z
  .object({ params: createProductParamsSchema, body: createProductBodySchema })
  .strict();
export type CreateProductProps = z.infer<typeof createProductPropsSchema>;

/**
 * Creates a new product in a project.
 *
 * @operationId create-product
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName)
 * @param props.body - Request body with product details
 * @returns Promise resolving to the created product
 */
export const createProduct = async (client: ApiClient, props: CreateProductProps): Promise<CreateProductResult> => {
  const { params, body } = createProductPropsSchema.parse(props);
  const path = buildPath('/products/$orgName/$projectName', params);
  const response = await client.axios.post(path, body);
  return parseResult(client, productSchema, response.data);
};

// --- getProduct ---
export const getProductParamsSchema = productParamsSchema;

export type GetProductParams = z.infer<typeof getProductParamsSchema>;

export type GetProductResult = z.infer<typeof productSchema>;

export const getProductPropsSchema = z.object({ params: getProductParamsSchema }).strict();
export type GetProductProps = z.infer<typeof getProductPropsSchema>;

/**
 * Gets product details by org, project, and product code.
 *
 * @operationId get-product
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName, productCode)
 * @returns Promise resolving to the product
 */
export const getProduct = async (client: ApiClient, props: GetProductProps): Promise<GetProductResult> => {
  const { params } = getProductPropsSchema.parse(props);
  const path = buildPath('/products/$orgName/$projectName/$productCode', params);
  const response = await client.axios.get(path);
  return parseResult(client, productSchema, response.data);
};

// --- updateProduct ---
export const updateProductParamsSchema = getProductParamsSchema;

export type UpdateProductParams = z.infer<typeof updateProductParamsSchema>;

export const updateProductBodySchema = z.strictObject({
  code: productCodeSchema.optional().describe('New code (unique within project)'),
  name: z.string().max(1024).optional().describe('Display name'),
  description: descriptionSchema.optional().describe('Description'),
});

export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;

export type UpdateProductResult = z.infer<typeof productSchema>;

export const updateProductPropsSchema = z
  .object({ params: updateProductParamsSchema, body: updateProductBodySchema })
  .strict();
export type UpdateProductProps = z.infer<typeof updateProductPropsSchema>;

/**
 * Updates a product.
 *
 * @operationId update-product
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName, productCode)
 * @param props.body - Body with fields to update
 * @returns Promise resolving to the updated product
 */
export const updateProduct = async (client: ApiClient, props: UpdateProductProps): Promise<UpdateProductResult> => {
  const { params, body } = updateProductPropsSchema.parse(props);
  const path = buildPath('/products/$orgName/$projectName/$productCode', params);
  const response = await client.axios.patch(path, body);
  return parseResult(client, productSchema, response.data);
};

// --- deleteProduct ---
export const deleteProductParamsSchema = getProductParamsSchema;

export type DeleteProductParams = z.infer<typeof deleteProductParamsSchema>;

export const deleteProductResultSchema = z.void();

export const deleteProductPropsSchema = z.object({ params: deleteProductParamsSchema }).strict();
export type DeleteProductProps = z.infer<typeof deleteProductPropsSchema>;

/**
 * Deletes a product.
 *
 * @operationId delete-product
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName, productCode)
 */
export const deleteProduct = async (client: ApiClient, props: DeleteProductProps): Promise<void> => {
  const { params } = deleteProductPropsSchema.parse(props);
  const path = buildPath('/products/$orgName/$projectName/$productCode', params);
  await client.axios.delete(path);
};

// --- Reference image schemas (for referenceImages route) ---
export const createReferenceImageParamsSchema = getProductParamsSchema;

export type CreateReferenceImageParams = z.infer<typeof createReferenceImageParamsSchema>;

export const createReferenceImageBodySchema = z.strictObject({
  uploadToken: z.string().describe('Upload token from prepare-upload'),
  description: descriptionSchema.optional().describe('Optional description for the reference image'),
});

export type CreateReferenceImageBody = z.infer<typeof createReferenceImageBodySchema>;

export type CreateReferenceImageResult = z.infer<typeof referenceImageSchema>;

export const createReferenceImagePropsSchema = z
  .object({ params: createReferenceImageParamsSchema, body: createReferenceImageBodySchema })
  .strict();
export type CreateReferenceImageProps = z.infer<typeof createReferenceImagePropsSchema>;

export const getReferenceImageParamsSchema = getProductParamsSchema.extend({
  referenceImageId: z.coerce.number().int().describe('The ID of the reference image'),
});

export type GetReferenceImageParams = z.infer<typeof getReferenceImageParamsSchema>;

export type GetReferenceImageResult = z.infer<typeof referenceImageSchema>;

export const getReferenceImagePropsSchema = z.object({ params: getReferenceImageParamsSchema }).strict();
export type GetReferenceImageProps = z.infer<typeof getReferenceImagePropsSchema>;

export const updateReferenceImageParamsSchema = getReferenceImageParamsSchema;

export type UpdateReferenceImageParams = z.infer<typeof updateReferenceImageParamsSchema>;

export const updateReferenceImageBodySchema = z.strictObject({
  description: descriptionSchema.optional().describe('Description for the reference image'),
});

export type UpdateReferenceImageBody = z.infer<typeof updateReferenceImageBodySchema>;

export type UpdateReferenceImageResult = z.infer<typeof referenceImageSchema>;

export const updateReferenceImagePropsSchema = z
  .object({ params: updateReferenceImageParamsSchema, body: updateReferenceImageBodySchema })
  .strict();
export type UpdateReferenceImageProps = z.infer<typeof updateReferenceImagePropsSchema>;

export const deleteReferenceImageParamsSchema = getReferenceImageParamsSchema;

export type DeleteReferenceImageParams = z.infer<typeof deleteReferenceImageParamsSchema>;

export const deleteReferenceImageResultSchema = z.void();

export const deleteReferenceImagePropsSchema = z.object({ params: deleteReferenceImageParamsSchema }).strict();
export type DeleteReferenceImageProps = z.infer<typeof deleteReferenceImagePropsSchema>;

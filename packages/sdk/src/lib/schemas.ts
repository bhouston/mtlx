import * as z from 'zod';
import { Enums } from './enums.js';

export const descriptionSchema = z.string().max(10_240).describe('The description of the entity');
export const shortDescriptionSchema = z.string().max(1024).describe('The short description of the entity');
export const nullableDescriptionSchema = z.string().nullable().describe('The nullable description of the entity');

export const assetVisibilitySchema = z.enum(Enums.AssetVisibility).describe('The visibility of the asset');
export const aiUsageSchema = z.enum(Enums.AiUsage).describe('The AI usage policy of the asset');

export const commentTextSchema = z.string().min(1).max(10_240).describe('The text of the comment');

export const jwtSchema = z
  .string()
  .max(1024 * 10)
  .describe('The JWT token');

/**
 * Accepts either a boolean or a stringbool (e.g. "true"/"false", "1"/"0") for use in params and query schemas.
 * Use consistently so callers can pass either from query strings or programmatically.
 */
export const booleanPropSchema = z.union([z.boolean(), z.stringbool()]);

export const coreEntityNameRegex = '[a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*';
export const entityNameRegex = new RegExp(`^${coreEntityNameRegex}$`);

export const entityNameSchema = (description: string) =>
  z
    .string()
    .min(1, 'Name is required')
    .max(30, 'Name must be at most 30 characters')
    .regex(
      entityNameRegex,
      'Name must start with a letter and can only contain letters, numbers, and dashes (-). No consecutive or trailing dashes (-) allowed.',
    )
    .describe(description);

export const userNameSchema = entityNameSchema('The name of the user');

export const userNameParamsSchema = z.strictObject({
  userName: userNameSchema,
});
export type UserNameParams = z.infer<typeof userNameParamsSchema>;

export const standardUserNameSchema = entityNameSchema('The name of the user');

export const assetNameSchema = entityNameSchema('The name of the asset');

export const assetParamsSchema = z.strictObject({
  userName: userNameSchema,
  assetName: assetNameSchema,
});
export type AssetParams = z.infer<typeof assetParamsSchema>;

export const commentParamsSchema = assetParamsSchema.extend({
  commentId: z.coerce.number().int().describe('The ID of the comment'),
});
export type CommentParams = z.infer<typeof commentParamsSchema>;

export const taskParamsSchema = z.strictObject({
  userName: userNameSchema,
});
export type TaskParams = z.infer<typeof taskParamsSchema>;

export const apiTokenNameSchema = entityNameSchema('The name of the API token');

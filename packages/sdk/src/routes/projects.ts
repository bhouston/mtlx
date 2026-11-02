import { AxiosError } from 'axios';
import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';
import {
  descriptionSchema,
  orgNameSchema,
  orgParamsSchema,
  projectNameSchema,
  projectParamsSchema,
  visibilitySchema,
} from '../lib/schemas.js';

// --- Shared entity schema ---
export const projectSchema = z.object({
  id: z.number().int().describe('The ID of the project'),
  name: z.string().describe('The name of the project'),
  description: z.string().describe('The description of the project'),
  visibility: visibilitySchema.describe('The visibility of the project'),
  createdAt: z.iso.datetime().describe('The date and time the project was created'),
  updatedAt: z.iso.datetime().describe('The date and time the project was updated'),
  orgId: z.number().int().describe('The ID of the organization'),
  orgName: z.string().describe('The name of the organization'),
});

export type Project = z.infer<typeof projectSchema>;

// --- listProjects ---
export const listProjectsSortFields = ['createdAt', 'updatedAt', 'name'] as const;

export const listProjectsQuerySchema = paginationOptionalSchema
  .merge(createSortingOptionalSchema(listProjectsSortFields))
  .merge(
    z.strictObject({
      visibility: visibilitySchema.optional().describe('Filter by visibility (PUBLIC or PRIVATE)'),
      userName: z.string().max(100).optional().describe('Filter by username'),
      orgName: orgNameSchema.optional().describe('Filter by organization name'),
    }),
  );

export type ListProjectQuery = z.infer<typeof listProjectsQuerySchema>;

export const listProjectsResultSchema = listResultSchema(projectSchema);

export type ListProjectResult = z.infer<typeof listProjectsResultSchema>;

export const listProjectPropsSchema = z.object({ query: listProjectsQuerySchema }).strict();
export type ListProjectProps = z.infer<typeof listProjectPropsSchema>;

/** @internal */
export const listProjectSortFields = listProjectsSortFields;

/** @internal */
export const listProjectDefaultSort: SortingFromFields<typeof listProjectSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListProjectSortField = (typeof listProjectSortFields)[number];

/**
 * Lists projects with optional filtering and pagination.
 *
 * @operationId list-projects-in-org
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters for filtering, pagination, and sorting
 * @returns Promise resolving to a paginated list of projects
 * @example
 * ```typescript
 * const projects = await listProjects(client, {
 *   query: { orgName: 'my-org', visibility: 'PUBLIC', pageOffset: 0, pageSize: 20 }
 * });
 * ```
 */
export const listProjects = async (client: ApiClient, props: ListProjectProps): Promise<ListProjectResult> => {
  const { query } = listProjectPropsSchema.parse(props);
  const path = '/projects';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listProjectsResultSchema, response.data);
};

// --- createProject ---
export const createProjectParamsSchema = orgParamsSchema;

export type CreateProjectParams = z.infer<typeof createProjectParamsSchema>;

export const createProjectBodySchema = z.strictObject({
  name: projectNameSchema.describe('The name of the project'),
  description: descriptionSchema.optional().describe('Optional description of the project'),
  visibility: visibilitySchema.describe('Visibility level: PUBLIC (anyone can view) or PRIVATE (members only)'),
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;

export type CreateProjectResult = z.infer<typeof projectSchema>;

export const createProjectPropsSchema = z
  .object({ params: createProjectParamsSchema, body: createProjectBodySchema })
  .strict();
export type CreateProjectProps = z.infer<typeof createProjectPropsSchema>;

/**
 * Creates a new project in an organization.
 *
 * @operationId create-project
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName)
 * @param props.body - Request body with project details
 * @returns Promise resolving to the created project
 * @example
 * ```typescript
 * const project = await createProject(client, {
 *   params: { orgName: 'my-org' },
 *   body: { name: 'my-project', description: 'My project', visibility: 'PUBLIC' }
 * });
 * ```
 */
export const createProject = async (client: ApiClient, props: CreateProjectProps): Promise<CreateProjectResult> => {
  const { params, body } = createProjectPropsSchema.parse(props);
  const path = buildPath('/projects/$orgName', params);
  const response = await client.axios.post(path, body);
  return parseResult(client, projectSchema, response.data);
};

// --- getProject, projectExists ---
export const getProjectParamsSchema = projectParamsSchema;

export type GetProjectParams = z.infer<typeof getProjectParamsSchema>;

export type GetProjectResult = z.infer<typeof projectSchema>;

export const getProjectPropsSchema = z.object({ params: getProjectParamsSchema }).strict();
export type GetProjectProps = z.infer<typeof getProjectPropsSchema>;

/**
 * Gets project information by org and project names.
 *
 * @operationId get-project
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName)
 * @returns Promise resolving to the project information
 * @example
 * ```typescript
 * const project = await getProject(client, {
 *   params: { orgName: 'my-org', projectName: 'my-project' }
 * });
 * ```
 */
export const getProject = async (client: ApiClient, props: GetProjectProps): Promise<GetProjectResult> => {
  const { params } = getProjectPropsSchema.parse(props);
  const path = buildPath('/projects/$orgName/$projectName', params);
  const response = await client.axios.get(path);
  return parseResult(client, projectSchema, response.data);
};

export const projectExists = async (client: ApiClient, props: GetProjectProps): Promise<boolean> => {
  const { params } = getProjectPropsSchema.parse(props);
  const path = buildPath('/projects/$orgName/$projectName', params);
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

// --- updateProject ---
export const updateProjectParamsSchema = projectParamsSchema;

export type UpdateProjectParams = z.infer<typeof updateProjectParamsSchema>;

export const updateProjectBodySchema = z.strictObject({
  name: projectNameSchema.optional().describe('The new name for the project'),
  description: descriptionSchema.optional().describe('The new description for the project'),
  visibility: visibilitySchema.optional().describe('The new visibility level (PUBLIC or PRIVATE)'),
  orgName: orgNameSchema.optional().describe('The new organization name (for moving projects)'),
});

export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;

export type UpdateProjectResult = z.infer<typeof projectSchema>;

export const updateProjectPropsSchema = z
  .object({ params: updateProjectParamsSchema, body: updateProjectBodySchema })
  .strict();
export type UpdateProjectProps = z.infer<typeof updateProjectPropsSchema>;

/**
 * Updates a project's metadata.
 *
 * @operationId update-project
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName)
 * @param props.body - Request body with fields to update
 * @returns Promise resolving to the updated project
 * @example
 * ```typescript
 * const project = await updateProject(client, {
 *   params: { orgName: 'my-org', projectName: 'my-project' },
 *   body: { description: 'Updated description' }
 * });
 * ```
 */
export const updateProject = async (client: ApiClient, props: UpdateProjectProps): Promise<UpdateProjectResult> => {
  const { params, body } = updateProjectPropsSchema.parse(props);
  const path = buildPath('/projects/$orgName/$projectName', params);
  const response = await client.axios.patch(path, body);
  return parseResult(client, projectSchema, response.data);
};

// --- deleteProject ---
export const deleteProjectParamsSchema = projectParamsSchema;

export type DeleteProjectParams = z.infer<typeof deleteProjectParamsSchema>;

export const deleteProjectResultSchema = z.void();

export const deleteProjectPropsSchema = z.object({ params: deleteProjectParamsSchema }).strict();
export type DeleteProjectProps = z.infer<typeof deleteProjectPropsSchema>;

/**
 * Deletes a project.
 *
 * @operationId delete-project
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (orgName, projectName)
 * @returns Promise that resolves when the project is deleted
 * @example
 * ```typescript
 * await deleteProject(client, {
 *   params: { orgName: 'my-org', projectName: 'my-project' }
 * });
 * ```
 */
export const deleteProject = async (client: ApiClient, props: DeleteProjectProps): Promise<void> => {
  const { params } = deleteProjectPropsSchema.parse(props);
  const path = buildPath('/projects/$orgName/$projectName', params);
  await client.axios.delete(path);
};

import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { orgNameSchema, projectNameSchema } from '../lib/schemas.js';
import { serverEventTypeSchema } from './serverEvents.js';

export const webhookPayloadSchema = z.object({
  id: z.uuid().describe('Unique delivery ID for idempotency'),
  type: serverEventTypeSchema.describe('Event type, e.g. asset.updated'),
  timestamp: z.iso.datetime().describe('ISO 8601 delivery timestamp'),
  data: z.unknown().describe('Event-specific payload (same shape as SSE data for that event type)'),
  context: z.object({
    orgName: orgNameSchema,
    projectName: projectNameSchema.optional(),
  }),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

// --- Shared query/path schemas ---
export const webhookQueryScopeSchema = z.union([
  z.strictObject({
    orgName: orgNameSchema,
  }),
  z.strictObject({
    orgName: orgNameSchema,
    projectName: projectNameSchema,
  }),
]);
export type WebhookQueryScope = z.infer<typeof webhookQueryScopeSchema>;

export const webhookIdParamsSchema = z.strictObject({
  webhookId: z.coerce.number().int().positive().describe('The numeric ID of the webhook'),
});
export type WebhookIdParams = z.infer<typeof webhookIdParamsSchema>;

export const createWebhookBodySchema = z.strictObject({
  url: z.url().max(1024).describe('The URL to deliver webhook events to'),
  events: z.array(serverEventTypeSchema).describe('Event types to subscribe to; empty array subscribes to all events'),
  secret: z.string().min(16).max(256).optional().describe('HMAC signing secret; if omitted, the server generates one'),
  description: z.string().max(1024).optional().describe('Human-readable description of this webhook'),
  active: z.boolean().default(true).describe('Whether the webhook is active'),
});

export type CreateWebhookBody = z.infer<typeof createWebhookBodySchema>;

export const updateWebhookBodySchema = z.strictObject({
  url: z.url().max(1024).optional().describe('The URL to deliver webhook events to'),
  events: z
    .array(serverEventTypeSchema)
    .optional()
    .describe('Event types to subscribe to; empty array subscribes to all events'),
  active: z.boolean().optional().describe('Whether the webhook is active'),
  description: z.string().max(1024).optional().describe('Human-readable description of this webhook'),
  secret: z
    .string()
    .min(16)
    .max(256)
    .optional()
    .describe('Rotate the HMAC signing secret; new secret replaces the old one'),
});

export type UpdateWebhookBody = z.infer<typeof updateWebhookBodySchema>;

export const webhookResponseSchema = z.object({
  id: z.number().int().positive().describe('Unique numeric ID of the webhook registration'),
  url: z.string().max(1024).describe('The URL webhooks are delivered to'),
  events: z.array(serverEventTypeSchema).describe('Subscribed event types; empty array means all events'),
  secret: z.string().optional().describe('HMAC secret, returned only on creation'),
  description: z.string().nullable().describe('Description of the webhook'),
  active: z.boolean().describe('Whether the webhook is active'),
  scope: z.enum(['org', 'project']).describe('Scope of this webhook registration'),
  orgName: orgNameSchema.describe('Organization this webhook belongs to'),
  projectName: projectNameSchema.optional().describe('Project this webhook belongs to (project-scoped only)'),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type WebhookResponse = z.infer<typeof webhookResponseSchema>;

export const webhookResponseWithoutSecretSchema = webhookResponseSchema.omit({ secret: true });
export type WebhookResponseWithoutSecret = z.infer<typeof webhookResponseWithoutSecretSchema>;

export const webhookListResponseSchema = z.object({
  webhooks: z.array(webhookResponseWithoutSecretSchema),
});

export type WebhookListResponse = z.infer<typeof webhookListResponseSchema>;

// --- createWebhook ---
export const createWebhookPropsSchema = z
  .object({ query: webhookQueryScopeSchema, body: createWebhookBodySchema })
  .strict();
export type CreateWebhookProps = z.infer<typeof createWebhookPropsSchema>;

export const createWebhook = async (client: ApiClient, props: CreateWebhookProps): Promise<WebhookResponse> => {
  const { query, body } = createWebhookPropsSchema.parse(props);
  const path = '/webhooks';
  const response = await client.axios.post(path, body, {
    params: query,
  });
  return parseResult(client, webhookResponseSchema, response.data);
};

// --- listWebhooks ---
export const listWebhooksPropsSchema = z.object({ query: webhookQueryScopeSchema }).strict();
export type ListWebhooksProps = z.infer<typeof listWebhooksPropsSchema>;

export const listWebhooks = async (client: ApiClient, props: ListWebhooksProps): Promise<WebhookListResponse> => {
  const { query } = listWebhooksPropsSchema.parse(props);
  const path = '/webhooks';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, webhookListResponseSchema, response.data);
};

// --- getWebhook ---
export const getWebhookPropsSchema = z.object({ params: webhookIdParamsSchema }).strict();
export type GetWebhookProps = z.infer<typeof getWebhookPropsSchema>;

export const getWebhook = async (client: ApiClient, props: GetWebhookProps): Promise<WebhookResponseWithoutSecret> => {
  const { params } = getWebhookPropsSchema.parse(props);
  const path = buildPath('/webhooks/$webhookId', params);
  const response = await client.axios.get(path);
  return parseResult(client, webhookResponseWithoutSecretSchema, response.data);
};

// --- updateWebhook ---
export const updateWebhookPropsSchema = z
  .object({ params: webhookIdParamsSchema, body: updateWebhookBodySchema })
  .strict();
export type UpdateWebhookProps = z.infer<typeof updateWebhookPropsSchema>;

export const updateWebhook = async (client: ApiClient, props: UpdateWebhookProps): Promise<WebhookResponse> => {
  const { params, body } = updateWebhookPropsSchema.parse(props);
  const path = buildPath('/webhooks/$webhookId', params);
  const response = await client.axios.patch(path, body);
  return parseResult(client, webhookResponseSchema, response.data);
};

// --- deleteWebhook ---
export const deleteWebhookPropsSchema = z.object({ params: webhookIdParamsSchema }).strict();
export type DeleteWebhookProps = z.infer<typeof deleteWebhookPropsSchema>;

export const deleteWebhook = async (client: ApiClient, props: DeleteWebhookProps): Promise<void> => {
  const { params } = deleteWebhookPropsSchema.parse(props);
  const path = buildPath('/webhooks/$webhookId', params);
  await client.axios.delete(path);
};

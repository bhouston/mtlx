import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { parseResult } from '../client.js';
import { buildPath } from '../lib/buildPath.js';
import { Enums } from '../lib/enums.js';
import type { SortingFromFields } from '../lib/list.js';
import { createSortingOptionalSchema, listResultSchema, paginationOptionalSchema } from '../lib/list.js';

export const notificationSchema = z.object({
  id: z.number().int().describe('The ID of the notification'),
  title: z.string(),
  body: z.string().describe('The body of the notification'),
  createdAt: z.iso.datetime().describe('The date and time the notification was created'),
  status: z.enum(Enums.NotificationStatus).describe('The status of the notification'),
  topic: z.enum(Enums.NotificationTopic).describe('The topic/type of the notification'),
  imageUrl: z.string().nullable().describe('The URL of the image in the notification'),
  link: z.string().nullable().describe('The link in the notification'),
  userId: z.number().int().describe('The ID of the user who received the notification'),
  userName: z.string().describe('The username of the user who received the notification'),
});

export type Notification = z.infer<typeof notificationSchema>;

export const listNotificationsSortFields = ['createdAt', 'status'] as const;

export const listNotificationsQuerySchema = paginationOptionalSchema
  .merge(createSortingOptionalSchema(listNotificationsSortFields))
  .extend({
    status: z.enum(Enums.NotificationStatus).optional().describe('Filter by status (UNREAD or READ)'),
  });

export type ListNotificationQuery = z.infer<typeof listNotificationsQuerySchema>;

export const listNotificationsResultSchema = listResultSchema(notificationSchema);

export type ListNotificationResult = z.infer<typeof listNotificationsResultSchema>;

export const listNotificationPropsSchema = z.object({ query: listNotificationsQuerySchema }).strict();
export type ListNotificationProps = z.infer<typeof listNotificationPropsSchema>;

/** @internal */
export const listNotificationSortFields = listNotificationsSortFields;

/** @internal */
export const listNotificationDefaultSort: SortingFromFields<typeof listNotificationSortFields> = {
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export type ListNotificationSortField = (typeof listNotificationSortFields)[number];

/**
 * Lists notifications for the authenticated user.
 *
 * @operationId list-notifications
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.query - Query parameters for filtering, pagination, and sorting
 * @returns Promise resolving to a paginated list of notifications
 */
export const listNotifications = async (
  client: ApiClient,
  props: ListNotificationProps,
): Promise<ListNotificationResult> => {
  const { query } = listNotificationPropsSchema.parse(props);
  const path = '/notifications';
  const response = await client.axios.get(path, {
    params: query,
  });
  return parseResult(client, listNotificationsResultSchema, response.data);
};

export const markNotificationAsReadParamsSchema = z.strictObject({
  notificationId: z.coerce.number().int(),
});

export type MarkNotificationAsReadParams = z.infer<typeof markNotificationAsReadParamsSchema>;

export const markNotificationAsReadBodySchema = z.strictObject({
  status: z.literal('READ'),
});

export type MarkNotificationAsReadBody = z.infer<typeof markNotificationAsReadBodySchema>;

export const markNotificationAsReadResultSchema = z.void();

export const markNotificationAsReadPropsSchema = z
  .object({ params: markNotificationAsReadParamsSchema, body: markNotificationAsReadBodySchema })
  .strict();
export type MarkNotificationAsReadProps = z.infer<typeof markNotificationAsReadPropsSchema>;

/**
 * Marks a specific notification as read.
 *
 * @operationId mark-notification-as-read
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.params - Path parameters (notificationId)
 * @param props.body - Request body with status
 * @returns Promise that resolves when the notification is marked as read
 */
export const markNotificationAsRead = async (client: ApiClient, props: MarkNotificationAsReadProps): Promise<void> => {
  const { params, body } = markNotificationAsReadPropsSchema.parse(props);
  const path = buildPath('/notifications/$notificationId', params);
  await client.axios.patch(path, body);
};

export const markAllNotificationsAsReadBodySchema = z.strictObject({
  status: z.literal('READ'),
});

export type MarkAllNotificationsAsReadBody = z.infer<typeof markAllNotificationsAsReadBodySchema>;

export const markAllNotificationsAsReadResultSchema = z.strictObject({
  success: z.boolean(),
});

export type MarkAllNotificationsAsReadResult = z.infer<typeof markAllNotificationsAsReadResultSchema>;

export const markAllNotificationsAsReadPropsSchema = z.object({ body: markAllNotificationsAsReadBodySchema }).strict();
export type MarkAllNotificationsAsReadProps = z.infer<typeof markAllNotificationsAsReadPropsSchema>;

/**
 * Marks all notifications as read for the authenticated user.
 *
 * @operationId mark-all-notifications-as-read
 * @param client - The API client instance
 * @param props - The request properties
 * @param props.body - Request body with status
 * @returns Promise resolving to a success indicator
 */
export const markAllNotificationsAsRead = async (
  client: ApiClient,
  props: MarkAllNotificationsAsReadProps,
): Promise<MarkAllNotificationsAsReadResult> => {
  const { body } = markAllNotificationsAsReadPropsSchema.parse(props);
  const path = '/notifications';
  const response = await client.axios.patch(path, body);
  return parseResult(client, markAllNotificationsAsReadResultSchema, response.data);
};

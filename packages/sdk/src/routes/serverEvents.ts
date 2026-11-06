import type { SchemaAddEventListenerOptions, SseMessageEvent } from 'axios-eventsource';
import { axiosEventSource } from 'axios-eventsource';
import * as z from 'zod';
import type { ApiClient } from '../client.js';
import { Enums } from '../lib/enums.js';
import { assetSchema } from './assets.js';
import { commentSchema } from './comments.js';

// ---------------------------------------------------------------------------
// Payload schemas per event type (sent as the SSE body)
// ---------------------------------------------------------------------------

// notification.new — lightweight signal; full data fetched via query invalidation
export const serverEventNotificationNewDataSchema = z
  .object({
    count: z.number().int().optional(),
    topic: z.enum(Enums.NotificationTopic).optional(),
  })
  .optional();

// notification-topic events — typed signals for specific notification kinds
export const serverEventNotificationTopicDataSchema = z.object({
  topic: z.enum(Enums.NotificationTopic),
  title: z.string().optional(),
  link: z.string().optional(),
});

// Extended schemas for events that produce notifications (centralized copy generation)
export const serverEventAssetModeratedDataSchema = serverEventNotificationTopicDataSchema.extend({
  userName: z.string(),
  assetName: z.string(),
  reason: z.string(),
});

export const serverEventCommentModeratedDataSchema = serverEventNotificationTopicDataSchema.extend({
  userName: z.string(),
  assetName: z.string(),
  commentId: z.number().int(),
  commentText: z.string(),
  reason: z.string(),
  targetUserId: z.number().int(),
});

export const serverEventAssetLikedDataSchema = serverEventNotificationTopicDataSchema.extend({
  userName: z.string(),
  assetName: z.string(),
  actorName: z.string(),
});

export const serverEventCommentLikedDataSchema = serverEventNotificationTopicDataSchema.extend({
  userName: z.string(),
  assetName: z.string(),
  commentId: z.number().int(),
  commentText: z.string(),
  actorName: z.string(),
  targetUserId: z.number().int(),
});

// asset events — carry the full entity for created/updated; just identifiers for deleted
export const serverEventAssetCreatedUpdatedDataSchema = z.object({
  asset: assetSchema,
  actorName: z.string().optional(), // For notification body when event produces notification
});

export const serverEventAssetDeletedDataSchema = z.object({
  assetId: z.number().int(),
  userName: z.string(),
  assetName: z.string(),
});

// comment events — carry the full entity plus location context
export const serverEventCommentDataSchema = z.object({
  comment: commentSchema,
  assetId: z.number().int(),
  userName: z.string(),
  assetName: z.string(),
  mentionedUserIds: z.array(z.number().int()).optional(),
});

// ---------------------------------------------------------------------------
// Canonical event registry — single source of truth for all event types.
// To add a new event: add one entry here; everything else is derived.
// ---------------------------------------------------------------------------
export const serverEventDataSchemas = {
  'asset.created': serverEventAssetCreatedUpdatedDataSchema,
  'asset.deleted': serverEventAssetDeletedDataSchema,
  'asset.liked': serverEventAssetLikedDataSchema,
  'asset.moderated': serverEventAssetModeratedDataSchema,
  'asset.updated': serverEventAssetCreatedUpdatedDataSchema,
  'comment.liked': serverEventCommentLikedDataSchema,
  'comment.moderated': serverEventCommentModeratedDataSchema,
  'comment.new': serverEventCommentDataSchema,
  'comment.updated': serverEventCommentDataSchema,
  'external-auth.approved': serverEventNotificationTopicDataSchema,
  'notification.new': serverEventNotificationNewDataSchema,
} as const;

// ---------------------------------------------------------------------------
// Derived types — all inferred from the registry above.
// ---------------------------------------------------------------------------
export type ServerEventType = keyof typeof serverEventDataSchemas;

export const SERVER_EVENT_TYPES = Object.keys(serverEventDataSchemas) as [ServerEventType, ...ServerEventType[]];

export const serverEventTypeSchema = z.enum(SERVER_EVENT_TYPES);

// Discriminated union of all server events, where the data type for each
// event is inferred from the registry entry.
export type ServerEvent = {
  [K in ServerEventType]: {
    type: K;
    userId: number;
    data: z.infer<(typeof serverEventDataSchemas)[K]>;
  };
}[ServerEventType];

// ---------------------------------------------------------------------------
// Zod schema for parsing full ServerEvent objects (generic, includes userId)
// ---------------------------------------------------------------------------
export const serverEventSchema = z.discriminatedUnion(
  'type',
  (Object.keys(serverEventDataSchemas) as ServerEventType[]).map((type) =>
    z.object({
      type: z.literal(type),
      userId: z.number().int(),
      data: serverEventDataSchemas[type],
    }),
  ) as unknown as [z.ZodObject<z.ZodRawShape>, ...z.ZodObject<z.ZodRawShape>[]],
);

export type SubscribeToServerEventsOptions = {
  path?: string;
};

export type ServerEventsSubscription = {
  addEventListener<K extends ServerEventType>(
    type: K,
    handler: (data: Extract<ServerEvent, { type: K }>['data']) => void,
  ): void;
  close(): void;
};

type HandlersMap = Partial<Record<ServerEventType, (data: unknown) => void>>;

const SSE_DEFAULT_PATH = '/server-events';

/**
 * Subscribe to the API server's SSE events stream.
 * Uses the ApiClient for authentication — JWT, session tokens, and API keys are all
 * handled automatically via the client's axios interceptors.
 * Returns an object with addEventListener(type, handler) for typed event handling and close().
 *
 * @example
 * const sub = subscribeToServerEvents(client);
 * sub.addEventListener('notification.new', (data) => { ... });
 * sub.addEventListener('asset.updated', (data) => { ... });
 * // on unmount: sub.close();
 */
export function subscribeToServerEvents(
  client: ApiClient,
  options?: SubscribeToServerEventsOptions,
): ServerEventsSubscription {
  const path = options?.path ?? SSE_DEFAULT_PATH;
  const handlers: HandlersMap = {};

  const stream = axiosEventSource(client.axios, path, {
    reconnect: { initialDelayMs: 1000, maxDelayMs: 30_000 },
  });

  for (const type of Object.keys(serverEventDataSchemas) as ServerEventType[]) {
    // Cast via unknown: axios-eventsource bundles its own Zod copy, so the ZodType
    // module paths differ from the host project's Zod, causing a structural mismatch.
    // The schema is compatible at runtime; the cast is purely a type-system workaround.
    const listenerOptions = {
      schema: serverEventDataSchemas[type],
    } as unknown as SchemaAddEventListenerOptions<unknown>;
    stream.addEventListener(
      type,
      (event) => {
        const handler = handlers[type];
        if (handler) {
          handler((event as unknown as SseMessageEvent<unknown>).data);
        }
      },
      listenerOptions,
    );
  }

  return {
    addEventListener<K extends ServerEventType>(type: K, handler: (data: unknown) => void): void {
      handlers[type] = handler;
    },
    close(): void {
      stream.close();
    },
  } as ServerEventsSubscription;
}

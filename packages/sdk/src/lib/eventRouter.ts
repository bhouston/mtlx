import type * as z from 'zod';
import { type ServerEvent, type ServerEventType, serverEventDataSchemas } from '../routes/serverEvents.js';

/** Input shape for routing: type + data (works for SSE events and webhook payloads). */
export type EventRouterInput = {
  type: string;
  data: unknown;
};

/** Handler map: one handler per event type, receives parsed data. */
export type EventRouterHandlers = {
  [K in ServerEventType]?: (data: Extract<ServerEvent, { type: K }>['data']) => void;
};

export type CreateEventRouterOptions = {
  handlers: EventRouterHandlers;
  onUnknown?: (type: string) => void;
  onParseError?: (type: string, error: z.ZodError) => void;
};

/**
 * Creates a transport-agnostic event router that parses { type, data } against
 * the canonical schema registry and dispatches to typed handlers.
 *
 * Works for both SSE events and webhook payloads. Use for consistent
 * parse-and-dispatch logic across consumers.
 *
 * @example
 * const router = createEventRouter({
 *   handlers: {
 *     'asset.updated': (data) => { /* data is typed *\/ },
 *     'notification.new': () => { /* ... *\/ },
 *   },
 *   onUnknown: (type) => console.warn('Unknown event:', type),
 *   onParseError: (type, err) => console.error('Parse failed:', type, err),
 * });
 * router.handle({ type: 'asset.updated', data: rawData });
 */
export function createEventRouter(options: CreateEventRouterOptions) {
  const { handlers, onUnknown, onParseError } = options;

  return {
    handle(input: EventRouterInput): void {
      const { type, data } = input;

      if (!(type in serverEventDataSchemas)) {
        onUnknown?.(type);
        return;
      }

      const schema = serverEventDataSchemas[type as ServerEventType];
      const result = schema.safeParse(data);

      if (!result.success) {
        onParseError?.(type, result.error);
        return;
      }

      const handler = handlers[type as ServerEventType];
      if (handler) {
        // We parsed with the schema for this type; TS cannot narrow the union, so we assert.
        (handler as (payload: unknown) => void)(result.data);
      }
    },
  };
}

export type EventRouter = ReturnType<typeof createEventRouter>;

import type * as z from 'zod';

/**
 * Parses data using a Zod schema.
 * @param schema - The zod schema to use for validation/type inference
 * @param data - The raw response data to parse
 * @returns The parsed or type-asserted data matching the schema's inferred type
 */
export const parseResult = <T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> => schema.parse(data);

/**
 * Legacy version that accepts a client parameter (unused, kept for backward compatibility).
 * This is used internally by client.ts to maintain the old API signature.
 */
export const parseResultWithClient = <T extends z.ZodTypeAny>(_client: unknown, schema: T, data: unknown): z.infer<T> =>
  parseResult(schema, data);

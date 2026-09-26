import type { Stream } from 'node:stream';
import * as z from 'zod';

export type BinaryResponse = 'arraybuffer' | 'stream' | 'blob';

export type BinaryResponseType<T extends BinaryResponse> = T extends 'stream'
  ? Stream
  : T extends 'arraybuffer'
    ? ArrayBuffer
    : Blob;

export const defaultBinaryResponse = <T extends BinaryResponse>(): T =>
  (typeof window !== 'undefined' ? 'blob' : 'stream') as T;

/*
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Optional<T> = T | {};

export const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([z.strictObject({}), schema]);*/

export const imageResizeOptionsSchemaProps = {
  width: z.coerce.number().int().positive().optional().describe('The width of the resized image'),
  height: z.coerce.number().int().positive().optional().describe('The height of the resized image'),
  quality: z.coerce.number().int().min(1).max(100).optional().describe('The quality of the resized image'),
};

export const ImageResizeOptionsSchema = z.strictObject(imageResizeOptionsSchemaProps);
export type ImageResizeOptions = z.infer<typeof ImageResizeOptionsSchema>;

// Define the image format schema
export const ImageTransformFormatSchema = z.enum(['jpg', 'png', 'webp', 'avif']);
export type ImageTransformFormat = z.infer<typeof ImageTransformFormatSchema>;

export const imageTransformOptionsSchemaProps = {
  format: ImageTransformFormatSchema.optional().describe('The image format to transform to'),
  ...imageResizeOptionsSchemaProps,
};

export const ImageTransformOptionsSchema = z.strictObject(imageTransformOptionsSchemaProps);

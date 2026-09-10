import type { Transform } from 'mtlx-core';
import { resizeTextures, type ImageFormat } from 'mtlx-core/textures';

export const IMAGE_FORMATS = ['webp', 'png', 'jpg', 'avif'] as const;

/** Texture flags for `transform`; pair with `.group(TEXTURE_OPTION_KEYS, TEXTURE_OPTION_GROUP)`. */
export const textureTransformOptions = {
  'max-image-size': {
    describe: 'Resize any texture whose longest edge exceeds this many pixels',
    type: 'number',
  },
  'image-format': {
    describe: 'Convert textures to this image format',
    choices: IMAGE_FORMATS,
  },
  'image-quality': {
    describe: 'Quality for lossy image formats (webp/jpg/avif)',
    type: 'number',
    default: 95,
  },
} as const;

export const TEXTURE_OPTION_KEYS = Object.keys(textureTransformOptions);
export const TEXTURE_OPTION_GROUP = 'Texture options:';

export interface TextureTransformArgv {
  maxImageSize?: number;
  imageFormat?: ImageFormat;
  imageQuality: number;
}

/** The transforms implied by the texture flags; empty when none were given. */
export const textureTransforms = (argv: TextureTransformArgv): Transform[] =>
  argv.maxImageSize || argv.imageFormat
    ? [
        resizeTextures({
          maxImageSize: argv.maxImageSize,
          imageFormat: argv.imageFormat,
          imageQuality: argv.imageQuality,
        }),
      ]
    : [];

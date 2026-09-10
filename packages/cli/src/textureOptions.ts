import { transformImage, type ImageFormat } from 'mtlx-core/textures';
import type { TransformResourceHook } from 'mtlx-core';

export const IMAGE_FORMATS = ['webp', 'png', 'jpg', 'avif'] as const;

/** Shared by `pack` (transform-on-the-way-into-the-archive) and `transform` (standalone). */
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

export interface TextureTransformArgv {
  maxImageSize?: number;
  imageFormat?: ImageFormat;
  imageQuality: number;
}

export const hasTextureTransformOptions = (argv: TextureTransformArgv): boolean =>
  Boolean(argv.maxImageSize) || Boolean(argv.imageFormat);

/** Builds the `transformResource` hook `resolveMaterialXResources`/`packMaterialX` accept. */
export const buildTransformResourceHook = (argv: TextureTransformArgv): TransformResourceHook => {
  return async (data, _sourcePath, sourceExtension) => {
    const result = await transformImage(data, sourceExtension, {
      maxImageSize: argv.maxImageSize,
      imageFormat: argv.imageFormat,
      imageQuality: argv.imageQuality,
    });
    return { data: result.data, extension: result.extension };
  };
};

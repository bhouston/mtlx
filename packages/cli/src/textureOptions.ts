import type { Transform } from 'mtlx-core';
import { resizeTextures, type ImageFormat } from 'mtlx-core/textures';

export const IMAGE_FORMATS = ['webp', 'png', 'jpg', 'avif'] as const;

/**
 * Named presets for `--profile`, each a shorthand for `--max-image-size`/`--image-format`.
 * `imageFormat` is deliberately left unset here: `resizeTextures`/`transformImage` in mtlx-core
 * already only reformat a texture whose extension isn't web-compatible (defaulting it to webp),
 * so leaving it unset keeps profile-driven conversion a filter (skip textures already fine)
 * rather than a blanket re-encode. An explicit `--image-format`/`--max-image-size` overrides the
 * profile.
 */
interface Profile {
  maxImageSize?: number;
  imageFormat?: ImageFormat;
}

export const PROFILES: Record<string, Profile> = {
  web: { maxImageSize: 2048 },
};

export const PROFILE_NAMES = Object.keys(PROFILES) as (keyof typeof PROFILES)[];

/** Texture flags for `transform`; pair with `.group(TEXTURE_OPTION_KEYS, TEXTURE_OPTION_GROUP)`. */
export const textureTransformOptions = {
  profile: {
    describe:
      'Apply a named texture preset (e.g. "web": webp-preferred, 2048px max); only touches incompatible textures',
    choices: PROFILE_NAMES,
  },
  'max-image-size': {
    describe: 'Resize any texture whose longest edge exceeds this many pixels; overrides --profile',
    type: 'number',
  },
  'image-format': {
    describe: 'Convert textures to this image format; overrides --profile',
    choices: IMAGE_FORMATS,
  },
  'image-quality': {
    describe: 'Quality for lossy image formats (webp/jpg/avif)',
    type: 'number',
    default: 95,
  },
  'texture-library': {
    alias: 'tl',
    describe:
      'Loose .mtlx output only: copy textures into this directory (relative to --output) instead of ./textures. ' +
      'Ignored for .mtlx.zip output, which always uses ./textures.',
    type: 'string',
  },
} as const;

export const TEXTURE_OPTION_KEYS = Object.keys(textureTransformOptions);
export const TEXTURE_OPTION_GROUP = 'Texture options:';

export interface TextureTransformArgv {
  profile?: keyof typeof PROFILES;
  maxImageSize?: number;
  imageFormat?: ImageFormat;
  imageQuality: number;
}

/** The transforms implied by the texture flags; empty when none were given. `--max-image-size`
 * and `--image-format` each override the corresponding setting from `--profile`. */
export const textureTransforms = (argv: TextureTransformArgv): Transform[] => {
  const profile = argv.profile ? PROFILES[argv.profile] : undefined;
  const maxImageSize = argv.maxImageSize ?? profile?.maxImageSize;
  const imageFormat = argv.imageFormat ?? profile?.imageFormat;
  return maxImageSize || imageFormat
    ? [resizeTextures({ maxImageSize, imageFormat, imageQuality: argv.imageQuality })]
    : [];
};

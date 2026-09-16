import { EXR_COMPRESSIONS, type ExrCompression } from 'hdrify';
import type { Transform } from 'mtlx-core';
import { resizeTextures, type ImageFormat, type TextureTarget } from 'mtlx-core/textures';

export const IMAGE_FORMATS = ['webp', 'png', 'jpg', 'avif', 'exr', 'hdr'] as const;
const IMAGE_FORMAT_SET = new Set<string>(IMAGE_FORMATS);
const EXR_COMPRESSION_SET = new Set<string>(EXR_COMPRESSIONS);

/** Parses `--image-format webp,exr:piz` into targets. Only `exr` accepts a `:<compression>` suffix. */
export const parseTextureTargets = (value: string): TextureTarget[] =>
  value.split(',').map((entry) => {
    const [format, compression] = entry.trim().split(':');
    if (!format || !IMAGE_FORMAT_SET.has(format)) {
      throw new Error(`Unknown --image-format "${format}"; expected one of ${IMAGE_FORMATS.join(', ')}`);
    }
    if (compression) {
      if (format !== 'exr') {
        throw new Error(`--image-format "${entry}": compression (":${compression}") is only valid for exr`);
      }
      if (!EXR_COMPRESSION_SET.has(compression)) {
        throw new Error(`Unknown EXR compression "${compression}"; expected one of ${EXR_COMPRESSIONS.join(', ')}`);
      }
    }
    return { format: format as ImageFormat, compression: compression as ExrCompression | undefined };
  });

/**
 * Named presets for `--profile`, each a shorthand for `--max-image-size`/`--image-format`.
 * `web`'s targets only include an `exr:piz` entry (not a blanket SDR target): `resizeTextures`/
 * `transformImage` in mtlx-core only reformat a texture whose extension isn't already a requested
 * target, so this normalizes EXR compression to PIZ (the safest choice for Three.js/Babylon) and
 * otherwise leaves textures whose classification has no explicit target alone. An explicit
 * `--image-format`/`--max-image-size` overrides the profile entirely.
 */
interface Profile {
  maxImageSize?: number;
  targets?: TextureTarget[];
}

export const PROFILES: Record<string, Profile> = {
  web: { maxImageSize: 2048, targets: [{ format: 'exr', compression: 'piz' }] },
};

export const PROFILE_NAMES = Object.keys(PROFILES) as (keyof typeof PROFILES)[];

/** Texture flags for `transform`; pair with `.group(TEXTURE_OPTION_KEYS, TEXTURE_OPTION_GROUP)`. */
export const textureTransformOptions = {
  profile: {
    describe:
      'Apply a named texture preset (e.g. "web": webp-preferred, 2048px max, EXRs normalized to PIZ); only touches incompatible textures',
    choices: PROFILE_NAMES,
  },
  'max-image-size': {
    describe: 'Resize any texture whose longest edge exceeds this many pixels; overrides --profile',
    type: 'number',
  },
  'image-format': {
    describe:
      'Comma-separated target formats (webp,png,jpg,avif,exr,hdr); overrides --profile. ' +
      'Each source converts to the target sharing its dynamic range: SDR sources use the first SDR ' +
      'target, HDR sources (exr/hdr) use the first HDR target. An HDR source with no HDR target ' +
      'requested is linearly clipped to SDR (no tone mapping). Append ":<compression>" to exr ' +
      '(e.g. "exr:piz") to normalize EXR compression; supported: ' +
      EXR_COMPRESSIONS.join(', '),
    type: 'string',
    coerce: parseTextureTargets,
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
      'Ignored for .mtlx.zip output, whose resources remain inside the archive.',
    type: 'string',
  },
} as const;

export const TEXTURE_OPTION_KEYS = Object.keys(textureTransformOptions);
export const TEXTURE_OPTION_GROUP = 'Texture options:';

export interface TextureTransformArgv {
  profile?: keyof typeof PROFILES;
  maxImageSize?: number;
  imageFormat?: TextureTarget[];
  imageQuality: number;
}

/** The transforms implied by the texture flags; empty when none were given. `--max-image-size`
 * and `--image-format` each override the corresponding setting from `--profile`. */
export const textureTransforms = (argv: TextureTransformArgv): Transform[] => {
  const profile = argv.profile ? PROFILES[argv.profile] : undefined;
  const maxImageSize = argv.maxImageSize ?? profile?.maxImageSize;
  const targets = argv.imageFormat ?? profile?.targets;
  return maxImageSize || targets ? [resizeTextures({ maxImageSize, targets, imageQuality: argv.imageQuality })] : [];
};

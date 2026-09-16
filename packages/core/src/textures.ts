import { applyResourceDestinations, planResourceDestinations } from './resource-graph.js';
/**
 * Texture resizing and reformatting, backed by [sharp](https://sharp.pixelplumbing.com/) for SDR
 * formats and [hdrify](https://www.npmjs.com/package/hdrify) for EXR/HDR.
 *
 * Both are native/Node-oriented, so this lives behind the `mtlx-core/textures` subpath and is
 * never pulled into a browser bundle by the root `mtlx-core` entry.
 *
 * @module mtlx-core/textures
 */
import {
  EXR_COMPRESSION_CODES,
  readExr,
  readHdr,
  resizeImage,
  writeExr,
  writeHdr,
  type ExrCompression,
  type HdrifyImage,
} from 'hdrify';
import sharp from 'sharp';
import { isImagePath, posixExtname, withExtension, type Transform } from './package.js';

/**
 * *SDR (web-compatible) output formats.*
 *
 * @category Textures
 */
export type SdrImageFormat = 'webp' | 'png' | 'jpg' | 'avif';

/**
 * *HDR output formats.*
 *
 * @category Textures
 */
export type HdrImageFormat = 'exr' | 'hdr';

/**
 * *Any supported output format.*
 *
 * @category Textures
 */
export type ImageFormat = SdrImageFormat | HdrImageFormat;

const SDR_FORMATS: ReadonlySet<string> = new Set(['webp', 'png', 'jpg', 'jpeg', 'avif']);
const HDR_FORMATS: ReadonlySet<string> = new Set(['exr', 'hdr']);
const isHdrFormat = (format: string): boolean => HDR_FORMATS.has(format);

/**
 * *One `--image-format` target.* `compression` only applies to (and is only honored for) `exr`.
 *
 * @category Textures
 */
export interface TextureTarget {
  format: ImageFormat;
  compression?: ExrCompression;
}

/**
 * *Options for {@link transformImage} and {@link resizeTextures}.*
 *
 * @category Textures
 */
export interface TransformImageOptions {
  /** Resize any image whose longest edge exceeds this many pixels (aspect ratio preserved). */
  maxImageSize?: number;
  /**
   * Target formats. Each source image is converted to the target sharing its dynamic-range
   * classification (SDR sources prefer an SDR target, HDR sources prefer an HDR target), so
   * `webp,exr` sends SDR sources to webp and HDR sources to exr without cross-converting.
   */
  targets?: TextureTarget[];
  /** Quality for lossy SDR formats (webp/jpg/avif). */
  imageQuality?: number;
}

/**
 * *Defaults for {@link TransformImageOptions}.*
 *
 * @category Textures
 */
export const TRANSFORM_IMAGE_DEFAULTS = { imageQuality: 95 } as const satisfies TransformImageOptions;

/**
 * *The result of {@link transformImage}.* `changed` is false when the input was returned as-is.
 *
 * @category Textures
 */
export interface TransformImageResult {
  data: Uint8Array;
  extension: string;
  changed: boolean;
}

/** sharp's `jpg` output format is spelled `jpeg`; everything else matches. */
const sharpFormatFor = (format: SdrImageFormat): 'jpeg' | 'png' | 'webp' | 'avif' =>
  format === 'jpg' ? 'jpeg' : format;

/** The first target sharing `sourceExt`'s dynamic-range classification (SDR/HDR), if any was requested. */
const pickTarget = (sourceExt: string, targets: TextureTarget[]): TextureTarget | undefined => {
  const sourceIsHdr = isHdrFormat(sourceExt);
  return targets.find((target) => isHdrFormat(target.format) === sourceIsHdr);
};

/** Scales `width`/`height` down (never up) so the longest edge is at most `maxSize`, preserving aspect ratio. */
const fitDimensions = (width: number, height: number, maxSize: number): { width: number; height: number } => {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxSize) return { width, height };
  const scale = maxSize / longestEdge;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

const transformSdrSource = async (
  data: Uint8Array,
  sourceExt: string,
  targets: TextureTarget[],
  maxImageSize: number | undefined,
  imageQuality: number,
): Promise<TransformImageResult> => {
  const sourceExtension = `.${sourceExt}`;
  const requested = pickTarget(sourceExt, targets) as { format: SdrImageFormat } | undefined;
  const targetFormat: SdrImageFormat | undefined =
    requested?.format ?? (SDR_FORMATS.has(sourceExt) ? undefined : 'webp');

  if (!maxImageSize && !targetFormat) {
    return { data, extension: sourceExtension, changed: false };
  }

  let pipeline = sharp(data);
  const metadata = await pipeline.metadata();
  const longestEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0);
  const needsResize = Boolean(maxImageSize) && longestEdge > maxImageSize!;
  if (needsResize) {
    pipeline = pipeline.resize({ width: maxImageSize, height: maxImageSize, fit: 'inside', withoutEnlargement: true });
  }

  if (!needsResize && !targetFormat) {
    return { data, extension: sourceExtension, changed: false };
  }

  const outputFormat = targetFormat ? sharpFormatFor(targetFormat) : (metadata.format ?? 'png');
  pipeline =
    outputFormat === 'png'
      ? pipeline.png()
      : pipeline.toFormat(outputFormat as 'jpeg' | 'webp' | 'avif', { quality: imageQuality });

  return {
    data: new Uint8Array(await pipeline.toBuffer()),
    extension: targetFormat ? `.${targetFormat}` : sourceExtension,
    changed: true,
  };
};

/**
 * Converts a decoded HDR/EXR image straight down to an SDR raster with no tone mapping: each
 * linear channel value is scaled by 255 and clipped to [0, 255]. Values above 1.0 clip to white.
 */
const clipHdrToSdr = async (
  image: { width: number; height: number; data: Float32Array },
  targetFormat: SdrImageFormat,
  imageQuality: number,
): Promise<TransformImageResult> => {
  const rgba = new Uint8Array(image.width * image.height * 4);
  for (let i = 0; i < rgba.length; i++) {
    rgba[i] = Math.min(255, Math.max(0, Math.round(image.data[i]! * 255)));
  }
  const pipeline = sharp(rgba, { raw: { width: image.width, height: image.height, channels: 4 } });
  const outputFormat = sharpFormatFor(targetFormat);
  const output = outputFormat === 'png' ? pipeline.png() : pipeline.toFormat(outputFormat, { quality: imageQuality });
  return { data: new Uint8Array(await output.toBuffer()), extension: `.${targetFormat}`, changed: true };
};

const transformHdrSource = async (
  data: Uint8Array,
  sourceExt: 'exr' | 'hdr',
  targets: TextureTarget[],
  maxImageSize: number | undefined,
  imageQuality: number,
): Promise<TransformImageResult> => {
  const sourceExtension = `.${sourceExt}`;
  const requested = pickTarget(sourceExt, targets);
  const sdrFallback = requested
    ? undefined
    : (targets.find((target) => SDR_FORMATS.has(target.format))?.format as SdrImageFormat | undefined);

  if (!requested && !sdrFallback && !maxImageSize) {
    return { data, extension: sourceExtension, changed: false };
  }
  if (requested?.format === sourceExt && !requested.compression && !maxImageSize) {
    return { data, extension: sourceExtension, changed: false };
  }

  const image = sourceExt === 'exr' ? readExr(data) : readHdr(data);
  const dims = maxImageSize ? fitDimensions(image.width, image.height, maxImageSize) : image;
  const resized: HdrifyImage =
    dims.width === image.width && dims.height === image.height ? image : resizeImage(image, dims);

  if (sdrFallback) return clipHdrToSdr(resized, sdrFallback, imageQuality);

  const targetFormat = (requested?.format ?? sourceExt) as 'exr' | 'hdr';
  const currentCompression = sourceExt === 'exr' ? (image.metadata?.compression as number | undefined) : undefined;
  const compression = targetFormat === 'exr' ? (requested?.compression ?? currentCompression) : undefined;
  const compressionChanged =
    Boolean(requested?.compression) && currentCompression !== EXR_COMPRESSION_CODES[requested!.compression!];
  const unchanged = resized === image && targetFormat === sourceExt && !compressionChanged;

  if (unchanged) return { data, extension: sourceExtension, changed: false };
  return {
    data: targetFormat === 'exr' ? writeExr(resized, { compression }) : writeHdr(resized),
    extension: `.${targetFormat}`,
    changed: true,
  };
};

/**
 * *Resizes (if oversized) and/or reformats one image's bytes.*
 *
 * SDR sources are read/written via sharp; EXR/HDR sources via hdrify. Each source converts to
 * the target sharing its dynamic-range classification (see {@link TransformImageOptions.targets}).
 * An HDR source with only SDR targets requested is linearly clipped to SDR (no tone mapping) so
 * it's still usable; an unclassified SDR source (e.g. `.tif`) with no matching target defaults to
 * webp so the output is always usable directly in a browser.
 *
 * Example:
 *
 * ```ts
 * const { data, extension } = await transformImage(bytes, '.tif', { maxImageSize: 1024 });
 * // extension === '.webp'
 * ```
 *
 * @category Textures
 */
export const transformImage = async (
  data: Uint8Array,
  sourceExtension: string,
  options: TransformImageOptions = {},
): Promise<TransformImageResult> => {
  const { maxImageSize, targets = [], imageQuality } = { ...TRANSFORM_IMAGE_DEFAULTS, ...options };
  const sourceExt = sourceExtension.toLowerCase().replace(/^\./, '');

  return isHdrFormat(sourceExt)
    ? transformHdrSource(data, sourceExt as 'exr' | 'hdr', targets, maxImageSize, imageQuality)
    : transformSdrSource(data, sourceExt, targets, maxImageSize, imageQuality);
};

/**
 * *A {@link Transform} that resizes and/or reformats every image resource in a package.*
 *
 * Renamed textures (e.g. `.jpg` → `.webp`) have their document references rewritten, so the
 * package stays consistent for `writeMaterialXPackage`.
 *
 * Example:
 *
 * ```ts
 * import { transform } from 'mtlx-core';
 * import { resizeTextures } from 'mtlx-core/textures';
 *
 * await transform(pkg, resizeTextures({ maxImageSize: 2048, targets: [{ format: 'webp' }], imageQuality: 90 }));
 * ```
 *
 * @category Transforms
 */
export const resizeTextures = (options: TransformImageOptions = {}): Transform => {
  return async (pkg) => {
    const results = new Map<(typeof pkg.resources)[number], Awaited<ReturnType<typeof transformImage>>>();
    for (const resource of pkg.resources) {
      if (isImagePath(resource.archivePath)) {
        results.set(resource, await transformImage(resource.data, posixExtname(resource.archivePath), options));
      }
    }
    const destinations = planResourceDestinations(pkg, (resource) => {
      const result = results.get(resource);
      return result?.changed ? withExtension(resource.archivePath, result.extension) : resource.archivePath;
    });
    applyResourceDestinations(pkg, destinations);
    for (const [resource, result] of results) if (result.changed) resource.data = result.data;
  };
};

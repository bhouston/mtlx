/**
 * Texture resizing and reformatting, backed by [sharp](https://sharp.pixelplumbing.com/).
 *
 * sharp is a native, Node-only dependency, so this lives behind the `mtlx-core/textures`
 * subpath and is never pulled into a browser bundle by the root `mtlx-core` entry.
 *
 * @module mtlx-core/textures
 */
import sharp from 'sharp';
import { isImagePath, posixExtname, rewriteResourcePath, withExtension, type Transform } from './package.js';

/**
 * *Web-compatible output formats.*
 *
 * @category Textures
 */
export type ImageFormat = 'webp' | 'png' | 'jpg' | 'avif';

const WEB_FORMATS: ReadonlySet<string> = new Set(['webp', 'png', 'jpg', 'jpeg', 'avif']);

/**
 * *Options for {@link transformImage} and {@link resizeTextures}.*
 *
 * @category Textures
 */
export interface TransformImageOptions {
  /** Resize any image whose longest edge exceeds this many pixels (aspect ratio preserved). */
  maxImageSize?: number;
  /** Convert to this format. Non-web sources (e.g. `.tif`) default to `webp` when unset. */
  imageFormat?: ImageFormat;
  /** Quality for lossy formats (webp/jpg/avif). */
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
const sharpFormatFor = (format: ImageFormat): 'jpeg' | 'png' | 'webp' | 'avif' => (format === 'jpg' ? 'jpeg' : format);

/**
 * *Resizes (if oversized) and/or reformats one image's bytes.*
 *
 * Reads any format sharp/libvips supports (webp, png, jpg, avif, gif, tiff, ...); writes only
 * the four web-compatible targets. A non-web source with no explicit `imageFormat` becomes webp
 * so the output is always usable directly in a browser.
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
  const { maxImageSize, imageFormat, imageQuality } = { ...TRANSFORM_IMAGE_DEFAULTS, ...options };
  const sourceExt = sourceExtension.toLowerCase().replace(/^\./, '');
  const targetFormat: ImageFormat | undefined = imageFormat ?? (WEB_FORMATS.has(sourceExt) ? undefined : 'webp');

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
 * await transform(pkg, resizeTextures({ maxImageSize: 2048, imageFormat: 'webp', imageQuality: 90 }));
 * ```
 *
 * @category Transforms
 */
export const resizeTextures = (options: TransformImageOptions = {}): Transform => {
  return async (pkg) => {
    for (const resource of pkg.resources) {
      if (!isImagePath(resource.archivePath)) {
        continue;
      }
      const result = await transformImage(resource.data, posixExtname(resource.archivePath), options);
      if (!result.changed) {
        continue;
      }
      // ponytail: a.png + a.webp both becoming a.webp collide; dedupe names if that ever bites.
      const archivePath = withExtension(resource.archivePath, result.extension);
      rewriteResourcePath(pkg.document, resource.archivePath, archivePath);
      resource.archivePath = archivePath;
      resource.data = result.data;
    }
  };
};

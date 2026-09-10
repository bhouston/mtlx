import sharp from 'sharp';

// Not exported from index.ts: sharp is a native, Node-only dependency, so this stays reachable
// only via the "mtlx-core/textures" subpath export — the website's browser bundle never sees it.

export type ImageFormat = 'webp' | 'png' | 'jpg' | 'avif';

const WEB_FORMATS: ReadonlySet<string> = new Set(['webp', 'png', 'jpg', 'jpeg', 'avif']);
const DEFAULT_QUALITY = 95;

export interface TransformImageOptions {
  maxImageSize?: number;
  imageFormat?: ImageFormat;
  imageQuality?: number;
}

export interface TransformImageResult {
  data: Uint8Array;
  extension: string;
  changed: boolean;
}

const extensionFor = (format: ImageFormat): string => `.${format}`;

/** sharp's `jpg` output format is spelled `jpeg`; everything else matches. */
const sharpFormatFor = (format: ImageFormat): 'jpeg' | 'png' | 'webp' | 'avif' => (format === 'jpg' ? 'jpeg' : format);

/**
 * Resizes (if oversized) and/or reformats an image buffer. Reads any format sharp/libvips
 * supports (webp, png, jpg, avif, gif, tiff, ...); writes only the four web-compatible targets.
 * A non-web source format (e.g. .tif/.tiff) with no explicit `imageFormat` defaults to webp,
 * since the output must always be usable directly in a browser.
 */
export const transformImage = async (
  data: Uint8Array,
  sourceExtension: string,
  options: TransformImageOptions,
): Promise<TransformImageResult> => {
  const sourceExt = sourceExtension.toLowerCase().replace(/^\./, '');
  const isWebCompatible = WEB_FORMATS.has(sourceExt);
  const targetFormat: ImageFormat | undefined = options.imageFormat ?? (isWebCompatible ? undefined : 'webp');

  if (!options.maxImageSize && !targetFormat) {
    return { data, extension: sourceExtension, changed: false };
  }

  let pipeline = sharp(data);
  const metadata = await pipeline.metadata();
  const longestEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0);
  const needsResize = Boolean(options.maxImageSize) && longestEdge > options.maxImageSize!;
  if (needsResize) {
    pipeline = pipeline.resize({
      width: options.maxImageSize,
      height: options.maxImageSize,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  if (!needsResize && !targetFormat) {
    return { data, extension: sourceExtension, changed: false };
  }

  const quality = options.imageQuality ?? DEFAULT_QUALITY;
  const outputFormat = targetFormat ? sharpFormatFor(targetFormat) : (metadata.format ?? 'png');
  pipeline =
    outputFormat === 'png' ? pipeline.png() : pipeline.toFormat(outputFormat as 'jpeg' | 'webp' | 'avif', { quality });

  const outputData = await pipeline.toBuffer();
  return {
    data: new Uint8Array(outputData),
    extension: targetFormat ? extensionFor(targetFormat) : sourceExtension,
    changed: true,
  };
};

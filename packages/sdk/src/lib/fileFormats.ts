import type { Enums } from './enums.js';

const FILE_FORMAT_DEFINITIONS = {
  gif: { name: 'GIF', mimeType: 'image/gif', extension: '.gif' },
  jpg: { name: 'JPEG', mimeType: 'image/jpeg', extension: '.jpg', alternativeExtensions: ['.jpeg'] },
  mtlx: {
    name: 'MaterialX',
    mimeType: 'application/xml',
    extension: '.mtlx',
    alternativeMimeTypes: ['text/xml'],
  },
  mtlxzip: {
    name: 'MaterialX Package (MTLX.ZIP)',
    mimeType: 'application/zip',
    extension: '.mtlx.zip',
    alternativeMimeTypes: ['application/octet-stream'],
  },
  png: { name: 'PNG', mimeType: 'image/png', extension: '.png' },
  webp: { name: 'WebP', mimeType: 'image/webp', extension: '.webp' },
} as const;

export type FileFormat = keyof typeof FILE_FORMAT_DEFINITIONS;
export const FileFormat = Object.keys(FILE_FORMAT_DEFINITIONS) as FileFormat[];
export const MimeType = [
  ...new Set(Object.values(FILE_FORMAT_DEFINITIONS).map((definition) => definition.mimeType)),
] as const;
export type MimeType = (typeof MimeType)[number];

export type FileFormatInfo = {
  format: FileFormat;
  name: string;
  mimeType: MimeType;
  extension: string;
  alternativeExtensions: readonly string[];
  alternativeMimeTypes: readonly string[];
};

export const FileFormatToFileFormatInfo: Record<FileFormat, FileFormatInfo> = FileFormat.reduce(
  (acc, format) => {
    const definition = FILE_FORMAT_DEFINITIONS[format];
    const alternativeExtensions = 'alternativeExtensions' in definition ? definition.alternativeExtensions : [];
    const alternativeMimeTypes = 'alternativeMimeTypes' in definition ? definition.alternativeMimeTypes : [];
    acc[format] = { format, ...definition, alternativeExtensions, alternativeMimeTypes };
    return acc;
  },
  {} as Record<FileFormat, FileFormatInfo>,
);

export type AssetTypeFileMapping = {
  fileFormats: readonly FileFormat[];
  description: string;
};
export function getFileFormatInfos(formats: readonly FileFormat[]): FileFormatInfo[] {
  return formats.map((format) => FileFormatToFileFormatInfo[format]);
}

export const MATERIAL_ASSET_FILE_FORMATS = ['mtlx', 'mtlxzip'] as const satisfies readonly FileFormat[];

function getDescriptionExtensionList(fileFormatInfos: readonly FileFormatInfo[]): string {
  return Array.from(
    new Set(
      fileFormatInfos.flatMap((fileFormatInfo) =>
        [fileFormatInfo.extension, ...fileFormatInfo.alternativeExtensions].map((ext) =>
          ext.replace('.', '').toUpperCase(),
        ),
      ),
    ),
  ).join(', ');
}

function buildAssetTypeDescription(prefix: string, fileFormatInfos: readonly FileFormatInfo[]): string {
  return `${prefix} (${getDescriptionExtensionList(fileFormatInfos)})`;
}

export const ASSET_TYPE_FILE_MAPPINGS: Record<Enums.AssetType, AssetTypeFileMapping> = {
  MATERIAL: {
    fileFormats: MATERIAL_ASSET_FILE_FORMATS,
    description: buildAssetTypeDescription('MaterialX material files', getFileFormatInfos(MATERIAL_ASSET_FILE_FORMATS)),
  },
};

export const AVATAR_FILE_FORMATS = ['png', 'jpg', 'gif', 'webp'] as const satisfies readonly FileFormat[];

function normalizeExtension(ext: string): string {
  return ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
}

export function getFileFormatMimeTypes(fileFormats: readonly FileFormat[]): MimeType[] {
  return [...new Set(fileFormats.map((fileFormat) => FileFormatToFileFormatInfo[fileFormat].mimeType))] as MimeType[];
}

export function getFileFormatExtensions(fileFormats: readonly FileFormat[]): string[] {
  return [
    ...new Set(
      fileFormats.flatMap((fileFormat) => {
        const info = FileFormatToFileFormatInfo[fileFormat];
        return [info.extension, ...info.alternativeExtensions];
      }),
    ),
  ];
}

export function getFileFormatInfoAcceptObject(fileFormats: readonly FileFormat[]): Record<string, string[]> {
  const acceptObject: Record<string, string[]> = {};
  for (const fileFormatInfo of getFileFormatInfos(fileFormats)) {
    const extensions = [
      fileFormatInfo.extension,
      ...fileFormatInfo.alternativeExtensions,
      ...(acceptObject[fileFormatInfo.mimeType] ?? []),
    ];
    acceptObject[fileFormatInfo.mimeType] = [...new Set(extensions)];
  }
  return acceptObject;
}

export function getFileFormatInfoFromMimeType(
  mimeType: string,
  fileFormats: readonly FileFormat[],
): FileFormatInfo | undefined {
  return getFileFormatInfos(fileFormats).find(
    (fileFormatInfo) => fileFormatInfo.mimeType === mimeType || fileFormatInfo.alternativeMimeTypes.includes(mimeType),
  );
}

export function getFileFormatInfoFromExtension(
  ext: string,
  fileFormats: readonly FileFormat[],
): FileFormatInfo | undefined {
  const normalizedExt = normalizeExtension(ext);
  return getFileFormatInfos(fileFormats).find(
    (fileFormatInfo) =>
      fileFormatInfo.extension === normalizedExt || fileFormatInfo.alternativeExtensions.includes(normalizedExt),
  );
}

/** Given a MIME type, return the matching format key from the allowed set, or undefined if not found. */
export function getMimeFileFormat<T extends readonly FileFormat[]>(
  mimeType: string,
  formats: T,
): T[number] | undefined {
  return getFileFormatInfoFromMimeType(mimeType, formats)?.format as T[number] | undefined;
}

export function getAssetTypeFromFileFormat(fileFormat: FileFormat): Enums.AssetType | undefined {
  for (const [assetType, mapping] of Object.entries(ASSET_TYPE_FILE_MAPPINGS)) {
    if (mapping.fileFormats.includes(fileFormat)) {
      return assetType as Enums.AssetType;
    }
  }
  return;
}

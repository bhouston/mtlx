import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { materialXNodeRegistry } from './registry.js';
import type { MaterialXDocument, MaterialXElement, MaterialXValidationIssue } from './types.js';
import { validateDocument } from './validate.js';
import { parseMaterialX, serializeMaterialX } from './xml.js';

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP64_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06064b50;
const ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIGNATURE = 0x07064b50;
const VERSION_NEEDED_ZIP32 = 20;
const STORE_COMPRESSION_METHOD = 0;
const ALIGNMENT_BYTES = 64;
const EXTRA_FIELD_PADDING_ID = 0xffff;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface MaterialZArchiveInputEntry {
  path: string;
  data: string | Uint8Array;
}

export interface MaterialZArchiveEntry {
  path: string;
  data: Uint8Array;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  dataOffset: number;
  isDirectory: boolean;
}

export interface PackMaterialXOptions {
  outputPath?: string;
}

export interface PackMaterialXResult {
  outputPath: string;
  rootPath: string;
  entries: string[];
}

export interface UnpackMaterialZOptions {
  outputDir?: string;
  force?: boolean;
}

export interface UnpackMaterialZResult {
  outputDir: string;
  rootPath: string;
  entries: string[];
}

export interface CheckMaterialXPackageResult {
  path: string;
  format: 'mtlx' | 'mtlz';
  issues: MaterialXValidationIssue[];
}

export interface MaterialZArchive {
  entries: MaterialZArchiveEntry[];
  rootEntry?: MaterialZArchiveEntry;
  issues: MaterialXValidationIssue[];
}

interface PendingZipEntry {
  path: string;
  data: Uint8Array;
  crc: number;
  localHeaderOffset: number;
  dataOffset: number;
}

const imageExtensions = new Set([
  '.avif',
  '.bmp',
  '.exr',
  '.gif',
  '.hdr',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.tga',
  '.tif',
  '.tiff',
  '.tx',
  '.webp',
]);

const resourceExtensions = new Set([...imageExtensions, '.mtlx', '.json', '.bin', '.txt']);

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const encodePath = (entryPath: string): Uint8Array => textEncoder.encode(entryPath);

const toUint8Array = (data: string | Uint8Array): Uint8Array =>
  typeof data === 'string' ? textEncoder.encode(data) : data;

const toBuffer = (data: Uint8Array): Buffer =>
  Buffer.isBuffer(data) ? data : Buffer.from(data.buffer, data.byteOffset, data.byteLength);

const makeIssue = (
  level: MaterialXValidationIssue['level'],
  location: string,
  message: string,
): MaterialXValidationIssue => ({
  level,
  location,
  message,
});

const hasErrors = (issues: MaterialXValidationIssue[]) => issues.some((issue) => issue.level === 'error');

const isRootMaterialXPath = (entryPath: string): boolean =>
  !entryPath.includes('/') && entryPath.toLowerCase().endsWith('.mtlx');

const isExternalReference = (value: string): boolean => /^[a-z][a-z0-9+.-]*:/i.test(value);

const isPathInside = (rootDir: string, candidatePath: string): boolean => {
  const relative = path.relative(rootDir, candidatePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const validateArchivePath = (entryPath: string): string | undefined => {
  if (!entryPath || entryPath.startsWith('/') || entryPath.includes('\\') || /^[a-z]:/i.test(entryPath)) {
    return 'Archive entry paths must be relative POSIX paths';
  }
  const segments = entryPath.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return 'Archive entry paths must not contain empty, current, or parent segments';
  }
  return undefined;
};

const createPaddingExtra = (offsetBeforeHeader: number, encodedNameLength: number): Buffer => {
  const baseDataOffset = offsetBeforeHeader + 30 + encodedNameLength;
  let extraLength = (ALIGNMENT_BYTES - (baseDataOffset % ALIGNMENT_BYTES)) % ALIGNMENT_BYTES;
  if (extraLength > 0 && extraLength < 4) {
    extraLength += ALIGNMENT_BYTES;
  }
  const extra = Buffer.alloc(extraLength);
  if (extraLength > 0) {
    extra.writeUInt16LE(EXTRA_FIELD_PADDING_ID, 0);
    extra.writeUInt16LE(extraLength - 4, 2);
  }
  return extra;
};

const createLocalHeader = (entryPath: string, data: Uint8Array, crc: number, extra: Buffer): Buffer => {
  const name = encodePath(entryPath);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(LOCAL_FILE_HEADER_SIGNATURE, 0);
  header.writeUInt16LE(VERSION_NEEDED_ZIP32, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(STORE_COMPRESSION_METHOD, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(data.byteLength, 18);
  header.writeUInt32LE(data.byteLength, 22);
  header.writeUInt16LE(name.byteLength, 26);
  header.writeUInt16LE(extra.byteLength, 28);
  return Buffer.concat([header, toBuffer(name), extra]);
};

const createCentralDirectoryHeader = (entry: PendingZipEntry): Buffer => {
  const name = encodePath(entry.path);
  const header = Buffer.alloc(46);
  header.writeUInt32LE(CENTRAL_DIRECTORY_SIGNATURE, 0);
  header.writeUInt16LE(VERSION_NEEDED_ZIP32, 4);
  header.writeUInt16LE(VERSION_NEEDED_ZIP32, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(STORE_COMPRESSION_METHOD, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.data.byteLength, 20);
  header.writeUInt32LE(entry.data.byteLength, 24);
  header.writeUInt16LE(name.byteLength, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(entry.localHeaderOffset, 42);
  return Buffer.concat([header, toBuffer(name)]);
};

const createEndOfCentralDirectory = (
  entryCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number,
): Buffer => {
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entryCount, 8);
  eocd.writeUInt16LE(entryCount, 10);
  eocd.writeUInt32LE(centralDirectorySize, 12);
  eocd.writeUInt32LE(centralDirectoryOffset, 16);
  eocd.writeUInt16LE(0, 20);
  return eocd;
};

export const createMaterialZArchive = (inputEntries: MaterialZArchiveInputEntry[]): Uint8Array => {
  const rootEntries = inputEntries.filter((entry) => isRootMaterialXPath(entry.path));
  if (rootEntries.length !== 1) {
    throw new Error('A .mtlz archive must contain exactly one root-level .mtlx file');
  }

  const entries = [rootEntries[0]!, ...inputEntries.filter((entry) => entry !== rootEntries[0])];
  const seen = new Set<string>();
  const fileParts: Buffer[] = [];
  const pendingEntries: PendingZipEntry[] = [];
  let offset = 0;

  for (const entry of entries) {
    const pathIssue = validateArchivePath(entry.path);
    if (pathIssue) {
      throw new Error(`${pathIssue}: ${entry.path}`);
    }
    if (seen.has(entry.path)) {
      throw new Error(`Duplicate archive entry: ${entry.path}`);
    }
    seen.add(entry.path);
    if (!isRootMaterialXPath(entry.path) && !entry.path.includes('/')) {
      throw new Error(`Resource entries must be stored in subdirectories: ${entry.path}`);
    }

    const data = toUint8Array(entry.data);
    const name = encodePath(entry.path);
    const extra = createPaddingExtra(offset, name.byteLength);
    const localHeaderOffset = offset;
    const localHeader = createLocalHeader(entry.path, data, crc32(data), extra);
    const dataOffset = localHeaderOffset + localHeader.byteLength;
    fileParts.push(localHeader, toBuffer(data));
    pendingEntries.push({
      path: entry.path,
      data,
      crc: crc32(data),
      localHeaderOffset,
      dataOffset,
    });
    offset += localHeader.byteLength + data.byteLength;
  }

  const centralDirectoryOffset = offset;
  const centralDirectoryParts = pendingEntries.map((entry) => createCentralDirectoryHeader(entry));
  const centralDirectorySize = centralDirectoryParts.reduce((size, part) => size + part.byteLength, 0);
  const archiveSize = centralDirectoryOffset + centralDirectorySize + 22;
  if (
    pendingEntries.length > 0xffff ||
    centralDirectoryOffset > 0xffffffff ||
    centralDirectorySize > 0xffffffff ||
    archiveSize > 0xffffffff
  ) {
    throw new Error('.mtlz archives must use ZIP32 and cannot exceed ZIP32 limits');
  }

  return Buffer.concat([
    ...fileParts,
    ...centralDirectoryParts,
    createEndOfCentralDirectory(pendingEntries.length, centralDirectorySize, centralDirectoryOffset),
  ]);
};

const findLastSignature = (buffer: Uint8Array, signature: number): number => {
  for (let offset = buffer.byteLength - 4; offset >= 0; offset -= 1) {
    if (
      buffer[offset] === (signature & 0xff) &&
      buffer[offset + 1] === ((signature >>> 8) & 0xff) &&
      buffer[offset + 2] === ((signature >>> 16) & 0xff) &&
      buffer[offset + 3] === ((signature >>> 24) & 0xff)
    ) {
      return offset;
    }
  }
  return -1;
};

const sliceEntryData = (
  buffer: Uint8Array,
  entryPath: string,
  compressedSize: number,
  localHeaderOffset: number,
  issues: MaterialXValidationIssue[],
): { data: Uint8Array; dataOffset: number } => {
  if (
    localHeaderOffset + 30 > buffer.byteLength ||
    Buffer.from(buffer).readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE
  ) {
    issues.push(makeIssue('error', entryPath, 'Central directory points to an invalid local file header'));
    return { data: new Uint8Array(), dataOffset: localHeaderOffset };
  }

  const nameLength = Buffer.from(buffer).readUInt16LE(localHeaderOffset + 26);
  const extraLength = Buffer.from(buffer).readUInt16LE(localHeaderOffset + 28);
  const dataOffset = localHeaderOffset + 30 + nameLength + extraLength;
  const dataEnd = dataOffset + compressedSize;
  if (dataEnd > buffer.byteLength) {
    issues.push(makeIssue('error', entryPath, 'Archive entry data extends past the end of the file'));
    return { data: new Uint8Array(), dataOffset };
  }
  return { data: buffer.slice(dataOffset, dataEnd), dataOffset };
};

export const inspectMaterialZArchive = (data: Uint8Array): MaterialZArchive => {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  const issues: MaterialXValidationIssue[] = [];
  const zip64Eocd = findLastSignature(buffer, ZIP64_END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  const zip64Locator = findLastSignature(buffer, ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIGNATURE);
  if (zip64Eocd !== -1 || zip64Locator !== -1) {
    issues.push(makeIssue('error', 'archive', '.mtlz archives must use ZIP32, not ZIP64'));
  }

  const eocdOffset = findLastSignature(buffer, END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  if (eocdOffset === -1) {
    return {
      entries: [],
      issues: [makeIssue('error', 'archive', 'Missing ZIP end of central directory record')],
    };
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (entryCount === 0xffff || centralDirectorySize === 0xffffffff || centralDirectoryOffset === 0xffffffff) {
    issues.push(makeIssue('error', 'archive', '.mtlz archives must use ZIP32 fields, not ZIP64 sentinel values'));
  }
  if (centralDirectoryOffset + centralDirectorySize > eocdOffset) {
    issues.push(makeIssue('error', 'archive', 'Central directory extends past the ZIP end record'));
  }

  const entries: MaterialZArchiveEntry[] = [];
  const seen = new Set<string>();
  let cursor = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > buffer.byteLength || buffer.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_SIGNATURE) {
      issues.push(makeIssue('error', 'archive', 'Invalid central directory file header'));
      break;
    }

    const flags = buffer.readUInt16LE(cursor + 8);
    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + nameLength;
    const entryPath = textDecoder.decode(buffer.slice(nameStart, nameEnd));
    cursor = nameEnd + extraLength + commentLength;

    const pathIssue = validateArchivePath(entryPath);
    if (pathIssue) {
      issues.push(makeIssue('error', entryPath, pathIssue));
    }
    if (seen.has(entryPath)) {
      issues.push(makeIssue('error', entryPath, 'Duplicate archive entry'));
    }
    seen.add(entryPath);
    if ((flags & 0x0001) !== 0) {
      issues.push(makeIssue('error', entryPath, '.mtlz archives must not be encrypted'));
    }
    if ((flags & 0x0008) !== 0) {
      issues.push(makeIssue('error', entryPath, '.mtlz archives must not use data descriptors'));
    }
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
      issues.push(makeIssue('error', entryPath, '.mtlz archives must use ZIP32 entry fields'));
    }

    const { data: entryData, dataOffset } = sliceEntryData(
      buffer,
      entryPath,
      compressedSize,
      localHeaderOffset,
      issues,
    );
    entries.push({
      path: entryPath,
      data: entryData,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      dataOffset,
      isDirectory: entryPath.endsWith('/'),
    });
  }

  const files = entries.filter((entry) => !entry.isDirectory);
  const rootEntries = files.filter((entry) => isRootMaterialXPath(entry.path));
  if (rootEntries.length !== 1) {
    issues.push(makeIssue('error', 'archive', '.mtlz archives must contain exactly one root-level .mtlx file'));
  }
  const sortedByLocalOffset = files.toSorted((left, right) => left.localHeaderOffset - right.localHeaderOffset);
  const rootEntry = rootEntries[0];
  if (rootEntry && sortedByLocalOffset[0]?.path !== rootEntry.path) {
    issues.push(
      makeIssue('error', rootEntry.path, 'Root .mtlx file must be the first local file record in the archive'),
    );
  }

  for (const entry of files) {
    if (entry === rootEntry) {
      if (entry.compressionMethod !== STORE_COMPRESSION_METHOD) {
        issues.push(makeIssue('error', entry.path, 'Root .mtlx file must be stored uncompressed'));
      }
      continue;
    }
    if (!entry.path.includes('/')) {
      issues.push(makeIssue('error', entry.path, 'Resource files must be stored in subdirectories'));
    }
    if (entry.compressionMethod !== STORE_COMPRESSION_METHOD) {
      issues.push(makeIssue('error', entry.path, 'Resource files must be stored without compression'));
    }
    if (entry.dataOffset % ALIGNMENT_BYTES !== 0) {
      issues.push(makeIssue('error', entry.path, 'Resource file data must be aligned to a 64-byte boundary'));
    }
  }

  return { entries, rootEntry, issues };
};

export const readMaterialZArchive = async (inputPath: string): Promise<MaterialZArchive> => {
  const data = await readFile(inputPath);
  return inspectMaterialZArchive(data);
};

const shouldConsiderReference = (element: MaterialXElement, attributeName: string, value: string): boolean => {
  const name = attributeName.toLowerCase();
  if (element.attributes.type === 'filename' && name === 'value') {
    return true;
  }
  if (['file', 'filename', 'href', 'uri', 'source'].includes(name)) {
    return true;
  }
  if (name === 'value') {
    const extension = path.posix.extname(value).toLowerCase();
    return value.includes('/') || resourceExtensions.has(extension);
  }
  return false;
};

const resourceDirectoryForPath = (sourcePath: string): string => {
  const extension = path.extname(sourcePath).toLowerCase();
  if (imageExtensions.has(extension)) {
    return 'textures';
  }
  if (extension === '.mtlx') {
    return 'libraries';
  }
  return 'resources';
};

const safeBasename = (sourcePath: string): string =>
  path.basename(sourcePath).replace(/[^a-zA-Z0-9._-]/g, '_') || 'resource';

const archivePathForResource = (
  sourcePath: string,
  assignedPaths: Map<string, string>,
  usedArchivePaths: Set<string>,
): string => {
  const existing = assignedPaths.get(sourcePath);
  if (existing) {
    return existing;
  }

  const directory = resourceDirectoryForPath(sourcePath);
  const basename = safeBasename(sourcePath);
  const extension = path.extname(basename);
  const stem = extension ? basename.slice(0, -extension.length) : basename;
  let archivePath = `${directory}/${basename}`;
  let suffix = 2;
  while (usedArchivePaths.has(archivePath)) {
    archivePath = `${directory}/${stem}-${suffix}${extension}`;
    suffix += 1;
  }

  assignedPaths.set(sourcePath, archivePath);
  usedArchivePaths.add(archivePath);
  return archivePath;
};

const rewriteResourceReferences = async (
  document: MaterialXDocument,
  rootDir: string,
): Promise<Array<{ archivePath: string; sourcePath: string }>> => {
  const assignedPaths = new Map<string, string>();
  const usedArchivePaths = new Set<string>();

  const rewriteElement = (element: MaterialXElement) => {
    for (const [attributeName, rawValue] of Object.entries(element.attributes)) {
      const value = rawValue.trim();
      if (!value || !shouldConsiderReference(element, attributeName, value)) {
        continue;
      }
      if (isExternalReference(value)) {
        throw new Error(`External references cannot be packed into .mtlz archives: ${value}`);
      }
      if (path.isAbsolute(value)) {
        throw new Error(`Absolute references cannot be packed into .mtlz archives: ${value}`);
      }

      const sourcePath = path.resolve(rootDir, value);
      if (!isPathInside(rootDir, sourcePath)) {
        throw new Error(`Referenced file is outside the MaterialX root directory: ${value}`);
      }
      const archivePath = archivePathForResource(sourcePath, assignedPaths, usedArchivePaths);
      element.attributes[attributeName] = archivePath;
    }

    for (const child of element.children) {
      rewriteElement(child);
    }
  };

  for (const element of document.elements) {
    rewriteElement(element);
  }

  const resources: Array<{ archivePath: string; sourcePath: string }> = [];
  for (const [sourcePath, archivePath] of assignedPaths) {
    try {
      await readFile(sourcePath);
    } catch {
      throw new Error(`Referenced file does not exist: ${sourcePath}`);
    }
    resources.push({ archivePath, sourcePath });
  }
  return resources.toSorted((left, right) => left.archivePath.localeCompare(right.archivePath));
};

export const packMaterialX = async (
  inputPath: string,
  options: PackMaterialXOptions = {},
): Promise<PackMaterialXResult> => {
  const rootDir = path.dirname(inputPath);
  const rootPath = path.basename(inputPath);
  if (!rootPath.toLowerCase().endsWith('.mtlx')) {
    throw new Error('pack requires a root .mtlx input file');
  }

  const xml = await readFile(inputPath, 'utf8');
  const document = parseMaterialX(xml);
  const resources = await rewriteResourceReferences(document, rootDir);
  const resourceEntries = await Promise.all(
    resources.map(async (resource) => ({
      path: resource.archivePath,
      data: await readFile(resource.sourcePath),
    })),
  );
  const archive = createMaterialZArchive([{ path: rootPath, data: serializeMaterialX(document) }, ...resourceEntries]);
  const outputPath =
    options.outputPath ?? path.join(rootDir, `${path.basename(rootPath, path.extname(rootPath))}.mtlz`);
  await writeFile(outputPath, archive);
  return {
    outputPath,
    rootPath,
    entries: [rootPath, ...resources.map((resource) => resource.archivePath)],
  };
};

export const unpackMaterialZ = async (
  inputPath: string,
  options: UnpackMaterialZOptions = {},
): Promise<UnpackMaterialZResult> => {
  const archive = await readMaterialZArchive(inputPath);
  if (hasErrors(archive.issues)) {
    throw new Error(archive.issues.map((issue) => `${issue.location}: ${issue.message}`).join('\n'));
  }
  if (!archive.rootEntry) {
    throw new Error('.mtlz archive is missing a root .mtlx entry');
  }

  const outputDir =
    options.outputDir ?? path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)));
  if (options.force) {
    await rm(outputDir, { recursive: true, force: true });
  }
  await mkdir(outputDir, { recursive: true });

  for (const entry of archive.entries) {
    if (entry.isDirectory) {
      continue;
    }
    const outputPath = path.join(outputDir, ...entry.path.split('/'));
    if (!isPathInside(outputDir, outputPath)) {
      throw new Error(`Archive entry would extract outside the output directory: ${entry.path}`);
    }
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, entry.data);
  }

  return {
    outputDir,
    rootPath: path.join(outputDir, archive.rootEntry.path),
    entries: archive.entries.filter((entry) => !entry.isDirectory).map((entry) => entry.path),
  };
};

export const checkMaterialXPackage = async (inputPath: string): Promise<CheckMaterialXPackageResult> => {
  const lowerPath = inputPath.toLowerCase();
  if (lowerPath.endsWith('.mtlz')) {
    const archive = await readMaterialZArchive(inputPath);
    const issues = [...archive.issues];
    if (archive.rootEntry && !hasErrors(archive.issues)) {
      try {
        const document = parseMaterialX(textDecoder.decode(archive.rootEntry.data));
        issues.push(...validateDocument(document, materialXNodeRegistry));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        issues.push(makeIssue('error', archive.rootEntry.path, message));
      }
    }
    return { path: inputPath, format: 'mtlz', issues };
  }

  try {
    const xml = await readFile(inputPath, 'utf8');
    const document = parseMaterialX(xml);
    return {
      path: inputPath,
      format: 'mtlx',
      issues: validateDocument(document, materialXNodeRegistry),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      path: inputPath,
      format: 'mtlx',
      issues: [makeIssue('error', inputPath, message)],
    };
  }
};

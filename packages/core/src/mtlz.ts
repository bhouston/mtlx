import { validateArchivePath, type MaterialXPackageEntry } from './package.js';
import type { MaterialXValidationIssue } from './types.js';
import { checkMaterialXText } from './validate.js';

// Hand-rolled ZIP32 writer/reader for the spec-strict ".mtlz" container: STORE-only, root
// .mtlx first, resources in subdirectories, 64-byte aligned data. Pure (no node:fs, no Buffer)
// so it runs in browsers as well as Node.

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

/**
 * *One entry read back from a `.mtlz` archive, with the raw ZIP header fields the spec checks.*
 *
 * @category Packaging
 */
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

/**
 * *The result of {@link inspectMaterialZArchive}: entries, the root document, and any spec
 * violations found.*
 *
 * @category Packaging
 */
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
}

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

const makeIssue = (
  level: MaterialXValidationIssue['level'],
  location: string,
  message: string,
): MaterialXValidationIssue => ({ level, location, message });

const hasErrors = (issues: MaterialXValidationIssue[]) => issues.some((issue) => issue.level === 'error');

const isRootMaterialXPath = (entryPath: string): boolean =>
  !entryPath.includes('/') && entryPath.toLowerCase().endsWith('.mtlx');

/** A little-endian struct writer: `w.u16(x).u32(y).bytes(z)`. */
const struct = (size: number) => {
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  let offset = 0;
  const writer = {
    bytes,
    u16(value: number) {
      view.setUint16(offset, value, true);
      offset += 2;
      return writer;
    },
    u32(value: number) {
      view.setUint32(offset, value, true);
      offset += 4;
      return writer;
    },
    raw(value: Uint8Array) {
      bytes.set(value, offset);
      offset += value.byteLength;
      return writer;
    },
  };
  return writer;
};

const concat = (parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((size, part) => size + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
};

const createPaddingExtra = (offsetBeforeHeader: number, encodedNameLength: number): Uint8Array => {
  const baseDataOffset = offsetBeforeHeader + 30 + encodedNameLength;
  let extraLength = (ALIGNMENT_BYTES - (baseDataOffset % ALIGNMENT_BYTES)) % ALIGNMENT_BYTES;
  if (extraLength > 0 && extraLength < 4) {
    extraLength += ALIGNMENT_BYTES;
  }
  if (extraLength === 0) {
    return new Uint8Array();
  }
  return struct(extraLength)
    .u16(EXTRA_FIELD_PADDING_ID)
    .u16(extraLength - 4).bytes;
};

const createLocalHeader = (name: Uint8Array, data: Uint8Array, crc: number, extra: Uint8Array): Uint8Array =>
  struct(30 + name.byteLength + extra.byteLength)
    .u32(LOCAL_FILE_HEADER_SIGNATURE)
    .u16(VERSION_NEEDED_ZIP32)
    .u16(0)
    .u16(STORE_COMPRESSION_METHOD)
    .u16(0)
    .u16(0)
    .u32(crc)
    .u32(data.byteLength)
    .u32(data.byteLength)
    .u16(name.byteLength)
    .u16(extra.byteLength)
    .raw(name)
    .raw(extra).bytes;

const createCentralDirectoryHeader = (entry: PendingZipEntry): Uint8Array => {
  const name = textEncoder.encode(entry.path);
  return struct(46 + name.byteLength)
    .u32(CENTRAL_DIRECTORY_SIGNATURE)
    .u16(VERSION_NEEDED_ZIP32)
    .u16(VERSION_NEEDED_ZIP32)
    .u16(0)
    .u16(STORE_COMPRESSION_METHOD)
    .u16(0)
    .u16(0)
    .u32(entry.crc)
    .u32(entry.data.byteLength)
    .u32(entry.data.byteLength)
    .u16(name.byteLength)
    .u16(0)
    .u16(0)
    .u16(0)
    .u16(0)
    .u32(0)
    .u32(entry.localHeaderOffset)
    .raw(name).bytes;
};

const createEndOfCentralDirectory = (entryCount: number, size: number, offset: number): Uint8Array =>
  struct(22)
    .u32(END_OF_CENTRAL_DIRECTORY_SIGNATURE)
    .u16(0)
    .u16(0)
    .u16(entryCount)
    .u16(entryCount)
    .u32(size)
    .u32(offset)
    .u16(0).bytes;

/**
 * *Builds a spec-compliant `.mtlz` archive in memory.*
 *
 * Exactly one root-level `.mtlx` entry is required and is always written first; every other
 * entry must live in a subdirectory. Entries are stored uncompressed with their data aligned to
 * 64 bytes, and the archive must fit ZIP32 limits.
 *
 * Example:
 *
 * ```ts
 * const bytes = createMaterialZArchive([
 *   { path: 'material.mtlx', data: new TextEncoder().encode(xml) },
 *   { path: 'textures/albedo.png', data: albedoBytes },
 * ]);
 * ```
 *
 * Reference:
 * - [MaterialX Container Format (.mtlz)](https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/documents/Specification/MaterialX.Specification.md)
 *
 * @category Packaging
 */
export const createMaterialZArchive = (inputEntries: MaterialXPackageEntry[]): Uint8Array => {
  const rootEntries = inputEntries.filter((entry) => isRootMaterialXPath(entry.path));
  if (rootEntries.length !== 1) {
    throw new Error('A .mtlz archive must contain exactly one root-level .mtlx file');
  }

  const entries = [rootEntries[0]!, ...inputEntries.filter((entry) => entry !== rootEntries[0])];
  const seen = new Set<string>();
  const fileParts: Uint8Array[] = [];
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

    const name = textEncoder.encode(entry.path);
    const crc = crc32(entry.data);
    const localHeader = createLocalHeader(name, entry.data, crc, createPaddingExtra(offset, name.byteLength));
    fileParts.push(localHeader, entry.data);
    pendingEntries.push({ path: entry.path, data: entry.data, crc, localHeaderOffset: offset });
    offset += localHeader.byteLength + entry.data.byteLength;
  }

  const centralDirectoryOffset = offset;
  const centralDirectoryParts = pendingEntries.map(createCentralDirectoryHeader);
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

  return concat([
    ...fileParts,
    ...centralDirectoryParts,
    createEndOfCentralDirectory(pendingEntries.length, centralDirectorySize, centralDirectoryOffset),
  ]);
};

const findLastSignature = (data: Uint8Array, signature: number): number => {
  for (let offset = data.byteLength - 4; offset >= 0; offset -= 1) {
    if (
      data[offset] === (signature & 0xff) &&
      data[offset + 1] === ((signature >>> 8) & 0xff) &&
      data[offset + 2] === ((signature >>> 16) & 0xff) &&
      data[offset + 3] === ((signature >>> 24) & 0xff)
    ) {
      return offset;
    }
  }
  return -1;
};

const sliceEntryData = (
  data: Uint8Array,
  view: DataView,
  entryPath: string,
  compressedSize: number,
  localHeaderOffset: number,
  issues: MaterialXValidationIssue[],
): { data: Uint8Array; dataOffset: number } => {
  if (
    localHeaderOffset + 30 > data.byteLength ||
    view.getUint32(localHeaderOffset, true) !== LOCAL_FILE_HEADER_SIGNATURE
  ) {
    issues.push(makeIssue('error', entryPath, 'Central directory points to an invalid local file header'));
    return { data: new Uint8Array(), dataOffset: localHeaderOffset };
  }

  const nameLength = view.getUint16(localHeaderOffset + 26, true);
  const extraLength = view.getUint16(localHeaderOffset + 28, true);
  const dataOffset = localHeaderOffset + 30 + nameLength + extraLength;
  const dataEnd = dataOffset + compressedSize;
  if (dataEnd > data.byteLength) {
    issues.push(makeIssue('error', entryPath, 'Archive entry data extends past the end of the file'));
    return { data: new Uint8Array(), dataOffset };
  }
  return { data: data.slice(dataOffset, dataEnd), dataOffset };
};

/**
 * *Parses `.mtlz` bytes and reports every spec violation as an issue instead of throwing.*
 *
 * Checks ZIP32-only, no encryption or data descriptors, STORE compression, root `.mtlx` first,
 * resources in subdirectories, and 64-byte data alignment. Works in Node and the browser.
 *
 * @category Packaging
 */
export const inspectMaterialZArchive = (data: Uint8Array): MaterialZArchive => {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const issues: MaterialXValidationIssue[] = [];
  const zip64Eocd = findLastSignature(data, ZIP64_END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  const zip64Locator = findLastSignature(data, ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIGNATURE);
  if (zip64Eocd !== -1 || zip64Locator !== -1) {
    issues.push(makeIssue('error', 'archive', '.mtlz archives must use ZIP32, not ZIP64'));
  }

  const eocdOffset = findLastSignature(data, END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  if (eocdOffset === -1) {
    return {
      entries: [],
      issues: [makeIssue('error', 'archive', 'Missing ZIP end of central directory record')],
    };
  }

  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
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
    if (cursor + 46 > data.byteLength || view.getUint32(cursor, true) !== CENTRAL_DIRECTORY_SIGNATURE) {
      issues.push(makeIssue('error', 'archive', 'Invalid central directory file header'));
      break;
    }

    const flags = view.getUint16(cursor + 8, true);
    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + nameLength;
    const entryPath = textDecoder.decode(data.slice(nameStart, nameEnd));
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
      data,
      view,
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

/**
 * *Inspects `.mtlz` bytes and, when the container itself is sound, also parses and validates
 * the root document.* The pure counterpart of `checkMaterialX` in `mtlx-core/node`.
 *
 * @category Validation
 */
export const checkMaterialZArchive = (data: Uint8Array): MaterialXValidationIssue[] => {
  const archive = inspectMaterialZArchive(data);
  if (!archive.rootEntry || hasErrors(archive.issues)) {
    return archive.issues;
  }
  return [...archive.issues, ...checkMaterialXText(textDecoder.decode(archive.rootEntry.data), archive.rootEntry.path)];
};

import { describe, expect, it } from 'vitest';

import {
  FileFormat,
  getFileFormatInfoFromFileName,
  getFileFormatInfoFromMimeTypeAndFileName,
  getFileNameExtension,
} from './fileFormats.js';

describe('fileFormats', () => {
  it('matches compound extensions before single ones', () => {
    expect(getFileFormatInfoFromFileName('Copper.MTLX.zip', FileFormat)?.format).toBe('mtlx');
    expect(getFileFormatInfoFromFileName('copper.mtlx', FileFormat)?.format).toBe('mtlx');
    expect(getFileFormatInfoFromFileName('archive.zip', FileFormat)?.format).toBe('zip');
    expect(getFileFormatInfoFromFileName('photo.jpeg', FileFormat)?.format).toBe('jpg');
    expect(getFileFormatInfoFromFileName('notes.txt', FileFormat)).toBeUndefined();
  });

  it('returns the registered extension of a file name', () => {
    expect(getFileNameExtension('a.b.mtlx.zip')).toBe('.mtlx.zip');
    expect(getFileNameExtension('a.zip')).toBe('.zip');
    expect(getFileNameExtension('a.TXT')).toBe('.txt');
    expect(getFileNameExtension('noext')).toBe('');
  });

  it('uses the file name to disambiguate shared MIME types', () => {
    expect(getFileFormatInfoFromMimeTypeAndFileName('application/zip', 'm.mtlx.zip', FileFormat)?.format).toBe('mtlx');
    expect(getFileFormatInfoFromMimeTypeAndFileName('application/zip', 'part.FCStd', FileFormat)?.format).toBe('fcstd');
    expect(getFileFormatInfoFromMimeTypeAndFileName('application/zip', undefined, FileFormat)?.format).toBe('fcstd');
    expect(getFileFormatInfoFromMimeTypeAndFileName('application/zip', 'm.mtlx.zip', ['fcstd'])?.format).toBe('fcstd');
    expect(
      getFileFormatInfoFromMimeTypeAndFileName('application/vnd.materialx+zip', undefined, FileFormat)?.format,
    ).toBe('mtlx');
  });
});

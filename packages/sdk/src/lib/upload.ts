import type { ApiClient } from '../client.js';
import { createAssetParamsSchema, prepareAssetUpload } from '../routes/assets.js';
import { FileFormat, getFileFormatInfoFromExtension } from './fileFormats.js';

export const uploadFileToUploadUrl = async (
  uploadUrl: string,
  file: File | Buffer | Uint8Array,
  mimetype?: string,
): Promise<void> => {
  let body: BodyInit;

  let contentType: string;
  if (file instanceof File) {
    // If file.type is empty (browser didn't recognize it), use provided mimetype
    // Otherwise, ensure they match to prevent mismatches
    if (file.type && mimetype && mimetype !== file.type) {
      throw new Error(`MIME type mismatch: ${mimetype} !== ${file.type}`);
    }
    contentType = file.type || mimetype || 'application/octet-stream';
    body = file;
  } else if (file instanceof Buffer || file instanceof Uint8Array) {
    contentType = mimetype ?? 'application/octet-stream';
    // Convert Buffer/Uint8Array to ArrayBuffer for fetch
    body = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  } else {
    // should never happen
    throw new Error('Unsupported file type. Expected File, Buffer, or Uint8Array');
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
  }
};

export type UploadFileProps = {
  params: {
    userName: string;
  };
  fileData: Buffer | Uint8Array;
  filename: string;
};

/**
 * Uploads a file and returns the upload token.
 * This helper function infers the MIME type from the file extension,
 * prepares the upload, and uploads the file to the signed URL.
 *
 * @param client - The API client instance
 * @param props - The upload properties
 * @param props.params - Path parameters (userName)
 * @param props.fileData - File data as Buffer or Uint8Array
 * @param props.filename - Filename (used for MIME type inference and upload metadata)
 * @returns Promise resolving to the upload token
 * @example
 * ```typescript
 * import { readFile } from 'node:fs/promises';
 * import { basename } from 'node:path';
 *
 * const fileData = await readFile('model.glb');
 * const filename = basename('model.glb');
 * const uploadToken = await uploadFile(client, {
 *   params: { userName: 'my-user' },
 *   fileData,
 *   filename,
 * });
 * ```
 */
export const uploadFile = async (client: ApiClient, props: UploadFileProps): Promise<string> => {
  const params = createAssetParamsSchema.parse(props.params);
  const { fileData, filename } = props;

  // Infer MIME type from extension
  const ext = filename.includes('.') ? `.${filename.split('.').pop()}` : '';
  const contentType = getFileFormatInfoFromExtension(ext, FileFormat)?.mimeType ?? 'application/octet-stream';

  // Prepare upload
  const { uploadUrl, uploadToken } = await prepareAssetUpload(client, {
    params,
    body: {
      filename,
      contentType,
      size: fileData.length,
    },
  });

  // Upload file to signed URL
  await uploadFileToUploadUrl(uploadUrl, fileData, contentType);

  return uploadToken;
};

import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import type { Asset, ApiClient, Enums } from 'mtlx-sdk';
import {
  createAsset,
  getFileFormatInfoFromExtension,
  MATERIAL_ASSET_FILE_FORMATS,
  prepareAssetUpload,
  updateAsset,
  uploadFileToUploadUrl,
} from 'mtlx-sdk';

export type UploadMaterialOptions = {
  userName: string;
  filePath: string;
  name: string;
  description?: string;
  keywords?: string;
  visibility?: Enums.AssetVisibility;
  shareLicense?: Enums.ShareLicense;
  metadata?: string;
};

/**
 * Infers the content type for a material upload from its filename (`.mtlx` or `.mtlx.zip`).
 */
function inferContentType(filename: string): string {
  const ext = filename.toLowerCase().endsWith('.mtlx.zip') ? '.mtlx.zip' : extname(filename);
  const formatInfo = getFileFormatInfoFromExtension(ext, MATERIAL_ASSET_FILE_FORMATS);
  if (!formatInfo) {
    throw new Error(`Unsupported material file extension: ${ext} (expected .mtlx or .mtlx.zip)`);
  }
  return formatInfo.mimeType;
}

/**
 * Uploads a `.mtlx.zip` (or `.mtlx`) file and creates a MATERIAL asset for it.
 */
export async function uploadMaterial(client: ApiClient, options: UploadMaterialOptions): Promise<Asset> {
  const filename = basename(options.filePath);
  const fileData = await readFile(options.filePath);
  const contentType = inferContentType(filename);

  const { uploadUrl, uploadToken } = await prepareAssetUpload(client, {
    params: { userName: options.userName },
    body: { filename, contentType, size: fileData.length },
  });

  await uploadFileToUploadUrl(uploadUrl, fileData, contentType);

  const asset = await createAsset(client, {
    params: { userName: options.userName },
    body: {
      name: options.name,
      description: options.description,
      type: 'MATERIAL',
      uploadToken,
      visibility: options.visibility ?? 'PUBLIC',
      shareLicense: options.shareLicense ?? 'CC_BY',
      metadata: options.metadata,
    },
  });

  // createAssetBodySchema has no `keywords` field; set it via a follow-up update.
  if (options.keywords) {
    return await updateAsset(client, {
      params: { userName: options.userName, assetName: asset.name },
      body: { keywords: options.keywords },
    });
  }

  return asset;
}

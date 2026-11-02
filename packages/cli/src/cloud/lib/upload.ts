import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { Asset, ApiClient, Enums } from 'mtlx-sdk';
import {
  createAsset,
  getFileFormatInfoFromFileName,
  MATERIAL_ASSET_FILE_FORMATS,
  updateAsset,
  uploadFile,
} from 'mtlx-sdk';

export type UploadMaterialOptions = {
  orgName: string;
  projectName: string;
  filePath: string;
  name: string;
  description?: string;
  keywords?: string;
  visibility?: Enums.AssetVisibility;
  shareLicense?: Enums.ShareLicense;
  metadata?: string;
};

/**
 * Uploads a `.mtlx.zip` (or `.mtlx`) file and creates a MATERIAL asset for it.
 */
export async function uploadMaterial(client: ApiClient, options: UploadMaterialOptions): Promise<Asset> {
  const filename = basename(options.filePath);
  if (!getFileFormatInfoFromFileName(filename, MATERIAL_ASSET_FILE_FORMATS)) {
    throw new Error(`Unsupported material file: ${filename} (expected .mtlx or .mtlx.zip)`);
  }
  const fileData = await readFile(options.filePath);
  const params = { orgName: options.orgName, projectName: options.projectName };

  const uploadToken = await uploadFile(client, { params, fileData, filename });

  const asset = await createAsset(client, {
    params,
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
      params: { ...params, assetName: asset.name },
      body: { keywords: options.keywords },
    });
  }

  return asset;
}

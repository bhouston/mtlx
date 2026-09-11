import type { MaterialXSummary, MaterialXValidationIssue } from 'mtlx-core';
import type { PreviewSettings } from '../previewSettings.js';
export interface PreviewTexture {
  path: string;
  data: ArrayBuffer;
}

export interface PreviewPayload {
  settings?: PreviewSettings;
  fileName: string;
  fileSize: number;
  valid: boolean;
  issues: MaterialXValidationIssue[];
  summary?: MaterialXSummary;
  parseError?: string;
  data?: ArrayBuffer;
  textures: PreviewTexture[];
  shaderBall?: ArrayBuffer;
  resourcesChecked?: boolean;
  resourcePaths?: string[];
}

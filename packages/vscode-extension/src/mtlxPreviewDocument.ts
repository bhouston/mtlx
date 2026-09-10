import type { MaterialXSummary, MaterialXValidationIssue } from 'mtlx-core';
import type { CustomDocument, Uri } from 'vscode';

export interface MtlxPreviewTexture {
  /** The raw `file` attribute value from the document, e.g. "textures/wood_color.jpg". */
  path: string;
  data: Uint8Array;
}

export class MtlxPreviewDocument implements CustomDocument {
  constructor(
    public readonly uri: Uri,
    public readonly fileSize: number,
    public readonly fileName: string,
    public readonly raw: Uint8Array,
    public readonly issues: MaterialXValidationIssue[],
    public readonly summary?: MaterialXSummary,
    public readonly parseError?: string,
    // Sibling texture files referenced by a loose (unzipped) .mtlx, read up front so the webview
    // (which has no real filesystem/HTTP access) can serve them as blob: URLs instead.
    public readonly textures: MtlxPreviewTexture[] = [],
  ) {}

  dispose(): void {
    // No resources to dispose for a readonly document.
  }
}

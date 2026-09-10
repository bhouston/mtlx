import type { MaterialXSummary, MaterialXValidationIssue } from 'mtlx-core';
import type { CustomDocument, Uri } from 'vscode';

export class MtlxPreviewDocument implements CustomDocument {
  constructor(
    public readonly uri: Uri,
    public readonly fileSize: number,
    public readonly fileName: string,
    public readonly raw: Uint8Array,
    public readonly issues: MaterialXValidationIssue[],
    public readonly summary?: MaterialXSummary,
    public readonly parseError?: string,
  ) {}

  dispose(): void {
    // No resources to dispose for a readonly document.
  }
}

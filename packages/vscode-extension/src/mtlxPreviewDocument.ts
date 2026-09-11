import type { CustomDocument, Uri } from 'vscode';
import type { analyze } from './mtlxAnalyze.js';

export type MtlxAnalysis = Awaited<ReturnType<typeof analyze>>;

export class MtlxPreviewDocument implements CustomDocument {
  constructor(
    public readonly uri: Uri,
    public readonly fileName: string,
    public readonly raw: Uint8Array,
    /** Validation, summary, and any sibling resources read up front for the webview. */
    public readonly analysis: MtlxAnalysis,
  ) {}

  dispose(): void {
    // No resources to dispose for a readonly document.
  }
}

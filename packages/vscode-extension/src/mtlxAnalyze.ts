import {
  checkMaterialXText,
  checkMaterialXZipArchive,
  detectFormat,
  inspectMaterialXZipArchive,
  parseMaterialX,
  summarizeMaterialX,
  type MaterialXSummary,
  type MaterialXValidationIssue,
} from 'mtlx-core';

const textDecoder = new TextDecoder();

// Analyzes the bytes already read via vscode.workspace.fs (not the on-disk file) so this works
// for virtual URIs too — e.g. a `git:` revision from the Source Control changes list, which can
// differ from what's currently on disk at the same fsPath.
export function analyze(
  fsPath: string,
  raw: Uint8Array,
): { issues: MaterialXValidationIssue[]; summary?: MaterialXSummary; parseError?: string } {
  try {
    const format = detectFormat(fsPath);
    if (format === 'mtlx') {
      const text = textDecoder.decode(raw);
      const document = parseMaterialX(text);
      return { issues: checkMaterialXText(text, fsPath), summary: summarizeMaterialX(fsPath, document) };
    }
    const archive = inspectMaterialXZipArchive(raw);
    const issues = checkMaterialXZipArchive(raw);
    if (!archive.rootEntry) {
      throw new Error(`No root .mtlx entry found in ${fsPath}`);
    }
    const document = parseMaterialX(textDecoder.decode(archive.rootEntry.data));
    return { issues, summary: summarizeMaterialX(archive.rootEntry.path, document) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { issues: [{ level: 'error', location: fsPath, message }], parseError: message };
  }
}

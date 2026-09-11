import * as vscode from 'vscode';

export { convertMaterialXFile, type TargetFormat } from './mtlxConvert.js';

const SUPPORTED_EXTENSIONS_PATTERN = /\.(mtlx|mtlx\.zip)$/i;

export const filterMtlxUris = (uris: vscode.Uri[]): vscode.Uri[] =>
  uris.filter((uri) => SUPPORTED_EXTENSIONS_PATTERN.test(uri.fsPath));

export const normalizeUris = (uri: vscode.Uri | undefined, selectedResources?: vscode.Uri[]): vscode.Uri[] => {
  const first = uri ?? vscode.window.activeTextEditor?.document.uri;
  if (!first) return [];
  if (!selectedResources?.length) return [first];
  const seen = new Set<string>([first.toString()]);
  const result: vscode.Uri[] = [first];
  for (const candidate of selectedResources) {
    const key = candidate.toString();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(candidate);
    }
  }
  return result;
};

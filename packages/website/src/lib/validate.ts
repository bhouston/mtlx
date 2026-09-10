import {
  parseMaterialX,
  summarizeMaterialX,
  validateDocument,
  type MaterialXSummary,
  type MaterialXValidationIssue,
} from 'mtlx-core';

/** Parses + validates MaterialX XML text client-side — a thin wrapper so the route component
 * stays declarative and this is independently testable. */
export const validateMaterialXText = (text: string): MaterialXValidationIssue[] =>
  validateDocument(parseMaterialX(text));

export interface MaterialXAnalysis {
  issues: MaterialXValidationIssue[];
  summary?: MaterialXSummary;
  parseError?: string;
}

/** Parses, validates, and summarizes MaterialX text — powers the website's info panel the same
 * way `summarizeMaterialX` powers the CLI's `info` command and the VS Code extension's stats
 * panel. */
export const analyzeMaterialXText = (path: string, text: string): MaterialXAnalysis => {
  try {
    const document = parseMaterialX(text);
    return { issues: validateDocument(document), summary: summarizeMaterialX(path, document) };
  } catch (error) {
    return { issues: [], parseError: error instanceof Error ? error.message : String(error) };
  }
};

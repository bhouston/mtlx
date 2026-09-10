import { parseMaterialX, validateDocument, type MaterialXValidationIssue } from 'mtlx-core';

/** Parses + validates MaterialX XML text client-side — a thin wrapper so the route component
 * stays declarative and this is independently testable. */
export const validateMaterialXText = (text: string): MaterialXValidationIssue[] =>
  validateDocument(parseMaterialX(text));

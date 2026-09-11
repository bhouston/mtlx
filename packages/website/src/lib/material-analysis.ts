import { extractMaterialXText } from './materialx-zip';
import { analyzeMaterialXText, type MaterialXAnalysis } from './validate';

export function analyzeBytes(data: ArrayBuffer, name: string): MaterialXAnalysis {
  const bytes = new Uint8Array(data);
  const text = bytes[0] === 0x50 && bytes[1] === 0x4b ? extractMaterialXText(data) : new TextDecoder().decode(data);
  return analyzeMaterialXText(name, text);
}

/** Resource budgets for untrusted XML documents and ZIP archives. Values must be positive safe integers. */
export interface MaterialXReadLimits {
  maxXmlBytes: number;
  maxXmlDepth: number;
  maxXmlElements: number;
  maxArchiveBytes: number;
  maxArchiveEntries: number;
  maxEntryBytes: number;
  maxExpandedBytes: number;
}

/** Conservative defaults; callers processing trusted larger assets can override individual budgets. */
export const DEFAULT_MATERIALX_READ_LIMITS: Readonly<MaterialXReadLimits> = Object.freeze({
  maxXmlBytes: 16 * 1024 * 1024,
  maxXmlDepth: 128,
  maxXmlElements: 100_000,
  maxArchiveBytes: 128 * 1024 * 1024,
  maxArchiveEntries: 4096,
  maxEntryBytes: 128 * 1024 * 1024,
  maxExpandedBytes: 512 * 1024 * 1024,
});

export const resolveMaterialXReadLimits = (overrides: Partial<MaterialXReadLimits> = {}): MaterialXReadLimits => {
  const limits = { ...DEFAULT_MATERIALX_READ_LIMITS, ...overrides };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`MaterialX read limit ${name} must be a positive safe integer`);
    }
  }
  return limits;
};

/**
 * Scan before XML validation/parsing, without building a tree or following entities.
 * Syntax validation remains the XML parser's responsibility. DTDs are deliberately unsupported.
 */
export const assertMaterialXXmlLimits = (xml: string, overrides?: Partial<MaterialXReadLimits>): void => {
  const limits = resolveMaterialXReadLimits(overrides);
  if (xml.length > limits.maxXmlBytes || new TextEncoder().encode(xml).byteLength > limits.maxXmlBytes) {
    throw new Error(`MaterialX XML exceeds maxXmlBytes (${limits.maxXmlBytes})`);
  }
  let depth = 0;
  let elements = 0;
  let position = 0;
  while ((position = xml.indexOf('<', position)) !== -1) {
    const terminator = xml.startsWith('<!--', position)
      ? '-->'
      : xml.startsWith('<![CDATA[', position)
        ? ']]>'
        : xml.startsWith('<?', position)
          ? '?>'
          : undefined;
    if (terminator) {
      const end = xml.indexOf(terminator, position + 2);
      if (end === -1) return; // The XML validator reports the malformed construct.
      position = end + terminator.length;
      continue;
    }
    if (xml.startsWith('<!', position)) {
      throw new Error('MaterialX XML DTD and entity declarations are unsupported');
    }
    const closing = xml[position + 1] === '/';
    let quote = '';
    let end = position + 1;
    for (; end < xml.length; end++) {
      const character = xml[end];
      if (quote) {
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        break;
      }
    }
    if (closing) {
      depth--;
    } else {
      if (++elements > limits.maxXmlElements) {
        throw new Error(`MaterialX XML exceeds maxXmlElements (${limits.maxXmlElements})`);
      }
      if (depth + 1 > limits.maxXmlDepth) {
        throw new Error(`MaterialX XML exceeds maxXmlDepth (${limits.maxXmlDepth})`);
      }
      if (xml[end - 1] !== '/') depth++;
    }
    position = end + 1;
  }
};

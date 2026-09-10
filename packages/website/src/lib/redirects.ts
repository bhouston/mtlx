export const SOURCE_PATH_REGEX = /^[~A-Za-z0-9_./:$-]+$/;
const SOURCE_WITH_OPTIONAL_SEARCH_REGEX = /^[~A-Za-z0-9_./:$-]+(?:\?[^#\s]+)?$/;

function validateRedirectTarget(target: string, lineNumber: number, source: string): void {
  if (target.startsWith('//')) {
    throw new Error(
      `Invalid redirect target on line ${lineNumber}: "${target}" for source "${source}". Protocol-relative URLs are not allowed.`,
    );
  }

  if (target.startsWith('http://')) {
    throw new Error(
      `Invalid redirect target on line ${lineNumber}: "${target}" for source "${source}". Only HTTPS URLs are allowed.`,
    );
  }

  if (target.startsWith('https://')) {
    if (!URL.canParse(target)) {
      throw new Error(
        `Invalid redirect target on line ${lineNumber}: "${target}" for source "${source}". Target is not a valid URL.`,
      );
    }
    return;
  }

  if (!target.startsWith('/')) {
    throw new Error(
      `Invalid redirect target on line ${lineNumber}: "${target}" for source "${source}". Target must be a domain-absolute path (starting with "/") or an HTTPS URL.`,
    );
  }
}

export function parseRedirectsFile(content: string): Map<string, string> {
  const redirects = new Map<string, string>();
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length !== 2) {
      throw new Error(`Malformed redirects.txt line ${index + 1}`);
    }

    const [source, target] = parts;

    if (!source || !SOURCE_WITH_OPTIONAL_SEARCH_REGEX.test(source)) {
      throw new Error(`Invalid source path on line ${index + 1}`);
    }

    if (!target) {
      throw new Error(`Missing redirect target on line ${index + 1} for source "${source}"`);
    }
    validateRedirectTarget(target, index + 1, source);

    if (redirects.has(source)) {
      throw new Error(`Duplicate source path "${source}" on line ${index + 1}`);
    }

    redirects.set(source, target);
  }

  return redirects;
}

function getLookupCandidates(sourcePath: string): string[] {
  const cleaned = sourcePath.trim();
  if (!cleaned) return [];

  const [pathPart = '', searchPart = ''] = cleaned.split(/(?=\?)/, 2);
  const withoutLeadingSlash = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart;
  const withLeadingSlash = withoutLeadingSlash ? `/${withoutLeadingSlash}` : pathPart;

  const candidates = new Set<string>([
    cleaned,
    `${withoutLeadingSlash}${searchPart}`,
    `${withLeadingSlash}${searchPart}`,
  ]);

  const initialCandidates = Array.from(candidates);

  for (const candidate of initialCandidates) {
    const [candidatePath = '', candidateSearch = ''] = candidate.split(/(?=\?)/, 2);
    if (candidatePath.length > 1 && candidatePath.endsWith('/')) {
      candidates.add(`${candidatePath.slice(0, -1)}${candidateSearch}`);
    } else if (candidatePath.length > 0) {
      candidates.add(`${candidatePath}/${candidateSearch}`);
    }
  }

  return [...candidates].filter(Boolean);
}

export function lookupRedirectTarget(redirects: Map<string, string>, sourcePath: string): string | undefined {
  const candidates = getLookupCandidates(sourcePath);

  for (const candidate of candidates) {
    const target = redirects.get(candidate);
    if (target) {
      return target;
    }
  }

  return undefined;
}

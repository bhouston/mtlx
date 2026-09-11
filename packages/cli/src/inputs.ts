import { glob } from 'node:fs/promises';

/** Expands each token as a glob pattern (a plain path matches itself), preserving first-seen
 * order and dropping duplicates matched by more than one pattern. */
export const expandInputs = async (patterns: string[]): Promise<string[]> => {
  const seen = new Set<string>();
  for (const pattern of patterns) {
    let matched = false;
    for await (const match of glob(pattern)) {
      matched = true;
      seen.add(match);
    }
    if (!matched) {
      throw new Error(`No files matched: ${pattern}`);
    }
  }
  return [...seen];
};

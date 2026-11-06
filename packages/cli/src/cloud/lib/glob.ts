import { resolve } from 'node:path';
import fg from 'fast-glob';

/**
 * Expand a glob pattern into a list of absolute file paths.
 *
 * Directories are excluded; only files are returned.
 */
export async function expandGlob(pattern: string): Promise<string[]> {
  const cwd = process.cwd();

  const entries = await fg(pattern, {
    cwd,
    onlyFiles: true,
    dot: false,
    absolute: true,
    followSymbolicLinks: true,
  });

  return entries.map((entry) => resolve(entry));
}

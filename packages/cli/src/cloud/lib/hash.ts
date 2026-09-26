import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

/**
 * Compute the SHA256 hash of a file at the given path.
 *
 * Uses a streaming reader to avoid loading the whole file into memory.
 */
export function hashFileSha256(filePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('error', (err) => {
      reject(err);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
  });
}

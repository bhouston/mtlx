import { exec } from 'node:child_process';
import process from 'node:process';

/** Best-effort local-browser launch (macOS `open`, Windows `start`, else `xdg-open`). Failures
 * are silently swallowed — the URL is always printed to the console too, so a headless/CI
 * environment (or a missing opener binary) still leaves the user with something to copy. */
export function openInBrowser(url: string): void {
  const command =
    process.platform === 'darwin'
      ? `open ${JSON.stringify(url)}`
      : process.platform === 'win32'
        ? `start "" ${JSON.stringify(url)}`
        : `xdg-open ${JSON.stringify(url)}`;
  exec(command, () => {
    // ignore errors — the printed URL is the fallback.
  });
}

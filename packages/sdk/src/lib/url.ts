/**
 * Returns true if the given string is a valid URL, false otherwise.
 * Uses the same semantics as the URL constructor (no throw).
 */
export function validateUrl(url: string): boolean {
  try {
    // oxlint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
export function makeUrl(
  host: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): URL {
  const url = new URL(path, host);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    }
  }

  return url;
}

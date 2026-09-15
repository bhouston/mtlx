/** Keep embedded material bytes out of telemetry URLs, messages and navigation breadcrumbs. */
export const redactEditorMaterialLink = (value: string): string =>
  value.replace(/(^|#)material=[\w-]+/g, '$1material=[redacted]');

/** Sentry events and breadcrumbs are JSON-like; preserve non-plain objects and shared references. */
export function redactEditorMaterialData<T>(value: T): T {
  const seen = new WeakMap<object, unknown>();
  function visit(input: unknown): unknown {
    if (typeof input === 'string') return redactEditorMaterialLink(input);
    if (!input || typeof input !== 'object') return input;
    if (seen.has(input)) return seen.get(input);
    if (Array.isArray(input)) {
      const result: unknown[] = [];
      seen.set(input, result);
      for (const item of input) result.push(visit(item));
      return result;
    }
    if (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null) return input;
    const result: Record<string, unknown> = {};
    seen.set(input, result);
    for (const [key, entry] of Object.entries(input))
      Object.defineProperty(result, key, { value: visit(entry), enumerable: true, writable: true, configurable: true });
    return result;
  }
  return visit(value) as T;
}

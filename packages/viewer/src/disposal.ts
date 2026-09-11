/** Collect only owned render resources; traverse shader nodes too, where texture values live. */
export function collectDisposables(values: unknown[]): () => void {
  const visited = new WeakSet<object>();
  const resources = new Set<{ dispose(): void }>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    const item = value as Record<string, unknown>;
    if (item.isTexture || item.isMaterial || item.isBufferGeometry) {
      resources.add(value as { dispose(): void });
    }
    if (item.isBufferGeometry || item.isTexture || ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return;
    for (const child of Object.values(item)) visit(child);
  };
  values.forEach(visit);
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    for (const resource of resources) resource.dispose();
  };
}

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { MaterialViewer } from '@/components/MaterialViewerLazy';
import { resolveMaterialParam } from '@/lib/presets';

export interface EmbedSearch {
  material?: string;
}

export const Route = createFileRoute('/embed')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): EmbedSearch =>
    typeof search.material === 'string' ? { material: search.material } : {},
  component: EmbedPage,
});

/** Chromeless viewer for iframe embedding: `/embed?material=<preset id or .mtlx URL>`. */
function EmbedPage() {
  const { material } = Route.useSearch();
  const [viewerError, setViewerError] = useState<string | null>(null);

  // resolveMaterialParam is pure and synchronous, so derive the source (and any "unknown
  // material" error) straight from the search param during render instead of an effect.
  const resolved = material ? resolveMaterialParam(material) : undefined;
  const resolveError = material && !resolved ? `Unknown material "${material}"` : null;
  const source = resolved ? { kind: 'url' as const, folderUrl: resolved.folderUrl, fileName: resolved.fileName } : null;
  const error = resolveError ?? viewerError;

  return (
    <div className="p-2">
      <MaterialViewer source={source} onError={setViewerError} />
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

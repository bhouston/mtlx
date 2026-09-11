import { viewerSearch, viewerSettings } from '@/lib/viewer-search';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { MaterialViewer } from '@/components/MaterialViewerLazy';
import { resolveMaterialParam } from '@/lib/presets';

export const Route = createFileRoute('/embed')({
  ssr: false,
  validateSearch: viewerSearch,
  component: EmbedPage,
});

/** Chromeless viewer for iframe embedding: `/embed?materialUrl=<preset id or .mtlx URL>`. */
function EmbedPage() {
  const search = Route.useSearch();
  const { materialUrl } = search;
  const navigate = Route.useNavigate();
  const [viewerError, setViewerError] = useState<string | null>(null);

  // resolveMaterialParam is pure and synchronous, so derive the source (and any "unknown
  // material" error) straight from the search param during render instead of an effect.
  const resolved = materialUrl ? resolveMaterialParam(materialUrl) : undefined;
  const resolveError = materialUrl && !resolved ? `Unknown material "${materialUrl}"` : null;
  const source = useMemo(() => {
    const value = materialUrl ? resolveMaterialParam(materialUrl) : undefined;
    return value ? { kind: 'url' as const, folderUrl: value.folderUrl, fileName: value.fileName } : null;
  }, [materialUrl]);
  const error = resolveError ?? viewerError;

  return (
    <div className="p-2">
      <MaterialViewer
        source={source}
        onError={setViewerError}
        settings={viewerSettings(search)}
        onSettingsChange={(patch) =>
          void navigate({
            to: '.',
            search: (previous) => ({ ...previous, ...patch }),
            replace: true,
            resetScroll: false,
          })
        }
      />
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

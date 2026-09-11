import { viewerSearch, viewerSettings } from '@/lib/viewer-search';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { MaterialViewer } from '@/components/MaterialViewerLazy';
import { useMaterialLoad } from '@/hooks/use-material-load';

export const Route = createFileRoute('/embed')({
  ssr: false,
  validateSearch: viewerSearch,
  component: EmbedPage,
});

/** Chromeless viewer for iframe embedding: `/embed?materialUrl=<preset id or .mtlx URL>`. */
function EmbedPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { load, clear, source, fileError, loadProgress } = useMaterialLoad();
  const [viewerError, setViewerError] = useState<string | null>(null);
  useEffect(() => {
    if (search.materialUrl) load(search.materialUrl);
    else clear();
  }, [search.materialUrl, load, clear]);
  const error = fileError ?? viewerError;

  return (
    <div className="p-2">
      <MaterialViewer
        source={source}
        onError={setViewerError}
        loadProgress={loadProgress}
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

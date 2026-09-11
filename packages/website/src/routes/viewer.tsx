import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { MaterialViewer } from '@/components/MaterialViewerLazy';
import { InfoPanel } from '@/components/InfoPanel';
import { LogPanel } from '@/components/LogPanel';
import { ViewerToolbar } from '@/components/viewer/ViewerToolbar';
import { MaterialDropZone } from '@/components/viewer/MaterialDropZone';
import { useMaterialLoad } from '@/hooks/use-material-load';
import { viewerSearch, viewerSettings } from '@/lib/viewer-search';
import type { PreviewReport } from '@/components/MaterialViewer';

export const Route = createFileRoute('/viewer')({
  ssr: false,
  validateSearch: viewerSearch,
  head: () => ({
    meta: [
      { title: 'MaterialX viewer — mtlx' },
      {
        name: 'description',
        content: 'Drag and drop a .mtlx or .mtlx.zip file to preview and validate it in the browser.',
      },
    ],
  }),
  component: ViewerPage,
});

function ViewerPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { load, clear, source, fileMeta, analysis, fileError, loadProgress, logLines, appendLog } = useMaterialLoad();
  const localFile = useRef(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewReport>({ state: 'idle', resources: 'unchecked', failedResources: [] });

  useEffect(() => {
    if (search.materialUrl) {
      localFile.current = false;
      load(search.materialUrl);
    } else if (!localFile.current) {
      clear();
    }
  }, [search.materialUrl, load, clear]);

  const loadFromFile = (file: File) => {
    localFile.current = true;
    void navigate({ to: '.', search: (previous) => ({ ...previous, materialUrl: undefined }) });
    load(file);
  };
  const loadFromUrl = (url: string) => {
    if (search.materialUrl === url) load(url);
    else void navigate({ to: '.', search: (previous) => ({ ...previous, materialUrl: url }) });
  };

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">MaterialX viewer</h1>
        <p className="text-sm text-muted-foreground">Preview and validate .mtlx and .mtlx.zip files in your browser.</p>
        <p className="text-sm text-muted-foreground">
          Part of the{' '}
          <Link to="/" className="text-primary underline underline-offset-4">
            Mtlx suite of web-focused MaterialX tools
          </Link>
          .
        </p>
      </header>
      <ViewerToolbar search={search} onLoadFile={loadFromFile} onLoadUrl={loadFromUrl} />
      {fileError && !analysis?.parseError ? (
        <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">
          {fileError}
        </p>
      ) : null}
      <MaterialDropZone onLoadFile={loadFromFile} className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
        <MaterialViewer
          source={source}
          settings={viewerSettings(search)}
          onSettingsChange={(patch) =>
            void navigate({
              to: '.',
              search: (previous) => ({ ...previous, ...patch }),
              replace: true,
              resetScroll: false,
            })
          }
          loadProgress={loadProgress}
          onError={(message) => {
            setViewerError(message);
            if (message) appendLog(`ERROR: ${message}`);
          }}
          onLog={appendLog}
          onStatus={setPreview}
        />
        <aside id="material-details" className="min-w-0">
          <InfoPanel
            fileName={fileMeta?.name}
            fileSize={fileMeta?.size}
            summary={analysis?.summary}
            issues={analysis?.issues ?? []}
            parseError={analysis?.parseError}
            viewerError={source ? viewerError : null}
            preview={preview}
            resourcesChecked={analysis?.resourcesChecked}
            localFile={!!source && !/^https?:/.test(source.name) && !source.name.endsWith('.zip')}
          />
        </aside>
      </MaterialDropZone>
      <LogPanel lines={logLines} />
    </main>
  );
}

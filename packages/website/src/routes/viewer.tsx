import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { MaterialViewer, type MaterialSource } from '@/components/MaterialViewerLazy';
import { InfoPanel } from '@/components/InfoPanel';
import { LogPanel } from '@/components/LogPanel';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaterialLoadController } from '@/lib/material-load';
import { PRESET_MATERIALS, presetUrl, materialSearch, resolveMaterialParam } from '@/lib/presets';
import type { PreviewReport } from '@/components/MaterialViewer';
import type { MaterialXAnalysis } from '@/lib/validate';

export interface ViewerSearch {
  materialUrl?: string;
}

export const Route = createFileRoute('/viewer')({
  ssr: false,
  validateSearch: materialSearch,
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
  const { materialUrl } = Route.useSearch();
  const navigate = Route.useNavigate();
  const loader = useRef(new MaterialLoadController());
  useEffect(() => () => loader.current.cancel(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<MaterialSource | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [analysis, setAnalysis] = useState<MaterialXAnalysis | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewReport>({ state: 'idle', resources: 'unchecked', failedResources: [] });
  const [urlInput, setUrlInput] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareMessage('Copied to clipboard.');
    } catch {
      setShareMessage('Clipboard unavailable. Use Download diagnostics or copy the URL from the address bar.');
    }
  };
  const diagnostics = () =>
    JSON.stringify(
      { file: fileMeta, analysis, preview, previewError: viewerError, loadError: fileError, log: logLines },
      null,
      2,
    );
  const shareUrl = (route: 'viewer' | 'embed') => {
    const url = new URL(`/${route}`, window.location.origin);
    if (materialUrl) url.searchParams.set('materialUrl', materialUrl);
    return url.href;
  };
  const [dragActive, setDragActive] = useState(false);

  const appendLog = (message: string) => setLogLines((prev) => [...prev, message]);

  const handleViewerError = (message: string | null) => {
    setViewerError(message);
    if (message) appendLog(`ERROR: ${message}`);
  };

  const load = async (input: File | { url: string; name: string }) => {
    setSource(null);
    setFileMeta(null);
    setAnalysis(null);
    setViewerError(null);
    setFileError(null);
    setLogLines([`Loading ${input.name}...`]);
    setShareMessage('');
    await loader.current.load(
      input,
      (result) => {
        setSource(result.source);
        setFileMeta(result.fileMeta);
        setAnalysis(result.analysis);
        appendLog(`Parsed ${input.name}.`);
      },
      (message) => {
        setFileError(message);
        appendLog(`ERROR: ${message}`);
      },
    );
  };

  const loadFromFile = async (file: File) => {
    loader.current.cancel();
    if (!/\.mtlx(\.zip)?$/i.test(file.name)) {
      setSource(null);
      setFileMeta(null);
      setAnalysis(null);
      setFileError('Unsupported file type — drop a .mtlx or .mtlx.zip file.');
      return;
    }
    void navigate({ to: '.', search: {} });
    await load(file);
  };

  // Drive the viewer entirely from the `materialUrl` query param, so a link can be shared and reloaded.
  useEffect(() => {
    setUrlInput(materialUrl ?? '');
    if (!materialUrl) return;
    const resolved = resolveMaterialParam(materialUrl);
    if (!resolved) {
      loader.current.cancel();
      setSource(null);
      setFileMeta(null);
      setAnalysis(null);
      setFileError(`Unknown material "${materialUrl}"`);
      appendLog(`ERROR: Unknown material "${materialUrl}"`);
      return;
    }
    void load({ url: `${resolved.folderUrl}${resolved.fileName}`, name: resolved.fileName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialUrl]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">MaterialX viewer</h1>
        <p className="text-sm text-muted-foreground">
          A pure TypeScript/JavaScript MaterialX toolkit — works out of the box on Node, browsers, Windows, macOS, and
          Linux.
        </p>
        <p className="text-sm text-muted-foreground">Drag and drop a MaterialX file, or pick a sample below.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          Choose File…
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mtlx,.zip"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFromFile(file);
            event.target.value = '';
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDetailsOpen(!detailsOpen)}
          aria-expanded={detailsOpen}
          aria-controls="material-details"
        >
          {detailsOpen ? 'Hide details' : 'Show details'}
        </Button>
        {fileError ? (
          <p role="alert" className="min-w-0 text-sm text-destructive [overflow-wrap:anywhere]">
            {fileError}
          </p>
        ) : null}
      </div>

      <form
        className="flex min-w-0 flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            const url = new URL(urlInput);
            if (!['https:', 'http:'].includes(url.protocol) || !resolveMaterialParam(url.href))
              throw new Error('Use an HTTP(S) URL ending in .mtlx or .mtlx.zip.');
            setShareMessage('');
            void navigate({ to: '.', search: { materialUrl: url.href } });
            if (materialUrl === url.href) void load({ url: url.href, name: url.pathname.split('/').at(-1)! });
          } catch {
            setShareMessage('Use an HTTP(S) URL ending in .mtlx or .mtlx.zip.');
          }
        }}
      >
        <Select
          value={PRESET_MATERIALS.some((preset) => presetUrl(preset) === materialUrl) ? materialUrl : ''}
          onValueChange={(value) => void navigate({ to: '.', search: { materialUrl: value } })}
        >
          <SelectTrigger aria-label="Sample material" className="w-[260px] max-w-full" size="sm">
            <SelectValue placeholder="Load a sample material…" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_MATERIALS.map((preset) => (
              <SelectItem key={presetUrl(preset)} value={presetUrl(preset)}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          Material URL
          <input
            type="url"
            required
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://example.com/material.mtlx.zip"
            className="min-w-0 rounded border border-border bg-background px-3 py-2"
          />
        </label>
        <Button type="submit" variant="outline">
          Load URL
        </Button>
        <Button variant="outline" disabled={!materialUrl} onClick={() => void copy(shareUrl('viewer'))}>
          Copy link
        </Button>
        <Button
          variant="outline"
          disabled={!materialUrl}
          onClick={() =>
            void copy(
              `<iframe src="${shareUrl('embed').replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" title="MaterialX preview" width="640" height="640" allow="fullscreen" allowfullscreen></iframe>`,
            )
          }
        >
          Copy embed code
        </Button>
      </form>
      <output className="text-sm">{shareMessage}</output>

      <div
        className={`grid min-w-0 gap-6 rounded-lg ${detailsOpen ? 'md:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]' : ''} ${dragActive ? 'outline-2 outline-offset-4 outline-primary' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          const file = event.dataTransfer.files[0];
          if (file) void loadFromFile(file);
        }}
      >
        <MaterialViewer source={source} onError={handleViewerError} onLog={appendLog} onStatus={setPreview} />
        <aside id="material-details" hidden={!detailsOpen} className="min-w-0">
          <InfoPanel
            fileName={fileMeta?.name}
            fileSize={fileMeta?.size}
            summary={analysis?.summary}
            issues={analysis?.issues ?? []}
            parseError={analysis?.parseError}
            viewerError={viewerError}
            preview={preview}
            resourcesChecked={analysis?.resourcesChecked}
            localFile={source?.kind === 'buffer' && !/^https?:/.test(source.name) && !source.name.endsWith('.zip')}
          />
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void copy(diagnostics())}>
          Copy diagnostics
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([diagnostics()], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'mtlx-diagnostics.json';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Download diagnostics
        </Button>
      </div>
      <LogPanel lines={logLines} />
    </main>
  );
}

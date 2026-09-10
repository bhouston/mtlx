import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { MaterialViewer, type MaterialSource } from '@/components/MaterialViewerLazy';
import { InfoPanel } from '@/components/InfoPanel';
import { LogPanel } from '@/components/LogPanel';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractMaterialXText } from '@/lib/materialx-zip';
import { PRESET_MATERIALS, presetId, resolveMaterialParam } from '@/lib/presets';
import { analyzeMaterialXText, type MaterialXAnalysis } from '@/lib/validate';

export interface HomeSearch {
  material?: string;
}

export const Route = createFileRoute('/')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): HomeSearch =>
    typeof search.material === 'string' ? { material: search.material } : {},
  component: HomePage,
});

function HomePage() {
  const { material } = Route.useSearch();
  const navigate = Route.useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<MaterialSource | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [analysis, setAnalysis] = useState<MaterialXAnalysis | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const appendLog = (message: string) => setLogLines((prev) => [...prev, message]);

  const handleViewerError = (message: string | null) => {
    setViewerError(message);
    if (message) appendLog(`ERROR: ${message}`);
  };

  const loadFromFile = async (file: File) => {
    setFileError(null);
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.mtlx') && !lowerName.endsWith('.mtlz') && !lowerName.endsWith('.mtlx.zip')) {
      setFileError('Unsupported file type — drop a .mtlx, .mtlz, or .mtlx.zip file.');
      return;
    }
    void navigate({ to: '.', search: {} });
    appendLog(`Loading ${file.name}...`);
    try {
      const data = await file.arrayBuffer();
      setSource({ kind: 'buffer', data, name: file.name });
      const text = lowerName.endsWith('.mtlx') ? new TextDecoder().decode(data) : extractMaterialXText(data);
      setFileMeta({ name: file.name, size: data.byteLength });
      setAnalysis(analyzeMaterialXText(file.name, text));
      appendLog(`Parsed ${file.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFileError(message);
      appendLog(`ERROR: ${message}`);
    }
  };

  const loadFromUrl = async (folderUrl: string, fileName: string) => {
    setFileError(null);
    setSource({ kind: 'url', folderUrl, fileName });
    const url = `${folderUrl}${fileName}`;
    appendLog(`Fetching ${url}...`);
    try {
      const text = await fetch(url).then((response) => response.text());
      setFileMeta({ name: fileName, size: new TextEncoder().encode(text).length });
      setAnalysis(analyzeMaterialXText(fileName, text));
      appendLog(`Parsed ${fileName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFileError(message);
      appendLog(`ERROR: ${message}`);
    }
  };

  // Drive the viewer entirely from the `material` query param, so a link can be shared and reloaded.
  useEffect(() => {
    if (!material) return;
    const resolved = resolveMaterialParam(material);
    if (!resolved) {
      appendLog(`ERROR: Unknown material "${material}"`);
      return;
    }
    void loadFromUrl(resolved.folderUrl, resolved.fileName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">MaterialX viewer</h1>
        <p className="text-sm text-muted-foreground">
          A pure TypeScript/JavaScript MaterialX toolkit — no binary dependencies, works out of the box on Node,
          browsers, Windows, macOS, and Linux.
        </p>
        <p className="text-sm text-muted-foreground">Drag and drop a MaterialX file, or pick a sample below.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={material ?? ''}
          onValueChange={(value) => void navigate({ to: '.', search: { material: value } })}
        >
          <SelectTrigger className="w-[260px]" size="sm">
            <SelectValue placeholder="Load a sample material…" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_MATERIALS.map((preset) => (
              <SelectItem key={presetId(preset)} value={presetId(preset)}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          Choose File…
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mtlx,.mtlz,.zip"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFromFile(file);
            event.target.value = '';
          }}
        />
        {material ? (
          <Link
            to="/embed"
            search={{ material }}
            target="_blank"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Embed link ↗
          </Link>
        ) : null}
        {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
      </div>

      <div
        className={`grid gap-6 rounded-lg md:grid-cols-[3fr_1fr] ${dragActive ? 'outline-2 outline-offset-4 outline-primary' : ''}`}
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
        <MaterialViewer source={source} onError={handleViewerError} onLog={appendLog} />
        <InfoPanel
          fileName={fileMeta?.name}
          fileSize={fileMeta?.size}
          summary={analysis?.summary}
          issues={analysis?.issues ?? []}
          parseError={analysis?.parseError}
          viewerError={viewerError}
        />
      </div>

      <LogPanel lines={logLines} />
    </main>
  );
}

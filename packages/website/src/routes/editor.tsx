import { createEditorSession } from 'mtlx-core/session';
import { createFileRoute, useLocation } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  cloneMaterialXDocument,
  createMaterialXDocument,
  relativeResourcePath,
  serializeMaterialX,
  type MaterialXPackage,
} from 'mtlx-core';
import {
  GraphToolbar,
  MaterialXNodeGraph,
  NodeParameterEditor,
  useCommandShortcuts,
  useEditorSession,
  createDefaultDocument,
  exportMaterial,
  getNodeCatalog,
  graphScopes,
  previewXml,
} from 'mtlx-editor';
import 'mtlx-editor/styles.css';
import { MaterialViewer } from '@/components/MaterialViewerLazy';
import type { MaterialSource } from '@/components/MaterialViewer';
import { loadEditorMaterial } from '@/lib/editor-material-load';
import {
  DRAFT_LIMITS,
  EDITOR_LAYOUTS,
  decodeEditorSnapshot,
  editorSearch,
  editorShareUrl,
  encodeEditorSnapshot,
  hasEditorSnapshot,
  readEditorSnapshot,
  type EditorLayout,
} from '@/lib/editor-search';
import { viewerSettings } from '@/lib/viewer-search';
import { MaterialLoadControls } from '@/components/viewer/MaterialLoadControls';
import { EditorShareMenu } from '@/components/editor/EditorShareMenu';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Columns2, Download, Layers, Rows2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const LAYOUT_ICONS: Record<EditorLayout, typeof Columns2> = { horizontal: Columns2, vertical: Rows2, overlay: Layers };
const LAYOUT_LABELS: Record<EditorLayout, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
  overlay: 'Overlay',
};
const MAX_UPLOAD_BYTES = 16 * 1024 * 1024;
const DRAFT_KEY = 'mtlx-editor-draft';
const readDraft = () => {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? '';
  } catch {
    return '';
  }
};
const writeDraft = (encoded: string | null) => {
  try {
    if (encoded === null) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, encoded);
  } catch {
    // Private windows and full quotas simply skip the draft.
  }
};
export const Route = createFileRoute('/editor')({
  ssr: false,
  validateSearch: editorSearch,
  head: () => ({ meta: [{ title: 'MaterialX editor — mtlx' }] }),
  component: EditorPage,
});

function EditorPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { resolvedTheme } = useTheme();
  const hash = useLocation({ select: (location) => location.hash });
  const localFile = useRef(false);
  const activeController = useRef<AbortController | null>(null);
  const [loadedSource, setLoadedSource] = useState<{ url?: string; xml: string; resources?: unknown }>({ xml: '' });
  const offeredDraft = useRef(false);
  // A URL-sourced material starts empty rather than briefly showing the default material.
  const hasUrlSource = Boolean(search.materialUrl) || hasEditorSnapshot(hash);
  const [loadedPackage, setPackage] = useState<MaterialXPackage>(() => ({
    rootPath: 'material.mtlx',
    document: hasUrlSource ? createMaterialXDocument({ version: '1.39' }) : createDefaultDocument(),
    resources: [],
  }));
  const [session] = useState(() => createEditorSession({ document: loadedPackage.document }));
  const snapshot = useEditorSession(session);
  // Browser-driving agents (Claude in Chrome, Playwright MCP) script edits through window.mtlx and
  // read the result back with toXml(); see /agents.
  useEffect(() => {
    window.mtlx = session;
    return () => {
      delete window.mtlx;
    };
  }, [session]);
  // File/preview APIs use a detached document copy; all edits target the session.
  const documentCopy = useMemo(() => cloneMaterialXDocument(snapshot.document), [snapshot.document]);
  const pkg = useMemo(() => ({ ...loadedPackage, document: documentCopy }), [loadedPackage, documentCopy]);
  const scope = graphScopes(pkg.document).includes(search.scope ?? '') ? (search.scope ?? '') : '';
  const [documentId, setDocumentId] = useState(0);
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [source, setSource] = useState<MaterialSource | null>(null);
  const [loading, setLoading] = useState(hasUrlSource);
  const layout = search.layout ?? 'vertical';
  const setLayout = (next: EditorLayout) =>
    void navigate({
      to: '.',
      search: (previous) => ({ ...previous, layout: next === 'vertical' ? undefined : next }),
      hash: true,
      replace: true,
      resetScroll: false,
    });
  const generation = useRef(0);
  const documentXml = useMemo(() => serializeMaterialX(pkg.document), [pkg.document]);
  const dirty = documentXml !== loadedSource.xml || loadedPackage.resources !== loadedSource.resources;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  // Unsaved work survives a closed tab as a local draft; a clean document clears it.
  useEffect(() => {
    if (!dirty) {
      writeDraft(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        writeDraft(encodeEditorSnapshot(pkg, DRAFT_LIMITS));
      } catch {
        writeDraft(null);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [dirty, pkg]);
  const resources = useMemo(
    () => ({
      files: loadedPackage.resources
        .filter((resource) => !/\.mtlx$/i.test(resource.archivePath))
        .map((resource) => relativeResourcePath(loadedPackage.rootPath, resource.archivePath)),
      addFile: async (file: File) => {
        if (file.size > MAX_UPLOAD_BYTES) throw new Error('Images must be 16 MB or smaller.');
        const data = new Uint8Array(await file.arrayBuffer());
        const base = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'texture';
        const taken = new Set(loadedPackage.resources.map((resource) => resource.archivePath));
        let archivePath = `textures/${base}`;
        for (let suffix = 2; taken.has(archivePath); suffix++)
          archivePath = `textures/${base.replace(/(\.[^.]*)?$/, `-${suffix}$1`)}`;
        setPackage((current) => ({
          ...current,
          resources: [...current.resources, { archivePath, sourcePath: archivePath, data }],
        }));
        return relativeResourcePath(loadedPackage.rootPath, archivePath);
      },
    }),
    [loadedPackage],
  );
  const xml = useMemo(() => previewXml(pkg.document), [pkg.document]);
  // The editor owns XML and resource bytes. The preview owns every Three.js object.
  // Layout changes do not alter this XML; semantic edits schedule a fresh compilation.
  useEffect(() => {
    const timer = setTimeout(() => setSource({ name: pkg.rootPath, data: new TextEncoder().encode(xml).buffer }), 200);
    return () => clearTimeout(timer);
  }, [xml, pkg.rootPath]);
  useEffect(
    () => () => {
      generation.current++;
      activeController.current?.abort();
    },
    [],
  );
  useCommandShortcuts(session);
  const load = useCallback(
    async (input?: File | string | { snapshot: string } | { draft: string }) => {
      const run = ++generation.current;
      activeController.current?.abort();
      const controller = new AbortController();
      activeController.current = controller;
      setLoading(true);
      setError('');
      try {
        const next =
          input === undefined
            ? { rootPath: 'material.mtlx', document: createDefaultDocument(), resources: [] }
            : typeof input === 'object' && 'snapshot' in input
              ? readEditorSnapshot(input.snapshot)
              : typeof input === 'object' && 'draft' in input
                ? decodeEditorSnapshot(input.draft, DRAFT_LIMITS)
                : await loadEditorMaterial(input, controller.signal, window.location.origin);
        if (run !== generation.current || controller.signal.aborted) return;
        getNodeCatalog(next.document);
        setDocumentId(run);
        setPackage(next);
        // A restored draft is still unsaved work, so it stays dirty.
        const restored = typeof input === 'object' && 'draft' in input;
        setLoadedSource({
          url: typeof input === 'string' ? input : undefined,
          xml: restored ? '' : serializeMaterialX(next.document),
          resources: restored ? undefined : next.resources,
        });
        session.replaceDocument(next.document);
      } catch (e) {
        if (run === generation.current && !controller.signal.aborted)
          setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (run === generation.current) setLoading(false);
      }
    },
    [session],
  );
  // Route navigation is an external input that replaces the editable document.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (hasEditorSnapshot(hash)) {
      localFile.current = false;
      void load({ snapshot: hash });
    } else if (search.materialUrl) {
      localFile.current = false;
      void load(search.materialUrl);
    } else if (!localFile.current) {
      void load();
      const draft = readDraft();
      if (draft && !offeredDraft.current) {
        offeredDraft.current = true;
        toast('You have unsaved edits from a previous visit.', {
          duration: Infinity,
          action: { label: 'Restore', onClick: () => void load({ draft }) },
          cancel: { label: 'Discard', onClick: () => writeDraft(null) },
        });
      }
    }
  }, [search.materialUrl, hash, load]);
  /* oxlint-enable react/set-state-in-effect */
  const loadFromFile = (file: File) => {
    localFile.current = true;
    void navigate({
      to: '.',
      search: (previous) => ({ ...previous, materialUrl: undefined, scope: undefined }),
      hash: '',
    });
    void load(file);
  };
  const loadFromUrl = (url: string) => {
    if (search.materialUrl === url && !hasEditorSnapshot(hash)) void load(url);
    else
      void navigate({ to: '.', search: (previous) => ({ ...previous, materialUrl: url, scope: undefined }), hash: '' });
  };
  const download = () => {
    const bytes = exportMaterial(pkg, true);
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pkg.rootPath.split('/').at(-1)}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  // File drops are an alternative to the labeled keyboard-accessible file input.
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <main
      className="flex min-h-0 flex-1 flex-col gap-3 p-3"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length) {
          e.preventDefault();
          loadFromFile(e.dataTransfer.files[0]!);
        }
      }}
    >
      <h1 className="sr-only">MaterialX editor</h1>
      <MaterialLoadControls materialUrl={search.materialUrl} onLoadFile={loadFromFile} onLoadUrl={loadFromUrl}>
        <Button variant="ghost" size="sm" title="Download .mtlx.zip" onClick={download} disabled={loading}>
          <Download aria-hidden="true" />
          Download
        </Button>
        <EditorShareMenu
          disabled={loading}
          getUrl={() =>
            editorShareUrl(
              window.location.origin,
              { ...viewerSettings(search), scope, layout },
              pkg,
              documentXml === loadedSource.xml ? loadedSource.url : undefined,
            )
          }
        />
        {dirty && (
          <span
            className="ml-auto text-xs text-muted-foreground"
            title="Edits are kept as a local draft until you download them"
          >
            Unsaved
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={dirty ? '' : 'ml-auto'} title="Preview layout">
              {(() => {
                const Icon = LAYOUT_ICONS[layout];
                return <Icon aria-hidden="true" />;
              })()}
              Layout
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {EDITOR_LAYOUTS.map((value) => {
              const Icon = LAYOUT_ICONS[value];
              return (
                <DropdownMenuItem key={value} onSelect={() => setLayout(value)}>
                  <Icon aria-hidden="true" />
                  {LAYOUT_LABELS[value]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </MaterialLoadControls>
      {error && <p role="alert">{error}</p>}
      {(() => {
        const preview = (
          <>
            <MaterialViewer
              source={source}
              resources={pkg.resources}
              onError={setPreviewError}
              settings={viewerSettings(search)}
              onSettingsChange={(patch) =>
                void navigate({
                  to: '.',
                  search: (previous) => ({ ...previous, ...patch }),
                  hash: true,
                  replace: true,
                  resetScroll: false,
                })
              }
            />
            {previewError && (
              <p role="alert" className="mt-1 rounded bg-background/90 px-2 py-1 text-xs">
                Preview: {previewError}
              </p>
            )}
          </>
        );
        // The toolbar and inspector follow the session, so they sit beside the canvas rather than inside it.
        const graph = (
          <div key={documentId} className="mtlx-graph-frame mtlx-fill">
            <MaterialXNodeGraph
              session={session}
              fileName={pkg.rootPath}
              mode="edit"
              scope={scope}
              colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
              onScopeChange={(nextScope) => {
                void navigate({
                  to: '.',
                  search: (previous) => ({ ...previous, scope: nextScope || undefined }),
                  hash: true,
                  replace: true,
                  resetScroll: false,
                });
              }}
            >
              {layout === 'overlay' && preview}
            </MaterialXNodeGraph>
            <GraphToolbar session={session} />
            {layout === 'overlay' && <NodeParameterEditor session={session} resources={resources} />}
          </div>
        );
        // Vertical and horizontal keep the inspector docked in place; overlay floats it over the graph on demand.
        const inspector = (
          <NodeParameterEditor
            session={session}
            resources={resources}
            className="mtlx-inspector-docked"
            placeholder="Select a single node to edit its properties."
          />
        );
        return (
          <div className={`min-h-0 flex-1 mtlx-editor-body mtlx-editor-body-${layout}`}>
            {layout === 'vertical' && (
              <div className="mtlx-preview-pane">
                {preview}
                {inspector}
              </div>
            )}
            {graph}
            {layout === 'horizontal' && inspector}
            {layout === 'horizontal' && <div className="mtlx-preview-pane">{preview}</div>}
          </div>
        );
      })()}
    </main>
  );
}

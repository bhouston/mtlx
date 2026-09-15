import { createEditorSession } from 'mtlx-core/session';
import { createFileRoute, useLocation } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cloneMaterialXDocument, parseMaterialX, serializeMaterialX, type MaterialXPackage } from 'mtlx-core';
import {
  MaterialXNodeGraph,
  MaterialXNodeLib,
  useEditorSession,
  createDefaultDocument,
  exportMaterial,
  getNodeCatalog,
  graphScopes,
  previewXml,
  projectGraph,
} from 'mtlx-editor';
import 'mtlx-editor/styles.css';
import { MaterialViewer } from '@/components/MaterialViewerLazy';
import type { MaterialSource } from '@/components/MaterialViewer';
import { loadEditorMaterial } from '@/lib/editor-material-load';
import { editorSearch, editorShareUrl, hasEditorSnapshot, readEditorSnapshot } from '@/lib/editor-search';
import { viewerSettings } from '@/lib/viewer-search';
import { MaterialLoadControls } from '@/components/viewer/MaterialLoadControls';
import { EditorShareMenu } from '@/components/editor/EditorShareMenu';
import { Button } from '@/components/ui/button';
import { Download, Redo2, Undo2 } from 'lucide-react';

export const Route = createFileRoute('/editor')({
  ssr: false,
  validateSearch: editorSearch,
  head: () => ({ meta: [{ title: 'MaterialX editor — mtlx' }] }),
  component: EditorPage,
});

function EditorPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const hash = useLocation({ select: (location) => location.hash });
  const localFile = useRef(false);
  const activeController = useRef<AbortController | null>(null);
  const [loadedSource, setLoadedSource] = useState<{ url?: string; xml: string }>({ xml: '' });
  const [loadedPackage, setPackage] = useState<MaterialXPackage>(() => ({
    rootPath: 'material.mtlx',
    document: createDefaultDocument(),
    resources: [],
  }));
  const [session] = useState(() => createEditorSession({ document: loadedPackage.document }));
  const snapshot = useEditorSession(session);
  // File/preview APIs use a detached document copy; all edits target the session.
  const documentCopy = useMemo(() => cloneMaterialXDocument(snapshot.document), [snapshot.document]);
  const pkg = useMemo(() => ({ ...loadedPackage, document: documentCopy }), [loadedPackage, documentCopy]);
  const scope = graphScopes(pkg.document).includes(search.scope ?? '') ? (search.scope ?? '') : '';
  const [documentId, setDocumentId] = useState(0);
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [source, setSource] = useState<MaterialSource | null>(null);
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const catalog = useMemo(() => getNodeCatalog(pkg.document), [pkg.document]);
  const documentXml = useMemo(() => serializeMaterialX(pkg.document), [pkg.document]);
  const xml = useMemo(() => previewXml(pkg.document), [pkg.document]);
  // The editor owns XML and resource bytes. The preview owns every Three.js object.
  // Layout changes do not alter this XML; semantic edits schedule a fresh compilation.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const data = exportMaterial(
          { rootPath: pkg.rootPath, resources: pkg.resources, document: parseMaterialX(xml) },
          pkg.resources.length > 0,
        );
        setSource({
          name: pkg.resources.length ? 'preview.mtlx.zip' : pkg.rootPath,
          data: new Uint8Array(data).buffer,
        });
      } catch (e) {
        setPreviewError(e instanceof Error ? e.message : String(e));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [xml, pkg.resources, pkg.rootPath]);
  useEffect(
    () => () => {
      generation.current++;
      activeController.current?.abort();
    },
    [],
  );
  const load = useCallback(
    async (input?: File | string | { snapshot: string }) => {
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
              : await loadEditorMaterial(input, controller.signal, window.location.origin);
        if (run !== generation.current || controller.signal.aborted) return;
        getNodeCatalog(next.document);
        setDocumentId(run);
        setPackage(next);
        setLoadedSource({ url: typeof input === 'string' ? input : undefined, xml: serializeMaterialX(next.document) });
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
    } else if (!localFile.current) void load();
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
      className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6"
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
      <h1 className="text-3xl font-semibold">MaterialX editor</h1>
      <p className="text-sm text-muted-foreground">
        Drop a .mtlx or .mtlx.zip file, or edit the starter material. Preview updates after each edit using Three.js
        MaterialX support.
      </p>
      <MaterialLoadControls materialUrl={search.materialUrl} onLoadFile={loadFromFile} onLoadUrl={loadFromUrl}>
        <Button
          variant="outline"
          size="sm"
          className="w-8 px-0"
          aria-label="Undo"
          title="Undo"
          disabled={!snapshot.canUndo}
          onClick={session.undo}
        >
          <Undo2 aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-8 px-0"
          aria-label="Redo"
          title="Redo"
          disabled={!snapshot.canRedo}
          onClick={session.redo}
        >
          <Redo2 aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-8 px-0"
          aria-label="Download .mtlx.zip"
          title="Download .mtlx.zip"
          onClick={download}
          disabled={loading}
        >
          <Download aria-hidden="true" />
        </Button>
        <EditorShareMenu
          disabled={loading}
          getUrl={() =>
            editorShareUrl(
              window.location.origin,
              { ...viewerSettings(search), scope },
              pkg,
              documentXml === loadedSource.xml ? loadedSource.url : undefined,
            )
          }
        />
      </MaterialLoadControls>
      {error && <p role="alert">{error}</p>}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_340px]">
        <MaterialXNodeLib
          catalog={catalog}
          onAdd={(spec) => {
            const nodes = projectGraph(pkg.document, scope, catalog).nodes;
            const x = Math.min(0, ...nodes.map((node) => node.position.x)) - 310;
            try {
              session.transaction('Add node', () => {
                const id = session.graph(scope).addNode({ definition: spec.nodeDefName! });
                session.layout.moveNodes({ [id]: { x, y: 50 } }, scope);
              });
              setError('');
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : String(failure));
            }
          }}
        />
        <div>
          <MaterialViewer
            source={source}
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
            <p role="alert" className="text-sm">
              Preview: {previewError}
            </p>
          )}
        </div>
      </div>
      <MaterialXNodeGraph
        key={documentId}
        session={session}
        fileName={pkg.rootPath}
        mode="edit"
        scope={scope}
        onScopeChange={(nextScope) => {
          void navigate({
            to: '.',
            search: (previous) => ({ ...previous, scope: nextScope || undefined }),
            hash: true,
            replace: true,
            resetScroll: false,
          });
        }}
      />
    </main>
  );
}

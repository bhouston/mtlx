import { useMemo } from 'react';
import { createEditorSession } from 'mtlx-core/session';
import { importMaterial } from './model.js';
import { MaterialXNodeGraph } from './MaterialXNodeGraph.js';
import { NodeParameterEditor } from './NodeParameterEditor.js';
import { GraphToolbar } from './GraphToolbar.js';

/** Read-only inspection of a MaterialX file or archive, independent of 3D rendering. */
export function MaterialXGraphView({ data, fileName }: { data?: ArrayBuffer; fileName?: string }) {
  const result = useMemo(() => {
    if (!data || !fileName) return null;
    try {
      // URL sources may include query strings; importMaterial expects a file extension.
      const name = /^https?:/i.test(fileName) ? new URL(fileName).pathname : fileName;
      const material = importMaterial(new Uint8Array(data), name);
      return { session: createEditorSession({ document: material.document }), fileName: material.rootPath };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [data, fileName]);
  if (!result) return <p className="p-6 text-sm text-muted-foreground">Load a MaterialX file to inspect its graph.</p>;
  if (!result.session)
    return (
      <p role="alert" className="p-6 text-sm text-destructive">
        {result.error}
      </p>
    );
  return (
    <div className="mtlx-graph-view mtlx-graph-frame">
      <MaterialXNodeGraph session={result.session} fileName={result.fileName} mode="view" />
      <GraphToolbar session={result.session} editable={false} />
      <NodeParameterEditor session={result.session} editable={false} />
    </div>
  );
}

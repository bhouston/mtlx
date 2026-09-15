import { useMemo, useState } from 'react';
import { graphScopes, importMaterial } from './model.js';
import { MaterialXNodeGraph } from './MaterialXNodeGraph.js';

/** Read-only inspection of a MaterialX file or archive, independent of 3D rendering. */
export function MaterialXGraphView({ data, fileName }: { data?: ArrayBuffer; fileName?: string }) {
  const result = useMemo(() => {
    if (!data || !fileName) return null;
    try {
      // URL sources may include query strings; importMaterial expects a file extension.
      const name = /^https?:/i.test(fileName) ? new URL(fileName).pathname : fileName;
      const material = importMaterial(new Uint8Array(data), name);
      return { document: material.document, fileName: material.rootPath };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [data, fileName]);
  const [selectedScope, setScope] = useState('');
  if (!result) return <p className="p-6 text-sm text-muted-foreground">Load a MaterialX file to inspect its graph.</p>;
  if (!result.document)
    return (
      <p role="alert" className="p-6 text-sm text-destructive">
        {result.error}
      </p>
    );
  const scopes = graphScopes(result.document);
  const scope = scopes.includes(selectedScope) ? selectedScope : '';
  return (
    <div className="mtlx-graph-view">
      <MaterialXNodeGraph
        document={result.document}
        fileName={result.fileName}
        scope={scope}
        onScopeChange={setScope}
        mode="view"
      />
    </div>
  );
}

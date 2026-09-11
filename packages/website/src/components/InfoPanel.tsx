import { ValidityChecks } from './ValidityChecks';
import type { MaterialXSummary, MaterialXValidationIssue } from 'mtlx-core';
import type { PreviewReport } from './MaterialViewer';

export interface InfoPanelProps {
  fileName?: string;
  fileSize?: number;
  summary?: MaterialXSummary;
  issues: MaterialXValidationIssue[];
  parseError?: string;
  viewerError?: string | null;
  preview?: PreviewReport;
  localFile?: boolean;
  resourcesChecked?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {items.length ? (
          items.map((item, index) => <li key={index}>{item}</li>)
        ) : (
          <li className="list-none text-muted-foreground">(none)</li>
        )}
      </ul>
    </section>
  );
}

export function InfoPanel({
  fileName,
  fileSize,
  summary,
  issues,
  parseError,
  viewerError,
  preview,
  localFile,
  resourcesChecked,
}: InfoPanelProps) {
  if (!fileName && !parseError)
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        Load a material to see its details here.
      </div>
    );
  return (
    <div className="min-w-0 overflow-auto rounded-lg border border-border bg-card p-4 text-sm [overflow-wrap:anywhere]">
      <ValidityChecks
        issues={issues}
        parseError={parseError}
        viewerError={viewerError}
        preview={preview}
        resourcesChecked={resourcesChecked}
        dependencyHint={
          localFile && summary?.referencedTextures.length
            ? 'Open a .mtlx.zip containing the textures, or host the document and textures together.'
            : undefined
        }
      />
      {summary ? (
        <Section
          title="Materials (surfaces/volumes)"
          items={summary.materials.map((material) => `${material.name ?? '(unnamed)'} [${material.category}]`)}
        />
      ) : null}
      {fileName || summary ? (
        <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
          <dt>File</dt>
          <dd>{fileName}</dd>
          {fileSize !== undefined ? (
            <>
              <dt>Size</dt>
              <dd>{formatFileSize(fileSize)}</dd>
            </>
          ) : null}
          {summary ? (
            <>
              <dt>Version</dt>
              <dd>{summary.version ?? 'unknown'}</dd>
              <dt>Colorspace</dt>
              <dd>{summary.colorspace ?? 'unknown'}</dd>
              <dt>Node graphs</dt>
              <dd>{summary.nodeGraphCount}</dd>
              <dt>Top-level nodes</dt>
              <dd>{summary.topLevelNodeCount}</dd>
            </>
          ) : null}
        </dl>
      ) : null}
      {summary ? (
        <>
          <Section title="Referenced textures" items={summary.referencedTextures} />
          <details className="mt-3">
            <summary className="cursor-pointer font-semibold">Internal nodes ({summary.nodes.length})</summary>
            <Section
              title="Nodes"
              items={summary.nodes.map((node) => `${node.name ?? '(unnamed)'} [${node.category}]`)}
            />
          </details>
        </>
      ) : null}
    </div>
  );
}

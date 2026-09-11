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

function Section({ title, items, expanded = false }: { title: string; items: string[]; expanded?: boolean }) {
  return (
    <details open={expanded}>
      <summary className="cursor-pointer select-none font-semibold">
        {title} ({items.length})
      </summary>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {items.length ? (
          items.map((item, index) => <li key={index}>{item}</li>)
        ) : (
          <li className="list-none text-muted-foreground">(none)</li>
        )}
      </ul>
    </details>
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
    <div className="min-w-0 space-y-3 overflow-auto rounded-lg border border-border bg-card p-4 text-sm [overflow-wrap:anywhere]">
      {fileName || summary ? (
        <details open>
          <summary className="cursor-pointer select-none font-semibold">File details</summary>
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
        </details>
      ) : null}
      {summary ? (
        <>
          <Section
            title="Materials"
            expanded={summary.materials.length > 1}
            items={summary.materials.map((material) => `${material.name ?? '(unnamed)'} [${material.category}]`)}
          />
          <Section title="References" items={summary.referencedTextures} />
          <Section
            title="Internal Nodes"
            items={summary.nodes.map((node) => `${node.name ?? '(unnamed)'} [${node.category}]`)}
          />
        </>
      ) : null}
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
    </div>
  );
}

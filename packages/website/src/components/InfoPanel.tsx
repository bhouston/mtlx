import type { MaterialXSummary, MaterialXValidationIssue } from 'mtlx-core';

export interface InfoPanelProps {
  fileName?: string;
  fileSize?: number;
  summary?: MaterialXSummary;
  issues: MaterialXValidationIssue[];
  parseError?: string;
  /** A 3D-render-time error (e.g. WebGPU init failure), separate from a document parse error. */
  viewerError?: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {items.length ? (
          items.map((item, index) => <li key={index}>{item}</li>)
        ) : (
          <li className="list-none pl-0 text-muted-foreground">(none)</li>
        )}
      </ul>
    </div>
  );
}

// Mirrors the VS Code extension's stats panel (src/preview/preview.ts renderStats()), both
// driven by mtlx-core's shared summarizeMaterialX().
export function InfoPanel({ fileName, fileSize, summary, issues, parseError, viewerError }: InfoPanelProps) {
  if (!fileName && !parseError) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        Load a material to see its details here.
      </div>
    );
  }

  const valid = !parseError && !issues.some((issue) => issue.level === 'error');

  return (
    <div className="flex h-full flex-col overflow-auto rounded-lg border border-border bg-card p-4 text-sm">
      <p className={valid ? 'font-semibold text-green-600 dark:text-green-400' : 'font-semibold text-destructive'}>
        {valid ? '✓ Valid' : '✗ Invalid'}
      </p>
      {parseError ? <p className="mt-1 text-destructive">Parse error: {parseError}</p> : null}
      {viewerError ? <p className="mt-1 text-destructive">3D preview error: {viewerError}</p> : null}

      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="font-medium text-muted-foreground">File</dt>
        <dd className="break-words">{fileName}</dd>
        {fileSize !== undefined ? (
          <>
            <dt className="font-medium text-muted-foreground">Size</dt>
            <dd>{formatFileSize(fileSize)}</dd>
          </>
        ) : null}
        {summary ? (
          <>
            <dt className="font-medium text-muted-foreground">Version</dt>
            <dd>{summary.version ?? 'unknown'}</dd>
            <dt className="font-medium text-muted-foreground">Colorspace</dt>
            <dd>{summary.colorspace ?? 'unknown'}</dd>
            <dt className="font-medium text-muted-foreground">Node graphs</dt>
            <dd>{summary.nodeGraphCount}</dd>
            <dt className="font-medium text-muted-foreground">Top-level nodes</dt>
            <dd>{summary.topLevelNodeCount}</dd>
          </>
        ) : null}
      </dl>

      {summary ? (
        <>
          <Section
            title="Materials (surfaces/volumes)"
            items={summary.materials.map((material) => `${material.name ?? '(unnamed)'} [${material.category}]`)}
          />
          <Section title="Referenced textures" items={summary.referencedTextures} />
          <Section
            title="Internal nodes"
            items={summary.nodes.map((node) => `${node.name ?? '(unnamed)'} [${node.category}]`)}
          />
        </>
      ) : null}

      {issues.length > 0 ? (
        <div>
          <h3 className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Issues</h3>
          <ul className="mt-1 space-y-1">
            {issues.map((issue, index) => (
              <li
                key={index}
                className={issue.level === 'error' ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-400'}
              >
                {issue.level.toUpperCase()} {issue.location}: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

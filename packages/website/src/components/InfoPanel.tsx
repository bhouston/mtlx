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
  const warningCount = issues.filter((issue) => issue.level === 'warning').length;
  const valid =
    !parseError &&
    !issues.some((issue) => issue.level === 'error' && issue.rule !== 'resources' && issue.rule !== 'renderer-support');
  const resourceErrors = issues.filter((issue) => issue.level === 'error' && issue.rule === 'resources').length;
  const failed = preview?.failedResources ?? [];
  return (
    <div className="min-w-0 overflow-auto rounded-lg border border-border bg-card p-4 text-sm [overflow-wrap:anywhere]">
      <output aria-live="polite" aria-atomic="true" className="block space-y-2">
        <p>
          <strong>Document: </strong>
          <span className={valid ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
            {valid ? '✓ Document checks passed' : '✗ Document checks failed'}
          </span>
        </p>
        <p>
          <strong>Resources: </strong>
          {resourceErrors
            ? `${resourceErrors} resource issues`
            : failed.length
              ? `${failed.length} failed to load`
              : preview?.resources === 'loading'
                ? 'Loading requested resources…'
                : resourcesChecked
                  ? 'Dependency checks passed'
                  : preview?.resources === 'loaded'
                    ? 'Requested resources loaded'
                    : resourcesChecked
                      ? 'Dependency checks passed'
                      : 'Unavailable for checking'}
        </p>
        <p>
          <strong>Preview: </strong>
          {viewerError ? 'Failed' : (preview?.state ?? 'idle')}
        </p>
      </output>
      <p className="mt-2 text-xs text-muted-foreground">
        {warningCount} warning{warningCount === 1 ? '' : 's'}. Checks: XML, structure, types, dependencies and renderer
        categories. Shader compilation is checked by the preview.
      </p>
      {parseError ? <p className="mt-2 text-destructive">Parse error: {parseError}</p> : null}
      {viewerError ? <p className="mt-2 text-destructive">3D preview error: {viewerError}</p> : null}
      {failed.length ? (
        <>
          <Section title="Failed resources" items={failed} />
          <p className="mt-1">
            Check the referenced paths and image formats. For remote files, check hosting and CORS permissions.
          </p>
        </>
      ) : null}
      {localFile && summary?.referencedTextures.length ? (
        <p className="mt-2">
          A local .mtlx cannot access sibling textures in the browser. Open a self-contained .mtlx.zip, or host the
          document and textures together.
        </p>
      ) : null}
      {issues.length ? (
        <section>
          <h3 className="mt-3 font-semibold">Issues</h3>
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
        </section>
      ) : null}
      {summary ? (
        <Section
          title="Materials (surfaces/volumes)"
          items={summary.materials.map((material) => `${material.name ?? '(unnamed)'} [${material.category}]`)}
        />
      ) : null}
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

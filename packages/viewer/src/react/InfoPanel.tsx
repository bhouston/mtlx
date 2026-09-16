import { Fragment } from 'react';
import { humanizeBytes } from 'humanize-units';
import { summarizeInternalNodes } from '../diagnostics.js';
import { ValidityChecks } from './ValidityChecks.js';
import type { PreviewReport, ValidationIssue } from '../diagnostics.js';

/** Structural subset of mtlx-core's MaterialXSummary, so this package needs no mtlx-core dependency. */
export interface MaterialSummary {
  version?: string;
  colorspace?: string;
  nodeGraphCount: number;
  topLevelNodeCount: number;
  materials: { name?: string; category: string }[];
  nodes: { name?: string; category: string }[];
  referencedTextures: string[];
}

/** Structural subset of mtlx-core's MaterialXAsset. */
export interface MaterialAsset {
  path: string;
  bytes?: number;
}

const formatBytes = (bytes: number) => humanizeBytes(bytes, { unitSeparator: ' ' });

export interface InfoPanelProps {
  fileName?: string;
  fileSize?: number;
  summary?: MaterialSummary;
  /** Root document first, then every dependency; sizes are uncompressed. */
  assets?: MaterialAsset[];
  issues: ValidationIssue[];
  parseError?: string;
  viewerError?: string | null;
  preview?: PreviewReport;
  localFile?: boolean;
  resourcesChecked?: boolean;
}

function Section({
  title,
  items,
  expanded = false,
  count = items.length,
}: {
  title: string;
  items: string[];
  expanded?: boolean;
  count?: number;
}) {
  return (
    <details open={expanded}>
      <summary className="cursor-pointer select-none font-semibold">
        {title} ({count})
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

/** Dependencies with sizes when the host inspected them; the root document is excluded. */
function ReferencesSection({ assets, fallback }: { assets?: MaterialAsset[]; fallback: string[] }) {
  if (!assets?.length) return <Section title="References" items={fallback} />;
  const references = assets.slice(1);
  const total = references.reduce((sum, asset) => sum + (asset.bytes ?? 0), 0);
  return (
    <details>
      <summary className="cursor-pointer select-none font-semibold">
        References ({references.length}, {formatBytes(total)})
      </summary>
      {references.length ? (
        <dl className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5">
          {references.map((asset) => (
            <Fragment key={asset.path}>
              <dt>{asset.path}</dt>
              <dd className="text-right tabular-nums">
                {asset.bytes === undefined ? (
                  <span className="text-muted-foreground">(missing)</span>
                ) : (
                  formatBytes(asset.bytes)
                )}
              </dd>
            </Fragment>
          ))}
        </dl>
      ) : (
        <p className="mt-1 text-muted-foreground">(none)</p>
      )}
    </details>
  );
}

export function InfoPanel({
  fileName,
  fileSize,
  summary,
  assets,
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
  const { types: nodeTypes, count: internalNodeCount } = summarizeInternalNodes(summary);
  return (
    <div className="min-w-0 space-y-3 overflow-auto rounded-lg border border-border bg-card p-4 text-sm [overflow-wrap:anywhere]">
      {fileName || summary ? (
        <details open>
          <summary className="cursor-pointer select-none font-semibold">File details</summary>
          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
            {fileSize !== undefined ? (
              <>
                <dt>Size</dt>
                <dd>{formatBytes(fileSize)}</dd>
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
          <ReferencesSection assets={assets} fallback={summary.referencedTextures} />
          <Section
            title="Internal Nodes"
            count={internalNodeCount}
            items={nodeTypes.map(([type, count]) => `${type} (${count})`)}
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

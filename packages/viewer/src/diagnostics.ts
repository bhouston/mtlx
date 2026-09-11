/** Framework-independent diagnostics shared by the website and editor webview. */
export type CheckState = 'passed' | 'failed' | 'warning' | 'pending' | 'unchecked';
export interface Check {
  name: string;
  state: CheckState;
  messages: string[];
}
export interface ValidationIssue {
  level: 'error' | 'warning';
  rule?: string;
  code?: string;
  location: string;
  message: string;
}
export interface PreviewReport {
  state: 'idle' | 'loading' | 'ready' | 'error';
  resources: 'unchecked' | 'loading' | 'loaded';
  failedResources: string[];
}
export interface DiagnosticInput {
  issues: ValidationIssue[];
  parseError?: string;
  viewerError?: string | null;
  preview?: PreviewReport;
  resourcesChecked?: boolean;
  dependencyHint?: string;
}
export function computeChecks({
  issues,
  parseError,
  viewerError,
  preview,
  resourcesChecked,
  dependencyHint,
}: DiagnosticInput): { checks: Check[]; overall: CheckState } {
  const checks: Check[] = [
    { name: 'XML', state: parseError ? 'failed' : 'passed', messages: parseError ? [parseError] : [] },
  ];
  const groups = [
    ['basic', 'Nodes'],
    ['structure', 'Structure'],
    ['types', 'Types'],
    ['resources', 'Dependencies'],
    ['renderer-support', 'Renderer support'],
  ];
  for (const [rule, name] of groups) {
    const findings = issues.filter((issue) => issue.rule === rule);
    const messages = findings.map((issue) => `${issue.location}: ${issue.message}`);
    let state: CheckState = parseError ? 'unchecked' : 'passed';
    if (rule === 'resources' && !parseError) {
      state = preview?.resources === 'loading' ? 'pending' : resourcesChecked ? 'passed' : 'unchecked';
      if (!resourcesChecked) messages.push(dependencyHint ?? 'Dependencies could not be checked.');
      if (preview?.failedResources.length) {
        state = 'failed';
        messages.push(...preview.failedResources.map((url) => `Failed to load: ${url}`));
      }
    }
    if (findings.some((issue) => issue.level === 'error')) state = 'failed';
    else if (findings.length && state !== 'failed') state = 'warning';
    checks.push({ name: name!, state, messages });
  }
  const remaining = issues.filter(
    (issue) => issue.code !== 'PARSE_ERROR' && !groups.some(([rule]) => rule === issue.rule),
  );
  if (remaining.length)
    checks.push({
      name: 'Document',
      state: remaining.some((issue) => issue.level === 'error') ? 'failed' : 'warning',
      messages: remaining.map((issue) => `${issue.location}: ${issue.message}`),
    });
  checks.push({
    name: 'Preview',
    state:
      viewerError || preview?.state === 'error'
        ? 'failed'
        : parseError
          ? 'unchecked'
          : preview?.state === 'ready'
            ? 'passed'
            : preview?.state === 'loading'
              ? 'pending'
              : 'unchecked',
    messages: viewerError ? [viewerError] : [],
  });
  const overall =
    (['failed', 'warning', 'pending', 'unchecked'] as const).find((candidate) =>
      checks.some((check) => check.state === candidate),
    ) ?? 'passed';
  return { checks, overall };
}

export function summarizeInternalNodes(summary?: {
  materials: { category: string }[];
  nodes: { category: string }[];
}): { types: [string, number][]; count: number } {
  const materialTypes = new Set(summary?.materials.map((material) => material.category));
  const types = new Map<string, number>();
  for (const node of summary?.nodes ?? []) {
    if (materialTypes.has(node.category) || ['surfacematerial', 'volumematerial'].includes(node.category.toLowerCase()))
      continue;
    types.set(node.category, (types.get(node.category) ?? 0) + 1);
  }
  return {
    types: [...types].toSorted(([a], [b]) => a.localeCompare(b)),
    count: [...types.values()].reduce((total, count) => total + count, 0),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

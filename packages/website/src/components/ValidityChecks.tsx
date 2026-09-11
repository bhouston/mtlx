import { useState } from 'react';
import type { MaterialXValidationIssue } from 'mtlx-core';
import type { PreviewReport } from './MaterialViewer';

type CheckState = 'passed' | 'failed' | 'warning' | 'pending' | 'unchecked';
interface Check {
  name: string;
  state: CheckState;
  messages: string[];
}
export interface ValidityChecksProps {
  issues: MaterialXValidationIssue[];
  parseError?: string;
  viewerError?: string | null;
  preview?: PreviewReport;
  resourcesChecked?: boolean;
  dependencyHint?: string;
}
const STATES: Record<CheckState, { symbol: string; label: string; color: string }> = {
  passed: { symbol: '✓', label: 'Passed', color: 'text-green-600 dark:text-green-400' },
  failed: { symbol: '✗', label: 'Failed', color: 'text-destructive' },
  warning: { symbol: '⚠', label: 'Warning', color: 'text-amber-600 dark:text-amber-400' },
  pending: { symbol: '…', label: 'Checking', color: 'text-muted-foreground' },
  unchecked: { symbol: '–', label: 'Not checked', color: 'text-muted-foreground' },
};
function CheckMark({ state }: { state: CheckState }) {
  const status = STATES[state];
  return (
    <span className={status.color}>
      <span aria-hidden="true">{status.symbol}</span>
      <span className="sr-only">{status.label}</span>
    </span>
  );
}

export function ValidityChecks({
  issues,
  parseError,
  viewerError,
  preview,
  resourcesChecked,
  dependencyHint,
}: ValidityChecksProps) {
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
  const state =
    (['failed', 'warning', 'pending', 'unchecked'] as const).find((candidate) =>
      checks.some((check) => check.state === candidate),
    ) ?? 'passed';
  const problems = checks.filter((check) => check.state === 'failed' || check.state === 'warning');
  const problemKey = JSON.stringify(problems);
  const [disclosure, setDisclosure] = useState({ problemKey, open: problems.length > 0 });
  const open = disclosure.problemKey === problemKey ? disclosure.open : problems.length > 0;
  return (
    <details
      open={open}
      onToggle={(event) => setDisclosure({ problemKey, open: event.currentTarget.open })}
      data-validity-state={state}
    >
      <summary className="cursor-pointer select-none font-semibold">
        <span className="inline-flex items-center gap-2">
          Validity Checks <CheckMark state={state} />
        </span>
      </summary>
      <ul className="mt-3 space-y-2">
        {checks.map((check) => (
          <li key={check.name} data-check={check.name} data-check-state={check.state}>
            <div className="flex items-center justify-between gap-3">
              <span>{check.name}</span>
              <CheckMark state={check.state} />
            </div>
            {check.messages.length ? (
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {check.messages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

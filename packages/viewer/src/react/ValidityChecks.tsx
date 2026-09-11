import { useState } from 'react';
import { computeChecks, type CheckState, type DiagnosticInput } from '../diagnostics.js';

export type ValidityChecksProps = DiagnosticInput;
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
  const { checks, overall: state } = computeChecks({
    issues,
    parseError,
    viewerError,
    preview,
    resourcesChecked,
    dependencyHint,
  });
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

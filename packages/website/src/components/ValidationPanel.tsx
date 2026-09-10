import type { MaterialXValidationIssue } from 'mtlx-core';

export interface ValidationPanelProps {
  issues: MaterialXValidationIssue[] | null;
  loadError: string | null;
}

export function ValidationPanel({ issues, loadError }: ValidationPanelProps) {
  if (!issues && !loadError) {
    return null;
  }

  return (
    <div className="w-full rounded-lg bg-black/30 p-4 text-sm">
      {loadError ? <p className="text-red-400">3D preview error: {loadError}</p> : null}
      {issues && issues.length === 0 ? <p className="text-green-400">Check passed — no issues found.</p> : null}
      {issues && issues.length > 0 ? (
        <ul className="space-y-1">
          {issues.map((issue, index) => (
            <li key={index} className={issue.level === 'error' ? 'text-red-400' : 'text-yellow-400'}>
              {issue.level.toUpperCase()} {issue.location}: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

'use client';

import { Tooltip } from 'radix-ui';
import type { EditorSession } from 'mtlx-core/session';
import {
  TOOLBAR_COMMANDS,
  execute,
  resolveCommands,
  shortcutLabel,
  useCommandContext,
  type CommandEntry,
} from './commands.js';

/** Icon toolbar for the session's commands; in view mode only the canvas commands remain. Floats bottom-center of its parent by default. */
export function GraphToolbar({
  session,
  editable = true,
  entries = TOOLBAR_COMMANDS,
  className = '',
}: {
  session: EditorSession;
  editable?: boolean;
  entries?: readonly CommandEntry[];
  className?: string;
}) {
  const context = useCommandContext(session, { editable });
  const items = resolveCommands(entries, context);
  return (
    <Tooltip.Provider delayDuration={400}>
      <div role="toolbar" aria-label="Graph tools" className={`mtlx-command-bar nodrag nopan ${className}`}>
        {items.map((item, index) =>
          item === 'divider' ? (
            <hr key={index} className="mtlx-command-bar-divider" />
          ) : (
            <Tooltip.Root key={item.id}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className="mtlx-command-button"
                  data-variant={item.variant}
                  aria-label={item.label}
                  disabled={!item.enabled}
                  onClick={() => void execute(item, context)}
                >
                  {item.icon && <item.icon size={16} aria-hidden="true" />}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="mtlx-tooltip" side="top" sideOffset={6}>
                  {item.title}
                  {item.shortcuts?.[0] && <kbd>{shortcutLabel(item.shortcuts[0])}</kbd>}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          ),
        )}
      </div>
    </Tooltip.Provider>
  );
}

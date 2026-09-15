import { useState } from 'react';

/** The node's name as an inline field: Enter or blur renames, Escape reverts. */
export function NodeNameField({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  const submit = () => {
    const next = draft.trim();
    if (next && next !== name) onRename(next);
    else setDraft(name);
  };
  return (
    <input
      className="mtlx-node-name"
      aria-label="Node name"
      title="Rename node"
      value={draft}
      spellCheck={false}
      size={Math.max(4, draft.length)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={submit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          setDraft(name);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

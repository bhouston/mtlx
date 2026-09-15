import { useEffect, useId, useRef, useState } from 'react';
import type { MaterialXNodeSpec } from './model.js';
import { searchNodeCatalog } from './node-catalog-tree.js';

export interface QuickAddMenuProps {
  catalog: MaterialXNodeSpec[];
  /** Position inside the canvas element. */
  at: { x: number; y: number };
  /** Narrows the offered definitions, for example to those accepting a dragged wire. */
  accept?: (spec: MaterialXNodeSpec) => boolean;
  placeholder?: string;
  onAdd: (spec: MaterialXNodeSpec) => void;
  onClose: () => void;
}
const LIMIT = 12;
/** Searchable node insertion at the cursor. Enter adds the highlighted node, Escape closes. */
export function QuickAddMenu({ catalog, at, accept, placeholder, onAdd, onClose }: QuickAddMenuProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  // A popover opened by a gesture takes focus so typing starts immediately.
  useEffect(() => input.current?.focus(), []);
  const entries = searchNodeCatalog(catalog, query, accept).slice(0, LIMIT);
  const index = Math.min(active, Math.max(0, entries.length - 1));
  const choose = (position: number) => {
    const entry = entries[position];
    if (entry?.kind === 'node') onAdd(entry.node);
  };
  return (
    <div className="mtlx-quick-add nodrag nopan nowheel" style={{ left: at.x, top: at.y }}>
      <input
        ref={input}
        onBlur={onClose}
        type="search"
        aria-label="Search nodes to add"
        aria-controls={listId}
        placeholder={placeholder ?? 'Add node…'}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') setActive(Math.min(index + 1, entries.length - 1));
          else if (event.key === 'ArrowUp') setActive(Math.max(index - 1, 0));
          else if (event.key === 'Enter') choose(index);
          else if (event.key === 'Escape') onClose();
          else return;
          event.preventDefault();
          event.stopPropagation();
        }}
      />
      <ul id={listId} className="mtlx-node-list">
        {entries.map((entry, position) => (
          <li key={entry.id} id={`${listId}-${position}`}>
            <button
              type="button"
              tabIndex={-1}
              aria-pressed={position === index}
              title={entry.kind === 'node' ? entry.node.nodeDefName : undefined}
              onMouseEnter={() => setActive(position)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(position)}
            >
              <span className="mtlx-catalog-label">{entry.label}</span>
              {entry.kind === 'node' && <small>{entry.node.nodeGroup}</small>}
            </button>
          </li>
        ))}
        {!entries.length && <li>No matching nodes</li>}
      </ul>
    </div>
  );
}

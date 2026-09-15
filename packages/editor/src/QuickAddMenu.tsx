import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MaterialXNodeSpec } from './model.js';
import {
  buildNodeCatalogTree,
  searchNodeCatalog,
  type NodeCatalogEntry,
  type NodeDefinition,
} from './node-catalog-tree.js';

export interface QuickAddMenuProps {
  catalog: MaterialXNodeSpec[];
  /** Position inside the canvas element. */
  at: { x: number; y: number };
  /** Narrows the offered definitions, for example to those accepting a dragged wire. */
  accept?: (spec: MaterialXNodeSpec) => boolean;
  placeholder?: string;
  onAdd: (spec: NodeDefinition) => void;
  onClose: () => void;
}
const LIMIT = 12;
function filterTree(entries: NodeCatalogEntry[], accept: (spec: MaterialXNodeSpec) => boolean): NodeCatalogEntry[] {
  return entries.flatMap((entry): NodeCatalogEntry[] => {
    if (entry.kind === 'node') return accept(entry.node) ? [entry] : [];
    const children = filterTree(entry.children, accept);
    return children.length ? [{ ...entry, children }] : [];
  });
}
/** Searchable, category-browsable node insertion at the cursor. Enter adds or drills in, Escape closes. */
export function QuickAddMenu({ catalog, at, accept = () => true, placeholder, onAdd, onClose }: QuickAddMenuProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [path, setPath] = useState<string[]>([]);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  // A popover opened by a gesture takes focus so typing starts immediately.
  useEffect(() => input.current?.focus(), []);
  const tree = useMemo(() => filterTree(buildNodeCatalogTree(catalog), accept), [catalog, accept]);
  const search = query.trim();
  let group: NodeCatalogEntry | undefined;
  let level = tree;
  for (const id of path) {
    group = level.find((entry) => entry.kind === 'group' && entry.id === id);
    if (group?.kind !== 'group') break;
    level = group.children;
  }
  const entries = search ? searchNodeCatalog(catalog, search, accept).slice(0, LIMIT) : level;
  const index = Math.min(active, Math.max(0, entries.length - 1));
  const back = () => {
    setPath(path.slice(0, -1));
    setActive(0);
  };
  const choose = (position: number) => {
    const entry = entries[position];
    if (!entry) return;
    if (entry.kind === 'node') onAdd(entry.node);
    else {
      setPath([...path, entry.id]);
      setActive(0);
    }
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
          else if (event.key === 'Backspace' && !query && path.length) back();
          else if (event.key === 'Escape') onClose();
          else return;
          event.preventDefault();
          event.stopPropagation();
        }}
      />
      {!search && path.length > 0 && (
        <button
          type="button"
          className="mtlx-quick-add-back"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={back}
        >
          <ChevronLeft size={14} aria-hidden="true" />
          {group?.kind === 'group' ? group.label : 'Back'}
        </button>
      )}
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
              {entry.kind === 'node' ? (
                <small>{entry.node.nodeGroup}</small>
              ) : (
                <ChevronRight size={14} aria-hidden="true" />
              )}
            </button>
          </li>
        ))}
        {!entries.length && <li>No matching nodes</li>}
      </ul>
    </div>
  );
}

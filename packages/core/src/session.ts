import { cloneMaterialXDocument, serializeMaterialX } from './xml.js';
import { validateDocument } from './validate.js';
import type {
  DeepReadonly,
  MaterialXDocument,
  MaterialXElement,
  MaterialXNodeSpec,
  ReadonlyMaterialXDocument,
} from './types.js';
import {
  addNode,
  cloneNode,
  connectNodes,
  disconnectInput,
  getNodeCatalog,
  graphScopes,
  groupNodes,
  materializeDocument,
  setInterfacePort,
  structuralSpecs,
  moveNodes,
  pasteNodes,
  readGraph,
  removeNodes,
  renameNode,
  resetInput,
  resolveTypes,
  setInputValue,
  type GraphConnection,
  type GraphNode,
  type Point,
} from './editing.js';

export type { DeepReadonly, ReadonlyMaterialXDocument } from './types.js';
export type InputValue = string | number | boolean | readonly number[];
export interface OutputRef {
  node: string;
  output: string;
}
export interface InputRef {
  node: string;
  input: string;
}
export interface EditorDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly scope?: string;
  readonly node?: string;
  readonly input?: string;
}
export class EditorError extends Error {
  readonly code: string;
  readonly scope?: string;
  readonly node?: string;
  readonly input?: string;
  constructor(diagnostic: EditorDiagnostic) {
    super(diagnostic.message);
    this.name = 'EditorError';
    this.code = diagnostic.code;
    this.scope = diagnostic.scope;
    this.node = diagnostic.node;
    this.input = diagnostic.input;
  }
}
export interface EditorSnapshot {
  readonly document: ReadonlyMaterialXDocument;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Whether the document differs from the one last loaded or marked clean. */
  readonly dirty: boolean;
  readonly undoLabel?: string;
  readonly redoLabel?: string;
}
export interface EditorSessionOptions {
  document: ReadonlyMaterialXDocument;
  /** A complete catalog; otherwise derive it from the document and standard registry. */
  catalog?: DeepReadonly<MaterialXNodeSpec[]>;
  historyLimit?: number;
}

/** Freeze stored data without evaluating the document's derived-view getters. */
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value)))
      if ('value' in descriptor) freeze(descriptor.value);
    Object.freeze(value);
  }
  return value;
}
const sameDocument = (a: MaterialXDocument, b: MaterialXDocument) =>
  a === b || JSON.stringify([a.attributes, a.elements]) === JSON.stringify([b.attributes, b.elements]);
const asEditorError = (error: unknown, scope?: string) =>
  error instanceof EditorError
    ? error
    : new EditorError({
        code: 'INVALID_OPERATION',
        message: error instanceof Error ? error.message : String(error),
        scope,
      });

const connection = (source: OutputRef, target: InputRef): GraphConnection => ({
  source: source.node,
  sourceHandle: source.output,
  target: target.node,
  targetHandle: target.input,
});

/** Headless editing state. Only successful commits publish immutable snapshots. */
export class EditorSession {
  private current: MaterialXDocument;
  private clean: MaterialXDocument;
  private readonly suppliedCatalog?: MaterialXNodeSpec[];
  private readonly historyLimit: number;
  private past: { document: MaterialXDocument; label: string; merge?: string }[] = [];
  private future: { document: MaterialXDocument; label: string }[] = [];
  private listeners = new Set<() => void>();
  private depth = 0;
  private snapshot: EditorSnapshot;
  private specViews = new WeakMap<MaterialXNodeSpec, DeepReadonly<MaterialXNodeSpec>>();
  private catalogViews = new WeakMap<MaterialXNodeSpec[], DeepReadonly<MaterialXNodeSpec[]>>();
  // Private member types vanish from declaration output, so the cache is typed at the read.
  private graphs = new Map<string, unknown>();
  private diagnosticCache = new WeakMap<MaterialXDocument, readonly EditorDiagnostic[]>();

  constructor(options: EditorSessionOptions) {
    const limit = options.historyLimit ?? 50;
    if (!Number.isInteger(limit) || limit < 0)
      throw new EditorError({ code: 'INVALID_ARGUMENT', message: 'historyLimit must be a nonnegative integer.' });
    this.historyLimit = limit;
    this.current = freeze(cloneMaterialXDocument(options.document));
    this.clean = this.current;
    this.suppliedCatalog = options.catalog
      ? freeze(structuredClone(options.catalog) as MaterialXNodeSpec[])
      : undefined;
    this.snapshot = this.makeSnapshot();
  }
  private catalog() {
    return this.suppliedCatalog ?? getNodeCatalog(this.current);
  }
  /** Reads inside a transaction see its working snapshot. Subscribers see getSnapshot(). */
  getDocument = (): ReadonlyMaterialXDocument => this.current;
  getCatalog(): DeepReadonly<MaterialXNodeSpec[]> {
    const catalog = this.catalog();
    let view = this.catalogViews.get(catalog);
    if (!view) {
      // Standard definitions are shared across documents. Copy each definition once,
      // rather than retaining another complete registry for every undo snapshot.
      view = Object.freeze(
        catalog.map((spec) => {
          let copy = this.specViews.get(spec);
          if (!copy) {
            copy = freeze(structuredClone(spec));
            this.specViews.set(spec, copy);
          }
          return copy;
        }),
      );
      this.catalogViews.set(catalog, view);
    }
    return view;
  }
  getSnapshot = (): EditorSnapshot => this.snapshot;
  toXml = (): string => serializeMaterialX(this.current);
  /** Treat the current document as saved; `dirty` clears until the next edit. */
  markClean() {
    this.outsideTransaction();
    this.clean = this.current;
    this.publish();
  }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private makeSnapshot(): EditorSnapshot {
    return Object.freeze({
      document: this.current,
      canUndo: !!this.past.length,
      canRedo: !!this.future.length,
      dirty: this.current !== this.clean,
      undoLabel: this.past.at(-1)?.label,
      redoLabel: this.future.at(-1)?.label,
    });
  }
  private publish() {
    this.snapshot = this.makeSnapshot();
    // Snapshot the listeners so subscriptions created during notification wait for the next commit.
    // oxlint-disable-next-line unicorn/no-useless-spread
    for (const listener of [...this.listeners]) {
      // A subscriber failure must not turn an already committed edit into a rejected operation.
      try {
        listener();
      } catch (error) {
        console.error('Editor subscriber failed:', error);
      }
    }
  }
  /** Consecutive commits sharing a merge key (one slider drag, one typing session) form a single history entry. */
  private record(before: MaterialXDocument, label: string, merge?: string) {
    if (this.historyLimit && !(merge && this.past.at(-1)?.merge === merge))
      this.past = [...this.past, { document: before, label, merge }].slice(-this.historyLimit);
    this.future = [];
    this.publish();
  }
  /** Synchronous transactions support nested savepoints; an uncaught error rolls back the enclosing transaction. */
  transaction<T>(label: string, operation: () => T extends PromiseLike<unknown> ? never : T): T {
    const before = this.current;
    this.depth++;
    let result: T;
    try {
      result = operation();
      if (result && typeof (result as { then?: unknown }).then === 'function')
        throw new EditorError({ code: 'ASYNC_TRANSACTION', message: 'Transactions must be synchronous.' });
    } catch (error) {
      this.current = before;
      throw asEditorError(error);
    } finally {
      this.depth--;
    }
    if (sameDocument(before, this.current)) this.current = before;
    else if (!this.depth) this.record(before, label);
    return result;
  }
  private outsideTransaction() {
    if (this.depth)
      throw new EditorError({
        code: 'TRANSACTION_ACTIVE',
        message: 'Cannot replace the document or travel history inside a transaction.',
      });
  }
  /** Loading a document accepts existing diagnostics and clears undo/redo. Input ownership stays with the caller. */
  replaceDocument(document: ReadonlyMaterialXDocument) {
    this.outsideTransaction();
    this.current = freeze(cloneMaterialXDocument(document));
    this.clean = this.current;
    this.past = [];
    this.future = [];
    this.publish();
  }
  undo = () => {
    this.outsideTransaction();
    const entry = this.past.pop();
    if (!entry) return;
    this.future.push({ document: this.current, label: entry.label });
    this.current = entry.document;
    this.publish();
  };
  redo = () => {
    this.outsideTransaction();
    const entry = this.future.pop();
    if (!entry) return;
    this.past.push({ document: this.current, label: entry.label });
    this.current = entry.document;
    this.publish();
  };
  private diagnostics(document: MaterialXDocument): readonly EditorDiagnostic[] {
    const cached = this.diagnosticCache.get(document);
    if (cached) return cached;
    const catalog = this.suppliedCatalog ?? getNodeCatalog(document);
    const issues: EditorDiagnostic[] = validateDocument(materializeDocument(document, catalog), {
      registry: catalog,
      rules: ['structure', 'types'],
    })
      .filter((issue) => issue.level === 'error')
      .map((issue) => ({
        code: issue.code ?? 'INVALID_DOCUMENT',
        message: `${issue.location}: ${issue.message}`,
        scope: issue.graph?.scope,
        node: issue.graph?.nodeIds[0],
        input: issue.graph?.input,
      }));
    for (const conflict of resolveTypes(document, catalog).conflicts)
      for (const node of conflict.nodeIds)
        issues.push({
          code: 'TYPE_CONFLICT',
          scope: conflict.scope,
          node,
          message: `${conflict.scope || 'Root graph'}/${node}: No compatible node definitions satisfy the connections and authored values.`,
        });
    const result = freeze(issues);
    this.diagnosticCache.set(document, result);
    return result;
  }
  getDiagnostics(): readonly EditorDiagnostic[] {
    return this.diagnostics(this.current);
  }
  private validate(next: MaterialXDocument) {
    // Imported errors may remain while users repair them. Reject newly introduced errors anywhere,
    // including dependencies outside the visible graph.
    const existing = new Set(this.diagnostics(this.current).map((issue) => JSON.stringify(issue)));
    const introduced = this.diagnostics(next).find((issue) => !existing.has(JSON.stringify(issue)));
    if (introduced) throw new EditorError(introduced);
  }
  private apply(label: string, operation: () => MaterialXDocument, validate = true, merge?: string) {
    let next: MaterialXDocument;
    try {
      next = operation();
      if (sameDocument(this.current, next)) return;
      if (validate) this.validate(next);
    } catch (error) {
      throw asEditorError(error);
    }
    const before = this.current;
    this.current = freeze(next);
    if (!this.depth) this.record(before, label, merge);
  }
  listScopes(): readonly string[] {
    return Object.freeze(graphScopes(this.current));
  }
  private assertScope(scope: string) {
    if (!graphScopes(this.current).includes(scope))
      throw new EditorError({ code: 'UNKNOWN_GRAPH', scope, message: `Unknown graph: ${scope}` });
  }
  private projection(scope: string) {
    this.assertScope(scope);
    return readGraph(this.current, scope, this.catalog());
  }
  private node(scope: string, id: string): GraphNode {
    const node = this.projection(scope).nodes.find((candidate) => candidate.id === id);
    if (!node)
      throw new EditorError({
        code: 'UNKNOWN_NODE',
        scope,
        node: id,
        message: `Unknown node: ${scope ? scope + '/' : ''}${id}`,
      });
    return node;
  }
  private input(scope: string, id: string, input: string) {
    const port = this.node(scope, id).inputs.find((candidate) => candidate.name === input);
    if (!port)
      throw new EditorError({
        code: 'UNKNOWN_INPUT',
        scope,
        node: id,
        input,
        message: `Unknown input: ${id}.${input}`,
      });
    return port;
  }
  /** Positions remain a separate view operation, but share atomic commits and undo history. */
  readonly layout = {
    moveNodes: (positions: Readonly<Record<string, Point>>, scope = '') => {
      this.assertScope(scope);
      for (const [id, point] of Object.entries(positions)) {
        this.node(scope, id);
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y))
          throw new EditorError({
            code: 'INVALID_POSITION',
            scope,
            node: id,
            message: `Position for ${id} must contain finite x and y coordinates.`,
          });
      }
      this.apply('Move nodes', () => moveNodes(this.current, positions, scope), false);
    },
  };
  /** Graph handles resolve against current state, so they remain useful across commits and undo. */
  graph(scope = '') {
    this.assertScope(scope);
    let graph = this.graphs.get(scope) as ReturnType<typeof this.createGraph> | undefined;
    if (!graph) {
      graph = this.createGraph(scope);
      this.graphs.set(scope, graph);
    }
    return graph;
  }
  private createGraph(scope: string) {
    const proposeConnection = (source: OutputRef, target: InputRef) => {
      this.input(scope, target.node, target.input);
      if (!this.node(scope, source.node).outputs.some((port) => port.name === source.output))
        throw new EditorError({
          code: 'UNKNOWN_OUTPUT',
          scope,
          node: source.node,
          message: `Unknown output: ${source.node}.${source.output}`,
        });
      try {
        return connectNodes(this.current, connection(source, target), scope, this.catalog());
      } catch (error) {
        throw new EditorError({
          code: 'INVALID_CONNECTION',
          scope,
          node: target.node,
          input: target.input,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };
    const readConnection = (target: InputRef): Readonly<OutputRef> | undefined => {
      this.input(scope, target.node, target.input);
      const node = this.node(scope, target.node);
      const attrs = (
        node.element.name === 'output'
          ? node.element
          : node.element.children.find(
              (port) => ['input', 'parameter'].includes(port.name) && port.attributes.name === target.input,
            )
      )?.attributes;
      const source = attrs?.nodename ?? attrs?.nodegraph ?? attrs?.interfacename;
      return source === undefined ? undefined : Object.freeze({ node: source, output: attrs?.output ?? 'out' });
    };
    return Object.freeze({
      scope,
      listNodes: (): DeepReadonly<GraphNode[]> => freeze(structuredClone(this.projection(scope).nodes)),
      getNode: (id: string): DeepReadonly<GraphNode> => freeze(structuredClone(this.node(scope, id))),
      getInputs: (id: string) =>
        freeze(structuredClone(this.node(scope, id).inputs)) as DeepReadonly<GraphNode['inputs']>,
      getOutputs: (id: string) =>
        freeze(structuredClone(this.node(scope, id).outputs)) as DeepReadonly<GraphNode['outputs']>,
      getConnection: readConnection,
      addNode: ({ definition }: { definition: string }): string => {
        this.assertScope(scope);
        const spec =
          this.catalog().find((candidate) => candidate.nodeDefName === definition) ??
          structuralSpecs.find((candidate) => candidate.nodeDefName === definition);
        if (!spec)
          throw new EditorError({
            code: 'UNKNOWN_DEFINITION',
            scope,
            message: `Unknown node definition: ${definition}`,
          });
        const ids = new Set(this.projection(scope).nodes.map((node) => node.id));
        let id = '';
        this.apply('Add node', () => {
          const next = addNode(this.current, spec, undefined, scope);
          id = readGraph(next, scope, this.catalog()).nodes.find((node) => !ids.has(node.id))!.id;
          return next;
        });
        return id;
      },
      cloneNode: (id: string): string => {
        this.node(scope, id);
        const ids = new Set(this.projection(scope).nodes.map((node) => node.id));
        let cloned = '';
        this.apply('Clone node', () => {
          const next = cloneNode(this.current, id, undefined, scope);
          cloned = readGraph(next, scope, this.catalog()).nodes.find((node) => !ids.has(node.id))!.id;
          return next;
        });
        return cloned;
      },
      /** Insert copies of node elements (for example from the clipboard) and return their ids. */
      pasteNodes: (elements: readonly MaterialXElement[], offset?: Point): string[] => {
        this.assertScope(scope);
        const ids = new Set(this.projection(scope).nodes.map((node) => node.id));
        let created: string[] = [];
        try {
          this.apply('Paste nodes', () => {
            const next = pasteNodes(this.current, elements, scope, offset);
            created = readGraph(next, scope, this.catalog())
              .nodes.filter((node) => !ids.has(node.id))
              .map((node) => node.id);
            return next;
          });
        } catch (error) {
          if (error instanceof EditorError) throw error;
          throw new EditorError({
            code: 'INVALID_ARGUMENT',
            scope,
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return created;
      },
      removeNodes: (ids: readonly string[]) => {
        this.assertScope(scope);
        for (const id of ids) this.node(scope, id);
        this.apply('Delete nodes', () => removeNodes(this.current, [...ids], scope));
      },
      /** Collapse root-scope nodes into a new node graph and return its id. Boundary wires become interface ports. */
      groupNodes: (ids: readonly string[]): string => {
        if (scope) throw new EditorError({ code: 'INVALID_ARGUMENT', scope, message: 'Node graphs cannot be nested.' });
        for (const id of ids) this.node(scope, id);
        const before = new Set(this.projection(scope).nodes.map((node) => node.id));
        let created = '';
        this.apply('Group nodes', () => {
          const next = groupNodes(this.current, [...ids], this.catalog());
          created = readGraph(next, scope, this.catalog()).nodes.find((node) => !before.has(node.id))!.id;
          return next;
        });
        return created;
      },
      renameNode: (id: string, name: string) => {
        this.node(scope, id);
        try {
          this.apply('Rename node', () => renameNode(this.current, id, name, scope));
        } catch (error) {
          throw new EditorError({
            code: 'INVALID_NAME',
            scope,
            node: id,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      },
      /** Retype or default an interface input/output node inside a node graph. */
      setInterfacePort: (id: string, changes: { type?: string; value?: string }) => {
        this.node(scope, id);
        this.apply('Edit interface port', () => setInterfacePort(this.current, id, changes, scope));
      },
      setInputValue: (
        id: string,
        input: string,
        value: InputValue,
        options: {
          type?: string;
          /** Opaque gesture token; equal tokens merge into one undo entry. */ merge?: string;
        } = {},
      ) => {
        this.input(scope, id, input);
        if (
          !(
            typeof value === 'string' ||
            typeof value === 'boolean' ||
            (typeof value === 'number' && Number.isFinite(value)) ||
            (Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item)))
          )
        )
          throw new EditorError({
            code: 'INVALID_VALUE',
            scope,
            node: id,
            input,
            message: `Invalid value for ${id}.${input}. Expected text, a finite number, a boolean, or an array of finite numbers.`,
          });
        this.apply(
          'Set input value',
          () => {
            const next = setInputValue(
              this.current,
              id,
              input,
              Array.isArray(value) ? value.join(', ') : String(value),
              scope,
              this.catalog(),
              options.type,
            );
            const invalid = this.diagnostics(next).find(
              (issue) =>
                issue.code === 'INVALID_VALUE' && issue.scope === scope && issue.node === id && issue.input === input,
            );
            if (invalid) throw new EditorError(invalid);
            return next;
          },
          true,
          options.merge === undefined ? undefined : JSON.stringify([scope, id, input, options.merge]),
        );
      },
      resetInput: (id: string, input: string) => {
        this.input(scope, id, input);
        this.apply('Reset input', () => resetInput(this.current, id, input, scope));
      },
      disconnectInput: (id: string, input: string) => {
        this.input(scope, id, input);
        if (!readConnection({ node: id, input })) return;
        this.apply('Disconnect input', () => disconnectInput(this.current, id, input, scope));
      },
      checkConnection: (source: OutputRef, target: InputRef): EditorDiagnostic | undefined => {
        try {
          this.validate(proposeConnection(source, target));
          return undefined;
        } catch (error) {
          const issue = asEditorError(error, scope);
          return Object.freeze({
            code: issue.code ?? 'INVALID_DOCUMENT',
            message: issue.message,
            scope: issue.scope,
            node: issue.node,
            input: issue.input,
          });
        }
      },
      connect: (source: OutputRef, target: InputRef) => {
        this.apply('Connect nodes', () => proposeConnection(source, target));
      },
    });
  }
}
export type EditorGraph = ReturnType<EditorSession['graph']>;
export const createEditorSession = (options: EditorSessionOptions) => new EditorSession(options);

// Headless graph operations and type queries. No canvas projection or renderer preparation.
export {
  addNode,
  cloneNode,
  connectNodes,
  connectionError,
  disconnectInput,
  getNodeCatalog,
  graphScopes,
  moveNodes,
  nonNodes,
  readGraph,
  pasteNodes,
  removeNodes,
  renameNode,
  resetInput,
  setInputValue,
  setInterfacePort,
  structuralSpecs,
  isStructural,
  groupNodes,
  type GraphConnection,
  type GraphNode,
  type GraphEdge,
  type Point,
} from './editing.js';
export {
  resolveTypes,
  materializeDocument,
  invalidateTypeResolution,
  resolutionKey,
  type ResolvedNode,
  type TypeResolution,
} from './type-resolution.js';
export { getNodeFamilies, findNodeFamily, type NodeFamily } from './node-families.js';

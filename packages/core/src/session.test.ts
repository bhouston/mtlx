import { describe, expect, it, vi } from 'vitest';
import { cloneMaterialXDocument, parseMaterialX, serializeMaterialX } from './xml.js';
import { createEditorSession, EditorError } from './session.js';
import type { MaterialXDocument } from './types.js';

function createDefaultDocument(): MaterialXDocument {
  return parseMaterialX(
    '<materialx version="1.39"><standard_surface name="surface" type="surfaceshader" xpos="0" ypos="0"><input name="base_color" type="color3" value="0.8, 0.25, 0.08"/><input name="specular_roughness" type="float" value="0.3"/></standard_surface><surfacematerial name="material" type="material" xpos="350" ypos="0"><input name="surfaceshader" type="surfaceshader" nodename="surface"/></surfacematerial></materialx>',
  );
}

const create = () => createEditorSession({ document: createDefaultDocument() });
const empty = () => createEditorSession({ document: parseMaterialX('<materialx version="1.39"/>') });

describe('renaming nodes', () => {
  it('rewrites sibling wires and nested graph references', () => {
    const session = createEditorSession({
      document: parseMaterialX(
        '<materialx version="1.39"><nodegraph name="graph"><constant name="c" type="color3"/><output name="out" type="color3" nodename="c"/></nodegraph><standard_surface name="surface" type="surfaceshader"><input name="base_color" type="color3" nodegraph="graph"/></standard_surface><surfacematerial name="material" type="material"><input name="surfaceshader" type="surfaceshader" nodename="surface"/></surfacematerial><look name="look"><materialassign name="assign" material="material" geom="/"/></look></materialx>',
      ),
    });
    session.graph('graph').renameNode('c', 'tint');
    session.graph().renameNode('graph', 'colors');
    session.graph().renameNode('material', 'gold');
    const xml = serializeMaterialX(session.getDocument());
    expect(xml).toContain('<output name="out" type="color3" nodename="tint"');
    expect(xml).toContain('nodegraph="colors"');
    expect(xml).toContain('material="gold"');
    expect(session.getSnapshot().undoLabel).toBe('Rename node');
    session.undo();
    session.undo();
    session.undo();
    expect(serializeMaterialX(session.getDocument())).toContain('nodename="c"');
  });
  it('rejects invalid and duplicate names without committing', () => {
    const session = create();
    expect(() => session.graph().renameNode('surface', '1bad')).toThrow(EditorError);
    expect(() => session.graph().renameNode('surface', 'material')).toThrow(/already exists/);
    expect(session.getSnapshot().canUndo).toBe(false);
  });
});
describe('immutable editing session', () => {
  it('merges commits that share a gesture token into one undo entry', () => {
    const session = create();
    const graph = session.graph();
    graph.setInputValue('surface', 'specular_roughness', 0.4, { merge: 'drag-1' });
    graph.setInputValue('surface', 'specular_roughness', 0.5, { merge: 'drag-1' });
    graph.setInputValue('surface', 'specular_roughness', 0.6, { merge: 'drag-1' });
    graph.setInputValue('surface', 'specular_roughness', 0.9, { merge: 'drag-2' });
    graph.setInputValue('surface', 'base', 0.5, { merge: 'drag-2' });
    expect(session.getSnapshot().canUndo).toBe(true);
    session.undo();
    expect(serializeMaterialX(session.getDocument())).toContain('specular_roughness" type="float" value="0.9"');
    session.undo();
    expect(serializeMaterialX(session.getDocument())).toContain('value="0.6"');
    session.undo();
    expect(serializeMaterialX(session.getDocument())).toContain('value="0.3"');
    expect(session.getSnapshot().canUndo).toBe(false);
  });
  it('owns its input and publishes deeply frozen snapshots, including query results', () => {
    const input = createDefaultDocument();
    const session = createEditorSession({ document: input });
    const before = session.getDocument();
    input.elements[0]!.attributes.name = 'outside';
    expect(before.elements[0]!.attributes.name).toBe('surface');
    expect(() => Object.assign(before.elements[0]!.attributes, { name: 'bad' })).toThrow();
    expect(() => Object.assign(before.elements, { 0: {} })).toThrow();
    const node = session.graph().getNode('surface');
    expect(() => Object.assign(node.inputs[0]!, { value: 'bad' })).toThrow();
    session.graph().setInputValue('surface', 'specular_roughness', 0.5);
    expect(session.getDocument()).not.toBe(before);
    expect(serializeMaterialX(before)).not.toContain('value="0.5"');
    expect(serializeMaterialX(session.getDocument())).toContain('value="0.5"');
    const detached = cloneMaterialXDocument(session.getDocument());
    detached.elements[0]!.attributes.name = 'copy';
    expect(session.graph().getNode('surface').id).toBe('surface');
  });

  it('builds a graph in one transaction, returns identifiers, and undoes/redoes exact snapshots', () => {
    const session = empty();
    const graph = session.graph();
    const before = session.getSnapshot();
    const listener = vi.fn();
    session.subscribe(listener);
    const output = session.transaction('Build multiplier', () => {
      const color = graph.addNode({ definition: 'ND_constant_color3' });
      const multiply = graph.addNode({ definition: 'ND_multiply_color3' });
      graph.setInputValue(color, 'value', [0.8, 0.2, 0.1], { type: 'color3' });
      graph.connect({ node: color, output: 'out' }, { node: multiply, input: 'in1' });
      expect(session.getSnapshot()).toBe(before);
      expect(graph.listNodes()).toHaveLength(2);
      return multiply;
    });
    const after = session.getDocument();
    expect(graph.getConnection({ node: output, input: 'in1' })).toEqual({ node: 'constant', output: 'out' });
    expect(
      after.elements.every((node) => node.attributes.xpos === undefined && node.attributes.ypos === undefined),
    ).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().undoLabel).toBe('Build multiplier');
    session.undo();
    expect(session.getDocument()).toBe(before.document);
    expect(session.getSnapshot().canUndo).toBe(false);
    session.redo();
    expect(session.getDocument()).toBe(after);
  });

  it('rolls back an entire failed transaction without notifying or losing redo', () => {
    const session = create();
    session.graph().setInputValue('surface', 'specular_roughness', 0.5);
    session.undo();
    const before = session.getSnapshot();
    const listener = vi.fn();
    session.subscribe(listener);
    expect(() =>
      session.transaction('Broken script', () => {
        session.graph().addNode({ definition: 'ND_constant_float' });
        session.layout.moveNodes({ surface: { x: 20, y: 40 } });
        session.graph().setInputValue('surface', 'specular_roughness', 'bad');
      }),
    ).toThrow(EditorError);
    expect(session.getSnapshot()).toBe(before);
    expect(session.getDocument()).toBe(before.document);
    expect(listener).not.toHaveBeenCalled();
    session.redo();
    expect(serializeMaterialX(session.getDocument())).toContain('value="0.5"');
  });

  it('supports nested savepoints and ignores transactions with no net change', () => {
    const session = create();
    const before = session.getSnapshot();
    session.transaction('No change', () => {
      const id = session.graph().addNode({ definition: 'ND_constant_float' });
      session.graph().removeNodes([id]);
    });
    expect(session.getSnapshot()).toBe(before);
    session.transaction('Outer', () => {
      session.graph().setInputValue('surface', 'specular_roughness', 0.4);
      expect(() =>
        session.transaction('Inner', () => {
          session.graph().removeNodes(['material']);
          throw new Error('Abort inner');
        }),
      ).toThrow('Abort inner');
      expect(session.graph().getNode('material')).toBeDefined();
    });
    expect(session.getSnapshot().undoLabel).toBe('Outer');
    session.undo();
    expect(session.getDocument()).toBe(before.document);
  });

  it('rejects async callbacks before they run and history travel during transactions', () => {
    const session = create();
    const run = vi.fn();
    // JS callers also get an explicit runtime rejection.
    expect(() =>
      session.transaction('Async', (async () => {
        run();
      }) as never),
    ).toThrow('synchronous');
    expect(run).not.toHaveBeenCalled();
    expect(() => session.transaction('Undo', () => session.undo())).toThrow('inside a transaction');
    expect(() => session.transaction('Load', () => session.replaceDocument(createDefaultDocument()))).toThrow(
      'inside a transaction',
    );
  });

  it('bounds history, ignores no-op edits, unsubscribes, and clears redo on new edits', () => {
    const session = createEditorSession({ document: createDefaultDocument(), historyLimit: 2 });
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);
    const graph = session.graph();
    for (const value of [0.1, 0.2, 0.3]) graph.setInputValue('surface', 'specular_roughness', value);
    const snapshot = session.getSnapshot();
    graph.setInputValue('surface', 'specular_roughness', 0.3);
    graph.removeNodes([]);
    expect(session.getSnapshot()).toBe(snapshot);
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
    session.undo();
    session.undo();
    session.undo();
    expect(session.getSnapshot().canUndo).toBe(false);
    expect(serializeMaterialX(session.getDocument())).toContain('value="0.1"');
    graph.setInputValue('surface', 'specular_roughness', 0.9);
    expect(session.getSnapshot().canRedo).toBe(false);
    expect(listener).toHaveBeenCalledTimes(3);
    session.replaceDocument(createDefaultDocument());
    expect(session.getSnapshot().canUndo).toBe(false);
    expect(session.getSnapshot().canRedo).toBe(false);
  });
});

describe('shared editing validation and queries', () => {
  it('rejects invalid values, identifiers, definitions and positions without changing snapshots', () => {
    const session = create();
    const graph = session.graph();
    const before = session.getSnapshot();
    const operations = [
      () => graph.setInputValue('surface', 'specular_roughness', 'banana'),
      () => graph.setInputValue('surface', 'base_color', [1, 2], { type: 'color3' }),
      () => graph.setInputValue('surface', 'specular_roughness', Infinity),
      () => graph.setInputValue('surface', 'no_such_input', 1),
      () => graph.resetInput('surface', 'no_such_input'),
      () => graph.disconnectInput('surface', 'no_such_input'),
      () => graph.removeNodes(['surface', 'missing']),
      () => graph.addNode({ definition: 'does_not_exist' }),
      () => session.graph('missing'),
      () => session.layout.moveNodes({ surface: { x: NaN, y: 0 } }),
    ];
    for (const operation of operations) {
      expect(operation).toThrow(EditorError);
      expect(session.getSnapshot()).toBe(before);
    }
    try {
      graph.setInputValue('surface', 'specular_roughness', 'banana');
    } catch (error) {
      expect(error).toMatchObject({ code: 'INVALID_VALUE', node: 'surface', input: 'specular_roughness' });
    }
  });

  it('uses identical checks for preview and connection commit, including cycles and wrong sockets', () => {
    const session = empty();
    const graph = session.graph();
    const a = graph.addNode({ definition: 'ND_add_float' });
    const b = graph.addNode({ definition: 'ND_add_float' });
    graph.connect({ node: a, output: 'out' }, { node: b, input: 'in1' });
    for (const [source, target] of [
      [
        { node: b, output: 'out' },
        { node: a, input: 'in1' },
      ],
      [
        { node: a, output: 'missing' },
        { node: b, input: 'in1' },
      ],
      [
        { node: a, output: 'out' },
        { node: b, input: 'missing' },
      ],
    ] as const) {
      const before = session.getSnapshot();
      const issue = graph.checkConnection(source, target);
      expect(issue).toBeDefined();
      expect(() => graph.connect(source, target)).toThrow(issue!.message);
      expect(session.getSnapshot()).toBe(before);
    }
  });

  it('replaces connections and values explicitly, resets defaults and cleans deleted sources', () => {
    const session = create();
    const graph = session.graph();
    const a = graph.addNode({ definition: 'ND_constant_float' });
    const b = graph.cloneNode(a);
    const input = { node: 'surface', input: 'specular_roughness' };
    graph.setInputValue('surface', input.input, 0.5);
    graph.connect({ node: a, output: 'out' }, input);
    graph.connect({ node: b, output: 'out' }, input);
    expect(graph.getConnection(input)).toEqual({ node: b, output: 'out' });
    graph.removeNodes([b]);
    expect(graph.getConnection(input)).toBeUndefined();
    graph.connect({ node: a, output: 'out' }, input);
    graph.setInputValue('surface', input.input, 0.3);
    const unconnected = session.getSnapshot();
    graph.disconnectInput('surface', input.input);
    expect(session.getSnapshot()).toBe(unconnected);
    expect(graph.getConnection(input)).toBeUndefined();
    graph.resetInput('surface', input.input);
    expect(graph.getNode('surface').element.children.some((port) => port.attributes.name === input.input)).toBe(false);
  });

  it('keeps same-named nodes isolated by graph scope and reports stale scopes', () => {
    const session = createEditorSession({
      document: parseMaterialX('<materialx version="1.39"><nodegraph name="a"/><nodegraph name="b"/></materialx>'),
    });
    const a = session.graph('a');
    const b = session.graph('b');
    expect(a.addNode({ definition: 'ND_constant_float' })).toBe(b.addNode({ definition: 'ND_constant_float' }));
    a.setInputValue('constant', 'value', 0.7, { type: 'float' });
    expect(b.getNode('constant').element.children).toHaveLength(0);
    expect(session.listScopes()).toEqual(['', 'a', 'b']);
    expect(a.getInputs('constant').map((port) => port.name)).toContain('value');
    expect(a.getOutputs('constant').map((port) => port.name)).toContain('out');
    session.graph().removeNodes(['a']);
    expect(() => a.listNodes()).toThrow('Unknown graph');
  });

  it('accepts broken imports and allows incremental repair and unrelated edits', () => {
    const document = parseMaterialX(
      '<materialx version="1.39"><standard_surface name="surface" type="surfaceshader"><input name="base_color" type="color3" value="1,0"/><input name="specular_roughness" type="float" value="bad"/></standard_surface></materialx>',
    );
    const session = createEditorSession({ document });
    expect(session.getDiagnostics().length).toBeGreaterThan(0);
    session.graph().addNode({ definition: 'ND_constant_float' });
    session.graph().setInputValue('surface', 'base_color', [0.8, 0.2, 0.1], { type: 'color3' });
    session.graph().setInputValue('surface', 'specular_roughness', 0.3);
    expect(session.getDiagnostics()).toEqual([]);
  });

  it('groups creation and separate layout into one undo entry and preserves unrelated XML', () => {
    const session = createEditorSession({
      document: parseMaterialX('<materialx version="1.39"><!--keep--><look name="look" custom="keep"/></materialx>'),
    });
    const before = session.getDocument();
    session.transaction('Place node', () => {
      const id = session.graph().addNode({ definition: 'ND_constant_float' });
      session.layout.moveNodes({ [id]: { x: 120, y: 80 } });
    });
    expect(session.graph().getNode('constant').element.attributes).toMatchObject({ xpos: '120', ypos: '80' });
    expect(session.graph().getNode('constant')).not.toHaveProperty('position');
    expect(serializeMaterialX(session.getDocument())).toContain('<!--keep-->');
    expect(serializeMaterialX(session.getDocument())).toContain('custom="keep"');
    session.undo();
    expect(session.getDocument()).toBe(before);
  });
});

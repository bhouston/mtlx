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

  it('rejects async callbacks and history travel during transactions', () => {
    const session = create();
    const before = session.getDocument();
    // JS callers also get an explicit runtime rejection; the rejected edit is rolled back.
    expect(() =>
      session.transaction('Async', (async () => {
        session.graph().setInputValue('surface', 'specular_roughness', 0.9);
      }) as never),
    ).toThrow('synchronous');
    expect(session.getDocument()).toBe(before);
    expect(() => session.transaction('Undo', () => session.undo())).toThrow('inside a transaction');
    expect(() => session.transaction('Load', () => session.replaceDocument(createDefaultDocument()))).toThrow(
      'inside a transaction',
    );
  });

  it('tracks dirty state through edits, undo, markClean and reload, and serializes XML', () => {
    const session = create();
    expect(session.getSnapshot().dirty).toBe(false);
    session.graph().setInputValue('surface', 'specular_roughness', 0.9);
    expect(session.getSnapshot().dirty).toBe(true);
    expect(session.toXml()).toContain('value="0.9"');
    session.undo();
    expect(session.getSnapshot().dirty).toBe(false);
    session.redo();
    session.markClean();
    expect(session.getSnapshot().dirty).toBe(false);
    session.replaceDocument(createDefaultDocument());
    expect(session.getSnapshot().dirty).toBe(false);
    expect(session.graph()).toBe(session.graph());
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
  it('types an untyped value from the node’s own nodedef when candidates are ambiguous', () => {
    const session = empty();
    const graph = session.graph();
    const multiply = graph.addNode({ definition: 'ND_multiply_float' });
    const fractal = graph.addNode({ definition: 'ND_fractal3d_float' });
    // Nothing constrains these polymorphic nodes yet, so the first catalog variant (color3) used to win.
    graph.setInputValue(multiply, 'in2', 3);
    graph.setInputValue(fractal, 'amplitude', 1);
    const xml = serializeMaterialX(session.getDocument());
    expect(xml).toContain('<input name="in2" type="float" value="3"/>');
    expect(xml).toContain('<input name="amplitude" type="float" value="1"/>');
    // A color3 connection leaves color3 * color3 and color3 * float as candidates; the authored float
    // nodedef breaks the tie, and an explicit type still overrides it.
    const color = graph.addNode({ definition: 'ND_constant_color3' });
    graph.setInputValue(color, 'value', [1, 0, 0], { type: 'color3' });
    const mix = graph.addNode({ definition: 'ND_multiply_float' });
    graph.connect({ node: color, output: 'out' }, { node: mix, input: 'in1' });
    graph.setInputValue(mix, 'in2', 0.5);
    expect(serializeMaterialX(session.getDocument())).toContain('<input name="in2" type="float" value="0.5"/>');
    graph.setInputValue(mix, 'in2', [0, 1, 0], { type: 'color3' });
    expect(serializeMaterialX(session.getDocument())).toContain('<input name="in2" type="color3" value="0, 1, 0"/>');
  });
  it('updates the authored nodedef when a typed value moves the node to another variant', () => {
    const session = empty();
    const graph = session.graph();
    const scale = graph.addNode({ definition: 'ND_multiply_vector3FA' });
    graph.setInputValue(scale, 'in1', [1, 2, 3], { type: 'vector3' });
    graph.setInputValue(scale, 'in2', [2, 0.5, 2], { type: 'vector3' });
    const xml = serializeMaterialX(session.getDocument());
    expect(xml).toContain('nodedef="ND_multiply_vector3"');
    expect(xml).not.toContain('ND_multiply_vector3FA');
    // A later untyped scalar now follows the corrected variant and is rejected rather than mistyped.
    expect(() => graph.setInputValue(scale, 'in2', 1.5)).toThrow(EditorError);
  });

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

describe('compound node graphs', () => {
  it('builds a node graph with interface ports and wires them through interfacename and output', () => {
    const session = empty();
    const root = session.graph();
    expect(root.addNode({ definition: 'ND_nodegraph' })).toBe('nodegraph');
    const inner = session.graph('nodegraph');
    const input = inner.addNode({ definition: 'ND_input' });
    const output = inner.addNode({ definition: 'ND_output' });
    const tint = inner.addNode({ definition: 'ND_constant_color3' });
    inner.setInterfacePort(input, { type: 'color3', value: '1, 0, 0' });
    inner.setInterfacePort(output, { type: 'color3' });
    inner.connect({ node: input, output: 'out' }, { node: tint, input: 'value' });
    inner.connect({ node: tint, output: 'out' }, { node: output, input: 'in' });
    const xml = serializeMaterialX(session.getDocument());
    expect(xml).toContain('<nodegraph name="nodegraph">');
    expect(xml).not.toContain('nodedef="ND_nodegraph"');
    expect(xml).toContain('<input name="input" type="color3" value="1, 0, 0"');
    expect(xml).toContain('<input name="value" interfacename="input"');
    expect(xml).toContain('<output name="output" type="color3" nodename="constant"');
    // The graph node in the parent scope exposes the interface as its ports.
    const compound = root.getNode('nodegraph');
    expect(compound.inputs.map((p) => p.name)).toEqual(['input']);
    expect(compound.outputs.map((p) => p.name)).toEqual(['output']);
    const surface = root.addNode({ definition: 'ND_standard_surface_surfaceshader' });
    root.connect({ node: 'nodegraph', output: 'output' }, { node: surface, input: 'base_color' });
    expect(serializeMaterialX(session.getDocument())).toContain('nodegraph="nodegraph" output="output"');
  });
  it('retyping a port drops its stale default and keeps structure in the right scope', () => {
    const session = empty();
    session.graph().addNode({ definition: 'ND_nodegraph' });
    const inner = session.graph('nodegraph');
    const input = inner.addNode({ definition: 'ND_input' });
    inner.setInterfacePort(input, { value: '0.5' });
    inner.setInterfacePort(input, { type: 'vector2' });
    expect(serializeMaterialX(session.getDocument())).toContain('<input name="input" type="vector2"/>');
    expect(() => inner.setInterfacePort('missing', { type: 'float' })).toThrow(EditorError);
    expect(() => session.graph().addNode({ definition: 'ND_input' })).toThrow(/inside a node graph/);
    expect(() => inner.addNode({ definition: 'ND_nodegraph' })).toThrow(/nested/);
    expect(() => session.graph().setInterfacePort('nodegraph', { type: 'float' })).toThrow(/not an interface/);
  });
});

describe('grouping nodes into a node graph', () => {
  const doc = () =>
    parseMaterialX(
      '<materialx version="1.39"><constant name="a" type="color3" xpos="10" ypos="40"><input name="value" type="color3" value="1, 0, 0"/></constant><multiply name="m" type="color3" xpos="200" ypos="20"><input name="in1" type="color3" nodename="a"/><input name="in2" type="color3" value="0.5, 0.5, 0.5"/></multiply><standard_surface name="surface" type="surfaceshader"><input name="base_color" type="color3" nodename="m"/><input name="specular_color" type="color3" nodename="m"/></standard_surface><surfacematerial name="material" type="material"><input name="surfaceshader" type="surfaceshader" nodename="surface"/></surfacematerial></materialx>',
    );
  it('moves the selection and turns boundary wires into interface ports', () => {
    const session = createEditorSession({ document: doc() });
    const id = session.graph().groupNodes(['m']);
    expect(id).toBe('nodegraph');
    const xml = serializeMaterialX(session.getDocument());
    expect(xml).toContain('<nodegraph name="nodegraph" xpos="200" ypos="20">');
    expect(xml).toContain('<input name="in1" type="color3" nodename="a"/>');
    expect(xml).toContain('<output name="out" type="color3" nodename="m"/>');
    expect(xml).toContain('<input name="in1" type="color3" interfacename="in1"/>');
    expect(xml).toContain('<input name="base_color" type="color3" nodegraph="nodegraph" output="out"/>');
    expect(xml).toContain('<input name="specular_color" type="color3" nodegraph="nodegraph" output="out"/>');
    expect(
      session
        .graph()
        .listNodes()
        .map((n) => n.id),
    ).toEqual(['a', 'surface', 'material', 'nodegraph']);
    expect(
      session
        .graph('nodegraph')
        .listNodes()
        .map((n) => n.id),
    ).toEqual(['in1', 'out', 'm']);
    expect(session.getSnapshot().undoLabel).toBe('Group nodes');
    session.undo();
    expect(serializeMaterialX(session.getDocument())).toBe(serializeMaterialX(doc()));
  });
  it('shares one interface input per external source and refuses cycles, materials and nested graphs', () => {
    const session = createEditorSession({ document: doc() });
    session.graph().groupNodes(['a', 'm']);
    const inner = session.graph('nodegraph');
    expect(inner.listNodes().map((n) => n.id)).toEqual(['out', 'a', 'm']);
    expect(serializeMaterialX(session.getDocument())).not.toContain('interfacename');
    const cyclic = createEditorSession({ document: doc() });
    // Grouping only a and surface would route a → m → surface back into the group.
    expect(() => cyclic.graph().groupNodes(['a', 'surface'])).toThrow(/cycle/);
    expect(() => cyclic.graph().groupNodes(['material'])).toThrow(/cannot be grouped/);
    expect(() => cyclic.graph().groupNodes([])).toThrow(EditorError);
    expect(() => inner.groupNodes(['a'])).toThrow(/nested/);
    expect(cyclic.getSnapshot().canUndo).toBe(false);
  });
});

describe('pasting nodes', () => {
  it('renames collisions, keeps wires among the pasted set and drops wires to the rest', () => {
    const session = create();
    const graph = session.graph();
    const elements = ['surface', 'material'].map((id) => graph.getNode(id).element);
    const ids = graph.pasteNodes(elements, { x: 10, y: 20 });
    expect(ids).toEqual(['surface_2', 'material_2']);
    expect(graph.getConnection({ node: 'material_2', input: 'surfaceshader' })).toEqual({
      node: 'surface_2',
      output: 'out',
    });
    expect(graph.getNode('surface_2').element.attributes).toMatchObject({ xpos: '10', ypos: '20' });
    // Only the material travels: its wire pointed outside the set, so it is dropped.
    const [lone] = graph.pasteNodes([graph.getNode('material').element]);
    expect(graph.getConnection({ node: lone!, input: 'surfaceshader' })).toBeUndefined();
    expect(session.getSnapshot().undoLabel).toBe('Paste nodes');
    session.undo();
    session.undo();
    expect(graph.listNodes().map((node) => node.id)).toEqual(['surface', 'material']);
  });
  it('rejects malformed clipboard data and misplaced structural nodes', () => {
    const session = create();
    expect(() => session.graph().pasteNodes([{ name: 'x' } as never])).toThrow(EditorError);
    expect(() =>
      session.graph().pasteNodes([{ name: 'input', attributes: { name: 'i', type: 'float' }, children: [] }]),
    ).toThrow(/inside a node graph/);
    expect(session.getSnapshot().canUndo).toBe(false);
  });
});

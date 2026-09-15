import { describe, expect, it } from 'vitest';
import { parseMaterialX, serializeMaterialX, validateDocument, type MaterialXNodeSpec } from 'mtlx-core';
import {
  addNode,
  cloneNode,
  connectNodes,
  connectionError,
  disconnectInput,
  exportMaterial,
  getNodeCatalog,
  getNodeFamilies,
  importMaterial,
  materializeDocument,
  moveNodes,
  previewXml,
  projectGraph,
  removeNodes,
  resetInput,
  resolveTypes,
  setInputValue,
} from './model.js';
import { validateGraph } from './validation.js';

const doc = (body = '') => parseMaterialX(`<materialx version="1.39">${body}</materialx>`);
const catalog = getNodeCatalog();
const tiled = catalog.find((s) => s.nodeDefName === 'ND_tiledimage_vector3')!;
const wire = (source: string, target: string, targetHandle = 'in', sourceHandle = 'out') => ({
  source,
  sourceHandle,
  target,
  targetHandle,
});
const node = (document: ReturnType<typeof doc>, id = 'tiledimage', scope = '') =>
  projectGraph(document, scope).nodes.find((n) => n.id === id)!;

const make = (category: string, type: string): MaterialXNodeSpec => ({
  category,
  type,
  nodeDefName: `${category}_${type}`,
  inputs: [{ name: 'in', type, value: type === 'float' ? '0' : '0,0,0' }],
  outputs: [{ name: 'out', type }],
  parameters: [],
});

const spec = (category: string, input: string, output: string, two = false): MaterialXNodeSpec => ({
  category,
  nodeDefName: `${category}_${input}_${output}`,
  type: output,
  inputs: [{ name: 'in', type: input }, ...(two ? [{ name: 'in2', type: input }] : [])],
  outputs: [{ name: 'out', type: output }],
  parameters: [],
});

describe('automatic type inference', () => {
  it('uses the imported definition to interpret explicitly authored values with omitted types', () => {
    const document = doc(
      '<tiledimage name="tiledimage" type="vector3"><input name="default" value="0, 0, 0"/></tiledimage>',
    );
    expect(node(document).type).toBe('vector3');
    expect(materializeDocument(document).nodes[0]?.inputs[0]?.type).toBe('vector3');
    expect(node(resetInput(document, 'tiledimage', 'default')).type).toBeUndefined();
  });

  it('respects an imported explicit version without fixing its output type', () => {
    const custom = [
      { ...make('a', 'float'), nodeDefName: 'old_float', attributes: { version: '1', isdefaultversion: 'false' } },
      { ...make('a', 'vector3'), nodeDefName: 'old_vector', attributes: { version: '1', isdefaultversion: 'false' } },
      { ...make('a', 'float'), nodeDefName: 'new_float', attributes: { version: '2' } },
    ];
    const document = doc('<a name="a" type="float" version="1"/><output name="result" type="vector3" nodename="a"/>');
    const concrete = materializeDocument(document, custom);
    expect(concrete.nodes[0]?.attributes.nodedef).toBe('old_vector');
    expect(projectGraph(document, '', custom).nodes[0]?.type).toBe('vector3');
  });

  it('authors legacy parameter values with their original tag while leaving defaults implicit', () => {
    let document = doc(
      '<nodedef name="ND_p" node="p"><parameter name="amount" type="float" value="0.5"/><output name="out" type="float"/></nodedef>',
    );
    const definition = getNodeCatalog(document).find((s) => s.nodeDefName === 'ND_p')!;
    document = addNode(document, definition, { x: 0, y: 0 });
    expect(node(document, 'p').element.children).toEqual([]);
    document = setInputValue(document, 'p', 'amount', '0.75');
    expect(node(document, 'p').element.children[0]).toMatchObject({
      name: 'parameter',
      attributes: { type: 'float', value: '0.75' },
    });
  });

  it('leaves new nodes generic, authors no defaults, and does not constrain types from UVs or filenames', () => {
    let document = addNode(doc('<input name="uv" type="vector2"/>'), tiled, { x: 10, y: 20 });
    expect(document.nodes.find((n) => n.name === 'tiledimage')?.inputs).toEqual([]);
    expect(node(document).type).toBeUndefined();
    expect(node(document).outputs[0]?.type).toBeUndefined();
    expect(node(document).inputs.find((p) => p.name === 'texcoord')?.type).toBe('vector2');
    document = connectNodes(document, wire('uv', 'tiledimage', 'texcoord'));
    document = setInputValue(document, 'tiledimage', 'file', 'texture.png');
    expect(node(document).type).toBeUndefined();
    expect(node(document).element.children).toHaveLength(2);
  });

  it.each(['float', 'color3', 'color4', 'vector2', 'vector3', 'vector4'])(
    'resolves tiledimage to %s and becomes generic after disconnect',
    (type) => {
      const original = addNode(doc(`<output name="result" type="${type}"/>`), tiled, { x: 0, y: 0 });
      const connected = connectNodes(original, wire('tiledimage', 'result'));
      expect(node(connected).type).toBe(type);
      expect(node(connected).inputs.find((p) => p.name === 'default')?.type).toBe(type);
      expect(node(connected).definition?.nodeDefName).toBe(`ND_tiledimage_${type}`);
      expect(validateGraph(connected)).toEqual([]);
      expect(node(disconnectInput(connected, 'result', 'in')).type).toBeUndefined();
      expect(node(original).type).toBeUndefined();
    },
  );

  it('treats imported nodedefs and connected input types as hints, and retains explicit value constraints', () => {
    let document = doc(`<tiledimage name="tiledimage" type="color3" nodedef="ND_tiledimage_color3">
      <input name="file" type="filename" value="texture.png"/>
      <input name="default" type="color3" nodename="value"/>
    </tiledimage><constant name="value" type="float"><input name="value" type="float" value="0.4"/></constant>`);
    expect(node(document).type).toBe('float');
    document = disconnectInput(document, 'tiledimage', 'default');
    expect(node(document).type).toBeUndefined();
    expect(node(document).element.children[0]?.attributes.value).toBe('texture.png');
    const authored = doc(
      '<tiledimage name="tiledimage" type="color3"><input name="default" type="vector3" value="0,0,0"/></tiledimage>',
    );
    expect(node(authored).type).toBe('vector3');
    expect(node(resetInput(authored, 'tiledimage', 'default')).type).toBeUndefined();
  });

  it('propagates through generic chains and releases constraints even when generic wires remain', () => {
    let document = doc(
      '<tiledimage name="tiledimage" type="float"/><multiply name="m" type="float"/><output name="result" type="vector3"/>',
    );
    document = connectNodes(document, wire('tiledimage', 'm', 'in1'));
    expect(node(document).type).toBeUndefined();
    document = connectNodes(document, wire('m', 'result'));
    expect(node(document).type).toBe('vector3');
    expect(node(document, 'm').type).toBe('vector3');
    document = disconnectInput(document, 'result', 'in');
    expect(node(document).type).toBeUndefined();
    expect(node(document, 'm').type).toBeUndefined();
    expect(projectGraph(document).edges).toHaveLength(1);
  });

  it('recomputes both pieces of a split graph and handles source deletion', () => {
    let document = doc(
      '<tiledimage name="tiledimage" type="float"/><absval name="a" type="float"/><output name="result" type="vector3"/>',
    );
    document = connectNodes(document, wire('tiledimage', 'a', 'in'));
    document = connectNodes(document, wire('a', 'result'));
    const split = disconnectInput(document, 'a', 'in');
    expect(node(split).type).toBeUndefined();
    expect(node(split, 'a').type).toBe('vector3');
    expect(node(removeNodes(document, ['result'])).type).toBeUndefined();
    expect(node(removeNodes(document, ['a'])).type).toBeUndefined();
  });

  it('keeps remaining fanout constraints and rejects contradictory consumers atomically', () => {
    let document = doc(
      '<tiledimage name="tiledimage" type="float"/><output name="a" type="vector3"/><output name="b" type="vector3"/><output name="c" type="color3"/>',
    );
    document = connectNodes(document, wire('tiledimage', 'a'));
    document = connectNodes(document, wire('tiledimage', 'b'));
    const before = serializeMaterialX(document);
    expect(() => connectNodes(document, wire('tiledimage', 'c'))).toThrow('Cannot connect');
    expect(serializeMaterialX(document)).toBe(before);
    document = disconnectInput(document, 'a', 'in');
    expect(node(document).type).toBe('vector3');
    document = disconnectInput(document, 'b', 'in');
    expect(node(document).type).toBeUndefined();
  });

  it('ignores a replaced wire and replaced authored value when checking a connection', () => {
    let document = doc(
      '<tiledimage name="tiledimage" type="float"/><tiledimage name="other" type="color3"/><output name="result" type="vector3"/>',
    );
    document = connectNodes(document, wire('tiledimage', 'result'));
    document = connectNodes(document, wire('other', 'result'));
    expect(node(document).type).toBeUndefined();
    expect(node(document, 'other').type).toBe('vector3');
    document = doc(
      '<tiledimage name="tiledimage" type="color3"><input name="default" type="color3" value="0,0,0"/></tiledimage><input name="v" type="vector3"/>',
    );
    document = connectNodes(document, wire('v', 'tiledimage', 'default'));
    expect(node(document).type).toBe('vector3');
    expect(node(document).element.children[0]?.attributes.value).toBeUndefined();
  });

  it('distinguishes a known output type from a fully resolved mixed-input overload', () => {
    let document = doc(
      '<add name="a" type="float"/><output name="result" type="color3"/><input name="amount" type="float"/>',
    );
    document = connectNodes(document, wire('a', 'result'));
    expect(node(document, 'a').type).toBe('color3');
    expect(node(document, 'a').inputs.find((p) => p.name === 'in2')?.type).toBeUndefined();
    document = connectNodes(document, wire('amount', 'a', 'in2'));
    expect(node(document, 'a').definition?.nodeDefName).toBe('ND_add_color3FA');
    expect(validateGraph(document)).toEqual([]);
  });

  it('authored values use the current fallback type, survive disconnect, and release it on reset', () => {
    let document = doc('<tiledimage name="tiledimage" type="float"/><output name="result" type="vector3"/>');
    document = connectNodes(document, wire('tiledimage', 'result'));
    document = setInputValue(document, 'tiledimage', 'default', '0, 0, 0');
    expect(node(document).element.children[0]?.attributes.type).toBe('vector3');
    document = disconnectInput(document, 'result', 'in');
    expect(node(document).type).toBe('vector3');
    document = resetInput(document, 'tiledimage', 'default');
    expect(node(document).type).toBeUndefined();
  });

  it('supports named graph outputs, interfaces and nested scopes independently', () => {
    const document = doc(`<nodegraph name="g"><input name="value" type="vector3"/>
      <tiledimage name="tiledimage" type="float"><input name="default" type="float" interfacename="value"/></tiledimage>
      <output name="rgb" type="vector3" nodename="tiledimage"/>
    </nodegraph><tiledimage name="tiledimage" type="float"><input name="default" type="color3" nodegraph="g" output="rgb"/></tiledimage>`);
    expect(node(document, 'tiledimage', 'g').type).toBe('vector3');
    expect(node(document).type).toBe('vector3');
    expect(validateGraph(document)).toEqual([]);
    expect(validateGraph(document, 'g')).toEqual([]);
  });

  it('keeps different interfaces separate and preserves unknown definitions', () => {
    const document = doc(
      '<separate3 name="s" type="multioutput" nodedef="ND_separate3_color3"/><mystery name="m" type="custom" special="yes"/>',
    );
    expect(node(document, 's').outputs.map((p) => p.name)).toEqual(['outr', 'outg', 'outb']);
    expect(materializeDocument(document).elements[1]).toEqual(document.elements[1]);
  });

  it('restores derived state from immutable undo snapshots and independent clones', () => {
    const original = doc('<tiledimage name="tiledimage" type="float"/><output name="result" type="vector3"/>');
    const connected = connectNodes(original, wire('tiledimage', 'result'));
    const cloned = cloneNode(connected, 'tiledimage', { x: 10, y: 10 });
    expect(node(cloned, 'tiledimage_copy').type).toBeUndefined();
    expect(node(original).type).toBeUndefined();
    expect(node(connected).type).toBe('vector3');
    expect(previewXml(moveNodes(connected, { tiledimage: { x: 100, y: 40 } }))).toBe(previewXml(connected));
  });
});

describe('concrete fallback for preview and export', () => {
  it('uses the first family definition and implicit defaults without resolving or mutating the draft', () => {
    const document = addNode(doc(), tiled, { x: 0, y: 0 });
    const original = serializeMaterialX(document);
    const first = getNodeFamilies(catalog).find((f) => f.label === 'tiledimage')!.variants[0]!;
    const preview = parseMaterialX(previewXml(document));
    expect(preview.nodes[0]?.attributes.nodedef).toBe(first.nodeDefName);
    expect(preview.nodes[0]?.inputs.find((p) => p.name === 'default')?.value).toBe(
      first.inputs.find((p) => p.name === 'default')?.value,
    );
    expect(node(document).definition?.inputs).toEqual(first.inputs);
    expect(node(document).type).toBeUndefined();
    expect(serializeMaterialX(document)).toBe(original);
    for (const zip of [false, true]) {
      const reopened = importMaterial(
        exportMaterial({ document, rootPath: 'a.mtlx', resources: [] }, zip),
        zip ? 'a.mtlx.zip' : 'a.mtlx',
      );
      expect(reopened.document.nodes[0]?.attributes.nodedef).toBe(first.nodeDefName);
      expect(reopened.document.nodes[0]?.inputs).toEqual([]);
      expect(node(reopened.document).type).toBeUndefined();
    }
  });

  it('selects jointly compatible fallbacks when the first variants at either endpoint disagree', () => {
    const custom = [make('a', 'float'), make('a', 'vector3'), make('b', 'vector3'), make('b', 'float')];
    const document = doc(
      '<a name="a" type="vector3"/><b name="b" type="vector3"><input name="in" type="vector3" nodename="a"/></b>',
    );
    const concrete = materializeDocument(document, custom);
    expect(concrete.nodes.map((n) => n.type)).toEqual(['float', 'float']);
    expect(concrete.nodes[1]?.inputs[0]?.type).toBe('float');
    expect(validateDocument(concrete, { registry: custom, rules: ['structure', 'types'] })).toEqual([]);
    expect(projectGraph(document, '', custom).nodes.map((n) => n.type)).toEqual([undefined, undefined]);
  });

  it('detects a reconvergent contradiction that pairwise candidate filtering cannot detect', () => {
    // A and B preserve a type, C changes it. Both branches meet at D, which requires equal inputs.
    const custom = ['a', 'b', 'd']
      .flatMap((category) => ['float', 'vector3'].map((type) => spec(category, type, type, category === 'd')))
      .concat([spec('c', 'float', 'vector3'), spec('c', 'vector3', 'float')]);
    const document = doc(`<a name="a"/><b name="b"><input name="in" nodename="a"/></b>
      <c name="c"><input name="in" nodename="a"/></c><d name="d"><input name="in" nodename="b"/></d>`);
    expect(connectionError(document, wire('c', 'd', 'in2'), '', custom)).toContain('Cannot connect');
    expect(resolveTypes(document, custom).conflicts).toEqual([]);
  });
});

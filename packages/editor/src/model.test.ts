import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseMaterialX, serializeMaterialX, type MaterialXPackage } from 'mtlx-core';
import {
  addNode,
  cloneNode,
  connectNodes,
  connectionError,
  createDefaultDocument,
  disconnectInput,
  exportMaterial,
  getNodeCatalog,
  graphScopes,
  importMaterial,
  moveNodes,
  previewXml,
  projectGraph,
  removeNodes,
  resetInput,
  setInputValue,
} from './model.js';
const catalog = getNodeCatalog();
const constant = catalog.find((s) => s.nodeDefName === 'ND_constant_color3')!;
const multiply = catalog.find((s) => s.nodeDefName === 'ND_multiply_color3')!;

describe('editing workflow', () => {
  it('clones values and incoming connections with unique names and independent children', () => {
    const original = createDefaultDocument();
    let copy = cloneNode(original, 'surface', { x: 40, y: 40 });
    copy = cloneNode(copy, 'surface', { x: 80, y: 80 });
    copy = cloneNode(copy, 'material', { x: 390, y: 40 });
    expect(projectGraph(copy).nodes.map((node) => node.id)).toEqual([
      'surface',
      'material',
      'surface_copy',
      'surface_copy_2',
      'material_copy',
    ]);
    expect(projectGraph(copy).edges.find((edge) => edge.target === 'material_copy')?.source).toBe('surface');
    copy = setInputValue(copy, 'surface_copy', 'base_color', '1, 0, 0');
    expect(
      projectGraph(copy)
        .nodes.find((node) => node.id === 'surface')
        ?.inputs.find((input) => input.name === 'base_color')?.value,
    ).toBe('0.8, 0.25, 0.08');
    expect(projectGraph(original).nodes).toHaveLength(2);
    expect(projectGraph(copy).nodes.find((node) => node.id === 'surface_copy')?.position).toEqual({ x: 40, y: 40 });
  });
  it('clones within a nested graph and preserves its connections', () => {
    const original = parseMaterialX(
      '<materialx version="1.39"><nodegraph name="graph"><constant name="value" type="float"><input name="value" type="float" value="0.5"/></constant><output name="out" type="float" nodename="value"/></nodegraph></materialx>',
    );
    const copy = cloneNode(original, 'value', { x: 20, y: 30 }, 'graph');
    expect(projectGraph(copy, 'graph').nodes.map((node) => node.id)).toEqual(['value', 'out', 'value_copy']);
    expect(projectGraph(copy, 'graph').edges[0]?.source).toBe('value');
    expect(projectGraph(original, 'graph').nodes).toHaveLength(2);
    expect(() => cloneNode(original, 'missing', { x: 0, y: 0 }, 'graph')).toThrow('Unknown node');
  });
  it('creates nodes with implicit defaults and unique names without changing the original', () => {
    const original = createDefaultDocument();
    let doc = addNode(original, constant, { x: 50, y: 20 });
    doc = addNode(doc, constant, { x: 70, y: 40 });
    expect(original.nodes).toHaveLength(2);
    expect(doc.nodes.map((n) => n.name)).toContain('constant_2');
    expect(doc.nodes.find((n) => n.name === 'constant')?.inputs).toEqual([]);
    const projected = projectGraph(doc).nodes.find((n) => n.id === 'constant')!;
    expect(projected.inputs[0]?.value).toBe(projected.definition?.inputs[0]?.value);
    expect(projected.type).toBeUndefined();
    expect(
      catalog
        .find((n) => n.nodeDefName === 'ND_standard_surface_surfaceshader')
        ?.inputs.find((p) => p.name === 'specular_roughness')?.value,
    ).toBe('0.2');
    expect(
      catalog.find((n) => n.nodeDefName === 'ND_image_color3')?.inputs.find((p) => p.name === 'texcoord')?.attributes
        ?.defaultgeomprop,
    ).toBe('UV0');
  });
  it('edits, connects, replaces, disconnects and resets a parameter, then round trips XML', () => {
    let doc = addNode(createDefaultDocument(), constant, { x: 0, y: 0 });
    doc = connectNodes(doc, { source: 'constant', sourceHandle: 'out', target: 'surface', targetHandle: 'base_color' });
    doc = setInputValue(doc, 'constant', 'value', '0.1, 0.8, 0.2');
    expect(doc.nodes[0]?.inputs.find((p) => p.name === 'base_color')?.attributes).toMatchObject({
      nodename: 'constant',
    });
    expect(doc.nodes[0]?.inputs.find((p) => p.name === 'base_color')?.value).toBeUndefined();
    doc = disconnectInput(doc, 'surface', 'base_color');
    expect(projectGraph(doc).edges).toHaveLength(1);
    doc = setInputValue(doc, 'surface', 'base_color', '1, 0, 0');
    expect(parseMaterialX(serializeMaterialX(doc)).nodes[0]?.inputs.find((p) => p.name === 'base_color')?.value).toBe(
      '1, 0, 0',
    );
    doc = resetInput(doc, 'surface', 'base_color');
    expect(doc.nodes[0]?.inputs.find((p) => p.name === 'base_color')).toBeUndefined();
  });
  it('rejects wrong port types, self connections and cycles', () => {
    let doc = addNode(createDefaultDocument(), multiply, { x: 0, y: 0 });
    doc = addNode(doc, multiply, { x: 0, y: 0 });
    expect(
      connectionError(doc, { source: 'surface', sourceHandle: 'out', target: 'multiply', targetHandle: 'in1' }),
    ).toContain('Cannot connect');
    expect(() =>
      connectNodes(doc, { source: 'multiply', sourceHandle: 'out', target: 'multiply', targetHandle: 'in1' }),
    ).toThrow('cycle');
    doc = connectNodes(doc, { source: 'multiply', sourceHandle: 'out', target: 'multiply_2', targetHandle: 'in1' });
    expect(() =>
      connectNodes(doc, { source: 'multiply_2', sourceHandle: 'out', target: 'multiply', targetHandle: 'in1' }),
    ).toThrow('cycle');
  });
  it('removes references to deleted nodes and separates layout from preview changes', () => {
    const doc = createDefaultDocument();
    const moved = moveNodes(doc, { surface: { x: 250, y: 80 } });
    expect(previewXml(doc)).toBe(previewXml(moved));
    expect(projectGraph(moved).nodes[0]?.position).toEqual({ x: 250, y: 80 });
    expect(projectGraph(removeNodes(moved, ['surface'])).edges).toEqual([]);
    expect(serializeMaterialX(removeNodes(moved, ['surface']))).not.toContain('nodename="surface"');
  });
});

describe('import and preservation', () => {
  const xml =
    '<materialx version="1.39" colorspace="lin_rec709"><!--keep--><nodegraph name="NG"><input name="color" type="color3" value="1,0,0"/><constant name="c" type="color3"><input name="value" type="color3" interfacename="color"/></constant><output name="result" type="color3" nodename="c"/></nodegraph><standard_surface name="s" type="surfaceshader"><input name="base_color" type="color3" nodegraph="NG" output="result"/></standard_surface><look name="look"><materialassign name="assign" material="m" geom="*"/></look></materialx>';
  it('keeps graph scopes, graph outputs, interfaces and unrelated XML', () => {
    let doc = parseMaterialX(xml);
    expect(graphScopes(doc)).toEqual(['', 'NG']);
    expect(projectGraph(doc).edges[0]).toMatchObject({ source: 'NG', sourceHandle: 'result', target: 's' });
    expect(projectGraph(doc, 'NG').edges).toHaveLength(2);
    doc = addNode(doc, constant, { x: 0, y: 0 }, 'NG');
    doc = connectNodes(doc, { source: 'constant', sourceHandle: 'out', target: 'result', targetHandle: 'in' }, 'NG');
    const serialized = serializeMaterialX(doc);
    expect(serialized).toContain('<!--keep-->');
    expect(serialized).toContain('<look name="look">');
    expect(serialized).toContain('colorspace="lin_rec709"');
    expect(projectGraph(parseMaterialX(serialized), 'NG').edges.find((e) => e.target === 'result')?.source).toBe(
      'constant',
    );
    expect(serializeMaterialX(removeNodes(doc, ['NG']))).not.toContain('nodegraph="NG"');
  });
  it('retains archive bytes and root paths through editing and export', () => {
    const pkg: MaterialXPackage = {
      rootPath: 'nested/material.mtlx',
      document: parseMaterialX(xml),
      resources: [{ archivePath: 'textures/a.png', sourcePath: 'textures/a.png', data: new Uint8Array([1, 2, 3]) }],
    };
    const imported = importMaterial(exportMaterial(pkg, true), 'material.mtlx.zip');
    imported.document = setInputValue(imported.document, 's', 'base_color', '0,1,0');
    const reopened = importMaterial(exportMaterial(imported, true), 'edited.mtlx.zip');
    expect(reopened.rootPath).toBe(pkg.rootPath);
    expect(reopened.resources[0]?.data).toEqual(pkg.resources[0]?.data);
    expect(reopened.document.nodes.find((n) => n.name === 's')?.inputs[0]?.value).toBe('0,1,0');
  });
  it('supports inherited custom definitions and preserves unknown nodes', () => {
    const doc = parseMaterialX(
      '<materialx version="1.39"><nodedef name="ND_custom" node="custom" inherit="ND_constant_color3"><input name="value" type="color3" value="1,0,1"/></nodedef><mystery name="unknown" type="float" custom="yes"/></materialx>',
    );
    const spec = getNodeCatalog(doc).find((s) => s.nodeDefName === 'ND_custom')!;
    expect(spec.outputs[0]?.type).toBe('color3');
    expect(spec.inputs[0]?.value).toBe('1,0,1');
    expect(serializeMaterialX(addNode(doc, spec, { x: 0, y: 0 }))).toContain('custom="yes"');
  });
  it('reports malformed files', () => {
    expect(() => importMaterial(new TextEncoder().encode('<broken>'), 'bad.mtlx')).toThrow('Invalid MaterialX XML');
    expect(() => importMaterial(new Uint8Array(), 'bad.txt')).toThrow('Choose a .mtlx');
    expect(() => importMaterial(new Uint8Array([0, 1]), 'bad.mtlx.zip')).toThrow();
  });
});

describe('compound graph navigation', () => {
  it('opens the Onyx sample graph and preserves its internal connections', () => {
    const document = parseMaterialX(readFileSync(new URL('./fixtures/onyx_hextiled.mtlx', import.meta.url), 'utf8'));
    const compound = projectGraph(document).nodes.find(
      (node) => node.id === 'NG_OnyxHextiled' || node.id === 'NG_OnyxsHextiled',
    );
    expect(compound?.compoundScope).toBe(compound?.id);
    expect(compound).toBeDefined();
    const contents = projectGraph(document, compound!.compoundScope);
    expect(contents.nodes.length).toBeGreaterThan(10);
    expect(contents.edges.length).toBeGreaterThan(10);
  });

  it('resolves local implementations and supports editing nested graph scopes', () => {
    const document = parseMaterialX(`<materialx version="1.39">
      <nodedef name="ND_compound" node="compound"><output name="out" type="float"/></nodedef>
      <compound name="instance" type="float" nodedef="ND_compound"/>
      <implementation name="IM_compound" nodedef="ND_compound" nodegraph="outer"/>
      <nodegraph name="outer"><nodegraph name="inner">
        <constant name="value" type="float"><input name="value" type="float" value="1"/></constant>
        <output name="out" type="float" nodename="value"/>
      </nodegraph></nodegraph>
    </materialx>`);
    expect(projectGraph(document).nodes.find((node) => node.id === 'instance')?.compoundScope).toBe('outer');
    expect(graphScopes(document)).toEqual(['', 'outer', 'outer/inner']);
    expect(projectGraph(document, 'outer').nodes[0]?.compoundScope).toBe('outer/inner');
    const edited = setInputValue(document, 'value', 'value', '2', 'outer/inner');
    expect(projectGraph(edited, 'outer/inner').nodes[0]?.inputs[0]?.value).toBe('2');
    expect(projectGraph(document, 'outer/inner').nodes[0]?.inputs[0]?.value).toBe('1');
    expect(projectGraph(removeNodes(edited, ['value'], 'outer/inner'), 'outer/inner').edges).toEqual([]);
    expect(serializeMaterialX(removeNodes(edited, ['value'], 'outer/inner'))).not.toContain('nodename="value"');
  });
});

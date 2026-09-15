import { checkMaterialXText, validateDocument } from './validate.js';
import { expect, it } from 'vitest';
import { parseMaterialX } from './xml.js';

it('accepts the MaterialX single-output and string-to-filename connection rules', () => {
  const document = parseMaterialX(
    '<materialx><nodegraph name="g"><constant name="s" type="string"/><output name="only" type="string" nodename="s"/></nodegraph><image name="i"><input name="file" type="filename" nodegraph="g" output="ignored_for_single_output"/></image></materialx>',
  );
  expect(validateDocument(document, { rules: ['structure', 'types'] })).toEqual([]);
});

const doc = (body: string) => parseMaterialX(`<materialx version="1.39">${body}</materialx>`);
it('checks declared input and connection types inside node graphs', () => {
  const issues = validateDocument(
    doc(
      '<nodegraph name="g"><constant name="color" type="color3"/><add name="sum" type="float"><input name="in1" type="boolean" nodename="color"/></add></nodegraph>',
    ),
    { rules: ['types'] },
  );
  expect(issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: 'PORT_TYPE_MISMATCH', location: 'materialx/nodegraph:g/add:sum/input:in1' }),
      expect.objectContaining({
        code: 'CONNECTION_TYPE_MISMATCH',
        location: 'materialx/nodegraph:g/add:sum/input:in1',
      }),
    ]),
  );
});
it('checks scoped connections, outputs and duplicate names independently of basic rules', () => {
  const issues = validateDocument(
    doc(
      '<constant name="same" type="float"/><constant name="same" type="float"/><nodegraph name="g"><output name="out" type="float" nodename="missing"/><output name="second" type="float"/></nodegraph><add name="sum" type="float"><input name="in1" type="float" nodegraph="g" output="bad"/></add>',
    ),
    { rules: ['structure'] },
  );
  expect(issues.map((issue) => issue.code)).toEqual(
    expect.arrayContaining(['DUPLICATE_NAME', 'UNRESOLVED_CONNECTION', 'UNRESOLVED_OUTPUT']),
  );
  expect(issues.every((issue) => issue.rule === 'structure')).toBe(true);
});
it('does not resolve graph-local names from another graph', () => {
  const issues = validateDocument(
    doc(
      '<nodegraph name="a"><constant name="local" type="float"/></nodegraph><nodegraph name="b"><output name="out" type="float" nodename="local"/></nodegraph>',
    ),
    { rules: ['structure'] },
  );
  expect(issues).toEqual([expect.objectContaining({ code: 'UNRESOLVED_CONNECTION' })]);
});
it('checks connection types when only types is selected', () => {
  const issues = validateDocument(
    doc(
      '<constant name="color" type="color3"/><add name="sum" type="float"><input name="in1" type="float" nodename="color"/></add>',
    ),
    { rules: ['types'] },
  );
  expect(issues).toContainEqual(expect.objectContaining({ code: 'CONNECTION_TYPE_MISMATCH' }));
});
it('uses the selected overload and recognizes custom categories without guessing unknown types', () => {
  const document = doc(
    '<nodedef name="ND_custom" node="custom" type="float"><input name="value" type="float"/></nodedef><custom name="instance" type="float" nodedef="ND_custom"><input name="value" type="color3"/></custom>',
  );
  expect(validateDocument(document, { rules: ['basic', 'types'] })).toEqual([
    expect.objectContaining({ code: 'PORT_TYPE_MISMATCH' }),
  ]);
});
it('reports the limits of resource and renderer checks explicitly', () => {
  expect(validateDocument(doc(''), { rules: ['resources', 'renderer-support'] }).map((issue) => issue.code)).toEqual([
    'RESOURCES_UNASSESSED',
    'RENDERER_SUPPORT_UNASSESSED',
  ]);
  expect(
    validateDocument(
      doc('<image name="i" type="color3"><input name="file" type="filename" value="missing.png"/></image>'),
      { rules: ['resources'], availableResources: [] },
    ),
  ).toEqual([expect.objectContaining({ code: 'RESOURCE_MISSING' })]);
});
it('preserves legacy registries and provides a stable parse-error code', () => {
  expect(
    validateDocument(doc('<custom name="c"/>'), [{ category: 'custom', inputs: [], outputs: [], parameters: [] }]),
  ).toEqual([]);
  expect(checkMaterialXText('<broken>')[0]?.code).toBe('PARSE_ERROR');
});
it('uses a selected graph output type for connection checks', () => {
  const issues = validateDocument(
    doc(
      '<nodegraph name="g"><output name="color" type="color3"/></nodegraph><add name="a" type="float"><input name="in1" type="float" nodegraph="g" output="color"/></add>',
    ),
    { rules: ['types'] },
  );
  expect(issues).toContainEqual(expect.objectContaining({ code: 'CONNECTION_TYPE_MISMATCH' }));
});
it('does not guess a port type when category overloads disagree', () => {
  const issues = validateDocument(doc('<custom name="a" type="float"><input name="value" type="color3"/></custom>'), {
    rules: ['types'],
    registry: [
      { category: 'custom', type: 'float', inputs: [{ name: 'value', type: 'float' }], outputs: [], parameters: [] },
      { category: 'custom', type: 'float', inputs: [{ name: 'value', type: 'color3' }], outputs: [], parameters: [] },
    ],
  });
  expect(issues).toEqual([]);
});

it('validates unopened nested graphs and exposes graph coordinates', () => {
  const document = doc(
    '<nodegraph name="outer"><nodegraph name="inner"><input name="v" type="color3"/><add name="sum" type="float"><input name="in1" type="float" interfacename="v"/><input name="in2" type="float" value="oops"/></add></nodegraph></nodegraph>',
  );
  const issues = validateDocument(document, { rules: ['structure', 'types'] });
  expect(issues).toEqual([
    expect.objectContaining({
      code: 'CONNECTION_TYPE_MISMATCH',
      graph: expect.objectContaining({ scope: 'outer/inner', nodeIds: ['sum', 'v'], input: 'in1', source: 'v' }),
    }),
    expect.objectContaining({
      code: 'INVALID_VALUE',
      graph: expect.objectContaining({ scope: 'outer/inner', nodeIds: ['sum'], input: 'in2' }),
    }),
  ]);
});

it('reports graph cycles under structure rules independently of type checks', () => {
  const document = doc(
    '<nodegraph name="g"><add name="a" type="float"><input name="in1" type="float" nodename="b"/></add><add name="b" type="float"><input name="in1" type="float" nodename="a"/></add></nodegraph>',
  );
  expect(validateDocument(document, { rules: ['types'] })).toEqual([]);
  const issues = validateDocument(document, { rules: ['structure'] });
  expect(issues).toHaveLength(2);
  expect(issues.every((issue) => issue.code === 'CONNECTION_CYCLE' && issue.graph?.scope === 'g')).toBe(true);
});

it('reports cyclic definition inheritance without throwing or mislabeling it as a parse error', () => {
  const xml = '<materialx><nodedef name="a" inherit="b"/><nodedef name="b" inherit="a"/></materialx>';
  expect(checkMaterialXText(xml, '', undefined, { rules: ['structure'] })).toEqual([
    expect.objectContaining({ code: 'NODEDEF_INHERITANCE_CYCLE', rule: 'structure' }),
  ]);
});

it('resolves document-level graph outputs from within another graph', () => {
  const document = doc(
    '<nodegraph name="source"><output name="out" type="float"/></nodegraph><nodegraph name="consumer"><add name="sum" type="float"><input name="in1" type="float" nodegraph="source"/></add></nodegraph>',
  );
  expect(validateDocument(document, { rules: ['structure', 'types'] })).toEqual([]);
});

it('attaches transitive container locations once, even for recursive implementation references', () => {
  const document = doc(
    '<nodedef name="ND_a" node="custom_a" type="float"/><nodedef name="ND_b" node="custom_b" type="float"/><nodegraph name="a" nodedef="ND_a"><custom_b name="use_b" type="float"/></nodegraph><nodegraph name="b" nodedef="ND_b"><custom_a name="use_a" type="float"/><constant name="bad" type="float"><input name="value" type="float" value="oops"/></constant></nodegraph><custom_a name="instance" type="float"/>',
  );
  const issues = validateDocument(document, { rules: ['types'] });
  expect(issues).toHaveLength(1);
  expect(issues[0]?.graph).toEqual(
    expect.objectContaining({
      scope: 'b',
      nodeIds: ['bad'],
      containers: expect.arrayContaining([
        { scope: '', nodeId: 'a' },
        { scope: '', nodeId: 'b' },
        { scope: '', nodeId: 'instance' },
        { scope: 'a', nodeId: 'use_b' },
        { scope: 'b', nodeId: 'use_a' },
      ]),
    }),
  );
  expect(issues[0]?.graph?.containers).toHaveLength(5);
});

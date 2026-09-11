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

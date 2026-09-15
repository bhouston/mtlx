import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseMaterialX } from 'mtlx-core';
import {
  createDefaultDocument,
  findNodeSpec,
  getNodeCatalog,
  graphScopes,
  materializeDocument,
  setInputValue,
} from './model.js';
import { validateGraph } from './validation.js';
const doc = (body: string) => parseMaterialX(`<materialx version="1.39">${body}</materialx>`);
it('validates every Onyx scope using the float-to-vector2 convert overload', () => {
  const document = parseMaterialX(readFileSync(new URL('./fixtures/onyx_hextiled.mtlx', import.meta.url), 'utf8'));
  const catalog = getNodeCatalog(document);
  const convert = document.elements
    .find((e) => e.attributes.name === 'NG_OnyxHextiled')!
    .children.find((e) => e.attributes.name === 'tiling_vector2')!;
  expect(findNodeSpec(convert, catalog)?.nodeDefName).toBe('ND_convert_float_vector2');
  for (const scope of graphScopes(document)) expect(validateGraph(document, scope, catalog)).toEqual([]);
});

it('resolves imported overloads from authored values instead of pinning the nodedef', () => {
  const document = doc(
    '<convert name="c" type="vector2" nodedef="ND_convert_boolean_vector2"><input name="in" type="float" value="1"/></convert><output name="out" type="vector2" nodename="c"/>',
  );
  expect(validateGraph(document)).toEqual([]);
  expect(materializeDocument(document).nodes[0]?.attributes.nodedef).toBe('ND_convert_float_vector2');
});
it('revalidates edited values and clears errors after correction', () => {
  const initial = createDefaultDocument();
  expect(validateGraph(initial)).toEqual([]);
  const broken = setInputValue(initial, 'surface', 'base_color', 'oops');
  expect(validateGraph(broken)).toEqual([
    expect.objectContaining({ nodeIds: ['surface'], message: expect.stringContaining('Invalid color3') }),
  ]);
  expect(validateGraph(setInputValue(broken, 'surface', 'base_color', '1, 0, 0'))).toEqual([]);
});
it('associates mismatched connections with both nodes and the wire', () => {
  expect(
    validateGraph(
      doc(
        '<constant name="c" type="color3"><input name="value" type="color3" value="1,0,0"/></constant><add name="a" type="float"><input name="in1" type="float" nodename="c"/></add><output name="out" type="float" nodename="a"/>',
      ),
    ),
  ).toContainEqual(
    expect.objectContaining({
      nodeIds: ['a', 'c'],
      edgeId: 'a/in1',
      message: expect.stringContaining('expected "float"'),
    }),
  );
});
it('reports dangling references even though no wire can be drawn', () => {
  expect(
    validateGraph(doc('<add name="a" type="float"><input name="in1" type="float" nodename="missing"/></add>')),
  ).toContainEqual(
    expect.objectContaining({ nodeIds: ['a'], edgeId: undefined, message: expect.stringContaining('missing') }),
  );
});
it('marks every wire in a cycle, without marking downstream wires', () => {
  const issues = validateGraph(
    doc(
      '<add name="a" type="float"><input name="in1" type="float" nodename="b"/></add><add name="b" type="float"><input name="in1" type="float" nodename="a"/></add><output name="out" type="float" nodename="b"/>',
    ),
  );
  expect(issues.map((i) => i.edgeId).toSorted()).toEqual(['a/in1', 'b/in1']);
});
it('resolves nested graph interfaces and named single outputs', () => {
  const document = doc(
    '<nodegraph name="g"><input name="v" type="float"/><add name="a" type="float"><input name="in1" type="float" interfacename="v"/></add><output name="only" type="float" nodename="a"/></nodegraph><output name="out" type="float" nodegraph="g"/>',
  );
  expect(validateGraph(document)).toEqual([]);
  expect(validateGraph(document, 'g')).toEqual([]);
});
it('rejects unknown outputs on multioutput nodes and accepts string to filename', () => {
  const document = doc(
    '<nodegraph name="g"><output name="x" type="float"/><output name="y" type="float"/></nodegraph><output name="out" type="float" nodegraph="g" output="bad"/><constant name="s" type="string"/><image name="image" type="color3"><input name="file" type="filename" nodename="s"/></image>',
  );
  expect(validateGraph(document)).toEqual([
    expect.objectContaining({ edgeId: 'out/in', message: expect.stringContaining('Cannot resolve output "bad"') }),
  ]);
});

it('highlights every enclosing graph and clears the indicators when the error is fixed', () => {
  const document = doc(
    '<nodegraph name="outer"><nodegraph name="inner"><constant name="broken" type="float"><input name="value" type="float" value="oops"/></constant></nodegraph><nodegraph name="inner_other"><constant name="ok" type="float"/></nodegraph></nodegraph><nodegraph name="unrelated"/>',
  );
  expect(validateGraph(document)).toEqual([
    expect.objectContaining({
      nodeIds: ['outer'],
      edgeId: undefined,
      message: expect.stringContaining('outer/inner/broken.value'),
    }),
  ]);
  expect(validateGraph(document, 'outer')).toEqual([
    expect.objectContaining({ nodeIds: ['inner'], edgeId: undefined }),
  ]);
  expect(validateGraph(document, 'outer/inner')).toEqual([
    expect.objectContaining({ nodeIds: ['broken'], message: expect.stringContaining('Invalid float') }),
  ]);
  expect(validateGraph(document, 'outer/inner_other')).toEqual([]);
  const fixed = setInputValue(document, 'broken', 'value', '1', 'outer/inner');
  for (const scope of graphScopes(fixed)) expect(validateGraph(fixed, scope)).toEqual([]);
});

it('highlights all compound instances that use an invalid implementation without marking their wires', () => {
  const document = doc(
    '<nodedef name="ND_custom" node="custom" type="float"/><implementation name="IM_custom" nodedef="ND_custom" nodegraph="implementation"/><nodegraph name="implementation"><add name="broken" type="float"><input name="in1" type="float" nodename="missing"/></add><output name="out" type="float" nodename="broken"/></nodegraph><custom name="first" type="float"/><custom name="second" type="float" nodedef="ND_custom"/><output name="out" type="float" nodename="first"/>',
  );
  const issues = validateGraph(document);
  expect(issues).toHaveLength(1);
  expect(issues[0]?.nodeIds.toSorted()).toEqual(['first', 'implementation', 'second']);
  expect(issues[0]?.edgeId).toBeUndefined();
  expect(issues[0]?.message).toContain('implementation/broken.in1');
});

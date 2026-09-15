import { expect, it } from 'vitest';
import { parseMaterialX, serializeMaterialX } from 'mtlx-core';
import { projectGraph } from './model.js';
import { socketColor, socketTypes } from './socket-colors.js';

it('resolves missing types from named outputs without changing the document', () => {
  const document = parseMaterialX(`<materialx version="1.39">
    <nodegraph name="source">
      <output name="rgb" type="color3"/><output name="alpha" type="float"/>
    </nodegraph>
    <custom name="target"><input name="in" nodegraph="source" output="rgb"/></custom>
  </materialx>`);
  const original = serializeMaterialX(document);
  const { nodes, edges } = projectGraph(document);
  const type = socketTypes(nodes, edges);
  expect(type('source', 'output', 'rgb')).toBe('color3');
  expect(type('source', 'output', 'alpha')).toBe('float');
  expect(type('target', 'input', 'in')).toBe('color3');
  expect(socketTypes(nodes, [])('target', 'input', 'in')).toBeUndefined();
  expect(serializeMaterialX(document)).toBe(original);
});

it('keeps ambiguous outputs grey and preserves declared input types', () => {
  const { nodes, edges } = projectGraph(
    parseMaterialX(`<materialx version="1.39">
    <custom name="source"/>
    <custom name="a"><input name="in" type="color3" nodename="source"/></custom>
    <custom name="b"><input name="in" type="vector3" nodename="source"/></custom>
  </materialx>`),
  );
  const type = socketTypes(nodes, edges);
  expect(type('source', 'output', 'out')).toBeUndefined();
  expect(socketColor(type('source', 'output', 'out'))).toBe('#a1a1a1');
  expect(type('a', 'input', 'in')).toBe('color3');
  expect(type('b', 'input', 'in')).toBe('vector3');
  expect(socketTypes(nodes, edges.slice(0, 1))('source', 'output', 'out')).toBe('color3');
});

it('uses individual socket types for overloaded nodes and array element colors', () => {
  const { nodes, edges } = projectGraph(
    parseMaterialX(`<materialx version="1.39">
    <mix name="blend" type="color3"><input name="mix" type="float" value="0.5"/></mix><output name="out" type="color3" nodename="blend"/>
  </materialx>`),
  );
  const type = socketTypes(nodes, edges);
  expect(type('blend', 'input', 'fg')).toBe('color3');
  expect(type('blend', 'input', 'mix')).toBe('float');
  expect(type('blend', 'output', 'out')).toBe('color3');
  expect(socketColor('color3array')).toBe(socketColor('color3'));
  expect(socketColor('customtype')).toBe('#a1a1a1');
});

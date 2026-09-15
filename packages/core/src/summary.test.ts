import { expect, it } from 'vitest';
import { parseMaterialX } from './xml.js';
import { summarizeMaterialX } from './summary.js';

it('summarizes actual nodes at every graph depth, including disconnected graphs', () => {
  const document = parseMaterialX(`<materialx>
    <nodedef name="ND_custom" node="custom"><input name="value" type="float"/></nodedef>
    <constant name="same" type="float"/>
    <nodegraph name="outer">
      <input name="value" type="float"/>
      <constant name="same" type="float"/>
      <nodegraph name="inner">
        <image name="texture" type="color3"><input name="file" type="filename" value="deep.png"/></image>
        <constant name="same" type="float"/>
        <output name="out" type="color3" nodename="texture"/>
      </nodegraph>
    </nodegraph>
    <surfacematerial name="material" type="material"/>
  </materialx>`);
  const summary = summarizeMaterialX('nested.mtlx', document);
  expect(summary.nodeGraphCount).toBe(2);
  expect(summary.topLevelNodeCount).toBe(2);
  expect(summary.nodes).toEqual([
    { name: 'same', category: 'constant' },
    { name: 'same', category: 'constant' },
    { name: 'texture', category: 'image' },
    { name: 'same', category: 'constant' },
    { name: 'material', category: 'surfacematerial' },
  ]);
  expect(summary.nodeCategories).toEqual(['constant', 'image', 'surfacematerial']);
  expect(summary.referencedTextures).toEqual(['deep.png']);
});

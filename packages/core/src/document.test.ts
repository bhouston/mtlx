import { expect, it } from 'vitest';
import { parseMaterialX, serializeMaterialX } from './xml.js';
import { mergeMaterialXPackages, rewriteResourcePath } from './package.js';
import { summarizeMaterialX } from './summary.js';
import { validateDocument } from './validate.js';

it('makes derived snapshots immutable without freezing the canonical tree', () => {
  const document = parseMaterialX(
    '<materialx><image name="a"><input name="file" type="filename" value="a.png"/></image></materialx>',
  );
  const snapshot = document.nodes[0]!;
  expect(() => Object.assign(snapshot, { name: 'wrong' })).toThrow();
  expect(() => Object.assign(snapshot.inputs[0]!, { value: 'wrong' })).toThrow();
  document.elements[0]!.attributes.name = 'b';
  expect(snapshot.name).toBe('a');
  expect(document.nodes[0]?.name).toBe('b');
});

it('derives summaries and validation from the edited canonical tree', () => {
  const document = parseMaterialX(
    '<materialx version="1.39"><image name="a"><input name="file" type="filename" value="a.png"/></image></materialx>',
  );
  rewriteResourcePath(document, 'a.png', 'b.png');
  expect(document.nodes[0]?.inputs[0]?.value).toBe('b.png');
  document.elements[0]!.children[0]!.attributes.name = '';
  expect(validateDocument(document).some((issue) => issue.level === 'error')).toBe(true);
  expect(summarizeMaterialX('', document)).toEqual(
    summarizeMaterialX('', parseMaterialX(serializeMaterialX(document))),
  );
});

const makeGraphPackage = (name: string) => ({
  rootPath: 'm.mtlx',
  resources: [],
  document: parseMaterialX(`<materialx><nodegraph name="${name}"/></materialx>`),
});

it('derives all merged graphs rather than retaining the first input view', () => {
  // Use attributed graphs: empty element fidelity has a separate regression/fix.
  const result = mergeMaterialXPackages([makeGraphPackage('a'), makeGraphPackage('b')]);
  expect(result.document.nodeGraphs).toHaveLength(2);
  expect(summarizeMaterialX('', result.document).nodeGraphCount).toBe(2);
});

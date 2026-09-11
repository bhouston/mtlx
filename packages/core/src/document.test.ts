import { expect, it } from 'vitest';
import { parseMaterialX, serializeMaterialX } from './xml.js';
import { mergeMaterialXPackages, rewriteResourcePath } from './package.js';
import { summarizeMaterialX } from './summary.js';
import { validateDocument } from './validate.js';

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

it('derives all merged graphs rather than retaining the first input view', () => {
  const make = (name: string) => ({
    rootPath: 'm.mtlx',
    resources: [],
    document: parseMaterialX(`<materialx><nodegraph name="${name}"/></materialx>`),
  });
  // Use attributed graphs: empty element fidelity has a separate regression/fix.
  const result = mergeMaterialXPackages([make('a'), make('b')]);
  expect(result.document.nodeGraphs).toHaveLength(2);
  expect(summarizeMaterialX('', result.document).nodeGraphCount).toBe(2);
});

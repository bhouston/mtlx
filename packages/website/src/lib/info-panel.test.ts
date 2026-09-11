import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { InfoPanel } from '../components/InfoPanel';

it('describes the limited checks and warns independently of render errors', () => {
  const html = renderToStaticMarkup(
    createElement(InfoPanel, { fileName: 'test.mtlx', issues: [], viewerError: 'No GPU' }),
  );
  expect(html).toContain('Document checks passed');
  expect(html).toContain('0 warning');
  expect(html).toContain('Checks: XML, structure, types, dependencies and renderer categories');
  expect(html).toContain('3D preview error: No GPU');
});
it('does not label a parse failure as passing', () => {
  const html = renderToStaticMarkup(
    createElement(InfoPanel, { fileName: 'test.mtlx', issues: [], parseError: 'bad XML' }),
  );
  expect(html).toContain('Document checks failed');
});

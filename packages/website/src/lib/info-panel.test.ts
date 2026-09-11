import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { InfoPanel } from '../components/InfoPanel';

it('describes the limited checks and warns independently of render errors', () => {
  const html = renderToStaticMarkup(
    createElement(InfoPanel, { fileName: 'test.mtlx', issues: [], viewerError: 'No GPU' }),
  );
  expect(html).toContain('Basic document checks passed');
  expect(html).toContain('0 warning');
  expect(html).toContain('resource completeness and shader compatibility are not established');
  expect(html).toContain('3D preview error: No GPU');
});
it('does not label a parse failure as passing', () => {
  const html = renderToStaticMarkup(
    createElement(InfoPanel, { fileName: 'test.mtlx', issues: [], parseError: 'bad XML' }),
  );
  expect(html).toContain('Basic document checks failed');
});

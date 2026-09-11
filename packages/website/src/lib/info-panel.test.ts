import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { InfoPanel, type InfoPanelProps } from '../components/InfoPanel';

function render(props: Partial<InfoPanelProps> = {}) {
  const html = renderToStaticMarkup(
    createElement(InfoPanel, {
      fileName: 'test.mtlx',
      issues: [],
      resourcesChecked: true,
      preview: { state: 'ready', resources: 'loaded', failedResources: [] },
      ...props,
    }),
  );
  return new DOMParser().parseFromString(html, 'text/html');
}
it('collapses passing checks into one green summary', () => {
  const document = render();
  const checks = document.querySelector('[data-validity-state]')!;
  expect(checks.getAttribute('data-validity-state')).toBe('passed');
  expect(checks.hasAttribute('open')).toBe(false);
  expect(checks.querySelector('summary')!.textContent).toBe('Validity Checks ✓Passed');
  expect(document.body.textContent).not.toContain('0 warnings');
  expect(document.body.textContent).not.toContain('Shader compilation is checked');
});
it('expands failures and groups diagnostics under the check that failed', () => {
  const document = render({
    issues: [{ rule: 'types', level: 'error', location: 'roughness', message: 'Expected a float' }],
  });
  expect(document.querySelector('[data-validity-state]')!.hasAttribute('open')).toBe(true);
  expect(document.querySelector('[data-check="Types"]')!.getAttribute('data-check-state')).toBe('failed');
  expect(document.querySelector('[data-check="Types"]')!.textContent).toContain('roughness: Expected a float');
  expect(document.querySelector('[data-check="XML"]')!.getAttribute('data-check-state')).toBe('passed');
});
it('does not report unrun checks as passing after a parse failure', () => {
  const document = render({ parseError: 'bad XML', preview: undefined });
  expect(document.querySelector('[data-check="XML"]')!.getAttribute('data-check-state')).toBe('failed');
  expect(document.querySelector('[data-check="Structure"]')!.getAttribute('data-check-state')).toBe('unchecked');
  expect(document.querySelector('[data-validity-state]')!.hasAttribute('open')).toBe(true);
});
it('distinguishes warnings, unchecked dependencies, pending rendering and preview failures', () => {
  const warning = render({
    issues: [{ rule: 'renderer-support', level: 'warning', location: 'node', message: 'Unsupported category' }],
  });
  expect(warning.querySelector('[data-validity-state]')!.getAttribute('data-validity-state')).toBe('warning');
  expect(warning.querySelector('[data-validity-state]')!.hasAttribute('open')).toBe(true);
  const unchecked = render({ resourcesChecked: false });
  expect(unchecked.querySelector('[data-check="Dependencies"]')!.getAttribute('data-check-state')).toBe('unchecked');
  const pending = render({ preview: { state: 'loading', resources: 'loading', failedResources: [] } });
  expect(pending.querySelector('[data-validity-state]')!.getAttribute('data-validity-state')).toBe('pending');
  const failed = render({ viewerError: 'No GPU' });
  expect(failed.querySelector('[data-check="Preview"]')!.textContent).toContain('No GPU');
  expect(failed.querySelector('[data-validity-state]')!.hasAttribute('open')).toBe(true);
});

it('summarizes internal node types and usage counts without material nodes or instance names', () => {
  const document = render({
    summary: {
      path: 'test.mtlx',
      nodeGraphCount: 1,
      topLevelNodeCount: 3,
      nodeCategories: [],
      referencedTextures: [],
      materials: [
        { name: 'surface', category: 'surfacematerial' },
        { name: 'volume', category: 'volumematerial' },
      ],
      nodes: [
        { name: 'surface', category: 'surfacematerial' },
        { name: 'volume', category: 'volumematerial' },
        { name: 'shader_instance', category: 'standard_surface' },
        { name: 'multiply_a', category: 'multiply' },
        { name: 'multiply_b', category: 'multiply' },
        { name: 'multiply_c', category: 'multiply' },
      ],
    },
  });
  const section = [...document.querySelectorAll('details')].find(
    (element) => element.querySelector('summary')?.textContent === 'Internal Nodes (4)',
  )!;
  expect([...section.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
    'multiply (3)',
    'standard_surface (1)',
  ]);
  expect(section.textContent).not.toContain('shader_instance');
  expect(section.textContent).not.toContain('multiply_a');
  expect(section.textContent).not.toContain('surfacematerial');
  expect(section.textContent).not.toContain('volumematerial');
});

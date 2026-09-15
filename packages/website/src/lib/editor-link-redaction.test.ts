import { expect, it } from 'vitest';
import { redactEditorMaterialData, redactEditorMaterialLink } from './editor-link-redaction';
it('removes snapshot bytes from telemetry while retaining useful route and setting information', () => {
  expect(redactEditorMaterialLink('https://mtlx.test/editor?mode=view#material=abc_DEF-123')).toBe(
    'https://mtlx.test/editor?mode=view#material=[redacted]',
  );
  expect(redactEditorMaterialLink('/editor?material=local/compound')).toBe('/editor?material=local/compound');
  expect(redactEditorMaterialLink('material=abc_DEF')).toBe('material=[redacted]');
});
it('redacts nested error reports and breadcrumbs without mutating the original', () => {
  const original = {
    request: { url: '/editor#material=abc' },
    breadcrumbs: [{ data: { to: '/editor#material=def' } }],
    message: 'Failed /editor#material=ghi',
  };
  const result = redactEditorMaterialData(original);
  expect(result.request.url).toBe('/editor#material=[redacted]');
  expect(result.breadcrumbs[0]?.data.to).toBe('/editor#material=[redacted]');
  expect(result.message).toBe('Failed /editor#material=[redacted]');
  expect(original.request.url).toBe('/editor#material=abc');
});

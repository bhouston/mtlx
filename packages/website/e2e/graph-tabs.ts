import type { Page } from 'playwright';
import { expect } from 'vitest';

export async function checkGraphTabs(page: Page) {
  const preview = page.getByRole('tab', { name: '3D Preview', exact: true });
  const graph = page.getByRole('tab', { name: 'Graph', exact: true });
  expect(await preview.getAttribute('aria-selected')).toBe('true');
  const canvas = await page.locator('canvas').elementHandle();
  await preview.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => graph.getAttribute('aria-selected')).toBe('true');
  await expect.poll(() => page.locator('.react-flow__node').count()).toBeGreaterThan(0);
  const node = page.locator('.react-flow__node').first();
  await node.click();
  expect(await page.getByRole('button', { name: 'Delete node', exact: true }).count()).toBe(0);
  expect(
    await page.locator('.mtlx-inspector input:not(:disabled), .mtlx-inspector select:not(:disabled)').count(),
  ).toBe(0);
  const position = await node.evaluate((element) => element.style.transform);
  await node.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Delete');
  expect(await node.evaluate((element) => element.style.transform)).toBe(position);
  expect((await page.locator('.mtlx-canvas').boundingBox())!.height).toBeGreaterThan(200);
  await preview.click();
  expect(await canvas!.evaluate((element) => element === document.querySelector('canvas'))).toBe(true);
  expect(await page.locator('canvas').isVisible()).toBe(true);
}

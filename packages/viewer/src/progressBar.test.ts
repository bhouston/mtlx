// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { ProgressBar } from './progressBar.js';
it('starts hidden, exposes progress and a replacement slot, completes and resets', () => {
  const progress = new ProgressBar();
  expect(progress.root.hidden).toBe(true);
  expect(progress.root.querySelector('slot')!.name).toBe('progress-bar');
  progress.update(0.4);
  expect(progress.root.hidden).toBe(false);
  expect(progress.bar.style.transform).toBe('scaleX(0.4)');
  expect(progress.bar.getAttribute('aria-valuenow')).toBe('40');
  progress.update(1);
  expect(progress.bar.classList.contains('complete')).toBe(true);
  progress.clear();
  expect(progress.root.hidden).toBe(true);
  progress.update(0);
  expect(progress.bar.classList.contains('complete')).toBe(false);
});

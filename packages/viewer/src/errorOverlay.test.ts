// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { ErrorOverlay } from './errorOverlay.js';

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

it('renders untrusted error content as text and copies all error details', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const host = document.createElement('div');
  const overlay = new ErrorOverlay(host);
  host.append(overlay.root);
  document.body.append(host);
  overlay.show(
    'Unable to load',
    new TypeError('<img src=x onerror=alert(1)>', { cause: new Error('Network failed') }),
    '/missing.file',
  );
  expect(overlay.root.querySelector('img')).toBeNull();
  expect(overlay.root.hidden).toBe(false);
  overlay.root.querySelector<HTMLButtonElement>('.error-log-copy')!.click();
  await Promise.resolve();
  expect(writeText).toHaveBeenCalledWith(
    'Unable to load\n\n<img src=x onerror=alert(1)>\n\nTypeError\nSource: /missing.file\nCause: Network failed',
  );
  expect(overlay.root.querySelector('[role="status"]')!.textContent).toBe('Copied');
  overlay.root.querySelector<HTMLButtonElement>('.error-log-close')!.click();
  host.setAttribute('errors', 'silent');
  overlay.syncVisibility();
  host.removeAttribute('errors');
  overlay.syncVisibility();
  expect(overlay.root.hidden).toBe(true);
  overlay.show('New error', 'Something else');
  expect(overlay.root.hidden).toBe(false);
  overlay.clear();
  expect(overlay.root.hidden).toBe(true);
});

it('handles unavailable clipboard and ignores late clipboard feedback for an obsolete error', async () => {
  let complete!: () => void;
  const writeText = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const overlay = new ErrorOverlay(document.createElement('div'));
  overlay.show('First', 'First error');
  const copy = overlay.root.querySelector<HTMLButtonElement>('.error-log-copy')!;
  copy.click();
  overlay.show('Second', 'Second error');
  complete();
  await Promise.resolve();
  expect(overlay.root.querySelector('[role="status"]')!.textContent).toBe('');
  vi.stubGlobal('navigator', {});
  copy.click();
  await Promise.resolve();
  expect(overlay.root.querySelector('[role="status"]')!.textContent).toContain('Couldn’t copy');
  expect(copy.disabled).toBe(false);
});

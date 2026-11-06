// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { setCanvasDescription } from './accessibility.js';

it('preserves the generic fallback and exposes interaction help separately from custom descriptions', () => {
  const canvas = document.createElement('canvas');
  setCanvasDescription(canvas);
  expect(canvas.getAttribute('aria-label')).toBe('Material preview. Arrow keys pan the camera.');
  setCanvasDescription(canvas, '  Brushed copper with horizontal grain  ');
  expect(canvas.getAttribute('aria-label')).toBe('Brushed copper with horizontal grain');
  expect(canvas.getAttribute('aria-description')).toContain('Drag to orbit');
  expect(canvas.getAttribute('aria-description')).toContain('Arrow keys pan');
  setCanvasDescription(canvas, ' ');
  expect(canvas.getAttribute('aria-label')).toBe('Material preview. Arrow keys pan the camera.');
});

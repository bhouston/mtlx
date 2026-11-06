/** Keep the accessible name separate from instructions so host descriptions stay concise. */
export function setCanvasDescription(canvas: HTMLCanvasElement, alt?: string): void {
  const description = alt?.trim();
  canvas.setAttribute('aria-label', description || 'Material preview. Arrow keys pan the camera.');
  canvas.setAttribute(
    'aria-description',
    `Drag to orbit the camera. Scroll or pinch to zoom.${description ? ' Arrow keys pan the camera.' : ''}`,
  );
}

/** Shared presentation for the custom element and React viewer. Values match model-viewer's defaults. */
export const PROGRESS_BAR_STYLES = `
.mtlx-progress { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2; }
.mtlx-progress[hidden] { display: none; }
.mtlx-progress-fill {
  position: absolute; top: 0; left: 0; width: 100%;
  height: var(--progress-bar-height, 5px);
  background-color: var(--progress-bar-color, rgba(0, 0, 0, 0.4));
  transform-origin: top left; transition: transform 0.09s; pointer-events: none;
}
.mtlx-progress-fill.complete { opacity: 0; transition: transform 0.09s, opacity 0.3s 1s; }
@media (prefers-reduced-motion: reduce) { .mtlx-progress-fill { transition: none; } }
`;

export class ProgressBar {
  readonly root = document.createElement('div');
  readonly bar = document.createElement('div');
  #value: number | null = null;
  constructor() {
    this.root.className = 'mtlx-progress';
    this.root.hidden = true;
    const slot = document.createElement('slot');
    slot.name = 'progress-bar';
    this.bar.className = 'mtlx-progress-fill';
    this.bar.setAttribute('part', 'default-progress-bar');
    this.bar.setAttribute('role', 'progressbar');
    this.bar.setAttribute('aria-label', 'Loading material preview');
    this.bar.setAttribute('aria-valuemin', '0');
    this.bar.setAttribute('aria-valuemax', '100');
    slot.append(this.bar);
    this.root.append(slot);
  }
  update(value: number): void {
    // Replace the fill on reset so CSS cannot animate backwards from a previous load.
    if (this.#value === null || value < this.#value) {
      this.bar.remove();
      this.root.querySelector('slot')!.append(this.bar);
    }
    this.#value = value;
    this.root.hidden = false;
    this.bar.style.transform = `scaleX(${Math.max(0.02, value)})`;
    this.bar.classList.toggle('complete', value === 1);
    this.bar.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    this.bar.setAttribute('aria-hidden', String(value === 1));
  }
  clear(): void {
    this.#value = null;
    this.root.hidden = true;
  }
}

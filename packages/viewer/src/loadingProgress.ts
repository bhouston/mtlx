/** Overall loading progress, including processing and the first render. */
export interface LoadingProgress {
  totalProgress: number;
  reason: 'material-load' | 'environment-update' | 'geometry-update';
}

/** Aggregate overlapping activities. Progress never moves backwards within a loading cycle. */
export class LoadingTracker {
  #tasks = new Map<object, number>();
  #value = 0;
  constructor(private readonly publish: (progress: LoadingProgress) => void) {}
  reset(): void {
    this.#tasks.clear();
    this.#value = 0;
  }
  start(reason: LoadingProgress['reason']): (progress: number) => void {
    if ([...this.#tasks.values()].every((value) => value === 1)) {
      this.#tasks.clear();
      this.#value = 0;
    }
    const token = {};
    this.#tasks.set(token, 0);
    const update = (progress: number) => {
      if (!this.#tasks.has(token)) return;
      this.#tasks.set(token, Math.max(this.#tasks.get(token)!, Math.min(1, Math.max(0, progress))));
      const values = [...this.#tasks.values()];
      this.#value = Math.max(this.#value, values.reduce((sum, value) => sum + value, 0) / values.length);
      this.publish({ totalProgress: this.#value, reason });
    };
    update(0);
    return update;
  }
}

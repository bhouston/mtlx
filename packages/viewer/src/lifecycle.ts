/** Registers ownership immediately, including resources arriving after cancellation. */
export class CleanupScope {
  disposed = false;
  private releases: (() => void)[] = [];
  own(release: () => void): void {
    if (this.disposed) release();
    else this.releases.push(release);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const release of this.releases.splice(0).toReversed()) release();
  }
}

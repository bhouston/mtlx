function errorText(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value) ?? 'Unknown error';
    } catch {
      return 'Unable to serialize error details';
    }
  }
  return String(value);
}

/** The visible error UI; event dispatch remains the responsibility of each host. */
export class ErrorOverlay {
  readonly root: HTMLDivElement;
  #title: HTMLElement;
  #message: HTMLElement;
  #detail: HTMLElement;
  #copyStatus: HTMLElement;
  #host: HTMLElement;
  #active = false;
  #dismissed = false;
  #revision = 0;

  constructor(host: HTMLElement) {
    this.#host = host;
    const document = host.ownerDocument;
    this.root = document.createElement('div');
    this.root.className = 'error-log';
    this.root.hidden = true;
    this.root.setAttribute('role', 'alert');
    const header = document.createElement('div');
    header.className = 'error-log-header';
    const icon = document.createElement('span');
    icon.className = 'error-log-icon';
    icon.textContent = '!';
    icon.setAttribute('aria-hidden', 'true');
    this.#title = document.createElement('strong');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'error-log-close';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Dismiss error');
    close.addEventListener('click', () => {
      this.#dismissed = true;
      this.syncVisibility();
    });
    header.append(icon, this.#title, close);
    this.#message = document.createElement('p');
    this.#message.className = 'error-log-message';
    this.#detail = document.createElement('pre');
    this.#detail.className = 'error-log-detail';
    const footer = document.createElement('div');
    footer.className = 'error-log-footer';
    this.#copyStatus = document.createElement('span');
    this.#copyStatus.setAttribute('role', 'status');
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'error-log-copy';
    copy.textContent = 'Copy to clipboard';
    copy.addEventListener('click', async () => {
      const revision = this.#revision;
      const text = [this.#title.textContent, this.#message.textContent, this.#detail.textContent].join('\n\n');
      copy.disabled = true;
      try {
        await navigator.clipboard.writeText(text);
        if (revision === this.#revision) this.#copyStatus.textContent = 'Copied';
      } catch {
        if (revision === this.#revision) this.#copyStatus.textContent = 'Couldn’t copy. Select the text to copy.';
      } finally {
        copy.disabled = false;
      }
    });
    footer.append(this.#copyStatus, copy);
    this.root.append(header, this.#message, this.#detail, footer);
  }

  syncVisibility(): void {
    this.root.hidden = !this.#active || this.#dismissed || this.#host.getAttribute('errors') === 'silent';
  }

  clear(): void {
    ++this.#revision;
    this.#active = false;
    this.syncVisibility();
  }

  show(title: string, error: unknown, source?: string | null): void {
    ++this.#revision;
    this.#title.textContent = title;
    this.#message.textContent = errorText(error);
    const details = [error instanceof Error ? error.name : 'Error'];
    if (source) details.push(`Source: ${source}`);
    if (error instanceof Error && error.cause !== undefined) {
      details.push(`Cause: ${errorText(error.cause)}`);
    }
    this.#detail.textContent = details.join('\n');
    this.#copyStatus.textContent = '';
    this.#active = true;
    this.#dismissed = false;
    this.syncVisibility();
  }
}

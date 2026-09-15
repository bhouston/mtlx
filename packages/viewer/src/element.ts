/**
 * `<material-viewer src="model.mtlx">` — a drop-in custom element in the spirit of Google's
 * `<model-viewer>`. Bundles the studio/bridge IBLs and shaderball geometry so a host page needs
 * nothing but this script and a `src` pointing at a `.mtlx` or `.mtlx.zip` file.
 *
 * Attributes:
 * - `src` (required): the `.mtlx` / `.mtlx.zip` file to preview.
 * - `model`: a custom glTF/GLB URL to preview the material on, in place of the built-in shaderball.
 * - `ibl`: `bridge` (default) or `studio`, or a URL to a custom `.hdr`/`.exr`/`.png`/`.jpg` environment.
 * - `geometry`: `totem` | `sphere` | `cube` | `plane` | `custom` (the last selects `model`, if given).
 * - `material`: initial material name; defaults to the document's last material.
 * - `rotate`, `bloom`, `ao`: `"false"` to disable (all default on).
 * - `background`: `environment` (default) shows the IBL; `none` leaves the backdrop transparent.
 * - `tone-mapping`: one of {@link TONE_MAPPING_OPTIONS}; defaults to `neutral`.
 * - `exposure` (-2..2), `intensity` (0..2).
 * - `settings-panel`: `open` | `closed` | `hidden` (default) — a built-in overlay for the above.
 *   `closed` shows just the toggle button; `hidden` shows nothing.
 *
 * Attribute changes other than `src`/`model` are applied live via {@link Viewer.setSettings}.
 * For host apps that need diagnostics or programmatic control, use {@link createViewer} directly.
 */
import { createViewer, type Viewer } from './viewer.js';
import { parseEnvironmentFile } from './environment.js';
import {
  DEFAULT_VIEWER_SETTINGS,
  GEOMETRY_OPTIONS,
  IBL_OPTIONS,
  TONE_MAPPING_OPTIONS,
  type SettingsOption,
  type ViewerSettings,
} from './renderingSettings.js';

// Each asset is resolved directly from import.meta.url (not via a shared base URL variable) because
// that's the exact `new URL('literal', import.meta.url)` pattern bundlers (Vite, esbuild, webpack)
// statically detect and rewrite to a fingerprinted/served path; an indirect base loses that.
const SHADERBALL_URL = new URL('../assets/shaderball.glb', import.meta.url);
const BUILTIN_IBLS: Record<string, URL> = {
  studio: new URL('../assets/studio-environment.png', import.meta.url),
  bridge: new URL('../assets/default-environment.hdr', import.meta.url),
};
const RELOAD_ATTRIBUTES = new Set(['src', 'model']);
const PANEL_STATES = new Set(['open', 'closed']);

async function fetchBytes(url: string | URL): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
  return response.arrayBuffer();
}

const optionsHtml = (options: readonly SettingsOption[]) =>
  options.map(({ value, label }) => `<option value="${value}">${label}</option>`).join('');

const PANEL_STYLE = `
  :host { position: relative; }
  .viewport { position: absolute; inset: 0; }
  .toggle {
    position: absolute; right: 8px; bottom: 8px; z-index: 1;
    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
    background: rgba(20, 20, 24, 0.7); color: #fff; font-size: 16px; line-height: 1;
  }
  .panel {
    position: absolute; right: 8px; bottom: 48px; z-index: 1; width: 220px;
    background: rgba(20, 20, 24, 0.85); color: #fff; border-radius: 8px; padding: 10px 12px;
    font: 12px system-ui, sans-serif; display: none; flex-direction: column; gap: 8px;
  }
  .panel.open { display: flex; }
  .panel label { display: flex; flex-direction: column; gap: 2px; }
  .panel label.row { flex-direction: row; align-items: center; justify-content: space-between; }
  .panel select, .panel input[type="range"] { width: 100%; }
`;

const PANEL_HTML = `
  <label>Geometry<select id="geometry"></select></label>
  <label>Environment<select id="ibl"></select></label>
  <label>Material<select id="material"></select></label>
  <label>Tone mapping<select id="tone-mapping"></select></label>
  <label class="row"><span>Rotate</span><input id="rotate" type="checkbox" /></label>
  <label class="row"><span>Background</span><input id="background" type="checkbox" /></label>
  <label class="row"><span>Bloom</span><input id="bloom" type="checkbox" /></label>
  <label class="row"><span>Ambient occlusion</span><input id="ao" type="checkbox" /></label>
  <label>Exposure<input id="exposure" type="range" min="-2" max="2" step="0.1" /></label>
  <label>Intensity<input id="intensity" type="range" min="0" max="2" step="0.1" /></label>
`;

export class MaterialViewerElement extends HTMLElement {
  static get observedAttributes() {
    return [
      'src',
      'model',
      'ibl',
      'geometry',
      'material',
      'rotate',
      'bloom',
      'ao',
      'background',
      'tone-mapping',
      'exposure',
      'intensity',
      'settings-panel',
    ];
  }

  #viewer: Viewer | null = null;
  #generation = 0;
  readonly #viewportEl: HTMLDivElement;
  readonly #toggleEl: HTMLButtonElement;
  readonly #panelEl: HTMLDivElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = PANEL_STYLE;
    this.#viewportEl = document.createElement('div');
    this.#viewportEl.className = 'viewport';
    this.#toggleEl = document.createElement('button');
    this.#toggleEl.type = 'button';
    this.#toggleEl.className = 'toggle';
    this.#toggleEl.textContent = '⚙';
    this.#toggleEl.hidden = true;
    this.#toggleEl.setAttribute('aria-label', 'Viewer settings');
    this.#toggleEl.addEventListener('click', () => this.#panelEl.classList.toggle('open'));
    this.#panelEl = document.createElement('div');
    this.#panelEl.className = 'panel';
    this.#panelEl.innerHTML = PANEL_HTML;
    this.#panelEl.querySelector('#tone-mapping')!.innerHTML = optionsHtml(TONE_MAPPING_OPTIONS);
    shadow.append(style, this.#viewportEl, this.#toggleEl, this.#panelEl);
    this.#bindControls();
  }

  connectedCallback(): void {
    if (!this.style.display) this.style.display = 'block';
    this.#syncPanelState();
    void this.#load();
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'settings-panel') {
      this.#syncPanelState();
      return;
    }
    if (RELOAD_ATTRIBUTES.has(name)) {
      void this.#load();
      return;
    }
    void this.#viewer?.setSettings(this.#readSettings());
    this.#syncControls();
  }

  disconnectedCallback(): void {
    this.#generation++;
    this.#viewer?.dispose();
    this.#viewer = null;
  }

  #bindControls(): void {
    const bind = (id: string, attr: string, read: (el: HTMLInputElement) => string | null) => {
      const el = this.#panelEl.querySelector<HTMLInputElement>(`#${id}`)!;
      el.addEventListener('input', () => {
        const value = read(el);
        if (value === null) this.removeAttribute(attr);
        else this.setAttribute(attr, value);
      });
    };
    bind('geometry', 'geometry', (el) => el.value);
    bind('ibl', 'ibl', (el) => el.value);
    bind('material', 'material', (el) => el.value);
    bind('tone-mapping', 'tone-mapping', (el) => el.value);
    bind('rotate', 'rotate', (el) => (el.checked ? null : 'false'));
    bind('background', 'background', (el) => (el.checked ? null : 'none'));
    bind('bloom', 'bloom', (el) => (el.checked ? null : 'false'));
    bind('ao', 'ao', (el) => (el.checked ? null : 'false'));
    bind('exposure', 'exposure', (el) => el.value);
    bind('intensity', 'intensity', (el) => el.value);
  }

  #syncPanelState(): void {
    const state = this.getAttribute('settings-panel');
    const mode = PANEL_STATES.has(state ?? '') ? state! : 'hidden';
    this.#toggleEl.hidden = mode === 'hidden';
    this.#panelEl.classList.toggle('open', mode === 'open');
  }

  /** Rebuilds the geometry/environment/material option lists; call after a document (re)loads. */
  #buildOptions(): void {
    const modelUrl = this.getAttribute('model');
    const geometryOptions = modelUrl ? [...GEOMETRY_OPTIONS, { value: 'custom', label: 'Custom' }] : GEOMETRY_OPTIONS;
    this.#panelEl.querySelector<HTMLSelectElement>('#geometry')!.innerHTML = optionsHtml(geometryOptions);
    const iblAttr = this.getAttribute('ibl');
    const iblOptions =
      iblAttr && !BUILTIN_IBLS[iblAttr] ? [...IBL_OPTIONS, { value: iblAttr, label: 'Custom' }] : IBL_OPTIONS;
    this.#panelEl.querySelector<HTMLSelectElement>('#ibl')!.innerHTML = optionsHtml(iblOptions);
    const materialSelect = this.#panelEl.querySelector<HTMLSelectElement>('#material')!;
    const names = this.#viewer?.scene.materialNames ?? [];
    materialSelect.innerHTML = optionsHtml(names.map((name) => ({ value: name, label: name })));
    materialSelect.value = this.#viewer?.scene.activeMaterial ?? '';
  }

  #syncControls(): void {
    const settings = this.#readSettings();
    const set = (id: string, value: string | boolean) => {
      const el = this.#panelEl.querySelector<HTMLInputElement>(`#${id}`)!;
      if (typeof value === 'boolean') el.checked = value;
      else el.value = value;
    };
    set('geometry', settings.geometry);
    set('ibl', settings.ibl);
    set('tone-mapping', settings.toneMapping);
    set('rotate', settings.rotate);
    set('background', settings.background !== 'none');
    set('bloom', settings.bloom);
    set('ao', settings.ao);
    set('exposure', String(settings.exposure));
    set('intensity', String(settings.intensity));
  }

  #readSettings(): ViewerSettings {
    const bool = (name: string, fallback: boolean) =>
      this.hasAttribute(name) ? this.getAttribute(name) !== 'false' : fallback;
    const number = (name: string, fallback: number, min: number, max: number) => {
      const value = Number(this.getAttribute(name));
      return this.hasAttribute(name) && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
    };
    const toneMapping =
      TONE_MAPPING_OPTIONS.find(({ value }) => value === this.getAttribute('tone-mapping'))?.value ??
      DEFAULT_VIEWER_SETTINGS.toneMapping;
    return {
      ...DEFAULT_VIEWER_SETTINGS,
      ibl: this.getAttribute('ibl') ?? 'bridge',
      geometry: this.getAttribute('geometry') ?? (this.getAttribute('model') ? 'custom' : 'totem'),
      materialName: this.getAttribute('material') ?? '',
      rotate: bool('rotate', true),
      background: this.getAttribute('background') === 'none' ? 'none' : 'environment',
      bloom: bool('bloom', DEFAULT_VIEWER_SETTINGS.bloom),
      ao: bool('ao', DEFAULT_VIEWER_SETTINGS.ao),
      toneMapping,
      exposure: number('exposure', DEFAULT_VIEWER_SETTINGS.exposure, -2, 2),
      intensity: number('intensity', DEFAULT_VIEWER_SETTINGS.intensity, 0, 2),
    };
  }

  async #load(): Promise<void> {
    const src = this.getAttribute('src');
    const modelUrl = this.getAttribute('model');
    this.#viewer?.dispose();
    this.#viewer = null;
    if (!src) return;
    const generation = ++this.#generation;
    try {
      const [data, shaderBall] = await Promise.all([fetchBytes(src), fetchBytes(SHADERBALL_URL)]);
      if (generation !== this.#generation) return;
      const viewer = await createViewer({
        container: this.#viewportEl,
        data,
        fileName: src,
        shaderBall,
        settings: this.#readSettings(),
        loadEnvironment: async (kind) => {
          const asset = BUILTIN_IBLS[kind];
          return parseEnvironmentFile(await fetchBytes(asset ?? kind), asset ? asset.pathname : kind);
        },
        // Matches the geometry attribute's 'custom' fallback above; a later `model` change goes
        // through a full #load() instead (see RELOAD_ATTRIBUTES), so this closure need not react to it.
        loadGeometry: modelUrl ? async () => ({ data: await fetchBytes(modelUrl) }) : undefined,
        onError: (message) => this.dispatchEvent(new CustomEvent('error', { detail: message })),
      });
      if (generation !== this.#generation) {
        viewer.dispose();
        return;
      }
      this.#viewer = viewer;
      this.#buildOptions();
      this.#syncControls();
      this.dispatchEvent(new Event('load'));
    } catch (error) {
      if (generation !== this.#generation) return;
      const detail = error instanceof Error ? error.message : String(error);
      this.dispatchEvent(new CustomEvent('error', { detail }));
    }
  }
}

if (!customElements.get('material-viewer')) customElements.define('material-viewer', MaterialViewerElement);

import { getConfig } from './config.ts';
import type { CliDeps } from './deps.ts';

type ConfigDefaults = {
  org?: string;
  project?: string;
};

// `yargs-file-commands` dynamically imports each command module, which can produce a module
// instance distinct from the one `runCli.ts` statically imports this file as. A module-level
// `let` would then split into two independent singletons (writer and reader never agreeing).
// Storing the cache on `globalThis` keeps a single source of truth regardless of which module
// instance is touched. Refreshed on every `initializeConfigDefaults` call (once per `runCli`
// invocation in production; each test invocation gets its own deps/config, so this must not be
// a one-shot cache or a later test would see an earlier test's defaults).
const GLOBAL_KEY = '__mtlxCliConfigDefaults';

function getStore(): ConfigDefaults {
  const store = (globalThis as Record<string, unknown>)[GLOBAL_KEY] as ConfigDefaults | undefined;
  if (store) {
    return store;
  }
  const fresh: ConfigDefaults = {};
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = fresh;
  return fresh;
}

export async function initializeConfigDefaults(deps: CliDeps): Promise<void> {
  const store = getStore();
  try {
    const config = await getConfig(deps);
    store.org = config.org;
    store.project = config.project;
  } catch {
    store.org = undefined;
    store.project = undefined;
  }
}

export function getOrg(): string | undefined {
  return getStore().org;
}

export function getProject(): string | undefined {
  return getStore().project;
}

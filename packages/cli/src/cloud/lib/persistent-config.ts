import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Config } from './config.ts';

export type PersistentConfig = {
  get: () => Promise<Partial<Config>>;
  set: (config: Partial<Config>) => Promise<void>;
};

export const getConfigDir = (): string => join(homedir(), '.config', 'mtlx-ai');

export class FilePersistentConfig implements PersistentConfig {
  public readonly configDir: string;
  constructor(configDir: string = getConfigDir()) {
    this.configDir = configDir;
  }

  async get(): Promise<Partial<Config>> {
    try {
      const content = await readFile(join(this.configDir, 'config.json'), 'utf-8');
      return JSON.parse(content) as Partial<Config>;
    } catch (error) {
      // File doesn't exist or is invalid, return default
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  async set(config: Partial<Config>): Promise<void> {
    await mkdir(this.configDir, { recursive: true });
    await writeFile(join(this.configDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
  }
}

export class MemoryPersistentConfig implements PersistentConfig {
  private config: Partial<Config> = {};
  constructor(initialConfig: Partial<Config> = {}) {
    this.config = JSON.parse(JSON.stringify(initialConfig));
  }

  get(): Promise<Partial<Config>> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.config)));
  }

  set(config: Partial<Config>): Promise<void> {
    this.config = JSON.parse(JSON.stringify(config));
    return Promise.resolve();
  }
}

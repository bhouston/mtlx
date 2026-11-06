import type { Config } from '../index.ts';

export type EnvVarName = 'LOA_HOST' | 'LOA_TOKEN';

export type EnvVars = {
  get: (key: EnvVarName) => string | undefined;
};

export class ProcessEnvVars implements EnvVars {
  get(key: EnvVarName): string | undefined {
    return process.env[key];
  }
}

export class MemoryEnvVars implements EnvVars {
  private readonly env: Map<string, string>;

  constructor(initialEnv?: Record<string, string>) {
    this.env = new Map(Object.entries(initialEnv ?? {}));
  }

  get(key: EnvVarName): string | undefined {
    return this.env.get(key);
  }

  set(key: EnvVarName, value: string): void {
    this.env.set(key, value);
  }

  deleteEnv(key: EnvVarName): void {
    this.env.delete(key);
  }
}

export const getEnvConfig = (envVars: EnvVars): Partial<Config> => {
  const host = envVars.get('LOA_HOST');
  const token = envVars.get('LOA_TOKEN');

  return {
    ...(host ? { host } : {}),
    ...(token ? { auth: { type: 'secretToken', token } } : {}),
  };
};

import type { ArgumentsCamelCase } from 'yargs';
import type { EnvVars } from './env-vars.ts';
import { ProcessEnvVars } from './env-vars.ts';
import type { Logger } from './logger.ts';
import { ConsoleLogger } from './logger.ts';
import type { PersistentConfig } from './persistent-config.ts';
import { FilePersistentConfig } from './persistent-config.ts';

export type CliDeps = {
  persistentConfig: PersistentConfig;
  envVars: EnvVars;
  logger: Logger;
};

export const createDefaultCliDeps = (): CliDeps => ({
  persistentConfig: new FilePersistentConfig(),
  envVars: new ProcessEnvVars(),
  logger: new ConsoleLogger(),
});

export function setCliDeps(argv: ArgumentsCamelCase, deps: CliDeps): void {
  (argv as ArgumentsCamelCase & { deps: CliDeps }).deps = deps;
}

export function getCliDeps(argv: ArgumentsCamelCase): CliDeps {
  return (argv as ArgumentsCamelCase & { deps: CliDeps }).deps;
}

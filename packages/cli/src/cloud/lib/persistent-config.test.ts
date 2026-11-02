import { describe, expect, it } from 'vitest';
import { type Config, getConfig } from './config.ts';
import { MemoryEnvVars } from './env-vars.ts';
import { MemoryLogger } from './logger.ts';
import { MemoryPersistentConfig } from './persistent-config.ts';

describe('persistent-config', () => {
  describe('MemoryPersistentConfig - Dependency Injection', () => {
    it('should use injected MemoryEnvVars', async () => {
      const envVars = new MemoryEnvVars({
        LOA_HOST: 'https://injected-host.test',
        LOA_TOKEN: 'st_'.padEnd(39, 'x'),
      });
      const persistentConfig = new MemoryPersistentConfig();
      const deps = {
        persistentConfig,
        envVars,
      };

      const config = await getConfig(deps);

      expect(config.host).toBe('https://injected-host.test');
      expect(config.auth?.token).toBe('st_'.padEnd(39, 'x'));
    });

    it('should allow setting env vars dynamically', async () => {
      const envVars = new MemoryEnvVars();
      const persistentConfig = new MemoryPersistentConfig({
        host: 'https://global-host.test',
        org: 'test-org',
      });
      const deps = {
        persistentConfig,
        envVars,
      };

      envVars.set('LOA_HOST', 'https://api.global.test');
      // Initially no env vars - getEnvConfig() returns default host, so it takes precedence
      let config = await getConfig(deps);
      expect(config.host).toBe('https://api.global.test'); // new env config
      expect(config.org).toBe('test-org'); // global config still present

      // Set env var - now it should use the env var
      envVars.set('LOA_HOST', 'https://env-host.test');
      config = await getConfig(deps);
      expect(config.host).toBe('https://env-host.test'); // env takes precedence
      expect(config.org).toBe('test-org'); // global config still present
    });
  });

  describe('MemoryPersistentConfig - getConfig() vs get()', () => {
    it('should merge env vars with global config in getConfig()', async () => {
      const envVars = new MemoryEnvVars({
        LOA_HOST: 'https://env-host.test',
        LOA_TOKEN: 'st_env_token'.padEnd(39, 'x'),
      });
      const globalConfig: Config = {
        host: 'https://global-host.test',
        org: 'test-org',
        project: 'test-project',
      };
      const persistentConfig = new MemoryPersistentConfig(globalConfig);
      const deps = {
        persistentConfig,
        envVars,
      };

      const config = await getConfig(deps);

      // Env vars should take precedence
      expect(config.host).toBe('https://env-host.test');
      expect(config.auth?.token).toBe('st_env_token'.padEnd(39, 'x'));
      // Global config values should still be present
      expect(config.org).toBe('test-org');
      expect(config.project).toBe('test-project');
    });

    it('should return only global config in get()', async () => {
      const envVars = new MemoryEnvVars({
        LOA_HOST: 'https://env-host.test',
        LOA_TOKEN: 'st_env_token'.padEnd(39, 'x'),
      });
      const globalConfig: Config = {
        host: 'https://global-host.test',
        org: 'test-org',
        project: 'test-project',
      };
      envVars.set('LOA_HOST', 'https://global-host.test');
      const persistentConfig = new MemoryPersistentConfig(globalConfig);

      const config = await persistentConfig.get();

      // Should only return global config, no env vars
      expect(config.host).toBe('https://global-host.test');
      expect(config.auth).toBeUndefined();
      expect(config.org).toBe('test-org');
      expect(config.project).toBe('test-project');
    });

    it('should not include env vars in get() even when env vars change', async () => {
      const envVars = new MemoryEnvVars();
      const globalConfig: Config = {
        host: 'https://global-host.test',
        org: 'test-org',
      };
      const persistentConfig = new MemoryPersistentConfig(globalConfig);
      const logger = new MemoryLogger();
      const deps = {
        persistentConfig,
        envVars,
        logger,
      };

      const globalConfigResult = await persistentConfig.get();
      expect(globalConfigResult.host).toBe('https://global-host.test');
      expect(globalConfigResult.org).toBe('test-org');

      // Change env vars
      envVars.set('LOA_HOST', 'https://new-env-host.test');
      envVars.set('LOA_TOKEN', 'st_new_token'.padEnd(39, 'x'));

      const configResult = await getConfig(deps);
      expect(configResult.host).toBe('https://new-env-host.test');
      expect(configResult.auth?.token).toBe('st_new_token'.padEnd(39, 'x'));
      expect(configResult.org).toBe('test-org');

      // But getConfig() should include env vars
      const mergedConfig = await getConfig(deps);
      expect(mergedConfig.host).toBe('https://new-env-host.test');
      expect(mergedConfig.auth?.token).toBe('st_new_token'.padEnd(39, 'x'));
    });
  });

  describe('MemoryPersistentConfig - setConfig()', () => {
    it('should write to global config only', async () => {
      const envVars = new MemoryEnvVars({
        LOA_HOST: 'https://env-host.test',
      });
      const persistentConfig = new MemoryPersistentConfig({
        host: 'https://initial-host.test',
        org: 'initial-org',
      });
      const deps = {
        persistentConfig,
        envVars,
      };

      // Set new config
      await deps.persistentConfig.set({
        host: 'https://new-host.test',
        org: 'new-org',
        project: 'new-project',
      });

      // get() should return the new config
      const globalConfig = await deps.persistentConfig.get();
      expect(globalConfig.host).toBe('https://new-host.test');
      expect(globalConfig.org).toBe('new-org');
      expect(globalConfig.project).toBe('new-project');

      // getConfig() should merge with env vars
      const mergedConfig = await getConfig(deps);
      expect(mergedConfig.host).toBe('https://env-host.test'); // env takes precedence
      expect(mergedConfig.org).toBe('new-org'); // from global config
      expect(mergedConfig.project).toBe('new-project'); // from global config
    });

    it('should not be affected by env vars when setting config', async () => {
      const envVars = new MemoryEnvVars({
        LOA_HOST: 'https://env-host.test',
        LOA_TOKEN: 'st_env_token'.padEnd(39, 'x'),
      });
      const persistentConfig = new MemoryPersistentConfig();
      const deps = {
        persistentConfig,
        envVars,
      };

      // Set config with specific values
      await deps.persistentConfig.set({
        host: 'https://set-host.test',
        org: 'set-org',
      });

      // Change env vars after setting
      envVars.set('LOA_HOST', 'https://different-env-host.test');

      // get() should still return what was set (not affected by env vars)
      const globalConfig = await deps.persistentConfig.get();
      expect(globalConfig.host).toBe('https://set-host.test');
      expect(globalConfig.org).toBe('set-org');
      expect(globalConfig.auth).toBeUndefined();

      // But getConfig() should merge with current env vars
      const mergedConfig = await getConfig(deps);
      expect(mergedConfig.host).toBe('https://different-env-host.test'); // env takes precedence
      expect(mergedConfig.org).toBe('set-org'); // from global config
    });
  });

  describe('MemoryPersistentConfig - getRawConfig()', () => {
    it('should return raw stored config for testing', async () => {
      const config: Config = {
        host: 'https://test-host.test',
        org: 'test-org',
      };
      const persistentConfig = new MemoryPersistentConfig(config);

      const rawConfig = await persistentConfig.get();

      expect(rawConfig).toEqual(config);
      expect(rawConfig.host).toBe('https://test-host.test');
      expect(rawConfig.org).toBe('test-org');
    });
  });
});

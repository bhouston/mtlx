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
        user: 'test-user',
      });
      const deps = {
        persistentConfig,
        envVars,
      };

      envVars.set('LOA_HOST', 'https://api.global.test');
      // Initially no env vars - getEnvConfig() returns default host, so it takes precedence
      let config = await getConfig(deps);
      expect(config.host).toBe('https://api.global.test'); // new env config
      expect(config.user).toBe('test-user'); // global config still present

      // Set env var - now it should use the env var
      envVars.set('LOA_HOST', 'https://env-host.test');
      config = await getConfig(deps);
      expect(config.host).toBe('https://env-host.test'); // env takes precedence
      expect(config.user).toBe('test-user'); // global config still present
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
        user: 'test-user',
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
      expect(config.user).toBe('test-user');
    });

    it('should return only global config in get()', async () => {
      const envVars = new MemoryEnvVars({
        LOA_HOST: 'https://env-host.test',
        LOA_TOKEN: 'st_env_token'.padEnd(39, 'x'),
      });
      const globalConfig: Config = {
        host: 'https://global-host.test',
        user: 'test-user',
      };
      envVars.set('LOA_HOST', 'https://global-host.test');
      const persistentConfig = new MemoryPersistentConfig(globalConfig);

      const config = await persistentConfig.get();

      // Should only return global config, no env vars
      expect(config.host).toBe('https://global-host.test');
      expect(config.auth).toBeUndefined();
      expect(config.user).toBe('test-user');
    });

    it('should not include env vars in get() even when env vars change', async () => {
      const envVars = new MemoryEnvVars();
      const globalConfig: Config = {
        host: 'https://global-host.test',
        user: 'test-user',
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
      expect(globalConfigResult.user).toBe('test-user');

      // Change env vars
      envVars.set('LOA_HOST', 'https://new-env-host.test');
      envVars.set('LOA_TOKEN', 'st_new_token'.padEnd(39, 'x'));

      const configResult = await getConfig(deps);
      expect(configResult.host).toBe('https://new-env-host.test');
      expect(configResult.auth?.token).toBe('st_new_token'.padEnd(39, 'x'));
      expect(configResult.user).toBe('test-user');

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
        user: 'initial-user',
      });
      const deps = {
        persistentConfig,
        envVars,
      };

      // Set new config
      await deps.persistentConfig.set({
        host: 'https://new-host.test',
        user: 'new-user',
      });

      // get() should return the new config
      const globalConfig = await deps.persistentConfig.get();
      expect(globalConfig.host).toBe('https://new-host.test');
      expect(globalConfig.user).toBe('new-user');

      // getConfig() should merge with env vars
      const mergedConfig = await getConfig(deps);
      expect(mergedConfig.host).toBe('https://env-host.test'); // env takes precedence
      expect(mergedConfig.user).toBe('new-user'); // from global config
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
        user: 'set-user',
      });

      // Change env vars after setting
      envVars.set('LOA_HOST', 'https://different-env-host.test');

      // get() should still return what was set (not affected by env vars)
      const globalConfig = await deps.persistentConfig.get();
      expect(globalConfig.host).toBe('https://set-host.test');
      expect(globalConfig.user).toBe('set-user');
      expect(globalConfig.auth).toBeUndefined();

      // But getConfig() should merge with current env vars
      const mergedConfig = await getConfig(deps);
      expect(mergedConfig.host).toBe('https://different-env-host.test'); // env takes precedence
      expect(mergedConfig.user).toBe('set-user'); // from global config
    });
  });

  describe('MemoryPersistentConfig - getRawConfig()', () => {
    it('should return raw stored config for testing', async () => {
      const config: Config = {
        host: 'https://test-host.test',
        user: 'test-user',
      };
      const persistentConfig = new MemoryPersistentConfig(config);

      const rawConfig = await persistentConfig.get();

      expect(rawConfig).toEqual(config);
      expect(rawConfig.host).toBe('https://test-host.test');
      expect(rawConfig.user).toBe('test-user');
    });
  });
});

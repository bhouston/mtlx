import { beforeEach, describe, expect, it } from 'vitest';
import { getConfig } from '../../lib/config.ts';
import type { CliDeps } from '../../lib/deps.ts';
import { MemoryEnvVars } from '../../lib/env-vars.ts';
import { MemoryLogger } from '../../lib/logger.ts';
import { MemoryPersistentConfig } from '../../lib/persistent-config.ts';
import { runCli } from '../../runCli.ts';

describe('config commands', () => {
  let deps: CliDeps;
  let envVars: MemoryEnvVars;
  let logger: MemoryLogger;
  let persistentConfig: MemoryPersistentConfig;

  beforeEach(() => {
    persistentConfig = new MemoryPersistentConfig({});
    envVars = new MemoryEnvVars();
    logger = new MemoryLogger();
    deps = {
      persistentConfig,
      envVars,
      logger,
    };
  });

  describe('config get', () => {
    it('should return only global config (no env vars)', async () => {
      // Set global config
      await persistentConfig.set({
        host: 'https://api.global.test',
        user: 'test-user',
      });

      // Set env vars (should not appear in config get output)
      envVars.set('LOA_HOST', 'https://api.env.test');
      envVars.set('LOA_TOKEN', 'st_env_token'.padEnd(39, 'x'));

      await runCli(['config', 'get'], deps);

      const config = await persistentConfig.get();

      // Should only show global config, not env vars
      expect(config.host).toBe('https://api.global.test');
      expect(config.user).toBe('test-user');
      expect(config.auth).toBeUndefined(); // Not in global config
    });

    it('should return empty config when no global config is set', async () => {
      // Start with empty config
      await persistentConfig.set({
        host: 'https://api.test.example',
      });

      // Set env vars (should not appear)
      envVars.set('LOA_HOST', 'https://api.env.test');
      envVars.set('LOA_TOKEN', 'st_env_token'.padEnd(39, 'x'));

      await runCli(['config', 'get'], deps);

      const config = await persistentConfig.get();

      // Should only show what's in global config
      expect(config.host).toBe('https://api.test.example');
      expect(config.user).toBeUndefined(); // Not in global config
      expect(config.auth).toBeUndefined(); // Not in global config
    });

    describe('config set', () => {
      it('should read and write only global config (env vars should not interfere)', async () => {
        // Set initial global config
        await persistentConfig.set({
          host: 'https://api.initial.test',
          user: 'initial-user',
        });

        // Set env vars that should not interfere
        envVars.set('LOA_HOST', 'https://api.env-interference.test');
        envVars.set('LOA_TOKEN', 'st_env_token'.padEnd(39, 'x'));

        await runCli(['config', 'set', '--user', 'new-user'], deps);

        // Verify global config was updated correctly
        const globalConfig = await persistentConfig.get();
        expect(globalConfig.user).toBe('new-user');
        expect(globalConfig.host).toBe('https://api.initial.test'); // Should remain unchanged

        // Verify env vars didn't interfere
        expect(globalConfig.auth).toBeUndefined(); // Not set in global config
      });

      it('should update host in global config', async () => {
        await persistentConfig.set({
          host: 'https://api.old.test',
        });

        await runCli(['config', 'set', '--host', 'https://api.new.test'], deps);

        let globalConfig = await persistentConfig.get();
        expect(globalConfig.host).toBe('https://api.new.test');

        await runCli(['config', 'clear', '--host'], deps);

        globalConfig = await persistentConfig.get();
        expect(globalConfig.host).toBeUndefined();
      });

      describe('host validation', () => {
        it('should accept valid https:// URLs', async () => {
          await runCli(['config', 'set', '--host', 'https://api.example.com'], deps);
          const globalConfig = await persistentConfig.get();
          expect(globalConfig.host).toBe('https://api.example.com');
        });

        it('should accept valid http:// URLs', async () => {
          await runCli(['config', 'set', '--host', 'http://localhost:3700'], deps);
          const globalConfig = await persistentConfig.get();
          expect(globalConfig.host).toBe('http://localhost:3700');
        });

        it('should accept URLs with username and password', async () => {
          await runCli(['config', 'set', '--host', 'https://user:pass@api.example.com'], deps);
          const globalConfig = await persistentConfig.get();
          expect(globalConfig.host).toBe('https://user:pass@api.example.com');
        });

        it('should accept URLs with port', async () => {
          await runCli(['config', 'set', '--host', 'https://api.example.com:8080'], deps);
          const globalConfig = await persistentConfig.get();
          expect(globalConfig.host).toBe('https://api.example.com:8080');
        });

        it('should accept URLs with username, password, and port', async () => {
          await runCli(['config', 'set', '--host', 'https://user:pass@api.example.com:8080'], deps);
          const globalConfig = await persistentConfig.get();
          expect(globalConfig.host).toBe('https://user:pass@api.example.com:8080');
        });

        it('should reject URLs without http:// or https:// prefix', async () => {
          await expect(runCli(['config', 'set', '--host', 'api.example.com'], deps)).rejects.toThrow(
            'Host must start with http:// or https://',
          );
        });

        it('should reject invalid URL formats', async () => {
          await expect(runCli(['config', 'set', '--host', 'https://'], deps)).rejects.toThrow(
            'Invalid host URL format',
          );
        });

        it('should reject malformed URLs', async () => {
          await expect(runCli(['config', 'set', '--host', 'https://[invalid'], deps)).rejects.toThrow(
            'Invalid host URL format',
          );
        });
      });

      describe('user name validation', () => {
        it('should accept valid user names', async () => {
          await runCli(['config', 'set', '--user', 'my-user'], deps);
          const globalConfig = await persistentConfig.get();
          expect(globalConfig.user).toBe('my-user');
        });

        it('should accept user names with numbers', async () => {
          await runCli(['config', 'set', '--user', 'user123'], deps);
          const globalConfig = await persistentConfig.get();
          expect(globalConfig.user).toBe('user123');
        });

        it('should accept user names with dashes', async () => {
          await runCli(['config', 'set', '--user', 'my-user-name'], deps);
          const globalConfig = await persistentConfig.get();
          expect(globalConfig.user).toBe('my-user-name');
        });

        it('should reject user names starting with a number', async () => {
          await expect(runCli(['config', 'set', '--user', '123user'], deps)).rejects.toThrow('Invalid user name');
        });

        it('should reject user names with consecutive dashes', async () => {
          await expect(runCli(['config', 'set', '--user', 'my--user'], deps)).rejects.toThrow('Invalid user name');
        });

        it('should reject user names with trailing dashes', async () => {
          await expect(runCli(['config', 'set', '--user', 'my-user-'], deps)).rejects.toThrow('Invalid user name');
        });

        it('should reject user names that are too long', async () => {
          const longName = 'a'.repeat(31); // 31 characters, max is 30
          await expect(runCli(['config', 'set', '--user', longName], deps)).rejects.toThrow('Invalid user name');
        });

        it('should reject empty user names', async () => {
          await expect(runCli(['config', 'set', '--user', ''], deps)).rejects.toThrow('Invalid user name');
        });

        it('should reject user names with invalid characters', async () => {
          await expect(runCli(['config', 'set', '--user', 'my_user'], deps)).rejects.toThrow('Invalid user name');
        });
      });

      it('should persist config values correctly', async () => {
        // Set user
        await runCli(['config', 'set', '--user', 'persisted-user'], deps);

        // Verify it persisted
        let globalConfig = await persistentConfig.get();
        expect(globalConfig.user).toBe('persisted-user');

        // Update user
        await runCli(['config', 'set', '--user', 'updated-user'], deps);

        // Verify user updated
        globalConfig = await persistentConfig.get();
        expect(globalConfig.user).toBe('updated-user');
      });
    });

    describe('config clear', () => {
      it('should clear user from global config', async () => {
        // Set initial config
        await persistentConfig.set({
          host: 'https://api.test.example',
          user: 'test-user',
        });

        await runCli(['config', 'clear', '--user'], deps);

        const globalConfig = await persistentConfig.get();
        expect(globalConfig.user).toBeUndefined();
      });

      it('should reset host to default when cleared', async () => {
        await persistentConfig.set({
          host: 'https://api.custom.test',
          user: 'test-user',
        });

        await runCli(['config', 'clear', '--host'], deps);

        const globalConfig = await persistentConfig.get();
        expect(globalConfig.host).toBeUndefined(); // Should reset to empty
        expect(globalConfig.user).toBe('test-user'); // Should remain

        // and the defaults should be restored when getting the full config
        const fullConfig = await getConfig(deps);
        expect(fullConfig.host).toBe('https://api.mtlx.ai');
        expect(fullConfig.user).toBe('test-user');
      });

      it('should clear multiple values at once', async () => {
        await persistentConfig.set({
          host: 'https://api.custom.test',
          user: 'test-user',
        });

        await runCli(['config', 'clear', '--user', '--host'], deps);

        const globalConfig = await persistentConfig.get();
        expect(globalConfig.user).toBeUndefined();
        expect(globalConfig.host).toBeUndefined(); // Reset to default

        // and the defaults should be restored when getting the full config
        const fullConfig = await getConfig(deps);
        expect(fullConfig.host).toBe('https://api.mtlx.ai');
        expect(fullConfig.user).toBeUndefined();
      });
    });

    describe('config commands with env vars', () => {
      it('should show env vars in getConfig() but not in config get command', async () => {
        // Set global config
        await persistentConfig.set({
          host: 'https://api.global.test',
          user: 'global-user',
        });

        // Set env vars
        envVars.set('LOA_HOST', 'https://api.env.test');
        envVars.set('LOA_TOKEN', 'st_env_token'.padEnd(39, 'x'));

        // getConfig() should include env vars
        const mergedConfig = await persistentConfig.get();
        expect(mergedConfig.host).toBe('https://api.global.test'); // env takes precedence
        expect(mergedConfig.auth?.token).toBeUndefined();
        expect(mergedConfig.user).toBe('global-user'); // from global

        const fullConfig = await getConfig(deps);
        expect(fullConfig.host).toBe('https://api.env.test');
        expect(fullConfig.auth?.token).toBe('st_env_token'.padEnd(39, 'x'));
        expect(fullConfig.user).toBe('global-user');
      });
    });
  });
});

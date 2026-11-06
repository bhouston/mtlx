import { createServer, type Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CliDeps } from '../../lib/deps.ts';
import { MemoryEnvVars } from '../../lib/env-vars.ts';
import { MemoryLogger } from '../../lib/logger.ts';
import { MemoryPersistentConfig } from '../../lib/persistent-config.ts';
import { runCli } from '../../runCli.ts';

type AuthRequest = { path: string; authorization?: string; refreshToken?: string };

async function startAuthServer(): Promise<{ host: string; requests: AuthRequest[]; server: Server }> {
  const requests: AuthRequest[] = [];
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    requests.push({
      path: req.url ?? '',
      authorization: req.headers.authorization,
      refreshToken: body.refreshToken,
    });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/auth/refresh-access-token') {
      res.end(JSON.stringify({ accessToken: 'test-access-token' }));
    } else if (req.url?.startsWith('/notifications')) {
      res.end(JSON.stringify({ rows: [], rowCount: 0 }));
    } else {
      res.statusCode = 404;
      res.end('{}');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP server address');
  return { host: `http://127.0.0.1:${address.port}`, requests, server };
}

describe('auth status', () => {
  let persistentConfig: MemoryPersistentConfig;
  let envVars: MemoryEnvVars;
  let logger: MemoryLogger;
  let deps: CliDeps;
  const servers: Server[] = [];

  beforeEach(() => {
    persistentConfig = new MemoryPersistentConfig({});
    envVars = new MemoryEnvVars();
    logger = new MemoryLogger();
    deps = { persistentConfig, envVars, logger };
  });

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
  });

  it('validates the environment token against the environment host instead of stale saved credentials', async () => {
    const { host, requests, server } = await startAuthServer();
    servers.push(server);
    await persistentConfig.set({
      host: 'https://api.saved.test',
      auth: {
        type: 'session',
        token: 'stale-session',
        user: { id: 'old', name: 'Old User', email: 'old@example.test' },
      },
    });
    envVars.set('LOA_HOST', host);
    envVars.set('LOA_TOKEN', 'environment-token');

    await runCli(['auth', 'status'], deps);

    expect(requests).toEqual([
      { path: '/auth/refresh-access-token', authorization: undefined, refreshToken: 'environment-token' },
      { path: '/notifications?pageSize=1', authorization: 'Bearer test-access-token', refreshToken: undefined },
    ]);
    expect(logger.toString()).toContain('Token is valid');
    expect(logger.toString()).not.toContain('Old User');
  });

  it('uses --host over LOA_HOST while keeping the environment token', async () => {
    const { host, requests, server } = await startAuthServer();
    servers.push(server);
    envVars.set('LOA_HOST', 'https://api.env.test');
    envVars.set('LOA_TOKEN', 'environment-token');

    await runCli(['auth', 'status', '--host', host], deps);

    expect(requests[0]?.refreshToken).toBe('environment-token');
    expect(requests[1]?.path).toBe('/notifications?pageSize=1');
  });

  it('uses saved credentials when no environment token is set', async () => {
    const { host, requests, server } = await startAuthServer();
    servers.push(server);
    await persistentConfig.set({ host, auth: { type: 'secretToken', token: 'saved-token' } });

    await runCli(['auth', 'status'], deps);

    expect(requests[0]?.refreshToken).toBe('saved-token');
    expect(requests[1]?.authorization).toBe('Bearer test-access-token');
  });
});

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
export const PORT = Number(process.env.MTLX_DOCS_PORT ?? 3827);
export default async function () {
  const server = spawn('pnpm', ['exec', 'docusaurus', 'serve', '--port', String(PORT), '--no-open'], {
    stdio: 'inherit',
  });
  for (let i = 0; i < 100; i++) {
    if (
      await fetch(`http://localhost:${PORT}/`).then(
        () => true,
        () => false,
      )
    )
      return () => server.kill();
    await sleep(200);
  }
  server.kill();
  throw new Error('Documentation preview server did not start.');
}

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

// Serves the production build (`pnpm --filter website build` must have run first), because the
// react/react-dom version mismatch only surfaces in the SSR bundle, not the vite dev server.
export const PORT = 3123;

export default async function () {
  const server = spawn('node', ['.output/server/index.mjs'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
  });
  for (let i = 0; i < 50; i++) {
    if (
      await fetch(`http://localhost:${PORT}/`).then(
        () => true,
        () => false,
      )
    )
      break;
    await sleep(200);
  }
  return () => {
    server.kill();
  };
}

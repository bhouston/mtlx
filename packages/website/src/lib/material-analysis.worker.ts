import { analyzeBytes } from './material-analysis';

self.addEventListener('message', (event: MessageEvent<{ data: ArrayBuffer; name: string }>) => {
  const { data, name } = event.data;
  try {
    const analysis = analyzeBytes(data, name);
    self.postMessage({ data, analysis }, { transfer: [data] });
  } catch (error) {
    // Dedicated workers have no targetOrigin parameter.
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
});

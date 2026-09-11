import { analyzeBytes } from './material-analysis';

self.addEventListener(
  'message',
  async (event: MessageEvent<{ data: ArrayBuffer; name: string; resourceUrl?: string }>) => {
    const { data, name, resourceUrl } = event.data;
    try {
      const analysis = await analyzeBytes(data, name, resourceUrl);
      self.postMessage({ data, analysis }, { transfer: [data] });
    } catch (error) {
      // Dedicated workers have no targetOrigin parameter.
      // oxlint-disable-next-line unicorn/require-post-message-target-origin
      self.postMessage({ error: error instanceof Error ? error.message : String(error) });
    }
  },
);

import { readFile } from 'node:fs/promises';
import { readHdr } from 'hdrify';
import { expect, it, vi } from 'vitest';
import { Texture } from 'three';
import { createEnvironmentSwitcher, parseEnvironmentFile } from './environment.js';

it('keeps the bundled bridge HDR finite through half-float PMREM filtering', async () => {
  const bytes = await readFile(new URL('../assets/default-environment.hdr', import.meta.url));
  const source = readHdr(bytes);
  const texture = await parseEnvironmentFile(new Uint8Array(bytes).buffer, 'default-environment.hdr');
  const pixels = texture.image.data as Float32Array;

  expect(source.data.some((value) => value > 65_504)).toBe(true);
  expect(pixels.every((value) => Number.isFinite(value) && Math.abs(value) <= 65_504)).toBe(true);
  expect(pixels[0]).toBe(source.data[0]);
  expect(pixels[1]).toBe(source.data[1]);
  expect(pixels[2]).toBe(source.data[2]);
  expect(pixels.reduce((max, value) => Math.max(max, value), -Infinity)).toBe(65_504);
  texture.dispose();
});

it('keeps the current IBL on failure and disposes replaced, stale and late resources', async () => {
  const sources: Texture[] = [];
  let complete!: (texture: Texture) => void;
  const load = vi
    .fn()
    .mockImplementationOnce(async () => new Texture())
    .mockImplementationOnce(
      () =>
        new Promise<Texture>((resolve) => {
          complete = resolve;
        }),
    )
    .mockImplementationOnce(async () => new Texture())
    .mockRejectedValueOnce(new Error('offline'));
  const targets: Array<{ texture: Texture; dispose: ReturnType<typeof vi.fn> }> = [];
  const apply = vi.fn();
  const controller = createEnvironmentSwitcher(
    async (kind) => {
      const source = await load(kind);
      sources.push(source);
      vi.spyOn(source, 'dispose');
      return source;
    },
    () => {
      const target = { texture: new Texture(), dispose: vi.fn() };
      targets.push(target);
      return target;
    },
    apply,
  );
  await controller.set('studio');
  const stale = controller.set('default');
  await controller.set('studio');
  complete(new Texture());
  expect(await stale).toBe(false);
  expect(apply).toHaveBeenCalledTimes(2);
  expect(targets[0]!.dispose).toHaveBeenCalledTimes(1);
  await expect(controller.set('default')).rejects.toThrow('offline');
  expect(targets[1]!.dispose).not.toHaveBeenCalled();
  controller.dispose();
  controller.dispose();
  expect(targets[1]!.dispose).toHaveBeenCalledTimes(1);
  expect(sources.every((source) => vi.mocked(source.dispose).mock.calls.length === 1)).toBe(true);
  load.mockImplementationOnce(
    () =>
      new Promise<Texture>((resolve) => {
        complete = resolve;
      }),
  );
  const late = controller.set('default');
  const texture = new Texture();
  complete(texture);
  expect(await late).toBe(false);
  expect(texture.dispose).toHaveBeenCalledTimes(1);
});

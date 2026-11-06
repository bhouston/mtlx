import { expect, it, vi } from 'vitest';
import { Mesh, MeshBasicMaterial, Texture, type BufferGeometry, type Scene } from 'three/webgpu';
import { createViewerEnvironmentSwitcher } from './neutralEnvironment.js';

it('generates unclipped neutral HDR lighting without I/O and reuses it across environment switches', async () => {
  const studio = { texture: new Texture(), dispose: vi.fn() };
  const photo = { texture: new Texture(), dispose: vi.fn() };
  const pmrem = {
    fromScene: vi.fn((scene: Scene) => {
      // Catch the previous PNG bake's clipped/dim light panels and any introduced color cast.
      const panels = scene.children.filter(
        (child): child is Mesh<BufferGeometry, MeshBasicMaterial> =>
          child instanceof Mesh && child.material instanceof MeshBasicMaterial,
      );
      expect(panels).toHaveLength(7);
      for (const panel of panels) {
        const { r, g, b } = panel.material.color;
        expect(r).toBe(g);
        expect(g).toBe(b);
      }
      expect(Math.max(...panels.map((panel) => panel.material.color.r))).toBe(80);
      return studio;
    }),
    fromEquirectangular: vi.fn(() => photo),
  };
  const source = new Texture();
  const disposeSource = vi.spyOn(source, 'dispose');
  const load = vi.fn(async () => source);
  const apply = vi.fn();
  const environments = createViewerEnvironmentSwitcher(pmrem, load, apply);
  await environments.set('studio');
  expect(load).not.toHaveBeenCalled();
  expect(pmrem.fromScene).toHaveBeenCalledWith(expect.anything(), 0.04, 0.1, 100, { size: 256 });
  expect(apply).toHaveBeenLastCalledWith(studio.texture);
  await environments.set('bridge');
  expect(load).toHaveBeenCalledWith('bridge');
  expect(disposeSource).toHaveBeenCalledOnce();
  expect(studio.dispose).not.toHaveBeenCalled();
  await environments.set('studio');
  expect(pmrem.fromScene).toHaveBeenCalledOnce();
  expect(apply).toHaveBeenLastCalledWith(studio.texture);
  expect(photo.dispose).toHaveBeenCalledOnce();
  environments.dispose();
  environments.dispose();
  expect(studio.dispose).toHaveBeenCalledOnce();
});

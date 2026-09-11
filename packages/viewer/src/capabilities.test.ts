import { expect, it } from 'vitest';
// These three.js internals have no type declarations. Test against the installed renderer so
// upgrades cannot silently leave the lightweight host/worker inventory behind.
// @ts-expect-error untyped three.js addon
import { createMaterialXCompileRegistry } from 'three/addons/loaders/materialx/compile/MaterialXCompileRegistry.js';
// @ts-expect-error untyped three.js addon
import { MtlXLibrary } from 'three/addons/loaders/materialx/MaterialXNodeLibrary.js';
// @ts-expect-error untyped three.js addon
import { MaterialXSurfaceMappings } from 'three/addons/loaders/materialx/MaterialXSurfaceMappings.js';
import { supportedMaterialXCategories } from './capabilities.js';
it('matches the renderer category inventory', () => {
  expect(supportedMaterialXCategories).toEqual(
    [
      ...new Set([
        ...createMaterialXCompileRegistry().keys(),
        ...Object.keys(MtlXLibrary),
        ...Object.keys(MaterialXSurfaceMappings),
        'surfacematerial',
      ]),
    ].toSorted(),
  );
});

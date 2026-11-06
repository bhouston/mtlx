import { expect, it, vi } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three/webgpu';
import { applyCameraSettings, readCameraSettings } from './camera.js';
import { parseCameraSettings } from './cameraSettings.js';

it('validates camera units and bounds and canonicalizes URL/attribute values', () => {
  expect(
    parseCameraSettings({ cameraOrbit: '390deg 70deg 2m', cameraTarget: '.1m 0 -2m', fieldOfView: '35deg' }),
  ).toEqual({
    cameraOrbit: '30deg 70deg 2m',
    cameraTarget: '0.1m 0m -2m',
    fieldOfView: 35,
  });
  for (const cameraOrbit of [
    '0 0 2',
    '0 180 2',
    '0 60 0',
    '0 60 -1',
    '0 60 1001',
    '0rad 60deg 2m',
    '0deg 60deg 2deg',
    'NaN 60 2',
    'calc(1) 60 2',
    '0 60 2 extra',
  ])
    expect(parseCameraSettings({ cameraOrbit })).toEqual({});
  for (const cameraTarget of ['NaN 0 0', '0deg 0m 0m', '1001 0 0', '0 0', 'Infinity 0 0'])
    expect(parseCameraSettings({ cameraTarget })).toEqual({});
  for (const fieldOfView of [0, 121, Infinity, NaN, '45m', true, null, ''])
    expect(parseCameraSettings({ fieldOfView })).toEqual({});
});

it('round-trips orbit, pan, field of view and perspective zoom without altering the projected framing', () => {
  const camera = new PerspectiveCamera(60, 1.4, 0.01, 1000);
  const controls = { target: new Vector3(0.15, -0.2, 0.1), enableDamping: true, update: vi.fn() };
  camera.position.set(1.2, 1.8, 2.6);
  camera.zoom = 2;
  camera.lookAt(controls.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const point = new Vector3(0.3, 0.4, 0.2);
  const expected = point.clone().project(camera);
  const framing = readCameraSettings(camera, controls);
  expect(framing.cameraTarget).toBe('0.15m -0.2m 0.1m');
  const restored = new PerspectiveCamera(45, 1.4, 0.01, 1000);
  restored.position.set(0, 0, 3);
  const restoredControls = { target: new Vector3(), enableDamping: true, update: vi.fn() };
  applyCameraSettings(restored, restoredControls, parseCameraSettings(framing));
  restored.updateMatrixWorld();
  const actual = point.clone().project(restored);
  expect(actual.x).toBeCloseTo(expected.x, 5);
  expect(actual.y).toBeCloseTo(expected.y, 5);
  expect(restored.zoom).toBe(1);
  expect(restoredControls.enableDamping).toBe(true);
  expect(restoredControls.target.distanceTo(controls.target)).toBeLessThan(1e-6);
});

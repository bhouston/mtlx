import { MathUtils, Spherical, Vector3, type PerspectiveCamera } from 'three/webgpu';
import { cameraNumber, cameraOrbitValues, cameraTargetValues, type CameraSettings } from './cameraSettings.js';

interface CameraControls {
  target: Vector3;
  enableDamping: boolean;
  update(): unknown;
}

/** Apply framing without retaining any pending orbit/pan damping from the previous view. */
export function applyCameraSettings(
  camera: PerspectiveCamera,
  controls: CameraControls,
  settings: CameraSettings,
): void {
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  const offset = camera.position.clone().sub(controls.target);
  const target = cameraTargetValues(settings.cameraTarget);
  if (target) controls.target.fromArray(target);
  const orbit = cameraOrbitValues(settings.cameraOrbit);
  if (orbit)
    offset.setFromSpherical(new Spherical(orbit[2], MathUtils.degToRad(orbit[1]), MathUtils.degToRad(orbit[0])));
  camera.position.copy(controls.target).add(offset);
  if (settings.fieldOfView !== undefined) camera.fov = settings.fieldOfView;
  camera.zoom = 1;
  camera.near = Math.max(offset.length() / 1000, 0.001);
  camera.far = Math.max(offset.length() * 100, 1000);
  camera.updateProjectionMatrix();
  camera.lookAt(controls.target);
  controls.update();
  controls.enableDamping = damping;
}

/** Flatten perspective zoom into effective FOV so orbit, pan and zoom round-trip together. */
export function readCameraSettings(
  camera: PerspectiveCamera,
  controls: Pick<CameraControls, 'target'>,
): Required<CameraSettings> {
  const orbit = new Spherical().setFromVector3(new Vector3().subVectors(camera.position, controls.target));
  return {
    cameraOrbit: `${cameraNumber(MathUtils.radToDeg(orbit.theta))}deg ${cameraNumber(MathUtils.radToDeg(orbit.phi))}deg ${cameraNumber(orbit.radius)}m`,
    cameraTarget: controls.target
      .toArray()
      .map((value) => `${cameraNumber(value)}m`)
      .join(' '),
    fieldOfView: Number(cameraNumber(camera.getEffectiveFOV())),
  };
}

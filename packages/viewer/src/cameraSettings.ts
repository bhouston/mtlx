/** Optional declarative framing. Geometry is normalized to a one-meter cube before framing. */
export interface CameraSettings {
  /** Azimuth and polar angle in degrees, then distance in meters: `30deg 65deg 2m`. */
  cameraOrbit?: string;
  /** Camera aim point in normalized scene meters: `0m 0m 0m`. */
  cameraTarget?: string;
  /** Vertical field of view in degrees, between 1 and 120. */
  fieldOfView?: number;
}

const numberToken = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:deg|m)?$/i;
const scalar = (input: unknown, unit: 'deg' | 'm'): number | undefined => {
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;
  if (typeof input !== 'string' || !numberToken.test(input.trim())) return;
  const token = input.trim();
  if (/[a-z]$/i.test(token) && !token.toLowerCase().endsWith(unit)) return;
  const value = Number(token.replace(new RegExp(`${unit}$`, 'i'), ''));
  return Number.isFinite(value) ? value : undefined;
};
export const cameraNumber = (value: number): string => String(Number(value.toFixed(6)));

export function cameraOrbitValues(input: unknown): [number, number, number] | undefined {
  if (typeof input !== 'string') return;
  const tokens = input.trim().split(/\s+/);
  if (tokens.length !== 3) return;
  const azimuth = scalar(tokens[0], 'deg');
  const polar = scalar(tokens[1], 'deg');
  const radius = scalar(tokens[2], 'm');
  if (
    azimuth === undefined ||
    polar === undefined ||
    radius === undefined ||
    polar < 0.01 ||
    polar > 179.99 ||
    radius < 0.01 ||
    radius > 1000
  )
    return;
  return [((((azimuth + 180) % 360) + 360) % 360) - 180, polar, radius];
}
export function cameraTargetValues(input: unknown): [number, number, number] | undefined {
  if (typeof input !== 'string') return;
  const tokens = input.trim().split(/\s+/);
  if (tokens.length !== 3) return;
  const values = tokens.map((token) => scalar(token, 'm'));
  if (values.some((value) => value === undefined || Math.abs(value) > 1000)) return;
  return [values[0]!, values[1]!, values[2]!];
}

/** Canonical, finite camera values shared by attributes and URL search parameters. */
export function parseCameraSettings(input: {
  cameraOrbit?: unknown;
  cameraTarget?: unknown;
  fieldOfView?: unknown;
}): CameraSettings {
  const result: CameraSettings = {};
  const orbit = cameraOrbitValues(input.cameraOrbit);
  if (orbit)
    result.cameraOrbit = `${cameraNumber(orbit[0])}deg ${cameraNumber(orbit[1])}deg ${cameraNumber(orbit[2])}m`;
  const target = cameraTargetValues(input.cameraTarget);
  if (target) result.cameraTarget = target.map((value) => `${cameraNumber(value)}m`).join(' ');
  const fov = scalar(input.fieldOfView, 'deg');
  if (fov !== undefined && fov >= 1 && fov <= 120) result.fieldOfView = fov;
  return result;
}

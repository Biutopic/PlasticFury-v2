import { WAVE_AMPLITUDE, WAVE_FREQUENCY } from './constants';

/** Returns Y height of the ocean surface at (x, z) for a given time. */
export function getWaveHeight(x: number, z: number, time: number): number {
  return (
    Math.sin(x * WAVE_FREQUENCY + time * 1.2) * WAVE_AMPLITUDE +
    Math.sin(z * WAVE_FREQUENCY * 0.8 + time * 0.9) * WAVE_AMPLITUDE * 0.6 +
    Math.cos((x + z) * WAVE_FREQUENCY * 0.5 + time * 0.7) * WAVE_AMPLITUDE * 0.3
  );
}

/** Returns approximate surface normal (tilt) for boat bobbing. */
export function getWaveTilt(x: number, z: number, time: number): { tiltX: number; tiltZ: number } {
  const eps = 0.5;
  const hC = getWaveHeight(x, z, time);
  const hX = getWaveHeight(x + eps, z, time);
  const hZ = getWaveHeight(x, z + eps, time);
  return {
    tiltX: Math.atan2(hZ - hC, eps) * 0.6,
    tiltZ: -Math.atan2(hX - hC, eps) * 0.6,
  };
}

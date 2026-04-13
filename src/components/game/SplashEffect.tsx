import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWaveHeight } from '@/game/waveUtils';
import type { CollisionEvent } from '@/game/types';

const SPLASH_DURATION = 1.1;
const RING_DURATION = 0.75;
const PARTICLE_COUNT = 22;

function SplashParticles({ event }: { event: CollisionEvent }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const startY = useRef<number | null>(null);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      // Spread evenly around a circle + some randomness
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const speed = 2.5 + Math.random() * 5;
      return {
        vx: Math.cos(angle) * speed,
        vy: 4.5 + Math.random() * 8,
        vz: Math.sin(angle) * speed,
        size: 0.08 + Math.random() * 0.18,
      };
    });
  }, [event.id]);

  useFrame(() => {
    if (!meshRef.current) return;
    const now = performance.now() / 1000;
    const elapsed = now - event.time;
    const t = elapsed / SPLASH_DURATION;

    if (t >= 1) {
      meshRef.current.visible = false;
      return;
    }

    if (startY.current === null) {
      startY.current = getWaveHeight(event.x, event.z, event.time) + 0.4;
    }

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, 1 - t * 1.4);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const x = event.x + p.vx * elapsed;
      const y = startY.current! + p.vy * elapsed - 9.8 * elapsed * elapsed;
      const z = event.z + p.vz * elapsed;

      dummy.position.set(x, Math.max(y, startY.current! - 0.2), z);
      dummy.scale.setScalar(p.size * Math.max(0, 1 - t));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 5, 4]} />
      <meshBasicMaterial color="#c8ecf8" transparent opacity={0.9} depthWrite={false} />
    </instancedMesh>
  );
}

function RingShockwave({ event }: { event: CollisionEvent }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startY = useRef<number | null>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const now = performance.now() / 1000;
    const elapsed = now - event.time;
    const t = elapsed / RING_DURATION;

    if (t >= 1) {
      meshRef.current.visible = false;
      return;
    }

    if (startY.current === null) {
      startY.current = getWaveHeight(event.x, event.z, event.time) + 0.1;
    }

    // Ease-out expansion
    const eased = 1 - (1 - t) * (1 - t);
    meshRef.current.scale.setScalar(1 + eased * 9);
    meshRef.current.position.set(event.x, startY.current!, event.z);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.65;
  });

  return (
    <mesh ref={meshRef} position={[event.x, 0, event.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.7, 1.15, 36]} />
      <meshBasicMaterial color="#7fd4f0" transparent opacity={0.65} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/** Render splash particles + ring for every damage-type collision event. */
export default function SplashEffect({ events }: { events: CollisionEvent[] }) {
  // Only show splashes for damage hits (not the steal text)
  const damageEvents = events.filter(e => e.text.startsWith('-'));
  return (
    <>
      {damageEvents.map(e => (
        <group key={e.id}>
          <SplashParticles event={e} />
          <RingShockwave event={e} />
        </group>
      ))}
    </>
  );
}

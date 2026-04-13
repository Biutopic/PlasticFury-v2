import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getWaveHeight, getWaveTilt } from '@/game/waveUtils';
import type { PirateState } from '@/game/types';

const PIRATE_SHIP_PATH = '/assets/low-poly_pirate_ship/scene.gltf';
// Native model is ~5400 units wide after internal 0.01 matrix = ~54 units.
// Scale 0.07 → ~3.8 unit wide ship.
const PIRATE_SCALE = 0.1;

function disableCulling(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) child.frustumCulled = false;
  });
}

function PirateShipGLTF() {
  const { scene } = useGLTF(PIRATE_SHIP_PATH);
  const cloned = useMemo(() => {
    const c = scene.clone();
    disableCulling(c);
    return c;
  }, [scene]);
  return <primitive object={cloned} 
  scale={[PIRATE_SCALE, PIRATE_SCALE, PIRATE_SCALE]} 
  rotation={[0, 3 * Math.PI / 8, 0]}
  />;
}

useGLTF.preload(PIRATE_SHIP_PATH);

interface Props {
  pirate: PirateState;
}

export default function PirateModel({ pirate }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const waveY = getWaveHeight(pirate.x, pirate.z, t);
    const { tiltX, tiltZ } = getWaveTilt(pirate.x, pirate.z, t);
    groupRef.current.position.set(pirate.x, waveY + 0.3, pirate.z);
    groupRef.current.rotation.set(tiltX, pirate.rotation, tiltZ);
  });

  return (
    <group ref={groupRef} frustumCulled={false}>
      <PirateShipGLTF />
      {/* Red warning ring so players can spot the pirate */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <ringGeometry args={[2.4, 2.7, 32]} />
        <meshBasicMaterial color="#cc0000" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

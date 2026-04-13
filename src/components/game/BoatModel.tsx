import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getWaveHeight, getWaveTilt } from '@/game/waveUtils';
import type { PlayerState } from '@/game/types';

const LEVEL_SCALE: Record<number, number> = {
  1: 1.0,
  2: 1.0,
  3: 1.0,
  4: 1.0,
  5: 1.0,
};

interface Props {
  player: PlayerState;
  isLocalPlayer?: boolean;
}

/** Disable frustum culling on all meshes in a scene graph. */
function disableCulling(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.frustumCulled = false;
    }
  });
}

// function BaseBoatModel() {
//   const { scene } = useGLTF('/assets/fishing_boat_gltf/scene.gltf');
//   const cloned = useMemo(() => {
//     const c = scene.clone();
//     disableCulling(c);
//     return c;
//   }, [scene]);
//   return <primitive object={cloned} rotation={[0, Math.PI / 2, 0]} />;
// }

// useGLTF.preload('/assets/fishing_boat_gltf/scene.gltf');



function BaseBoatModel() {
  // const { scene } = useGLTF('/assets/dredge_fan_art_gltf/scene.gltf');
  const { scene } = useGLTF('/assets/renaud8000.glb');
  const cloned = useMemo(() => {
    const c = scene.clone();
    disableCulling(c);
    return c;
  }, [scene]);
  return <primitive object={cloned} rotation={[0, - Math.PI / 2, 0]} 
  position={[0, 0.8, 0]}
  scale={10.0} 
  />;
}
  // return <primitive object={cloned} rotation={[0, Math.PI / 2, 0]} />;

useGLTF.preload('/assets/renaud8000.glb');

export default function BoatModel({ player, isLocalPlayer }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const waveY = getWaveHeight(player.x, player.z, t);
    const { tiltX, tiltZ } = getWaveTilt(player.x, player.z, t);

    groupRef.current.position.set(player.x, waveY + 0.3, player.z);
    groupRef.current.rotation.set(tiltX, player.rotation, tiltZ);
  });

  const s = LEVEL_SCALE[player.boatLevel] ?? 1.0;

  return (
    <group ref={groupRef} frustumCulled={false}>
      <group scale={[s, s, s]}>
        <BaseBoatModel />
      </group>
      {isLocalPlayer && (
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
          <ringGeometry args={[1.8 * s, 2.0 * s, 32]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

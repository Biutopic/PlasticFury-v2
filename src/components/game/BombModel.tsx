import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { BombState } from '@/game/types';
import { PIRATE_BOMB_ARC_HEIGHT } from '@/game/constants';

const BOMB_PATH = '/assets/pirate_bomb.glb';
const BOMB_SCALE = 0.25;

function disableCulling(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) child.frustumCulled = false;
  });
}

function BombGLTF() {
  const { scene } = useGLTF(BOMB_PATH);
  const cloned = useMemo(() => {
    const c = scene.clone();
    disableCulling(c);
    return c;
  }, [scene]);
  return <primitive object={cloned} scale={[BOMB_SCALE, BOMB_SCALE, BOMB_SCALE]} />;
}

useGLTF.preload(BOMB_PATH);

interface Props {
  bomb: BombState;
}

export default function BombModel({ bomb }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = bomb.progress; // 0..1

    // Linear interpolation for x, z
    const x = bomb.originX + (bomb.targetX - bomb.originX) * t;
    const z = bomb.originZ + (bomb.targetZ - bomb.originZ) * t;

    // Parabolic arc for y: y = 4 * H * t * (1 - t)
    const y = 4 * PIRATE_BOMB_ARC_HEIGHT * t * (1 - t) + 0.3;

    groupRef.current.position.set(x, y, z);

    // Spin the bomb as it tumbles through the air
    groupRef.current.rotation.x = clock.getElapsedTime() * 4;
    groupRef.current.rotation.z = clock.getElapsedTime() * 2;
  });

  return (
    <group ref={groupRef} frustumCulled={false}>
      <BombGLTF />
    </group>
  );
}

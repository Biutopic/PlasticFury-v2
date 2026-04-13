import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Ocean from './Ocean';
import BoatModel from './BoatModel';
import GarbageInstances from './GarbageModel';
import PlayerLabel from './PlayerLabel';
import FloatingText from './FloatingText';
import SplashEffect from './SplashEffect';
import TurboTrail from './TurboTrail';
import PirateModel from './PirateModel';
import BombModel from './BombModel';
import { CAMERA_HEIGHT, CAMERA_FOLLOW_DISTANCE, CAMERA_LOOK_Y } from '@/game/constants';
import type { PlayerState, GarbageItem, CollisionEvent, PirateState, BombState, GameInput } from '@/game/types';

interface Props {
  localPlayer: PlayerState;
  players: PlayerState[];
  garbage: GarbageItem[];
  collisionEvents: CollisionEvent[];
  pirates: PirateState[];
  bombs: BombState[];
  inputRef: React.RefObject<GameInput>;
}

const SUN_POSITION: [number, number, number] = [100, 30, 100];

export default function GameScene({ localPlayer, players, garbage, collisionEvents, pirates, bombs, inputRef }: Props) {
  const cameraTargetRef = useRef(new THREE.Vector3());

  // Follow camera
  useFrame(({ camera }) => {
    const tx = localPlayer.x - Math.sin(localPlayer.rotation) * CAMERA_FOLLOW_DISTANCE;
    const tz = localPlayer.z - Math.cos(localPlayer.rotation) * CAMERA_FOLLOW_DISTANCE;
    cameraTargetRef.current.lerp(new THREE.Vector3(tx, CAMERA_HEIGHT, tz), 0.05);
    camera.position.copy(cameraTargetRef.current);
    camera.lookAt(localPlayer.x, CAMERA_LOOK_Y, localPlayer.z);
  });

  return (
    <>
      {/* Procedural sky dome */}
      <Sky
        sunPosition={SUN_POSITION}
        turbidity={6}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Image-based environment lighting (gives reflections to water) */}
      <Environment preset="sunset" />

      {/* Direct lighting */}
      <ambientLight intensity={1.5} />
      <directionalLight
        position={SUN_POSITION}
        intensity={3.0}
        castShadow
        color="#fff8e7"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={['#87ceeb', '#1a6a9a', 0.8]} />

      {/* Soft distance fog */}
      <fog attach="fog" args={['#b0d4e8', 120, 400]} />

      {/* Reflective ocean */}
      <Ocean />

      {/* Garbage (instanced for performance) */}
      <GarbageInstances items={garbage} />

      {/* Players */}
      {players.map(p => (
        <group key={p.id}>
          <BoatModel player={p} isLocalPlayer={p.id === localPlayer.id} />
          <PlayerLabel player={p} isLocal={p.id === localPlayer.id} />
        </group>
      ))}

      {/* Pirate ships */}
      {pirates.map(pirate => (
        <PirateModel key={pirate.id} pirate={pirate} />
      ))}

      {/* Pirate bombs in flight */}
      {bombs.map(bomb => (
        <BombModel key={bomb.id} bomb={bomb} />
      ))}

      {/* Turbo boost bubbles */}
      <TurboTrail player={localPlayer} inputRef={inputRef} />

      {/* Splash particles on collision */}
      <SplashEffect events={collisionEvents} />

      {/* Floating damage numbers */}
      <FloatingText events={collisionEvents} />
    </>
  );
}

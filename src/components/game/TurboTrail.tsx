import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWaveHeight } from '@/game/waveUtils';
import type { PlayerState, GameInput } from '@/game/types';

const MAX_BUBBLES = 80;
const BUBBLE_LIFETIME = 1.0;
const SPAWN_INTERVAL = 0.03;
const BUBBLE_COLORS = [new THREE.Color(0x06d6a0), new THREE.Color(0x00ccff), new THREE.Color(0xffffff)];

interface BubbleData {
  x: number;
  z: number;
  life: number;
  baseY: number;
  vy: number;
  size: number;
  colorIdx: number;
}

interface Props {
  player: PlayerState;
  inputRef: React.RefObject<GameInput>;
}

export default function TurboTrail({ player, inputRef }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const bubblesRef = useRef<BubbleData[]>([]);
  const spawnTimerRef = useRef(0);

  const colorArray = useMemo(() => new Float32Array(MAX_BUBBLES * 3), []);
  const colorAttrRef = useRef<THREE.InstancedBufferAttribute | null>(null);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Set up instance color attribute once
    if (!colorAttrRef.current) {
      const attr = new THREE.InstancedBufferAttribute(colorArray, 3);
      mesh.instanceColor = attr;
      colorAttrRef.current = attr;
    }

    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const bubbles = bubblesRef.current;
    const isBoosting = (inputRef.current?.boost ?? false) && player.boostEnergy > 0;

    // Spawn new bubbles when boosting
    if (isBoosting) {
      spawnTimerRef.current += dt;
      while (spawnTimerRef.current >= SPAWN_INTERVAL) {
        spawnTimerRef.current -= SPAWN_INTERVAL;
        if (bubbles.length >= MAX_BUBBLES) {
          bubbles.shift();
        }
        const bx = player.x + (Math.random() - 0.5) * 0.5;
        const bz = player.z + (Math.random() - 0.5) * 0.5;
        bubbles.push({
          x: bx,
          z: bz,
          life: BUBBLE_LIFETIME,
          baseY: getWaveHeight(bx, bz, t) + 0.1,
          vy: 0.5 + Math.random() * 0.5,
          size: 0.15 + Math.random() * 0.15,
          colorIdx: Math.floor(Math.random() * 3),
        });
      }
    } else {
      spawnTimerRef.current = 0;
    }

    // Decay bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
      bubbles[i].life -= dt;
      if (bubbles[i].life <= 0) {
        bubbles.splice(i, 1);
      }
    }

    // Update instances
    for (let i = 0; i < MAX_BUBBLES; i++) {
      if (i < bubbles.length) {
        const b = bubbles[i];
        const progress = 1 - b.life / BUBBLE_LIFETIME;
        const y = b.baseY + b.vy * progress;
        const scale = b.size * (1 + progress * 2);

        dummy.position.set(b.x, y, b.z);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const c = BUBBLE_COLORS[b.colorIdx];
        colorArray[i * 3] = c.r;
        colorArray[i * 3 + 1] = c.g;
        colorArray[i * 3 + 2] = c.b;
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (colorAttrRef.current) colorAttrRef.current.needsUpdate = true;

    (mesh.material as THREE.MeshBasicMaterial).opacity = bubbles.length > 0 ? 0.7 : 0;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_BUBBLES]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}

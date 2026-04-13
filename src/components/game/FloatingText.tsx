import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getWaveHeight } from '@/game/waveUtils';
import type { CollisionEvent } from '@/game/types';

const FLOAT_DURATION = 1.5;
const FLOAT_HEIGHT = 5;

interface Props {
  events: CollisionEvent[];
}

function FloatingTextItem({ event }: { event: CollisionEvent }) {
  const groupRef = useRef<THREE.Group>(null);
  const startY = useRef<number | null>(null);

  const isDamage = event.text.startsWith('-');
  const isSteal = event.text.includes('plastic');

  useFrame(() => {
    if (!groupRef.current) return;
    const now = performance.now() / 1000;
    const elapsed = now - event.time;
    const t = Math.min(elapsed / FLOAT_DURATION, 1);

    if (startY.current === null) {
      startY.current = getWaveHeight(event.x, event.z, event.time) + 2.5;
    }

    groupRef.current.position.set(
      event.x,
      startY.current + t * FLOAT_HEIGHT,
      event.z,
    );

    if (t >= 1) groupRef.current.visible = false;
  });

  const elapsed = performance.now() / 1000 - event.time;
  if (elapsed > FLOAT_DURATION) return null;

  const prefix = isDamage ? '💥' : isSteal ? '⚡' : '';
  const fontSize = isDamage ? 30 : isSteal ? 22 : 16;

  // Thick outline via stacked text-shadows
  const outline = '2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000';
  const textShadow = isDamage
    ? `${outline}, 0 0 12px rgba(255,50,50,0.95), 0 0 24px rgba(255,0,0,0.5)`
    : isSteal
    ? `${outline}, 0 0 12px rgba(255,215,0,0.95), 0 0 24px rgba(255,180,0,0.5)`
    : outline;

  const animName = isDamage ? 'floatPunchDamage' : isSteal ? 'floatPunchSteal' : 'floatPunch';

  return (
    <group ref={groupRef}>
      <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
        <div
          className="select-none font-bold whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-heading)',
            color: event.color,
            fontSize,
            textShadow,
            animation: `${animName} ${FLOAT_DURATION}s ease-out forwards`,
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}
        >
          {prefix}&nbsp;{event.text}
        </div>
      </Html>
    </group>
  );
}

export default function FloatingText({ events }: Props) {
  return (
    <>
      {events.map(e => (
        <FloatingTextItem key={e.id} event={e} />
      ))}
    </>
  );
}

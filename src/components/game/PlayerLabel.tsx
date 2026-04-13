import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getWaveHeight } from '@/game/waveUtils';
import { MAX_HEALTH } from '@/game/constants';
import type { PlayerState } from '@/game/types';

interface Props {
  player: PlayerState;
  isLocal?: boolean;
}

export default function PlayerLabel({ player, isLocal }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const healthPct = Math.max(0, player.health / MAX_HEALTH) * 100;
  const isCritical = player.health < MAX_HEALTH * 0.3;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const waveY = getWaveHeight(player.x, player.z, t);
    groupRef.current.position.set(player.x, waveY + 2.5, player.z);
  });

  return (
    <group ref={groupRef}>
      <Html center distanceFactor={18} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center gap-0.5 select-none" style={{ minWidth: 70 }}>
          <span
            className="font-bold px-2 py-0.5 rounded"
            style={{
              fontFamily: 'var(--font-heading)',
              color: isLocal ? '#00ffcc' : '#ffffff',
              background: 'rgba(0,0,0,0.5)',
              fontSize: 24,
              textShadow: isLocal
                ? '0 0 6px #00ffcc, 0 1px 3px #000'
                : '0 1px 3px #000, 0 0 4px rgba(0,0,0,0.8)',
              letterSpacing: '0.03em',
              border: isLocal ? '1px solid rgba(0,255,204,0.4)' : '1px solid rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap',
            }}
          >
            {player.name} <span style={{ color: isLocal ? '#ffe066' : '#aaddff', fontSize: 23 }}>Lv{player.boatLevel}</span>
          </span>
          <div
            className="rounded-full overflow-hidden"
            style={{ width: 60, height: 6, background: 'rgba(0,0,0,0.6)' }}
          >
            <div
              className={isCritical ? 'health-bar-critical' : 'health-bar-fill'}
              style={{ width: `${healthPct}%`, height: '100%', borderRadius: 999 }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

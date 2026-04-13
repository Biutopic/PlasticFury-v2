import { useState, useEffect, useRef } from 'react';

interface Props {
  isRespawning: boolean;
}

export default function RespawnCountdown({ isRespawning }: Props) {
  const [count, setCount] = useState(3);
  const [animKey, setAnimKey] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!isRespawning) return;

    setCount(3);
    setAnimKey(k => k + 1);

    timersRef.current.push(setTimeout(() => { setCount(2); setAnimKey(k => k + 1); }, 1000));
    timersRef.current.push(setTimeout(() => { setCount(1); setAnimKey(k => k + 1); }, 2000));

    return () => { timersRef.current.forEach(clearTimeout); };
  }, [isRespawning]);

  if (!isRespawning) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.58)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      pointerEvents: 'none',
    }}>
      <div style={{
        color: '#ff4455',
        fontSize: '1.4rem',
        fontWeight: 800,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        marginBottom: '0.5rem',
        textShadow: '0 0 20px rgba(255,60,80,0.7)',
        opacity: 0.95,
      }}>
        Wrecked
      </div>

      <div
        key={animKey}
        style={{
          fontSize: '14rem',
          fontWeight: 900,
          lineHeight: 1,
          color: '#ffffff',
          textShadow: '0 0 60px rgba(255,100,80,0.85), 0 0 20px rgba(255,60,60,0.6)',
          animation: 'respawn-shrink 1s cubic-bezier(0.4, 0, 0.8, 1) forwards',
          userSelect: 'none',
        }}
      >
        {count}
      </div>

      <div style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.95rem',
        marginTop: '1rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}>
        Respawning…
      </div>

      <style>{`
        @keyframes respawn-shrink {
          0%   { transform: scale(2.2); opacity: 0.15; }
          15%  { transform: scale(1.15); opacity: 1; }
          75%  { transform: scale(0.85); opacity: 0.9; }
          100% { transform: scale(0.55); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

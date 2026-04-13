import { useEffect, useState } from 'react';

interface Props {
  hitTimestamp: number; // changes whenever local player is hit
}

const SHAKE_DURATION = 300;   // ms
const VIGNETTE_DURATION = 500; // ms

export default function HitEffects({ hitTimestamp }: Props) {
  const [shaking, setShaking] = useState(false);
  const [showVignette, setShowVignette] = useState(false);

  useEffect(() => {
    if (hitTimestamp === 0) return;

    setShaking(true);
    setShowVignette(true);

    const shakeTimer = setTimeout(() => setShaking(false), SHAKE_DURATION);
    const vignetteTimer = setTimeout(() => setShowVignette(false), VIGNETTE_DURATION);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(vignetteTimer);
    };
  }, [hitTimestamp]);

  return (
    <>
      {/* Screen shake — applied to the entire game wrapper via a CSS class */}
      {shaking && (
        <style>{`
          .game-screen { animation: shakeX ${SHAKE_DURATION}ms ease-out; }
        `}</style>
      )}

      {/* Red vignette overlay */}
      {showVignette && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(200,0,0,0.5) 100%)',
            animation: `vignetteFlash ${VIGNETTE_DURATION}ms ease-out forwards`,
            zIndex: 50,
          }}
        />
      )}
    </>
  );
}
